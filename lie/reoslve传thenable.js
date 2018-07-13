var Promise = require("./lie");

// var p0 = new Promise(resolve => {
//     resolve(0);
// });

// var p1 = new Promise(resolve => {
//     debugger;
//     resolve(p0); // resolve传入thenable
// });

// var p2 = new Promise(resolve => {
//     resolve(1);
// });

// console.log("p0:", p0);
// console.log("p1:", p1);
// console.log("p2:", p2);
// console.log('--- Event loop ---');
// setTimeout(() => {
//     console.log("p1:", p1);
//     console.log("p2:", p2);
// }, 0);

/*
 p0: Promise<fulfilled> 
 p1: Promise<pending>    // 为什么p1的status为pending
 p2: Promise<fulfilled>
 --- Event loop ---
 p1: Promise<fulfilled>
 p2: Promise<fulfilled>

 小结: 当resolve传入一个thenable对象时,resolve会在thenable状态变为resolved时的下一个事件循环阶段将当前promise对象变为resolved。
 (简单讲就是: p1的状态由p0的状态决定,并且获取p0状态的过程是异步的)
*/


// var p0 = new Promise(resolve => {
//     resolve(1);
// });

// var p1 = new Promise(resolve => {
//     setTimeout(() => {
//         resolve(2);
//     }, 0);
// }).then(n => {
//     console.log(n);
// });

// var p2 = new Promise(resolve => {
//     resolve(p0);
// }).then(n => {
//     console.log(n);
// });

// setTimeout(() => {
//     console.log(0);
//     setTimeout(() => {
//         console.log(3);
//     }, 0);
// }, 0);

// result: 1 0 2 3