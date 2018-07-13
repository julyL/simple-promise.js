var Promise = require("./lie");

var p0 = new Promise(resolve => {
    resolve(0);
});

var p1 = new Promise(resolve => {
    resolve();
}).then(() => {
    setTimeout(() => {
        console.log(3);
    }, 0);
    return p0;
}).then(n => {
    console.log(n);
});

var p2 = new Promise(resolve => {
    resolve();
}).then(() => {
    return 2;
}).then(n => {
    console.log(n);
});
/*
result: 2 0 3
注: then方法返回thenable时, 内部会调用handlers.resolver.整个过程是异步的, 所以2先于0输出.0比3先输出是因为同一事件循环中,promise先于setTimout(fn, 0)执行。这里代码执行出现了2个事件循环, 第一个事件循环输出2  第二个事件循环输出 0 3

*/