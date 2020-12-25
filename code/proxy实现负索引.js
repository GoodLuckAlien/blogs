/**
 * 使用ES6 的Proxy实现数组负索引。 （负索引：例如，可以简单地使用arr[-1]替代arr[arr.length-1]访问最后一个元素，[-2]访问倒数第二个元素，以此类推
 */

 function proxyArr(arr){
    return new Proxy(arr,{
        get(target,key){
           if(key<0){
               let newKey = Math.abs(key)
               let lastIndex = target.length - 1
               let value
               while(newKey>0){
                  value = target[lastIndex]
                  lastIndex--
                  newKey--
               }
               return value
           }
           return  Reflect.get(target,key)
        }
    })
 }

const a = [1,2,3]
const A = proxyArr(a)
 console.log(A[-1])