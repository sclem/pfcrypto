# pfcrypto
basic extension to automatically update cryptocurrency holdings (any coin: BTC, ETH, ZEC, etc.)

## Links

[Chrome](https://chrome.google.com/webstore/detail/pfcrypto/ceepigemlmlbphjhffddplfecgedhoeb)

![Chrome Web Store](https://img.shields.io/chrome-web-store/users/ceepigemlmlbphjhffddplfecgedhoeb?style=flat-square)
![Chrome Web Store](https://img.shields.io/chrome-web-store/rating/ceepigemlmlbphjhffddplfecgedhoeb?style=flat-square)
![Chrome Web Store](https://img.shields.io/chrome-web-store/v/ceepigemlmlbphjhffddplfecgedhoeb?style=flat-square)

[Firefox](https://addons.mozilla.org/en-US/firefox/addon/_pfcrypto/)

![Mozilla Add-on](https://img.shields.io/amo/users/_pfcrypto?style=flat-square)
![Mozilla Add-on](https://img.shields.io/amo/rating/_pfcrypto?style=flat-square)
![Mozilla Add-on](https://img.shields.io/amo/v/_pfcrypto?style=flat-square)

![image](https://user-images.githubusercontent.com/8977050/33094770-41b65094-cecf-11e7-890f-79ec052487e3.png)

## Changelog

#### 03/15/2020:

* complete code refactor. make it easier to support a different api in the future. Coins can be added by "name", "id" or "symbol" in the api response (previously just id or symbol).

Example: "bitcoin-cash", "Bitcoin Cash", "BCH" are valid.

```json
{
    "id": "bitcoin-cash",
    "name": "Bitcoin Cash",
    "symbol": "BCH",
    "rank": "5",
    "price_usd": "178.917078694989",
    "price_btc": "0.0339659281246914",
    "24h_volume_usd": "295802169.622763",
    "market_cap_usd": "3294986312.19742",
    "available_supply": "18332564.6467999",
    "total_supply": "17505963",
    "max_supply": "21000000",
    "percent_change_1h": "-1.24",
    "percent_change_24h": "5.93",
    "percent_change_7d": "-34.78",
    "last_updated": "1584319802"
}
```

#### 03/13/2020:

* Change to use api.alternative.me/v1/ticker, coinmarketcap/v1 is deprecated.

#### 02/07/18:

* Address support for referencing coins by ticker symbol. Set the personal capital security ticker to `$SYMBOL`, such as `$BTC`

#### 12/14/17:

* Address support for ERC20 Tokens. Put the wallet address in the "Account Description" field in the format "erc20:address".

#### 11/21/17:

* Address support for ETH and BTC. Put the wallet address in the "Account Description" field and the "number of shares" will automatically be updated along with the current price

#### 11/11/17:
* Script has been updated to perform each holding update in series to prevent securities in the same manual account from not updating.

#### 09/25/17:

* To address the issue with cryptocurrencies which directly match a security found by personal capital's search (such as NEO), the script has been updated to strip everything except a-z characters in the crypto ticker.

Example: To successfully add NEO or another currency with the above issue, personal capital must not find the security. This can be triggered by adding a special character before/after the name of the currency. The extension will now work with the security ticker "$NEO" (without quotes)

## How it works:

* This extension runs whenever a user logs into personal capital. It queries api.alternative.me API for the current ticker price and executes a POST to personalcapital API on behalf of the user. If the address of the account is set in the "Account Description" field (ERC20 Tokens should be in the format "erc20:address"), the script will query blockcypher's API for the balance and use that for the number of shares.

## Usage:

* Install the extension.
* In personal capital, add a "Manual Investment Holdings" account. This is under "Add new account... more". If you already have this, you can skip this step.
* Add a holding in the account edit page. Enter the full name of the crypto currency, the ticker symbol, or the "id" from the API. Example: "BITCOIN" or "BTC". Enter the number of coins you hold (decimal is fine) and any price.
* Log out and log back into personal capital. The price will update after about 15-20 seconds and every time you log in in the future.

~~### Note: Throughout testing I found it to work best when each crypto holding is placed under its own account instead of multiple currencies in the same account. If you have trouble with currencies not updating when refreshing the page, try placing each into its own "Manual Investment Holdings" Account.~~ *Fixed in 0.0.3*

## Troubleshooting:
* Make sure the security ticker in personal capital is named the same as the 'id' field (not case sensitive) or the 'symbol' field (not case sensitive) or the 'name' field (not case sensitive) for the coin from https://api.alternative.me/v1/ticker.
  - Example: 'id' is 'bitcoin', security ticker is 'BITCOIN'
  - Example: 'symbol' is 'BTC', security ticker is 'BTC'
  - Example: 'name' is 'Bitcoin Cash', security ticker is 'Bitcoin Cash'
* To prevent collisions in coins with duplicate id/symbol/name lookups, no coin will overwrite another. The priority order is id, symbol, name in that order. If a coin gives incorrect results for 'id', its probably from a collision. Fall back to symbol, then name in that order. If it still doesn't work, check the console logs for a message saying 'coin could not be added' and open an issue.
* Wallet address support works for BTC, ETH, LTC, DOGE, and erc20 tokens. See the BlockCypherAPI class for details.
* When entering a security ticker, personal capital will automatically search for a description matching the ticker. If it finds a description, then the extension may not work even if you delete the auto-populated description or replace it. To prevent personal capital from finding a matching description, place a special character such as "$" at the beginning of the ticker
  - Example: Typing in the security ticker 'OMG' will automatically fill the description with and prevent the extension from working. Typing '$OMG' for the ticker does not have a matching description and allows the extension to work.
* If the price is updated for an ERC20 token but not the shares then it may be that the ERC20 token is not listed in the API. To check which tokens appear under your address, go to `https://ethplorer.io/address/<youraddress>`

## Notes:

* The button in the top right of chrome is not necessary and it can be hidden by right clicking on it and selecting "Hide in chrome menu". Google chrome forces an icon, there is no way to default hide it.

## Development:

* Clone repo
* Navigate to chrome://extensions
* Click 'load unpacked extension'
* Navigate to repo folder and load

## Roadmap:

* Mint support

I made this because I wanted the feature myself, it is completely free. If you want to donate:

BTC: 3R2FFc824w9RL3C9dL6psm1J16uveNT7ht

ETH: e9172B7c13f32e3384431dd17D478A00F4A6945D
