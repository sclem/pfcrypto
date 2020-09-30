'use strict';

// move external requests to background page for CORS
const fetchBackgroundData = (url) => {
  return new Promise((resolve, reject) => {
    // cancel if no response after timeout
    const timeout = setTimeout(() => {
      reject();
    }, 20000);
    chrome.runtime.sendMessage(
      {
        action: 'pfcrypto_request',
        url,
      },
      (resp) => {
        clearTimeout(timeout);
        resolve(resp);
      }
    );
  });
};

// PersonalCapitalHolding represents a single crypto holding in PC
class PersonalCapitalHolding {
  // regex match coin ticker so coins can override a real security
  // match a-z,0-9,dash and space
  static tickerRegex = /[a-z0-9- ]+/g;
  constructor(data) {
    this.data = data || {};
    this.priceSet = false;
    this.sharesSet = false;
  }
  getRawTicker() {
    return this.data.ticker;
  }
  getTicker() {
    if (this.data.ticker) {
      return this.data.ticker.toLowerCase().match(PersonalCapitalHolding.tickerRegex)[0].trim();
    }
    return null;
  }
  getWalletAddress() {
    if (this.isERC20()) {
      let ethAddr = this.data.description.toLowerCase().slice(6);
      // Ensure that the address preceeds with 0x
      if (ethAddr.slice(0, 2) !== '0x') {
        ethAddr = '0x' + ethAddr;
      }
      return ethAddr;
    }
    return this.data.description || null;
  }
  getPrice() {
    return this.data.price;
  }
  setPrice(usd) {
    this.priceSet = true;
    this.data.price = usd;
  }
  getShares() {
    return this.data.quantity;
  }
  setShares(q) {
    this.sharesSet = true;
    this.data.quantity = q;
  }
  isERC20() {
    return this.data.description && this.data.description.toLowerCase().slice(0, 6) === 'erc20:';
  }
}

// API interface to PC with credentials
class PersonalCapitalAPI {
  constructor(csrf) {
    this.csrf = csrf;
  }

  getCredentialFormData() {
    const formdata = new FormData();
    formdata.append('csrf', this.csrf);
    formdata.append('apiClient', 'WEB');
    return formdata;
  }

  //Retrieve all securities from personal capital that were added manually
  async getUserPCHoldings() {
    const url = 'https://home.personalcapital.com/api/invest/getHoldings';
    const formdata = this.getCredentialFormData();
    const resp = await fetch(url, {
      method: 'POST',
      body: formdata,
    });
    let holdings = [];
    if (resp.ok) {
      const data = await resp.json();
      holdings = data.spData.holdings
        .filter((c) => {
          return c.source === 'USER';
        })
        .map((h) => new PersonalCapitalHolding(h));
    }
    return {
      holdings,
      ok: resp.ok,
    };
  }

  // update a single security in personal capital
  async updateHolding(holding) {
    const url = 'https://home.personalcapital.com/api/account/updateHolding';
    const formdata = this.getCredentialFormData();
    for (const key in holding.data) {
      formdata.append(key, holding.data[key]);
    }
    return await fetch(url, {
      method: 'POST',
      body: formdata,
    });
  }
}

// CryptoCoin represents a single coin
class CryptoCoin {
  constructor(symbol, price) {
    this.symbol = symbol;
    this.price = Number(price);
  }
  getPrice() {
    return this.price;
  }
}

// CoinmarketcapAPI implements fetchCoins, returning a mapping of CryptoCoin ->
// prices
class CoinmarketcapAPI {
  static async fetchCoins() {
    const url = `https://api.alternative.me/v1/ticker/?limit=0`;
    const resp = await fetchBackgroundData(url);
    let coinMap = {};
    if (resp.ok) {
      const rawCoins = resp.data;
      rawCoins.forEach((rc) => {
        let added = false;
        // add coins by id, name, symbol, don't allow overwrite
        if (!coinMap[rc.id]) {
          coinMap[rc.id] = new CryptoCoin(rc.id, +rc.price_usd);
          added = true;
        }
        if (!coinMap[rc.symbol.toLowerCase()]) {
          coinMap[rc.symbol.toLowerCase()] = new CryptoCoin(rc.symbol, +rc.price_usd);
          added = true;
        }
        if (!coinMap[rc.name.toLowerCase()]) {
          coinMap[rc.name.toLowerCase()] = new CryptoCoin(rc.name, +rc.price_usd);
          added = true;
        }
        if (!added) {
          console.log(
            `coin with id ${rc.id}, symbol ${rc.symbol}, ${rc.name} conflicts with existing coin already mapped.`
          );
        }
      });
    }
    return {
      coinMap,
      ok: resp.ok,
    };
  }
}

// BlockCypherAPI used to get wallet balances
class BlockCypherAPI {
  static balanceMap = {
    bitcoin: {
      key: 'btc',
      unit: 1e-8, // 10^8 satoshis/btc
    },
    litecoin: {
      key: 'ltc',
      unit: 1e-8, // 10^8 base units/ltc
    },
    dogecoin: {
      key: 'doge',
      unit: 1e-8, // 10^8 koinus/dogecoin
    },
    ethereum: {
      key: 'eth',
      unit: 1e-18, // 10^18 wei/eth
    },
  };
  static async getBalance(symbol, address) {
    const { key, unit } = BlockCypherAPI.balanceMap[symbol] || {};
    if (key) {
      const url = `https://api.blockcypher.com/v1/${key}/main/addrs/${address}/balance`;
      const resp = await fetchBackgroundData(url);
      if (resp.ok) {
        const data = resp.data;
        return data.balance * unit;
      }
    }
    return null;
  }
}

