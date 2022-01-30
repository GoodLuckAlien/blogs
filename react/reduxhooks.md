
# 「React进阶」只用两个自定义 Hooks 就能替代 React-Redux ?

## 前言

之前有朋友问我，React Hooks 能否解决 React 项目状态管理的问题。这个问题让我思索了很久，最后得出的结论是：**能，不过需要两个自定义 hooks 去实现**。那么具体如何实现的呢？ 那就是今天要讲的内容了。

通过本文，你能够学习以下内容：

* useContext ，useRef ，useMemo，useEffect 的基本用法。
* 如何将不同组件的自定义 hooks 建立通信，共享状态。
* 合理编写自定义 hooks ， 分析 hooks 之间的依赖关系。
* 自定义 hooks 编写过程中一些细节问题。

带着如上的知识点，开启阅读之旅吧～（创作不易，希望屏幕前的你能给笔者赏个赞，以此鼓励我继续创作前端硬文。）

## 一 设计思路

首先，看一下要实现的两个自定义 hooks 具体功能。

*  `useCreateStore` 用于产生一个状态 Store ，通过 context 上下文传递 ，为了让每一个自定义 hooks `useConnect` 都能获取 context 里面的状态属性。
*  `useConnect` 使用这个自定义 hooks 的组件，可以获取改变状态的 dispatch 方法，还可以订阅 state ，被订阅的 state 发生变化，组件更新。

**如何让不同组件的自定义 hooks 共享状态并实现通信呢？**

首先不同组件的自定义 hooks ，可以通过 `useContext` 获得共有状态，而且还需要实现状态管理和组件通信，那么就需要一个状态调度中心来统一做这些事，可以称之为 `ReduxHooksStore` ，它具体做的事情如下：

* 全局管理 state， state 变化，通知对应组件更新。
* 收集使用 `useConnect` 组件的信息。组件销毁还要清除这些信息。
* 维护并传递负责更新的 `dispatch` 方法。
* 一些重要 api 要暴露给 context 上下文，传递给每一个 `useConnect`。

### 1 useCreateStore 设计

首先 `useCreateStore` 是在靠近根部组件的位置的， 而且全局只需要一个，目的就是创建一个 `Store` ，并通过 `Provider` 传递下去。

使用：
````js
const store = useCreateStore( reducer , initState )
````
参数：
* `reducer` ：全局 reducer，纯函数，传入 state 和 action ，返回新的 state 。
* `initState` ： 初始化 state 。

返回值：为 store 暴露的主要功能函数。

### 2 Store设计

Store 为上述所说的调度中心，接收全局 reducer ，内部维护状态 state ，负责通知更新 ，收集用 useConnect 的组件。  

````js
const Store = new ReduxHooksStore(reducer,initState).exportStore()
````

参数：接收两个参数，透传 useCreateStore 的参数。

### 3 useConnect设计

使用 useConnect 的组件，将获得 dispatch 函数，用于更新 state ，还可以通过第一个参数订阅 state ，被订阅的 state 改变 ，会让组件更新。

````js
// 订阅 state 中的 number 
const mapStoreToState = (state)=>({ number: state.number  })
const [ state , dispatch ] = useConnect(mapStoreToState)
````
参数：
* `mapStoreToState`：将 Store 中 state ，映射到组件的 state 中，可以做视图渲染使用。
* 如果没有第一个参数，那么只提供 `dispatch` 函数，不会订阅 state 变化带来的更新。

返回值：返回值是一个数组。

* 数组第一项：为映射的 state 的值。
* 数组第二项：为改变 state 的 `dispatch` 函数。



### 4 原理图


