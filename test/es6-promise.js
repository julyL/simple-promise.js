var Promise = require("../es6-promise").Promise;

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
