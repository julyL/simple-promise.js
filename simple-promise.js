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
  this.promiseEvent = new PromiseEvent();
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

Promise.prototype.then = function (resolveFunc, rejectFunc) {
  var promise = new Promise(function () {}),
    self = this;

  // 当Promise对象的状态已经为resolved或者rejected, 那么then方法将根据Promise对象当前状态异步执行相应的队列
  // 由于队列中之前函数都已经执行并且isdone被标记为true, 实际只会(也只需要)执行当前的resolveFunc或者rejectFunc
  if (this.status == "resolved") {
    excuteTasks.call(self, "resolved");
    promise.value = this.value;
  } else if (this.status == "rejected") {
    excuteTasks.call(self, "rejected");
    promise.value = this.value;
  } else {
    this.promiseEvent.on("changeStatus", function (status) {
      excuteTasks.call(self, status);
    })
  }

  this.tasks.push({
    resolved: resolveFunc,
    rejected: rejectFunc,
    promise: promise,
    isdone: false
  });
  return promise;
};

/**
 * 将当前this指向的Promise对象状态变为resolved,并异步执行队列
 * @param {*} value
 */
function onFulfilled(value) {
  if (this.status == "pending") {
    this.promiseEvent.emit("changeStatus", "resolved");
    // excuteTasks.call(this, "resolved");
    this.status = "resolved";
    this.value = value;
  }
}

function onRejected(value) {
  if (this.status == "pending") {
    this.promiseEvent.emit("changeStatus", "rejected");
    // excuteTasks.call(this, "rejected");
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
 * 根据status的值按照顺序异步执行相应的队列
 * @param {String} status
 */
function excuteTasks(status) {
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
          // resolvePromise和onFulfilled区分:
          // onFulfilled不会管value是什么值,都会改变promsie状态为resolved
          // resolvePromise能处理value为promise或者thenable的情况,并且最终还是会调用onResolved或者onRejected来结束. promise状态可能为resolved或者rejected
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
 * 根据x来决定pro是resolved还是rejected状态
 * @param {Promise} pro then方法返回的Promise对象
 * @param {*} x then方法接受2个函数作为参数,这2个函数return的值即为x
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

/*
Promise内部的观察者模式采用PromiseEvent实现

resolve() 内部会执行emit,来异步执行通过then绑定的回调队列
then() 内部会执行on来向队列中添加新的回调

但有一个问题就是: 执行resolve时,then方法还没有执行。导致emit触发了,on还没有绑定事件,从而then绑定的回调没法执行。
解决: 只需在执行on时,判断是否已经执行过emit,如果emit已经执行则直接执行回调,不进行事件绑定。 

*/
var PromiseEvent = function () {
  this.eventList = {};
  this.status = 'pending';
}

PromiseEvent.prototype = {
  on: function (eventName, fn) {
    if (this.status != 'pending') { // 如果事件已经emit过了
      fn.call(null, this.status)
      return;
    }
    var eventArray = this.eventList[eventName]
    if (Array.isArray(eventArray)) {
      eventArray.push(fn);
    } else {
      this.eventList[eventName] = [fn];
    }
  },
  emit: function (eventName, /*arg*/ ) {
    var eventArray = this.eventList[eventName],
      args = [].slice.call(arguments, 1),
      self;

    this.status = args[0]; // 记录emit已经执行
    if (Array.isArray(eventArray)) {
      eventArray.forEach(function (handle) {
        handle.apply(null, args)
      })
    }
  }
}

module.exports = Promise;