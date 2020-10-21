①②③④⑤⑥⑦⑧⑨⑩⑪⑫⑬⑭⑮⑯⑰⑱⑲⑳
# 玩转react-hooks,五种自定义hooks设计模式及其实战。

## 前言

hooks出来

## 自定义hooks设计

### 又回到那个问题？什么是hooks。

react-hooks是react16.8以后，react新增的钩子API，目的是增加代码的可复用性，逻辑性，弥补无状态组件没有生命周期，没有数据管理状态state的缺陷。笔者认为，react-hooks思想和初衷，也是把组件，颗粒化，单元化，形成独立的渲染环境，减少渲染次数，优化性能

还不明白react-hooks的伙伴可以看的另外一篇文章：
[react-hooks如何使用？](https://juejin.im/post/6864438643727433741)

### 什么是自定义hooks

### 如何设计一个自定义hooks，设计规范

#### 逻辑层 + 组件层

hooks 专注的就是**逻辑复用**， 是我们的项目，不仅仅停留在组件复用的层面上。hooks让我们可以将一段通用的逻辑存封起来。将我们需要它的时候，开箱即用即可。

#### 自定义hooks-驱动条件

hooks本质上是一个函数。函数的执行，决定与无状态组件组件自身的执行上下文。每次函数的执行(本质上就是组件的更新)就会执行自定义hooks的执行，由此可见组件本身执行和hooks的执行如出一辙。

那么prop的修改,useState,useReducer使用是无状态组件更新条件，那么就是驱动hooks执行的条件。

我们用一幅图来表示如上关系。

#### 自定义hooks-通用模式

我们设计的自定义react-hooks应该是长的这样的。

````js
const [ xxx , ... ] = useXXX(参数A,参数B...)
````
在我们在编写自定义hooks的时候，要**特别～特别～特别**关注的是**传进去什么**，**返回什么**。
返回的东西是我们真正需要的。更像一个工厂，把原材料加工，最后返回我们。正如下图所示


#### 自定义hooks-条件限定

如果自定义hooks没有设计好，比如返回一个改变state的函数，但是没有加条件限定限定，就有可能造成不必要的上下文的执行，更有甚的是组件的循环渲染执行。

比如:我们写一个非常简单hooks来**格式化数组将小写转成大写**。

````js

import React , { useState } from 'react'
/* 自定义hooks 用于格式化数组将小写转成大写 */
function useFormatList(list){
   return list.map(item=>{
       console.log(1111)
       return item.toUpperCase()
   })
}
/* 父组件传过来的list = [ 'aaa' , 'bbb' , 'ccc'  ] */
function index({ list }){
   const [ number ,setNumber ] = useState(0)
   const newList = useFormatList(list)
   return <div>
       <div className="list" >
          { newList.map(item=><div key={item} >{ item }</div>) }
        </div>
        <div className="number" >
            <div>{ number }</div>
            <button onClick={()=> setNumber(number + 1) } >add</button>
        </div>
   </div>
}
export default index
````

如上述问题，我们格式化父组件传递过来的list数组，并将小写变成大写，但是当我们点击add。 理想状态下数组不需要重新format，但是实际format跟着执行。无疑增加了性能开销。

**所以我们在设置自定义hooks的时候，一定要把条件限定-性能开销加进去。**

于是乎我们这样处理一下。

````js
function useFormatList(list) {
    return useMemo(() => list.map(item => {
        console.log(1111)
        return item.toUpperCase()
    }), [])
}
````
**华丽丽的解决了如上的问题。**

所以一个好用的自定义hooks,一定要配合 useMemo ,useCallback等api一起使用。
接下来让我们进入今天的实战环境把。

## 自定义hooks实战


## 总结