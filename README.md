# pfcrypto
basic chome extension to automatically update cryptocurrency holdings (any coin: BTC, ETH, ZEC, etc.)

![image](https://user-images.githubusercontent.com/8977050/28240576-adb6bb18-6952-11e7-9021-974445087cff.png)

## How it works:

* This extension runs whenever a user logs into personal capital. It queries coinmarketcap API for the current ticker price and executes a POST to personalcapital API on behalf of the user.

## Usage:

* Install the extension.
* In personal capital, add a "Manual Investment Holdings" account. This is under "Add new account... more". If you already have this, you can skip this step.
* Add a holding in the account edit page. Enter the full name of the crypto currency. Example: "BITCOIN". Enter the number of coins you hold (decimal is fine) and any price.
* Log out and log back into personal capital. The price will update after about 15-20 seconds and every time you log in in the future.

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
