①②③④⑤⑥⑦⑧⑨⑩⑪⑫⑬⑭⑮⑯⑰⑱⑲⑳
# vue3.0 源码解析一 ：数据绑定原理（上)

## 前言介绍

从本文开始，我们正式进入vue3.0 源码解析流程。个人觉得从ceateApp入手并不是最佳的学习方案，所以我们先从composition-api响应式原理入手，共同学习vue3.0带来的哪些翻天覆地的变化。

连载文章是大致是这样的，可能会根据变化随时更改：
1 数据绑定原理（上)
2 数据绑定原理（下)
3 computed和watch原理
4 事件系统
5 ceateApp
6 初始化mounted和patch流程。
7 diff算法与2.0区别
8 编译compiler系列
  ...


## 一 基于proxy的Observer

### 1 什么是proxy
**Proxy 对象用于定义基本操作的自定义行为（如属性查找、赋值、枚举、函数调用等）。**

proxy是es6新特性，为了对目标的作用主要是通过handler对象中的拦截方法拦截目标对象target的某些行为（如属性查找、赋值、枚举、函数调用等）。

````js
/* target: 目标对象，待要使用 Proxy 包装的目标对象（可以是任何类型的对象，包括原生数组，函数，甚至另一个代理）。 */
/* handler: 一个通常以函数作为属性的对象，各属性中的函数分别定义了在执行各种操作时代理 proxy 的行为。 */ 
const proxy = new Proxy(target, handler);

````

### 2 为什么要用proxy，改用proxy之后的利与弊


 > **  3.0 将带来一个基于 Proxy 的 observer 实现，它可以提供覆盖语言 (JavaScript——译注) 全范围的响应式能力，消除了当前 Vue 2 系列中基于 Object.defineProperty 所存在的一些局限，这些局限包括：1 对属性的添加、删除动作的监测； 2 对数组基于下标的修改、对于 .length 修改的监测； 3 对 Map、Set、WeakMap 和 WeakSet 的支持；；

vue2.0 用 **Object.defineProperty** 作为响应式原理的实现，但是会有它的局限性，比如 **无法监听数组基于下标的修改，不支持 Map、Set、WeakMap 和 WeakSet等缺陷** ，所以改用了proxy解决了这些问题，这也意味着vue3.0将放弃对低版本浏览器的兼容（兼容版本ie11以上）。


### 3 proxy中hander对象的基本用法

**vue3.0 响应式用到的捕获器（接下来会重点介绍）**

**handler.has()**                      ->  **in 操作符** 的捕捉器。    **(vue3.0 用到)**
**handler.get()**                      ->  **属性读取**  操作的捕捉器。 **(vue3.0 用到)**
**handler.set()**                      ->  **属性设置*** 操作的捕捉器。 **(vue3.0 用到)**
**handler.deleteProperty()**           ->  **delete 操作符** 的捕捉器。**(vue3.0 用到)**
**handler.ownKeys()**                  ->  **Object.getOwnPropertyNames 方法和 Object.getOwnPropertySymbols 方法**的捕捉器。**(vue3.0 用到)**

**vue3.0 响应式没用到的捕获器（有兴趣的同学可以研究一下**）

**handler.getPrototypeOf()**           ->  **Object.getPrototypeOf** 方法的捕捉器。
**handler.setPrototypeOf()**           ->  **Object.setPrototypeOf** 方法的捕捉器。
**handler.isExtensible()**             ->  **Object.isExtensible** 方法的捕捉器。
**handler.preventExtensions()**        ->  **Object.preventExtensions** 方法的捕捉器。
**handler.getOwnPropertyDescriptor()** ->  **Object.getOwnPropertyDescriptor** 方法的捕捉器。
**handler.defineProperty()**           ->  **Object.defineProperty** 方法的捕捉器。
**handler.apply()**                    ->  **函数调用操作** 的捕捉器。
**handler.construct()**                ->  **new 操作符**  的捕捉器。

#### ① has捕获器

**has(target, propKey)**

target:目标对象

propKey:待拦截属性名

作用:  拦截判断target对象是否含有属性propKey的操作

拦截操作： **propKey in proxy**;   不包含for...in循环

对应Reflect: **Reflect.has(target, propKey)**

🌰例子：

````js
const handler = {
    has(target, propKey){
        /*
        * 做你的操作
        */
        return propKey in target
    }
}
const proxy = new Proxy(target, handler)

````

#### ② get捕获器

**get(target, propKey, receiver)**

target:目标对象

propKey:待拦截属性名

receiver: proxy实例

