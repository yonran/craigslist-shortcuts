// tabId -> {resultsUrl, results: {title, url}, lastFocusedUrl}
var tabInfos = {};

chrome.extension.onRequest.addListener(function(request, sender, sendResponse) {
  if ("gotResults" === request.action) {
    var tabInfo = tabInfos[sender.tab.id] = tabInfos[sender.tab.id] || {};
    tabInfo.resultsUrl = sender.tab.url;
    tabInfo.results = request.results;
    return sendResponse({lastFocusedUrl: tabInfo.lastFocusedUrl});
  } else if ("setLastFocusedUrl" === request.action) {
    var tabInfo = tabInfos[sender.tab.id] = tabInfos[sender.tab.id] || {};
    tabInfo.lastFocusedUrl = request.url;
    return sendResponse();
  } else if ("get-index-url" === request.action) {
    var tabInfo = tabInfos[sender.tab.id];
    if (! tabInfo) {
      console.log(request.action + " could not be completed: tab",sender.tab.id,"not in map");
      return sendResponse();
    }
    return sendResponse(tabInfo.resultsUrl);
  } else if ("get-older-url" === request.action || "get-newer-url" === request.action) {
    var incr = "get-older-url" === request.action ? 1 : -1;
    var tabInfo = tabInfos[sender.tab.id];
    if (! tabInfo || ! tabInfo.results) {
      console.log(request.action + " could not be completed: tab",sender.tab.id,"not in map");
      return sendResponse();
    }
    var currentUrl = sender.tab.url;
    var currentIndex = null;
    for (var i = 0; i < tabInfo.results.length; i++) {
      if (tabInfo.results[i].url === currentUrl) {
        currentIndex = i;
        break;
      }
    }
    if (null == currentIndex) {
      console.log(request.action + " could not find next result: url",currentUrl,"not found in",tabInfo.results);
    }
    var newResult = tabInfo.results[currentIndex + incr];
    if (newResult) {
      return sendResponse(newResult.url);
    } else {
      return sendResponse(tabInfo.resultsUrl);
    }
  } else {
    console.error("Unknown request", request);
    return sendResponse();
  }
});
