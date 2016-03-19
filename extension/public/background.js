chrome.runtime.onInstalled.addListener(function(details) {
    if (details.reason == 'install') {
        window.open('/ui/html/welcome.html');
    } else if (details.reason == 'update') {
        window.open('/ui/html/about.html#changelog');
    }
});