## simple-promise.js
> 基础的Promise实现,已通过Promise A+测试

```
 // 测试步骤
 npm i promises-aplus-tests -g

 promises-aplus-tests test/simple-promise.js  
```

#### promise异步执行发生在哪？
```js
 new Promise((re,rj)=>{
    re();
    new Promise((re, rj) => {
        re();
        console.log(-1)
    }).then(() => {
        console.log(2)
    })
    console.log(0)
 }).then(()=>{
     console.log(3)
 })
 console.log(1)
 
// simple-promises输出:  -1 0 1 3 2    simple-promise.js的异步逻辑是在resolve方法和then方法中的
// 原生Promise输出:      -1 0 1 2 3    应该是发生在then方法中
```
> 原生Promise的异步是发生在执行then方法时的,所以在同一事件循环中先执行then方法的,会先执行then方法传入的回调函数