// EthplorerAPI used to get erc20 wallet balances
class EthplorerAPI {
  constructor() {
    this.erc20Dictionary = {};
  }
  async getBalance(symbol, ethereumAddress) {
    // only query api if not found
    if (!this.erc20Dictionary[ethereumAddress]) {
      const url = `https://api.ethplorer.io/getAddressInfo/${ethereumAddress}?apiKey=freekey`;
      const ercResp = await fetchBackgroundData(url);
      if (ercResp.ok) {
        this.erc20Dictionary[ethereumAddress] = ercResp.data;
      }
    }
    const token = this.erc20Dictionary[ethereumAddress].tokens.find((token) => {
      return (
        token.tokenInfo.name.toLowerCase() === symbol ||
        token.tokenInfo.symbol.toLowerCase() === symbol
      );
    });
    // If token is found in the list of balances, set the balance
    if (token) {
      return token.balance / Math.pow(10, Number(token.tokenInfo.decimals));
    }
    return null;
  }
}

//When page is loaded:
//1. get all holdings from personalcapital API
//2. set updated prices for each holding that the ticker matches from coin prices API
//3. update new price for each holding with personalcapital API
const main = async (csrf, tickerAPI) => {
  const pcAPI = new PersonalCapitalAPI(csrf);
  console.log('fetching pc holdings and coins...');

  const [holdingsResp, coinsResp] = await Promise.all([
    pcAPI.getUserPCHoldings(),
    tickerAPI.fetchCoins(),
  ]);
  const { holdings = [], ok: holdingsOk = false } = holdingsResp;
  if (!holdingsOk) {
    console.error('unable to fetch holdings from personal capital');
    return;
  }
  if (holdings.length === 0) {
    console.log('no holdings in personal capital to update');
    return;
  }
  const { coinMap = {}, ok: coinsOk = false } = coinsResp;
  if (!coinsOk) {
    console.error('unable to fetch coins from api');
    return;
  }
  if (Object.keys(coinMap).length <= 0) {
    console.log('no coins received to update holdings with');
    return;
  }

  console.log('mapping crypto prices to pc holdings...');
  const cryptoAccounts = [];
  for (let i = 0; i < holdings.length; i++) {
    const acct = holdings[i];
    const coin = coinMap[acct.getTicker()];
    if (coin) {
      acct.setPrice(coin.getPrice());
      cryptoAccounts.push(acct);
    } else if (acct.isERC20()) {
      cryptoAccounts.push(acct);
    } else {
      console.log(
        `skipping account with ticker: '${acct.getRawTicker()}'. Could not find matching coin/token. details:`,
        acct
      );
    }
  }
  if (cryptoAccounts.length === 0) {
    console.log('no holdings mapped to coins');
    return;
  }

  console.log(`mapping wallet balances for ${cryptoAccounts.length} accounts...`);
  const ethpAPI = new EthplorerAPI();
  let balanceCount = 0;
  const finalAccounts = await Promise.all(
    cryptoAccounts.map(async (account) => {
      const coinTicker = account.getTicker();
      const walletAddr = account.getWalletAddress();
      if (coinTicker && walletAddr) {
        let balance = null;
        console.log(`attempting to find balance for account ${account.getRawTicker()}`);
        try {
          if (account.isERC20()) {
            balance = await ethpAPI.getBalance(coinTicker, walletAddr);
            if (balance !== null) {
              account.setShares(balance);
              balanceCount++;
            }
          } else {
            balance = await BlockCypherAPI.getBalance(coinTicker, walletAddr);
            if (balance !== null) {
              account.setShares(balance);
              balanceCount++;
            }
          }
        } catch (ex) {
          console.error(`unable to get balance for ${coinTicker}. error: ${ex}`);
        }
        if (balance) {
          console.log(`set balance of ${account.getRawTicker()} to ${balance}`);
        }
      }
      return account;
    })
  );
  console.log(`retrieved balance for ${balanceCount} accounts`);

  // perform updates serialized. If they go parallel pc api chokes.
  for (let i = 0; i < finalAccounts.length; i++) {
    const pcHolding = finalAccounts[i];
    const ticker = pcHolding.getRawTicker();
    const price = pcHolding.getPrice().toFixed(2);
    const shares = pcHolding.getShares();
    console.log(
      `attempting to update ${ticker} to $${price}, shares ${shares}. price updated: ${pcHolding.priceSet}, shares updated: ${pcHolding.sharesSet}...`
    );
    const t0 = performance.now();
    const pcResp = await pcAPI.updateHolding(pcHolding);
    if (pcResp.ok) {
      console.log(
        `success updating ${ticker} to $${price}, took ${((performance.now() - t0) / 1000).toFixed(
          2
        )} seconds`
      );
    } else {
      console.error(`unable to update ${ticker} to $${price}: ${pcResp.statusText}`);
    }
  }
  console.log('done updating holdings.');
};

window.addEventListener(
  'message',
  (event) => {
    if (event.source === window && event.data.type && event.data.type == 'PFCRYPTO_CSRF') {
      const csrf = event.data.text;
      // in the future we can create another class to use a different API, as
      // long as the class implements fetchCoins() returning a map of [id] =>
      // CryptoCoin, it can be swapped out.
      main(csrf, CoinmarketcapAPI);
    }
  },
  false
);

//Hacky way to retrieve user session variable from content script
var s = document.createElement('script');
s.setAttribute('type', 'text/javascript');
s.innerHTML = `window.postMessage({
    "type": "PFCRYPTO_CSRF",
    text: window.csrf
}, "*");`;
document.body.appendChild(s);
