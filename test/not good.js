/*
    simple-promise存在2个问题:
    1. 异步执行顺序有问题,先执行then方法的应该先执行回调 示例1
    2. resolve中传入promise对象或thenable对象,没有引用其状态 示例2
*/
var Promise = require("../simple-promise");

// 示例1
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
// 应该是: 1 5 2 4 3

// 示例2
// var p2 = new Promise((re, rj) => {
//     rj(1);
// })
// var p1 = new Promise((resolve, reject) => {
//     resolve(p2);
// }).then(null, (e) => {
//     console.log(e);
// })
// 应该是: 1