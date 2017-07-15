//Get current prices and update matching holdings by ticker. Ex: 'bitcoin' === 'BITCOIN'
function setPrices(holdings, callback) {
    var xhr = new XMLHttpRequest();
    xhr.onreadystatechange = function() {
        if (this.readyState === 4) {
            var fixed = [];
            var data = JSON.parse(this.responseText);
            data.forEach(function(c) {
                holdings.forEach(function(h) {
                    if (h.ticker.toLowerCase() === c.id) {
                        h.price = +c.price_usd;
                        fixed.push(h);
                    }
                });
            });
            callback(fixed);
        }
    };
    xhr.open("GET", "https://api.coinmarketcap.com/v1/ticker/")
    xhr.send();
}

//Retreive all securities from personal capital that were added manually
function getHoldings(csrf, callback) {
    var xhr = new XMLHttpRequest();
    xhr.onreadystatechange = function() {
        if (this.readyState === 4) {
            var holdings = [];
            var data = JSON.parse(this.responseText);
            data.spData.holdings.forEach(function(c) {
                if (c.source === 'USER') {
                    holdings.push(c);
                }
            });
            callback(holdings);
        }
    };
    xhr.open("POST", "https://home.personalcapital.com/api/invest/getHoldings");
    var formdata = new FormData();
    formdata.append('csrf', csrf);
    formdata.append('apiClient', 'WEB');
    xhr.send(formdata);
}

//update a security with new data on behalf of the user
function updateHolding(csrf, data) {
    var xhr = new XMLHttpRequest();
    xhr.onreadystatechange = function() {
        if (this.readyState === 4) {
            console.log('success updating ' + data.ticker + ' to ' + data.price);
        }
    };
    xhr.open("POST", "https://home.personalcapital.com/api/account/updateHolding");
    var formdata = new FormData();
    formdata.append('csrf', csrf);
    formdata.append('apiClient', 'WEB');
    for (var key in data) {
        formdata.append(key, data[key]);
    }
    xhr.send(formdata);
}

//When page is loaded:
//1. get all holdings from personalcapital API
//2. set updated prices for each holding that the ticker matches from coinmarketcap API
//3. update new price for each holding with personalcapital API
window.addEventListener("message", function(event) {
    if (event.source === window && event.data.type && (event.data.type == "PFCRYPTO_CSRF")) {
        var csrf = event.data.text;
        getHoldings(csrf, function(holdings) {
            setPrices(holdings, function(fixed) {
                fixed.forEach(function(h) {
                    updateHolding(csrf, h);
                });
            });
        });
    }
}, false);

//Hacky way to retrieve user session variable from content script
var s = document.createElement('script');
s.setAttribute('type', 'text/javascript');
s.innerHTML = `window.postMessage({
    "type": "PFCRYPTO_CSRF",
    text: window.csrf
}, "*");`
document.body.appendChild(s);
