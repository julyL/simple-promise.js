// var Promise = require("../simple-promise");
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