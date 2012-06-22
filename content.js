// ==UserScript==
// @name          Craigslist Shortcuts
// @namespace     https://github.com/yonran/craigslist-shortcuts
// @description   Gmail-style (vim-inspired) keyboard shortcuts.
// @include       http://*.craigslist.org/*
// @version       0.0.3
// ==/UserScript==

if ("/search" === location.pathname.substring(0, "/search".length) ||
    "/" === location.pathname.charAt(location.pathname.length - 1)) {
  // A results page
  var resultsLinks = document.querySelectorAll("body > blockquote > p > a:link");
  resultsLinks = Array.prototype.slice.call(resultsLinks);  // make it a real array
  var resultsData = resultsLinks.map(function(a) {
    return {url: a.href, title: a.textContent};
  });
  sessionStorage.mostRecentIndexUrl = location.href;
  sessionStorage.mostRecentResults = JSON.stringify(resultsData);
  if (sessionStorage.mostRecentResultUrl) {
    var lastFocusedLink = resultsLinks.filter(function(a) {return a.href === sessionStorage.mostRecentResultUrl;})[0];
    if (lastFocusedLink)
      lastFocusedLink.focus();
  }
  resultsLinks = resultsData = null;

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
      sessionStorage.mostRecentResultUrl = link.href;
      e.preventDefault();
      e.stopPropagation();
    } else {
      return;
    }
  }, null);
} else {
  // A detail page
  sessionStorage.mostRecentResultUrl = location.href;
  document.addEventListener("keypress", function(e) {
    var key = String.fromCharCode(e.charCode);
    if ("j" === key || "k" === key) {
      var incr = "j" === key ? 1 : -1;  // 1 means older, -1 means newer
      var results;
      if (sessionStorage.mostRecentResults &&
          (results = JSON.parse(sessionStorage.mostRecentResults)) &&
          0 < results.length) {
        var currentIndex = null;
        for (var i = 0; i < results.length; i++) {
          var result = results[i];
          if (result && result.url === location.href) {
            currentIndex = i;
            break;
          }
        }
        var newResult;
        if (null != currentIndex &&
            (newResult = results[currentIndex + incr]) &&
            newResult.url) {
          location.href = newResult.url;
        }
      }
    } else if ("u" === key) {
      if (sessionStorage.mostRecentIndexUrl) {
        location.href = sessionStorage.mostRecentIndexUrl;
      }
    } else if ("!" === key) {
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