返回： 返回读取的属性

作用：拦截对象属性的读取

拦截操作：proxy[propKey]或者点运算符

对应Reflect：  **Reflect.get(target, propertyKey[, receiver])**       

🌰例子：

````js
const handler = {
    get: function(obj, prop) {
        return prop in obj ? obj[prop] : '没有此水果';
    }
}

const foot = new Proxy({}, handler)
foot.apple = '苹果'
foot.banana = '香蕉';

console.log(foot.apple, foot.banana);    /* 苹果 香蕉 */
console.log('pig' in foot, foot.pig);    /* false 没有此水果 */
````

**特殊情况**

````js
const person = {};
Object.defineProperty(person, 'age', {
  value: 18, 
  writable: false,
  configurable: false
})
const proxPerson = new Proxy(person, {
  get(target,propKey) {
    return 20
    //应该return 18;不能返回其他值，否则报错
  }
})
console.log( proxPerson.age ) /* 会报错 */
````

#### ③ set捕获器

**set(target,propKey, value,receiver)**

target:目标对象

propKey:待拦截属性名

value:新设置的属性值

receiver: proxy实例

返回：严格模式下返回true操作成功；否则失败，报错

作用： 拦截对象的属性赋值操作

拦截操作： proxy[propkey] = value

对应Reflect：  **Reflect.set(obj, prop, value, receiver)**       

````js
let validator = {
  set: function(obj, prop, value) {
    if (prop === 'age') {
      if (!Number.isInteger(value)) { /* 如果年龄不是整数 */
        throw new TypeError('The age is not an integer')
      }
      if (value > 200) {  /* 超出正常的年龄范围 */
        throw new RangeError('The age seems invalid')
      }
    }
    obj[prop] = value
    // 表示成功
    return true
  }
}
let person = new Proxy({}, validator)
person.age = 100
console.log(person.age)  // 100
person.age = 'young'     // 抛出异常: Uncaught TypeError: The age is not an integer
person.age = 300         // 抛出异常: Uncaught RangeError: The age seems invalid
````
**当对象的属性writable为false时，该属性不能在拦截器中被修改**

````js
const person = {};
Object.defineProperty(person, 'age', {
    value: 18,
    writable: false,
    configurable: true,
});

const handler = {
    set: function(obj, prop, value, receiver) {
        return Reflect.set(...arguments);
    },
};
const proxy = new Proxy(person, handler);
proxy.age = 20;
console.log(person) // {age: 18} 说明修改失败
````


#### ④ deleteProperty 捕获器

**deleteProperty(target, propKey)**

target:目标对象

propKey:待拦截属性名

返回：严格模式下只有返回true, 否则报错

作用： 拦截删除target对象的propKey属性的操作

拦截操作： delete proxy[propKey]

对应Reflect：  **Reflect.delete(obj, prop)**     

````js

var foot = { apple: '苹果' , banana:'香蕉'  }
var proxy = new Proxy(foot, {
  deleteProperty(target, prop) {
    console.log('当前删除水果 :',target[prop])
    return delete target[prop]
  }
});
delete proxy.apple
console.log(foot)

/*
运行结果：
'当前删除水果 : 苹果'
{  banana:'香蕉'  }
*/
````
**特殊情况： 属性是不可配置属性时，不能删除**

````js
var foot = {  apple: '苹果' }
Object.defineProperty(foot, 'banana', {
   value: '香蕉', 
   configurable: false
})
var proxy = new Proxy(foot, {
  deleteProperty(target, prop) {
    return delete target[prop];
  }
})
delete proxy.banana /* 没有效果 */
console.log(foot)
````

#### ⑤ownKeys 捕获器

**ownKeys(target)**

target：目标对象

返回： 数组（数组元素必须是字符或者Symbol,其他类型报错）

作用： 拦截获取键值的操作

拦截操作：

**1 Object.getOwnPropertyNames(proxy)**

**2 Object.getOwnPropertySymbols(proxy)**

**3 Object.keys(proxy)**

**4 for...in...循环**

对应Reflect：**Reflect.ownKeys()**


 ````js
var obj = { a: 10, [Symbol.for('foo')]: 2 };
Object.defineProperty(obj, 'c', {
    value: 3, 
    enumerable: false
})
var p = new Proxy(obj, {
  ownKeys(target) {
    return [...Reflect.ownKeys(target), 'b', Symbol.for('bar')]
  }
})
const keys = Object.keys(p)  // ['a']
// 自动过滤掉Symbol/非自身/不可遍历的属性

