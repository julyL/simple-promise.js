// 源码出处: https://github.com/calvinmetcalf/lie
"use strict";
var immediate = require("immediate");

/* istanbul ignore next */
function INTERNAL() {}

var handlers = {};

var REJECTED = ["REJECTED"];
var FULFILLED = ["FULFILLED"];
var PENDING = ["PENDING"];
/* istanbul ignore else */
if (!process.browser) {
  // in which we actually take advantage of JS scoping
  var UNHANDLED = ["UNHANDLED"];
}

module.exports = Promise;

function Promise(resolver) {
  if (typeof resolver !== "function") {
    throw new TypeError("resolver must be a function");
  }
  this.state = PENDING;
  this.queue = [];
  this.outcome = void 0;
  /* istanbul ignore else */
  if (!process.browser) {
    this.handled = UNHANDLED;
  }
  if (resolver !== INTERNAL) {
    safelyResolveThenable(this, resolver);
  }
}

Promise.prototype.finally = function(callback) {
  if (typeof callback !== "function") {
    return this;
  }
  var p = this.constructor;
  return this.then(resolve, reject);

  function resolve(value) {
    function yes() {
      return value;
    }
    return p.resolve(callback()).then(yes);
  }
  function reject(reason) {
    function no() {
      throw reason;
    }
    return p.resolve(callback()).then(no);
  }
};
Promise.prototype.catch = function(onRejected) {
  return this.then(null, onRejected);
};
Promise.prototype.then = function(onFulfilled, onRejected) {
  if (
    (typeof onFulfilled !== "function" && this.state === FULFILLED) ||
    (typeof onRejected !== "function" && this.state === REJECTED)
  ) {
    return this;
  }
  var promise = new this.constructor(INTERNAL);  // 调用then方法会新建一个Promise对象
  /* istanbul ignore else */
  if (!process.browser) {
    if (this.handled === UNHANDLED) {
      this.handled = null;
    }
  }
  if (this.state !== PENDING) {   // 执行then方法时,promise状态已经改变了
    var resolver = this.state === FULFILLED ? onFulfilled : onRejected;
    unwrap(promise, resolver, this.outcome);        // 异步执行then方法传入的回调
  } else {      // promise还是pending,则先放入队列中 (调用resolve,reject会执行队列)
    this.queue.push(new QueueItem(promise, onFulfilled, onRejected));   
  }

  return promise;
};
function QueueItem(promise, onFulfilled, onRejected) {
  this.promise = promise;
  if (typeof onFulfilled === "function") {
    this.onFulfilled = onFulfilled;
    this.callFulfilled = this.otherCallFulfilled;
  }
  if (typeof onRejected === "function") {
    this.onRejected = onRejected;
    this.callRejected = this.otherCallRejected;
  }
}
QueueItem.prototype.callFulfilled = function(value) {
  handlers.resolve(this.promise, value);
};
QueueItem.prototype.otherCallFulfilled = function(value) {
  unwrap(this.promise, this.onFulfilled, value);
};
QueueItem.prototype.callRejected = function(value) {
  handlers.reject(this.promise, value);
};
QueueItem.prototype.otherCallRejected = function(value) {
  unwrap(this.promise, this.onRejected, value);
};

// 执行then方法时内部异步执行的逻辑
function unwrap(promise, func, value) {
  immediate(function() {      
    var returnValue;
    try {
      returnValue = func(value);
    } catch (e) {
      return handlers.reject(promise, e);
    }
    if (returnValue === promise) {   // then方法返回的Promise对象不能等于调用then方法的Promise对象
      handlers.reject(promise, new TypeError("Cannot resolve promise with itself"));
    } else {
      handlers.resolve(promise, returnValue);
    }
  });
}

