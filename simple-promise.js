function Promise(func) {
  this.value = undefined;
  this.status = "pending";
  this.tasks = [];
  if (isFunction(func)) {
    try {
      func.call(this, onFulfilled.bind(this), onRejected.bind(this));
    } catch (err) {
      onRejected.bind(this);
    }
  } else {
    throw TypeError("Promise构造函数必须传函数");
  }
}

Promise.prototype.then = function(resolveFunc, rejectFunc) {
  var promise = new Promise(function() {});
  if (this.status == "resolved") {
    excuteTasks.call(this, "resolve");
    promise.value = this.value;
  }
  if (this.status == "rejectd") {
    excuteTasks.call(this, "reject");
    promise.value = this.value;
  }
  this.tasks.push({
    resolve: resolveFunc,
    reject: rejectFunc,
    promise: promise,
    isdone: false
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
  setTimeout(function() {
    fn();
  }, 0);
}

/**
 * 异步执行顺序队列
 * @param {String} type
 */
function excuteTasks(type) {
  var tasks = this.tasks,
    self = this;
  asyncExcute(function() {
    var taskLength = tasks.length,
      i = -1,
      func,
      result;
    while (i < taskLength - 1) {
      i++;
      if (tasks[i].isdone) {
        // 只能被调用一次
        continue;
      }
      tasks[i].isdone = true;
      func = tasks[i][type];
      if (isFunction(func)) {
        try {
          result = func(self.value);
          resolvePromise(tasks[i].promise, result);
        } catch (err) {
          onRejected.call(tasks[i].promise, err);
        }
      } else {
        if (type == "resolve") {
          result = self.value;
          resolvePromise(tasks[i].promise, result);
        } else {
          onRejected.call(tasks[i].promise, self.value);
        }
      }
    }
  });
}

function isFunction(func) {
  return typeof func == "function";
}

function resolvePromise(pro, x) {
  var isdone = false;
  if (pro == x) {
    onRejected.call(pro, TypeError("不能相等"));
  } else if (isFunction(x) || (x != null && typeof x == "object")) {
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
          function(y) {
            if (isdone) {
              return;
            }
            isdone = true;
            resolvePromise(pro, y);
          },
          function(y) {
            if (isdone) {
              return;
            }
            isdone = true;
            onRejected.call(pro, y);
          }
        );
      } catch (err) {
        if (isdone) {
          return;
        }
        isdone = true;
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
