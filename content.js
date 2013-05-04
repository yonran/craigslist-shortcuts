// ==UserScript==
// @name          Craigslist Shortcuts
// @namespace     https://github.com/yonran/craigslist-shortcuts
// @description   Gmail-style (vim-inspired) keyboard shortcuts.
// @include       http://*.craigslist.org/*
// @version       0.0.6
// ==/UserScript==

var isFromChromeWebStore = true;

if (document.querySelector('body.toc')) {
  var RESULTS_QUERY = ".row > .title1 a:link";
  // A results page
  var resultsLinks = document.querySelectorAll(RESULTS_QUERY);
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
      var resultsLinks = document.querySelectorAll(RESULTS_QUERY);
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
    } else if ("?" == key) {
      if (help == null) help = new Help(true);
      help.toggle();
    } else {
      return;
    }
    e.preventDefault();
    e.stopPropagation();
  }, null);
} else if (document.querySelector('body.posting')) {
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
        if (null != currentIndex) {
          var newResult = results[currentIndex + incr];
          var url = newResult && newResult.url || sessionStorage.mostRecentIndexUrl;
          if (url)
            location.href = url;
        }
      }
    } else if ("u" === key) {
      if (sessionStorage.mostRecentIndexUrl) {
        location.href = sessionStorage.mostRecentIndexUrl;
      }
    } else if ("!" === key) {
      var spamIterator = document.evaluate(
          "//*[@class='flags']//a[normalize-space(.)='spam']", document, null, XPathResult.ANY_TYPE, null);
      var spamLink = spamIterator.iterateNext();
      if (! spamLink) {
        console.error("Craigslist shortcuts: Could not find spam link.");
        return;
      }
      var syntheticClick = document.createEvent("MouseEvent");
      syntheticClick.initMouseEvent(
          "click", true, true, null, null, 0, 0, 0, 0, false, false, false, false, 0, null);
      spamLink.dispatchEvent(syntheticClick);
    } else if ("?" == key) {
      if (help == null) help = new Help(false);
      help.toggle();
    } else {
      return;
    }
    e.preventDefault();
    e.stopPropagation();
  }, false);
}

var help = null;
// constructor
function Help(isIndexPage) {
  var div = this.div = document.createElement("div");
  div.className = "keyboardHelp";
  div.setAttribute("style",
    "background: black; color: white; opacity: .7; z-index: 1002; " +
    "position: fixed; top: 5%; width: 92%; left: 4%; overflow: auto; " +
    "padding: 1em; " +
    "font-family: sans-serif; font-weight: bold;"
  );
  var tableContents = isIndexPage ?
    "<tr><td>j<td>focus on older item\n" +
    "<tr><td>k<td>focus on newer item\n" +
    "<tr><td>?<td>show this help\n"
    :
    "<tr><td>j<td>navigate to older item\n" +
    "<tr><td>k<td>navigate to newer item\n" +
    "<tr><td>!<td>mark as spam\n" +
    "<tr><td>u<td>go back to index\n" +
    "<tr><td>?<td>show this help\n";
  var sourceLink = isFromChromeWebStore ?
    "<a href=\"https://chrome.google.com/webstore/detail/fpkpfjpnegjenkallpheifeejplgfego\">Chrome Web Store</a>\n" :
    "<a href=\"http://userscripts.org/scripts/show/136751\">UserScript</a>\n";
  div.innerHTML =
    "<h1>Keyboard shortcuts</h1>\n" +
    "<a href data-action=close style=\"color:yellow\">Close</a> |\n" +
    sourceLink +
    "<table style=\"color:white; font-weight: bold\">\n" +
    tableContents +
    "</table>";
  Array.prototype.slice.call(div.querySelectorAll("a[data-action='close']")).forEach(function(a) {
    a.addEventListener("click", onClickCloseLink, false);
  });
  div.addEventListener("click", onClickDiv, false);
  var self = this;
  function onClickDocument(e) {
    if (e.shiftKey || e.ctrlKey || e.altKey || e.metaKey  || e.button > 0)
      return;
    self.close();
    e.preventDefault();
    e.stopPropagation();
  }
  function onClickCloseLink(e) {
    if (e.shiftKey || e.ctrlKey || e.altKey || e.metaKey  || e.button > 0)
      return;
    self.close();
    e.preventDefault();
    e.stopPropagation();
  }
  function onClickDiv(e) {
    if (e.shiftKey || e.ctrlKey || e.altKey || e.metaKey  || e.button > 0)
      return;
    // Prevent handling by the document click handler.
    // But don't prevent default on links.
    e.stopPropagation();
  }
  function onKeyDown(e) {
    if (27 === e.keyCode) {
      self.close();
      e.preventDefault();
      e.stopPropagation();
    }
  }
  this.onClickDocument = onClickDocument;
  this.onKeyDown = onKeyDown;
}
Help.prototype.open = function() {
  document.addEventListener("click", this.onClickDocument, false);
  document.addEventListener("keydown", this.onKeyDown, false);
  document.body.appendChild(this.div);
  this.isOpen = true;

  var a = this.div.querySelector("a[data-action='close']");
  if (a != null) a.focus();
};
Help.prototype.close = function() {
  document.removeEventListener("click", this.onClickDocument, false);
  document.removeEventListener("keydown", this.onKeyDown, false);
  document.body.removeChild(this.div);
  this.isOpen = false;
};
Help.prototype.toggle = function() {
  if (this.isOpen) this.close();
  else this.open();
};
