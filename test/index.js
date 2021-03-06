var Promise = require("../simple-promise");

function deferred() {
  var dfd = {};
  dfd.promise = new Promise(function(resolve, reject) {
    dfd.resolve = resolve;
    dfd.reject = reject;
  });
  return dfd;
}

module.exports = {
  deferred: deferred
};
