chrome.runtime.onMessage.addListener(function (request, _sender, sendResponse) {
  (async () => {
    switch (request.action) {
      case 'pfcrypto_request':
        try {
          console.log(`fetching data at ${request.url}`);
          const resp = await fetch(request.url);
          if (resp.ok) {
            const data = await resp.json();
            sendResponse({
              data,
              ok: true,
            });
          } else {
            throw new Error('unsuccessful request');
          }
        } catch (ex) {
          sendResponse({
            ok: false,
          });
        }
      default:
        break;
    }
  })();
  return true;
});
