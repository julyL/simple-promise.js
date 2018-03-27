var Promise = require("../simple-promise");
var p = new Promise(function(resolve, reject) {
  resolve(1);
});

p.then(() => {
  console.log(0);
});

setTimeout(() => {
  p.then(v => {
    console.log(v);
  });
  console.log(2);
}, 100);
