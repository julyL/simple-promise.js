var Promise = require("./index");

// then之前已经resolve 
// var p1 = new Promise(resolve => {
//   console.log(1);
//   resolve(3);
//   console.log(5);
// })

// p1.then(v=>{
//   console.log('6');
// })
// console.log(2);



// then之后再resolve
var p1 = new Promise(resolve => {
  console.log(1);
  setTimeout(() => {
    resolve(3);
  }, 10);
   console.log(5);
})

p1.then(v => {
  console.log('6');
})
console.log(2);