/* 和Object.keys()过滤性质一样，只返回target本身的可遍历属性 */
for(let prop in p) { 
  console.log('prop-',prop) /* prop-a */
}

/* 只返回拦截器返回的非Symbol的属性，不管是不是target上的属性 */
const ownNames = Object.getOwnPropertyNames(p)  /* ['a', 'c', 'b'] */

/* 只返回拦截器返回的Symbol的属性，不管是不是target上的属性*/
const ownSymbols = Object.getOwnPropertySymbols(p)// [Symbol(foo), Symbol(bar)]

/*返回拦截器返回的所有值*/
const ownKeys = Reflect.ownKeys(p)
// ['a','c',Symbol(foo),'b',Symbol(bar)]

 ````


## 二 vue3.0 如何建立响应式

vue3.0 建立响应式的方法有两种：
第一个就是运用composition-api中的reactive直接构建响应式，composition-api的出现我们可以在.vue文件中，直接用setup()函数来处理之前的大部分逻辑，也就是说我们没有必要在 export default{ } 中在声明生命周期 ， data(){} 函数，watch{} , computed{} 等 ，取而代之的是我们在setup函数中，用vue3.0 reactive watch 生命周期api来到达同样的效果，这样就像react-hooks一样提升代码的复用率，逻辑性更强。

第二个就是用传统的 data(){ return{} } 形式 ,vue3.0没有放弃对vue2.0写法的支持，而是对vue2.0的写法是完全兼容的，提供了**applyOptions** 来处理options形式的vue组件。但是options里面的data , watch , computed等处理逻辑，还是用了composition-api中的API对应处理。

### 1 composition-api  reactive

Reactive 相当于当前的 Vue.observable () API，经过reactive处理后的函数能变成响应式的数据，类似于option api里面的vue处理data函数的返回值。

我们用一个todoList的demo试着尝尝鲜。
````js

const { reactive , onMounted } = Vue
setup(){
    const state = reactive({
        count:0,
        todoList:[]
    })
    /* 生命周期mounted */
    onMounted(() => {
       console.log('mounted')
    })
    /* 增加count数量 */
    function add(){
        state.count++
    } 
    /* 减少count数量 */
    function del(){
        state.count--
    }
    /* 添加代办事项 */
    function addTodo(id,title,content){
        state.todoList.push({
            id,
            title,
            content,
            done:false
        })
    }
    /* 完成代办事项 */
    function complete(id){
        for(let i = 0; i< state.todoList.length; i++){
            const currentTodo = state.todoList[i] 
            if(id === currentTodo.id){
                state.todoList[i] = {
                    ...currentTodo,
                    done:true
                } 
                break
            }
        }
    }
    return {
        state,
        add,
        del,
        addTodo,
        complete
    }
}

````

### 2 options data

options形式的和vue2.0并没有什么区别

````js
export default {
    data(){
        return{
            count:0,
            todoList:[] 
        }
    },
    mounted(){
        console.log('mounted')
    }
    methods:{
        add(){
            this.count++
        },
        del(){
            this.count--
        },
        addTodo(id,title,content){
           this.todoList.push({
               id,
               title,
               content,
               done:false
           })
        },
        complete(id){
            for(let i = 0; i< this.todoList.length; i++){
                const currentTodo = this.todoList[i] 
                if(id === currentTodo.id){
                    this.todoList[i] = {
                        ...currentTodo,
                        done:true
                    } 
                    break
                }
            }
        }
    }
}

````

## 三 响应式原理初探

### 不同类型的Reactive
vue3.0可以根据业务需求引进不同的API方法。这里需要

#### ① reactive

建立响应式reactive，返回proxy对象，这个reactive可以深层次递归，也就是如果发现展开的属性值是**引用类型**的而且被**引用**，还会用reactive**递归处理**。而且属性是可以被修改的。

#### ② shallowReactive

建立响应式shallowReactive，返回proxy对象。和reactive的区别是只建立一层的响应式，也就是说如果发现展开属性是**引用类型**也不会**递归**。

#### ③ readonly

返回的proxy处理的对象，可以展开递归处理，但是属性是只读的，不能修改。可以做props传递给子组件使用。

#### ④ shallowReadonly

返回经过处理的proxy对象，但是建立响应式属性是只读的，不展开引用也不递归转换，可以这用于为有状态组件创建props代理对象。

### 储存对象与proxy

