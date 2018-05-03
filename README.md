### simple-promise.js
> 基于Promise A+规范实现的Promise,已通过Promise A+测试

```console
 npm install 
 npm run test  // 进行Promise A+测试
```

#### Promise内什么时候执行异步,resolve or then?
```js
new Promise(resolve => {
  console.log(1);
  resolve(3);
  new Promise((re, rj) => {
    re();
  }).then(() => {
    console.log(4)
  })
  console.log(5);
}).then(num => {
  console.log(num);
});
console.log(2);
 
// 1 5 2 4 3    这里先执行then先输出
```
> 执行then方法时会异步执行回调,resolve执行是同步的。所以在同一事件循环中先执行then方法的,对应的回调会先执行。