// var Promise = require("../simple-promise");
var p = new Promise(function(resolve, reject) {
  resolve(1);
})
  .then(() => {
    setTimeout(v => {
      throw Error("3s error");
    }, 3000);
  })
  .then(
    d => {
      console.log("1", d);
    },
    d => {
      console.log("0", d);
    }
  );