handlers.resolve = function(self, value) {
  var result = tryCatch(getThen, value);  // 试图从value中获取then方法
  if (result.status === "error") {        // 如果获取then方法时抛出异常
    return handlers.reject(self, result.value);  // 以error作为拒因
  }
  var thenable = result.value;

  if (thenable) { //  result.value为真说明 resolve(val)中的val是一个具有then方法的thenable
    safelyResolveThenable(self, thenable);
  } else {
    self.state = FULFILLED;
    self.outcome = value;
    var i = -1;
    var len = self.queue.length;
    while (++i < len) {       // 按照顺序执行当前pormise的所有成功回调
      self.queue[i].callFulfilled(value);
    }
  }
  return self;
};
handlers.reject = function(self, error) {
  self.state = REJECTED;
  self.outcome = error;
  /* istanbul ignore else */
  if (!process.browser) {
    if (self.handled === UNHANDLED) {
      immediate(function() {
        if (self.handled === UNHANDLED) {
          process.emit("unhandledRejection", error, self);
        }
      });
    }
  }
  var i = -1;
  var len = self.queue.length;
  while (++i < len) {
    self.queue[i].callRejected(error);
  }
  return self;
};

// 如果obj是一个thenable(有then方法),则返回一个函数用于执行then方法
function getThen(obj) {
  // Make sure we only access the accessor once as required by the spec
  var then = obj && obj.then;
  if (obj && (typeof obj === "object" || typeof obj === "function") && typeof then === "function") {
    return function appyThen() {
      then.apply(obj, arguments);
    };
  }
}

function safelyResolveThenable(self, thenable) {
  // Either fulfill, reject or reject with error
  var called = false;        // 用于记录函数内部状态只能变化一次
  function onError(value) {  // 将Promise状态变化rejectd的函数
    if (called) {
      return;
    }
    called = true;
    handlers.reject(self, value);
  }

  function onSuccess(value) { // 将Promise状态变化resolved的函数
    if (called) {
      return;
    }
    called = true;
    handlers.resolve(self, value);
  }

  function tryToUnwrap() {
    thenable(onSuccess, onError);
  }

  var result = tryCatch(tryToUnwrap);
  if (result.status === "error") { // Promise中的回调执行时抛出异常,则将拒因传入onError
    onError(result.value);
  }
}

function tryCatch(func, value) {
  var out = {};
  try {
    out.value = func(value);
    out.status = "success";
  } catch (e) {
    out.status = "error";
    out.value = e;
  }
  return out;
}

Promise.resolve = resolve;
function resolve(value) {
  if (value instanceof this) {
    return value;
  }
  return handlers.resolve(new this(INTERNAL), value);
}

Promise.reject = reject;
function reject(reason) {
  var promise = new this(INTERNAL);
  return handlers.reject(promise, reason);
}

Promise.all = all;
function all(iterable) {
  var self = this;
  if (Object.prototype.toString.call(iterable) !== "[object Array]") {
    return this.reject(new TypeError("must be an array"));
  }

  var len = iterable.length;
  var called = false;
  if (!len) {
    return this.resolve([]);
  }

  var values = new Array(len);
  var resolved = 0;
  var i = -1;
  var promise = new this(INTERNAL);

  while (++i < len) {
    allResolver(iterable[i], i);
  }
  return promise;
  function allResolver(value, i) {
    self.resolve(value).then(resolveFromAll, function(error) {
      if (!called) {
        called = true;
        handlers.reject(promise, error);
      }
    });
    function resolveFromAll(outValue) {
      values[i] = outValue;
      if (++resolved === len && !called) {
        called = true;
        handlers.resolve(promise, values);
      }
    }
  }
}

Promise.race = race;
function race(iterable) {
  var self = this;
  if (Object.prototype.toString.call(iterable) !== "[object Array]") {
    return this.reject(new TypeError("must be an array"));
  }

  var len = iterable.length;
  var called = false;
  if (!len) {
    return this.resolve([]);
  }

  var i = -1;
  var promise = new this(INTERNAL);

  while (++i < len) {
    resolver(iterable[i]);
  }
  return promise;
  function resolver(value) {
    self.resolve(value).then(
      function(response) {
        if (!called) {
          called = true;
          handlers.resolve(promise, response);
        }
      },
      function(error) {
        if (!called) {
          called = true;
          handlers.reject(promise, error);
        }
      }
    );
  }
}
