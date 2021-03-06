/*
  Promise构造函数字段说明:
  value:  Promsie对象成功的值或者拒绝的原因
  status: 表示Promise对象的状态, 有三种情况(pending,resolved,rejected)
  task:   是一个数组,Promise对象每执行一次then方法就会向task中push如下相应信息
      resolved:  then方法的第一个参数
      rejected:  then方法的第二个参数
      promise:   then方法返回的新Promise对象
      isdone:    用于标记resolved或rejected是否已经执行过了
*/
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

/*
 * then方法做了如下处理:
 * 1. status为resolved或rejected,则执行task中相应的队列
 * 2. 向task中添加任务
 */
Promise.prototype.then = function (resolveFunc, rejectFunc) {
  var promise = new Promise(function () {}),
    self = this;

  this.tasks.push({
    resolved: resolveFunc,
    rejected: rejectFunc,
    promise: promise,
    isdone: false
  });

  if (this.status == "resolved" || this.status == 'rejected') {
    asyncExcuteTasks.call(self, this.status);
    promise.value = this.value;
  }

  return promise;
};

/**
 * 执行resolved对应的队列
 * @param {*} value
 */
function onFulfilled(value) {
  if (this.status == "pending") {
    asyncExcuteTasks.call(this, "resolved");
    this.status = "resolved";
    this.value = value;
  }
}

function onRejected(value) {
  if (this.status == "pending") {
    asyncExcuteTasks.call(this, "rejected");
    this.status = "rejected";
    this.value = value;
  }
}

/**
 * 异步执行fn,这里简单的用setTimeout进行了模拟
 * @param {Function} fn
 */
function asyncExcute(fn) {
  setTimeout(function () {
    fn();
  }, 0);
}

/**
 * 根据Promise的状态值status来按照顺序异步执行tasks中相应的队列
 * @param {String} status
 */
function asyncExcuteTasks(status) {
  var tasks = this.tasks,
    self = this;
  asyncExcute(function () {
    var taskLength = tasks.length,
      i = -1,
      func,
      result;
    while (i < taskLength - 1) {
      i++;
      // 只能被调用一次(防止当promise对象不为pending时,重复执行之前通过then方法注册的函数)
      if (tasks[i].isdone) {
        continue;
      }
      tasks[i].isdone = true;
      func = tasks[i][status];
      if (isFunction(func)) {
        try {
          result = func(self.value);
          // resolvePromise会根据resolve传入的val,来执行onFulfilled或者onRejected(如果val为Promise对象或者thenable对象,则根据val的状态来执行相应的队列)
          resolvePromise(tasks[i].promise, result);
        } catch (err) {
          onRejected.call(tasks[i].promise, err);
        }
      } else {
        // eg: promise2 = promise1.then(onFulfilled, onRejected);
        // onFulfilled或者onRejected不是函数,则promise2的值和状态会和promise1保持一致(实际达到的效果等价于忽略了这个then方法)
        if (status == "resolved") {
          // 如果是resolved状态,则以promise1的value值进行resolved
          resolvePromise(tasks[i].promise, self.value);
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

/**
 * @param {Promise} pro: then方法返回的Promise对象
 * @param {*} x: then方法接受2个函数作为参数,这2个函数return的值即为x
 */
function resolvePromise(pro, x) {
  var isdone = false;
  if (x == pro) {
    onRejected.call(pro, TypeError("不能相等"));
  } else if (isFunction(x) || (x != null && typeof x == "object")) {
    // x为Promise对象或者thenable对象
    try {
      var then = x.then;
    } catch (err) {
      onRejected.call(pro, err);
      return;
    }
    try {
      if (isFunction(then)) {
        then.call(
          x,
          function (y) {
            if (isdone) {
              /*
                isdone用于确保thenable对象的状态只能改变一次(不可逆). 
                由于第三方的thenable的实现,状态可能可以任意改变,promise A+规范对此进行了限制,对于可能执行多次的地方都需要防止重复执行
                可能多次执行的3处地方: 传入then内的2个方法 + 执行then时抛出异常
              */
              return;
            }
            isdone = true;
            resolvePromise(pro, y);
          },
          function (y) {
            if (isdone) {
              return;
            }
            isdone = true;
            onRejected.call(pro, y);
          }
        );
      } else {
        onFulfilled.call(pro, x);
      }
    } catch (err) {
      if (isdone) {
        // 如果状态已经改变(不是pending),就算抛出异常也直接无视
        return;
      }
      isdone = true;
      onRejected.call(pro, err);
    }
  } else {
    // x为其他值
    onFulfilled.call(pro, x);
  }
}

module.exports = Promise;