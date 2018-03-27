var Promise = require("../simple-promise");
var handler1 = function handler1() {
  console.log("handler1");
};
var handler2 = function handler2() {
  console.log("handler2");
};
var handler3 = function handler3() {
  console.log("handler3");
};

var promise = new Promise(function(re, rj) {
  rj(1);
});

promise.then(null, function() {
  handler1();
  promise.then(null, handler3);
});
promise.then(null, handler2);

promise.then(null, function() {
  // Give implementations a bit of extra time to flush their internal queue, if necessary.
  setTimeout(function() {
    console.log("15ms later");
  }, 15);
});
