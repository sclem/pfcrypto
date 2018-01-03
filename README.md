# pfcrypto
basic chome extension to automatically update cryptocurrency holdings (any coin: BTC, ETH, ZEC, etc.)

![image](https://user-images.githubusercontent.com/8977050/33094770-41b65094-cecf-11e7-890f-79ec052487e3.png)

## Changelog

#### 12/14/17:

* Address support for ERC20 Tokens. Put the wallet address in the "Account Description" field in the format "erc20:address".

#### 11/21/17:

* Address support for ETH and BTC. Put the wallet address in the "Account Description" field and the "number of shares" will automatically be updated along with the current price

## 11/11/17:
* Script has been updated to perform each holding update in series to prevent securities in the same manual account from not updating.

## 09/25/17:

* To address the issue with cryptocurrencies which directly match a security found by personal capital's search (such as NEO), the script has been updated to strip everything except a-z characters in the crypto ticker.

Example: To successfully add NEO or another currency with the above issue, personal capital must not find the security. This can be triggered by adding a special character before/after the name of the currency. The extension will now work with the security ticker "$NEO" (without quotes)

## How it works:

* This extension runs whenever a user logs into personal capital. It queries coinmarketcap API for the current ticker price and executes a POST to personalcapital API on behalf of the user. If the address of the account is set in the "Account Description" field (ERC20 Tokens should be in the format "erc20:address"), the script will query blockcypher's API for the balance and use that for the number of shares.

## Usage:

* Install the extension.
* In personal capital, add a "Manual Investment Holdings" account. This is under "Add new account... more". If you already have this, you can skip this step.
* Add a holding in the account edit page. Enter the full name of the crypto currency. Example: "BITCOIN". Enter the number of coins you hold (decimal is fine) and any price.
* Log out and log back into personal capital. The price will update after about 15-20 seconds and every time you log in in the future.

~~### Note: Throughout testing I found it to work best when each crypto holding is placed under its own account instead of multiple currencies in the same account. If you have trouble with currencies not updating when refreshing the page, try placing each into its own "Manual Investment Holdings" Account.~~ *Fixed in 0.0.3*

## Troubleshooting:
* Make sure the security ticker in personal capital is named the same as the 'id' field (not case sensitive) for the coin from https://api.coinmarketcap.com/v1/ticker.
  - Example: 'id' is 'bitcoin', security ticker is 'BITCOIN'

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

BTC: 1nhKt67cEAyVZPjZrvQg2QBTa9zgmwMVL

ETH: 5258B7bC1C917839e7523830a6b301756b1c71f2
