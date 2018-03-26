var uid = 0;
function Promise(func) {
  uid++;
  this.uid = uid;
  this.value = undefined;
  this.status = "pending";
  this.resolveTasks = [];
  this.rejectTasks = [];
  if (isFunction(func)) {
    func.call(this, onFulfilled.bind(this), onRejected.bind(this));
  } else {
  }
}

Promise.prototype.then = function(resolveFunc, rejectFunc) {
  var promise = new Promise(function(resolve, reject) {});
  if (this.status == "resolved") {
    excuteTasks.call(this, "resolve");
    promise.value = this.value;
  }
  if (this.status == "rejectd") {
    excuteTasks.call(this, "reject");
    promise.value = this.value;
  }
  this.resolveTasks.push({
    func: resolveFunc,
    promise: promise
  });
  this.rejectTasks.push({
    func: rejectFunc,
    promise: promise
  });
  return promise;
};

function onFulfilled(value) {
  if (this.status == "pending") {
    excuteTasks.call(this, "resolve");
    this.status = "resolved";
    this.value = value;
  }
}
function onRejected(value) {
  if (this.status == "pending") {
    excuteTasks.call(this, "reject");
    this.status = "rejected";
    this.value = value;
  }
}

function asyncExcute(fn) {
  var self = this;
  process.nextTick(function() {
    fn.call(self);
  });
}

function excuteTasks(type) {
  var tasks = type == "resolve" ? this.resolveTasks : this.rejectTasks;
  asyncExcute.call(this, function() {
    var taskLength = tasks.length,
      i = 0,
      func,
      result;
    while (i < taskLength) {
      func = tasks[i].func;
      if (isFunction(func)) {
        try {
          result = func(this.value);
        } catch (err) {
          onRejected.call(tasks[i].promise, err);
        }
      } else {
        if (type == "resolve") {
          result = this.value;
        } else {
          onRejected.call(tasks[i].promise, this.value);
        }
      }
      resolvePromise(tasks[i].promise, result);
      i++;
    }
  });
}

function isFunction(func) {
  return typeof func == "function";
}

function resolvePromise(pro, x) {
  if (pro == x) {
    onRejected.call(pro, TypeError("不能相等"));
  } else if (x instanceof Promise) {
    x.then(
      function(val) {
        onFulfilled.call(pro, val);
      },
      function(val) {
        onRejected.call(pro, val);
      }
    );
  } else if (isFunction(x) || typeof x == "object") {
    try {
      var then = x.then;
    } catch (err) {
      onRejected.call(pro, err);
      return;
    }
    if (isFunction(then)) {
      try {
        then.call(
          x,
          function(val) {
            onFulfilled.call(pro, val);
          },
          function(val) {
            onRejected.call(pro, val);
          }
        );
      } catch (err) {
        onRejected.call(pro, err);
      }
    } else {
      onFulfilled.call(pro, x);
    }
  } else {
    onFulfilled.call(pro, x);
  }
}

module.exports = Promise;