上文中我们提及到。用Reactive处理过并返回的对象是一个proxy对象，假设存在很多组件，或者在一个组件中被多次reactive，就会有很多对proxy对象和它代理的原对象。为了能把proxy对象和原对象建立关系，vue3.0采用了WeakMap去储存这些对象关系。WeakMaps 保持了对键名所引用的对象的弱引用，即垃圾回收机制不将该引用考虑在内。只要所引用的对象的其他引用都被清除，垃圾回收机制就会释放该对象所占用的内存。也就是说，一旦不再需要，WeakMap 里面的键名对象和所对应的键值对会自动消失，不用手动删除引用。


````js
const rawToReactive = new WeakMap<any, any>()
const reactiveToRaw = new WeakMap<any, any>()
const rawToReadonly = new WeakMap<any, any>() /* 只读的 */
const readonlyToRaw = new WeakMap<any, any>() /* 只读的 */
````

vue3.0 用readonly来设置被拦截器拦截的对象能否被修改，可以满足之前的props不能被修改的单向数据流场景。
我们接下来重点讲一下接下来的四个weakMap的储存关系。

**rawToReactive**

键值对 ： { [targetObject] : obseved  } 

target（键）:目标对象值(这里可以理解为**reactive**的第一个参数。)
obsered（值）:经过proxy代理之后的proxy对象。 

**reactiveToRaw**
reactiveToRaw 储存的刚好与 rawToReactive的键值对是相反的。
键值对 { [obseved] : targetObject }


**rawToReadonly**

键值对 ： { [target] : obseved  } 

target（键）：目标对象。
obsered（值）:经过proxy代理之后的只读属性的proxy对象。 

**readonlyToRaw**
储存状态与rawToReadonly刚好相反。


### reactive入口解析 
接下来我们重点从reactive开始讲。

#### reactive({ ...object }) 入口

````js
/* TODO: */
export function reactive(target: object) {
  if (readonlyToRaw.has(target)) {
    return target
  }
  return createReactiveObject(
    target,                   /* 目标对象 */
    rawToReactive,            /* { [targetObject] : obseved  }   */
    reactiveToRaw,            /* { [obseved] : targetObject }  */
    mutableHandlers,          /* 处理 基本数据类型 和 引用数据类型 */
    mutableCollectionHandlers /* 用于处理 Set, Map, WeakMap, WeakSet 类型 */
  )
}
````
**reactive**函数的作用就是通过createReactiveObject方法产生一个proxy,而且针对不同的数据类型给定了不同的处理方法。


#### createReactiveObject
之前说到的createReactiveObject，我们接下来看看createReactiveObject发生了什么。

````js
const collectionTypes = new Set<Function>([Set, Map, WeakMap, WeakSet])
function createReactiveObject(
  target: unknown,
  toProxy: WeakMap<any, any>,
  toRaw: WeakMap<any, any>,
  baseHandlers: ProxyHandler<any>,
  collectionHandlers: ProxyHandler<any>
) {
  /* 判断目标对象是否被effect */
  /* observed 为经过 new Proxy代理的函数 */
  let observed = toProxy.get(target) /* { [target] : obseved  } */
  if (observed !== void 0) { /* 如果目标对象已经被响应式处理，那么直接返回proxy的observed对象 */
    return observed
  }
  if (toRaw.has(target)) { /* { [observed] : target  } */
    return target
  }
  /* 如果目标对象是 Set, Map, WeakMap, WeakSet 类型，那么 hander函数是 collectionHandlers 否侧目标函数是baseHandlers */
  const handlers = collectionTypes.has(target.constructor)
    ? collectionHandlers
    : baseHandlers
   /* TODO: 创建响应式对象  */
  observed = new Proxy(target, handlers)
  /* target 和 observed 建立关联 */
  toProxy.set(target, observed)
  toRaw.set(observed, target)
  /* 返回observed对象 */
  return observed
}
````


通过上面源码创建proxy对象的大致流程是这样的：
①首先判断目标对象有没有被proxy响应式代理过，如果是那么直接返回对象。
②然后通过判断目标对象是否是[ Set, Map, WeakMap, WeakSet  ]数据类型来选择是用**collectionHandlers** ， 还是**baseHandlers->就是reactive传进来的mutableHandlers**作为proxy的hander对象。
③最后通过真正使用new proxy来创建一个observed ，然后通过rawToReactive reactiveToRaw 保存 target和observed键值对。

大致流程图：



#### baseHandlers做了写什么?
对于hander到底做了什么，由于篇幅和笔者时间的关系，我们在下一章会继续探讨。

参考文档：
 > ** Proxy详解  h ttps://www.cnblogs.com/lyraLee/p/11774482.html 