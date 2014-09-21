/*
* https://github.com/kriskowal/asap/blob/master/LICENSE.md
* Copyright 2009–2014 Contributors. All rights reserved.
*/

"use strict";

// Use the fastest means possible to execute a task in its own turn, with
// priority over other events including IO, animation, reflow, and redraw
// events in browsers.
//
// An exception thrown by a task will permanently interrupt the processing of
// subsequent tasks. The higher level `asap` function ensures that if an
// exception is thrown by a task, that the task queue will continue flushing as
// soon as possible, but if you use `rawAsap` directly, you are responsible to
// either ensure that no exceptions are thrown from your task, or to manually
// call `rawAsap.requestFlush` if an exception is thrown.
module.exports = rawAsap;

function rawAsap(task) {
    if (!queue.length) {
        requestFlush();
        flushing = true;
    }
    // Equivalent to push, but avoids a function call.
    queue[queue.length] = task;
}

var queue = [];
var flushing = false;
var requestFlush;
var index = 0;
var capacity = 1024;

function flush() {
  while (index < queue.length) {
    var currentIndex = index;

    index = index + 1;
    queue[currentIndex].call();

    if (index > capacity) {
      for (var scan = 0; scan < index; scan++) {
        queue[scan] = queue[scan + index];
      }
      queue.length -= index;
      index = 0;
    }
  }
  queue.length = 0;
  index = 0;
  flushing = false;
}


var BrowserMutationObserver = global.MutationObserver || global.WebKitMutationObserver;

if (typeof BrowserMutationObserver === "function") {
  requestFlush = makeRequestFlushFromMutationObserver();

} else {
  requestFlush = makeRequestFlushFromTimer();
}


rawAsap.requestFlush = requestFlush;

function makeRequestFlushFromMutationObserver() {
    var toggle = 1;
    var observer = new BrowserMutationObserver(flush);
    var node = document.createTextNode("");
    observer.observe(node, {characterData: true});
    return function requestFlush() {
        toggle = -toggle;
        node.data = toggle;
    };
}

function makeRequestFlushFromTimer() {
    return function requestFlush() {
        var timeoutHandle = setTimeout(handleFlushTimer, 0);
        var intervalHandle = setInterval(handleFlushTimer, 50);
        function handleFlushTimer() {
            clearTimeout(timeoutHandle);
            clearInterval(intervalHandle);
            flush();
        }
    };
}