![7.jpg](https://p6-juejin.byteimg.com/tos-cn-i-k3u1fbpfcp/365036e1c9f44c648f6203b9b950c736~tplv-k3u1fbpfcp-watermark.image)


## 二 useCreateStore 

````js
export const ReduxContext = React.createContext(null)
/* 用于产生 reduxHooks 的 store */
export function useCreateStore(reducer,initState){
   const store = React.useRef(null)
   /* 如果存在——不需要重新实例化 Store */
   if(!store.current){
       store.current  = new ReduxHooksStore(reducer,initState).exportStore()
   }
   return store.current
}
````
`useCreateStore` 主要做的是：

* 接收 `reducer` 和 `initState` ，通过 ReduxHooksStore 产生一个 store ，不期望把 store 全部暴露给使用者，只需要暴露核心的方法，所以调用实例下的 `exportStore`抽离出核心方法。 

* 使用一个 `useRef` 保存核心方法，传递给 `Provider` 。 

## 三 状态管理者 —— ReduxHooksStore

接下来看一下核心状态 ReduxHooksStore 。

````js
import { unstable_batchedUpdates } from 'react-dom'
class ReduxHooksStore {
    constructor(reducer,initState){
       this.name = '__ReduxHooksStore__'
       this.id = 0
       this.reducer = reducer
       this.state = initState
       this.mapConnects = {}
    }
    /* 需要对外传递的接口 */
    exportStore=()=>{
        return {
            dispatch:this.dispatch.bind(this),
            subscribe:this.subscribe.bind(this),
            unSubscribe:this.unSubscribe.bind(this),
            getInitState:this.getInitState.bind(this)
        }
    }
    /* 获取初始化 state */
    getInitState=(mapStoreToState)=>{
        return mapStoreToState(this.state)
    }
    /* 更新需要更新的组件 */
    publicRender=()=>{
        unstable_batchedUpdates(()=>{ /* 批量更新 */
            Object.keys(this.mapConnects).forEach(name=>{
                const { update } = this.mapConnects[name]
                update(this.state)
            })
        })
    }
    /* 更新 state  */
    dispatch=(action)=>{
       this.state = this.reducer(this.state,action)
       // 批量更新
       this.publicRender()
    }
    /* 注册每个 connect  */
    subscribe=(connectCurrent)=>{
        const connectName = this.name + (++this.id)
        this.mapConnects[connectName] =  connectCurrent
        return connectName
    }
    /* 解除绑定 */
    unSubscribe=(connectName)=>{
        delete this.mapConnects[connectName]
    }
}
````

#### 状态

* `reducer`：这个 reducer 为全局的 reducer ，由 useCreateStore 传入。
* `state`：全局保存的状态 state ，每次执行 reducer 会得到新的 state 。
* `mapConnects`：里面保存每一个 useConnect 组件的更新函数。用于派发 state 改变带来的更新。 

#### 方法

**负责初始化：**

* `getInitState`：这个方法给自定义 hooks 的 useConnect 使用，用于获取初始化的 state 。 
* `exportStore`：这个方法用于把 ReduxHooksStore 提供的核心方法传递给每一个 useConnect 。

**负责绑定｜解绑：**

* `subscribe`： 绑定每一个自定义 hooks useConnect 。
* `unSubscribe`：解除绑定每一个 hooks 。

**负责更新：**

* `dispatch`：这个方法提供给业务组件层，每一个使用 useConnect 的组件可以通过 dispatch 方法改变 state ，内部原理是通过调用 reducer 产生一个新的 state 。

* `publicRender`：当 state 改变需要通知每一个使用 useConnect 的组件，这个方法就是通知更新，至于组件需不需要更新，那是 useConnect  内部需要处理的事情，这里还有一个细节，就是考虑到 dispatch 的触发场景可以是异步状态下，所以用 React-DOM 中 unstable_batchedUpdates 开启批量更新原则。

## 四 useConnect

useConnect 是整个功能的核心部分，它要做的事情是获取最新的 `state` ，然后通过订阅函数 `mapStoreToState` 得到订阅的 state ，判断订阅的 state 是否发生变化。如果发生变化渲染最新的 state 。

````js
export function useConnect(mapStoreToState=()=>{}){
    /* 获取 Store 内部的重要函数 */
   const contextValue = React.useContext(ReduxContext)
   const { getInitState , subscribe ,unSubscribe , dispatch } = contextValue
   /* 用于传递给业务组件的 state  */
   const stateValue = React.useRef(getInitState(mapStoreToState))

   /* 渲染函数 */
   const [ , forceUpdate ] = React.useState()
   /* 产生 */
   const connectValue = React.useMemo(()=>{
       const state =  {
           /* 用于比较一次 dispatch 中，新的 state 和 之前的state 是否发生变化  */
           cacheState: stateValue.current,
           /* 更新函数 */
           update:function (newState) {
               /* 获取订阅的 state */
               const selectState = mapStoreToState(newState)
               /* 浅比较 state 是否发生变化，如果发生变化， */
               const isEqual = shallowEqual(state.cacheState,selectState)
               state.cacheState = selectState
               stateValue.current  = selectState
               if(!isEqual){
                   /* 更新 */
                   forceUpdate({})
               }
           }
       }
       return state
   },[ contextValue ]) // 将 contextValue 作为依赖项。

   React.useEffect(()=>{
       /* 组件挂载——注册 connect */
       const name =  subscribe(connectValue)
       return function (){
            /* 组件卸载 —— 解绑 connect */
           unSubscribe(name)
       }
   },[ connectValue ]) /* 将 connectValue 作为 useEffect 的依赖项 */

   return [ stateValue.current , dispatch ]
}
````

**初始化**

* 用 useContext 获取上下文中， ReduxHooksStore 提供的核心函数。
* 用 useRef 来保存得到的最新的 state 。
* 用 useState 产生一个更新函数 `forceUpdate` ，这个函数只是更新组件。

**注册｜解绑流程**

* 注册： 通过 `useEffect` 来向 ReduxHooksStore 中注册当前 useConnect 产生的 connectValue ，connectValue 是什么马上会讲到。subscribe 用于注册，会返回当前 connectValue 的唯一标识 name 。

* 解绑：在 useEffect 的销毁函数中，可以用调用 unSubscribe 传入 name 来解绑当前的 connectValue


**connectValue是否更新组件**
 
* connectValue ：真正地向 ReduxHooksStore 注册的状态，首先用 `useMemo` 来对 connectValue 做缓存，connectValue 为一个对象，里面的 cacheState 保留了上一次的 mapStoreToState 产生的 state ，还有一个负责更新的 update 函数。

* **更新流程** ： 当触发 `dispatch` 在 ReduxHooksStore 中，会让每一个 connectValue 的 update 都执行， update 会触发映射函数 `mapStoreToState` 来得到当前组件想要的 state 内容。然后通过 `shallowEqual` 浅比较新老 state 是否发生变化，如果发生变化，那么更新组件。完成整个流程。

* shallowEqual ： 这个浅比较就是 React 里面的浅比较，在第 11 章已经讲了其流程，这里就不讲了。


**分清依赖关系**

* 首先自定义 hooks useConnect 的依赖关系是上下文 contextValue 改变，那么说明 store 发生变化，所以重新通过 useMemo 产生新的 connectValue 。**所以 useMemo 依赖 contextValue。**

* connectValue 改变，那么需要解除原来的绑定关系，重新绑定。**useEffect 依赖 connectValue。**

**局限性**

整个 useConnect 有一些局限性，比如：

* 没有考虑 mapStoreToState 可变性，无法动态传入 mapStoreToState 。
* 浅比较，不能深层次比较引用数据类型。

## 五 使用与验证效果

接下来就是验证效果环节，我模拟了组件通信的场景。

### 根部组件注入 Store

````js
import { ReduxContext , useConnect , useCreateStore } from './hooks/useRedux'
function  Index(){
    const [ isShow , setShow ] =  React.useState(true)
    console.log('index 渲染')
    return <div>
        <CompA />
        <CompB />
        <CompC />
        {isShow &&  <CompD />}
        <button onClick={() => setShow(!isShow)} >点击</button>
    </div>
}

function Root(){
    const store = useCreateStore(function(state,action){
        const { type , payload } =action
        if(type === 'setA' ){
            return {
                ...state,
                mesA:payload
            }
        }else if(type === 'setB'){
            return {
                ...state,
                mesB:payload
            }
        }else if(type === 'clear'){ //清空
            return  { mesA:'',mesB:'' }
        }
        else{
            return state
        }
    },
    { mesA:'111',mesB:'111' })
    return <div>
        <ReduxContext.Provider value={store} >
            <Index/>
        </ReduxContext.Provider>
    </div>
}
````

**Root根组件**
* 通过 useCreateStore 创建一个 store ，传入 reducer 和 初始化的值 `{ mesA:'111',mesB:'111' }`
* 用 Provider 传递 store。

**Index组件**

* 有四个子组件 CompA ， CompB ，CompC ，CompD 。其中 CompD 是 动态挂载的。


### 业务组件使用 

````js
function CompA(){
    const [ value ,setValue ] = useState('')
    const [state ,dispatch ] = useConnect((state)=> ({ mesB : state.mesB }) )
    return <div className="component_box" >
        <p> 组件A</p>
        <p>组件B对我说 ： {state.mesB} </p>
        <input onChange={(e)=>setValue(e.target.value)}
            placeholder="对B组件说"
        />
        <button onClick={()=> dispatch({ type:'setA' ,payload:value })} >确定</button>
    </div>
}

function CompB(){
    const [ value ,setValue ] = useState('')
    const [state ,dispatch ] = useConnect((state)=> ({ mesA : state.mesA }) )
    return <div className="component_box" >
        <p> 组件B</p>
        <p>组件A对我说 ： {state.mesA} </p>
        <input onChange={(e)=>setValue(e.target.value)}
            placeholder="对A组件说"
        />
        <button onClick={()=> dispatch({ type:'setB' ,payload:value })} >确定</button>
    </div>
}

function CompC(){
    const [state  ] = useConnect((state)=> ({ mes1 : state.mesA,mes2 : state.mesB }) )
    return <div className="component_box" >
        <p>组件A ： {state.mes1} </p>
        <p>组件B ： {state.mes2} </p>
    </div>
}

function CompD(){
    const [ ,dispatch  ] = useConnect( )
    console.log('D 组件更新')
    return <div className="component_box" >
        <button onClick={()=> dispatch({ type:'clear' })} > 清空 </button>
    </div>
}

````
* CompA 和 CompB 模拟组件双向通信。
* CompC 组件接收 CompA 和 CompB 通信内容，并映射到 `mes1 ，mes2` 属性上。
* CompD 没有 mapStoreToState ，没有订阅 state ，state 变化组件不会更新，只是用 dispatch 清空状态。

### 效果


![8.gif](https://p1-juejin.byteimg.com/tos-cn-i-k3u1fbpfcp/f7b06820f28f461c91620d7240b63ed5~tplv-k3u1fbpfcp-watermark.image)

## 六 总结

本文通过两个自定义 hooks 实现了 React-Redux 的基本功能，这个模式在真实项目中可以使用吗？ 我觉得如果是小型项目，是完全可以使用的，对于大型项目还是用 React Redux 或者其他成熟的状态管理工具。

### 《React进阶实践指南》小册已经上线

今天给大家推荐一本掘金小册 **《React进阶实践指南》**，本文中的自定义 hooks 也是小册自定义 hooks 章节中的一个案例。小册还有很多自定义 hooks 设计案例，而且自定义 hooks 设计和实践章节都在持续更新维护中，汇聚了笔者多年的心血，感兴趣的同学可以了解以下，下面是小册的介绍。

本小册从基础进阶篇，优化进阶篇，原理进阶篇，生态进阶篇，实践进阶篇，五个方向详细探讨 React 使用指南 和 原理介绍。

* 在基础进阶篇里，将重新认识react中 state，props，ref，context等模块，详解其基本使用和高阶玩法。
* 在优化进阶篇里，将讲解 React性能调优和细节处理，让React写的更优雅。
* 在原理进阶篇里，将针对React几个核心模块原理进行阐述，一次性搞定面试遇到React原理问题。
* 在生态进阶篇里，将重温React重点生态的用法，从原理角度分析内部运行的机制。
* 在实践进阶篇里，将串联前几个模块，进行强化实践。

至于小册为什么叫进阶实践指南，因为在讲解进阶玩法的同时，也包含了很多实践的小demo。还有一些面试中的问答环节，让读者从面试上脱颖而出。

目前小册已经上线，这里有 2 个 7 折的优惠码奉上。

* 小册 7 折优惠码： **cRftnJvJ**
* 小册 7 折优惠码： **5EPxuNV5**