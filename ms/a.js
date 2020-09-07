function calcCountOfObject(obj) {
    // coding...
    let reg = /[A-z]+/
    let len = 0

    function getLen(obj) {
        for(let i in obj) {
            let item = obj[i]

            if (typeof item === 'string' && reg.exec(item)) {
                len += reg.exec(item)[0].length
            } else if (Object.prototype.toString.call(item) === '[object Array]') {
                for(let a of item) {
                    getLen(a)
                    len += reg.exec(a) && reg.exec(a)[0].length
                }
            } else if (Object.prototype.toString.call(item) === '[object Object]') {
                getLen(item)
            }

        }

    }
     getLen(obj)
     return len
 }

 const obj = {
    name: 'code',
    obj: {
        name: 'CODE',
        age: [12, 45, 20],
        info: {
            nick: 'haha!'
        }
    },
    hooby: ['a', 'B']
 }

 console.log(calcCountOfObject(obj));