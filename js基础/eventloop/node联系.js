process.nextTick(function(){
    console.log('1');
});
process.nextTick(function(){
    console.log('2');
     setImmediate(function(){
        console.log('3');
    });
    process.nextTick(function(){
        console.log('4');
    });
});

setImmediate(function(){
    console.log('5');
     process.nextTick(function(){
        console.log('6');
    });
    setImmediate(function(){
        console.log('7');
    });
});

setTimeout(e=>{
    console.log(8);
    new Promise((resolve,reject)=>{
        console.log(8+'promise');
        resolve();
    }).then(e=>{
        console.log(8+'promise+then');
    })
},0)



setTimeout(e=>{ console.log(9); },0)

setImmediate(function(){
    console.log('10');
    process.nextTick(function(){
        console.log('11');
    });
    process.nextTick(function(){
        console.log('12');
    });
    setImmediate(function(){
        console.log('13');
    });
});


console.log('14');

 new Promise((resolve,reject)=>{
    console.log(15);
    resolve();
}).then(e=>{
    console.log(16);
})



// 14
// 15
// 1
// 2
// 4
// 16
// 8
// 8promise
// 8promise+then
// 9
// 5
// 6
// 10
// 11
// 12
// 3
// 7
// 13



// 'use strict';
//     console.log(1);
//     setTimeout(() => {
//         console.log(2)
//         new Promise((resolve) => {
//             console.log(6);
//             resolve(7);
//         }).then((num) => {
//             console.log(num);
//         })

//     });
//     setTimeout(() => {
//         console.log(3);
//            new Promise((resolve) => {
//             console.log(9);
//             resolve(10);
//         }).then((num) => {
//             console.log(num);
//         })
//         setTimeout(()=>{
//         	console.log(8);
//         })
//     })
//     new Promise((resolve) => {
//         console.log(4);
//         resolve(5)
//     }).then((num) => {
//         console.log(num);
//         new Promise((resolve)=>{
//         	console.log(11);
//         	resolve(12);
//         }).then((num)=>{
//         	console.log(num);
//         })
//     })

