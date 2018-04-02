// var Promise = require("./index");
// var Promise = require("../simple-promise.js");
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