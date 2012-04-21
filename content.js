if ("/search" === location.pathname.substring(0, "/search".length) ||
    "/" === location.pathname.charAt(location.pathname.length - 1)) {
  // A results page
  var resultsLinks = document.querySelectorAll("body > blockquote > p > a:link");
  resultsLinks = Array.prototype.slice.call(resultsLinks);  // make it a real array
  var resultsData = resultsLinks.map(function(a) {
    return {url: a.href, title: a.textContent};
  });
  chrome.extension.sendRequest({action: "gotResults", results: resultsData}, function(res) {
    if (res.lastFocusedUrl) {
      var lastFocusedLink = resultsLinks.filter(function(a) {return a.href === res.lastFocusedUrl;})[0];
      if (lastFocusedLink)
        lastFocusedLink.focus();
    }
  });
  document.addEventListener("keypress", function(e) {
    var key = String.fromCharCode(e.charCode);
    if ("j" === key || "k" === key) {
      var focused = document.activeElement;
      var resultsLinks = document.querySelectorAll("body > blockquote > p > a:link");
      var currentIndex = Array.prototype.indexOf.call(resultsLinks, focused);
      var newIndex;
      if (-1 === currentIndex)
        newIndex = 0;
      else
        newIndex = "j" === key ? currentIndex + 1 : currentIndex - 1;
      var link = resultsLinks[newIndex];
      if (! link) return;
      link.focus();
      chrome.extension.sendRequest({action: "setLastFocusedUrl", url: link.href});
      e.preventDefault();
      e.stopPropagation();
    } else {
      return;
    }
  }, null);
} else {
  // A detail page
  chrome.extension.sendRequest({action: "setLastFocusedUrl", url: location.href});
  document.addEventListener("keypress", function(e) {
    var navigateKeyToName = {
      "j": "get-older-url",
      "k": "get-newer-url",
      "u": "get-index-url"
    };
    var navigateName;
    if (null != (navigateName = navigateKeyToName[String.fromCharCode(e.charCode)])) {
      chrome.extension.sendRequest({action: navigateName}, function(url) {
        console.log(navigateName + " response:",url);
        if (url) {
          location.href = url;
        }
      });
    } else if ("!".charCodeAt(0) === e.charCode) {
      var spamIterator = document.evaluate(
          "//a[normalize-space(.)='spam/overpost']", document, null, XPathResult.ANY_TYPE, null);
      var spamLink = spamIterator.iterateNext();
      if (! spamLink) {
        console.error("Could not find spam link.");
        return;
      }
      var syntheticClick = document.createEvent("MouseEvent");
      syntheticClick.initMouseEvent(
          "click", true, true, null, null, 0, 0, 0, 0, false, false, false, false, 0, null);
      spamLink.dispatchEvent(syntheticClick);
    } else {
      return;
    }
    e.preventDefault();
    e.stopPropagation();
  }, false);
}
