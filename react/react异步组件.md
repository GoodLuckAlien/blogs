①②③④⑤⑥⑦⑧⑨⑩⑪⑫⑬⑭⑮⑯⑰⑱⑲⑳
# 「React进阶」漫谈React异步组件前世与今生

## 一 前言
今天我们聊一聊React中的异步组件的现况和未来，异步组件很可能是未来从数据交互到UI展示一种流畅的技术方案，所以既然要吃透React，进阶React，就有必要搞懂异步组件。

老规矩，我们还是带着问题开始今天的思考？（自测掌握程度）

* 1 什么是React异步组件，解决什么问题？
* 2 componentDidCatch如何捕获到渲染阶段错误，又这么弥补。
* 3 React.lazy如何实现动态加载的？
* 4 React.lazy为什么要在Supsonse内部。
* 5 Supsonse原理是什么？

## 二 初识：异步组件

### 1 什么是异步组件
我们先来想想目前的React应用中使用`ajax`或者`fetch`进行数据交互场景，基本上就是这样的，在类组件中`componentDidMount`和函数组件`effect`中进行数据交互，得到数据后，再渲染UI视图。那么可不可以让组件的渲染等待异步数据请求完毕，得到数据后再进行render呢？

对于上面这种情况，第一感觉是难以置信，如果能够实现让渲染中断，等到数据请求之后，再渲染呢？那就是`Susponse`，上面说到的不可能实现的事，`Susponse`做到了，React 16.6 新增了 <Suspense>  ，`Susponse` 让组件“等待”某个异步操作，直到该异步操作结束即可渲染。

传统模式：渲染组件-> 请求数据 -> 再渲染组件。</br>
异步模式：请求数据-> 渲染组件。

### 2 开启Suspense模式

一个传统模式下的数据交互应该是这个样子的。
````js
function Index(){
    const [ userInfo , setUserInfo ] = React.useState(0)
    React.useEffect(()=>{
       /* 请求数据交互 */
       getUserInfo().then(res=>{
           setUserInfo(res)
       })
    },[])
    return <div>
        <h1>{userInfo.name}</h1>;
    </div>
}
export default function Home(){
    return <div>
        <Index />
    </div>
}
````
* 流程： 页面初始化挂载，`useEffect`里面请求数据，通过`useState`改变数据，二次更新组件渲染数据。

那么如果用`Susponse`异步模式就可以这么写：

````js
function FutureAsyncComponent (){
    const userInfo = getUserInfo()
    return <div>
        <h1>{userInfo.name}</h1>; 
    </div>
}

/* 未来的异步模式 */
export default function Home(){
   return <div>
      <React.Suspense  fallback={ <div  > loading... </div> } >
          <FutureAsyncComponent/>
      </React.Suspense>
   </div>
}
````
当数据还没有加载完成时候，会展示`Suspense`中 `fallback`的内容，弥补请求数据中过渡效果 ，尽管这个模式在现在版本中还不能正式使用，但是将来 React 会支持这样的代码形式，

## 三 溯源：从componentDidCatch到Suspense
至于Suspense是如何将上述不可能的事情变成可能的呢？这就要从 `componentDidCatch` 说起了，在 React 推出 v16 的时候，就增加了一个新生命周期函数 `componentDidCatch`。如果某个组件定义了 `componentDidCatch`，那么这个组件中所有的子组件在渲染过程中抛出异常时，这个 `componentDidCatch` 函数就会被调用。

### componentDidCatch使用

componentDidCatch 可以捕获异常，它接受两个参数：
* 1 error —— 抛出的错误。
* 2 info —— 带有 componentStack key 的对象，其中包含有关组件引发错误的栈信息。

我们来模拟一个子组件渲染失败的情况：
````js
/* 正常组件，可以渲染 */
function Children(){
  return <div> hello ,let us learn React </div>
}
 /* 非React组件，将无法正常渲染 */
function Children1(){
  return 
}
export default class Index extends React.Component{
  componentDidCatch(error,info){
      console.log(error,info)
  }
  render(){
    return <div>
      <Children />
      <Children1/>
    </div>
  }
}
````
如上，我们模拟一个render失败的场景，将一个非React组件Children1当作正常的React的组件来渲染，这样在渲染阶段就会报错，错误信息就会被 `componentDidCatch`捕获到，错误信息如下：


对于如上如果在渲染子组件的时候出现错误，会导致整个组件渲染失败，无法显示，正常的组件`Children`也会被牵连，这个时候我们需要在`componentDidCatch`做一些补救措施，比如我们发现 `componentDidCatch` 失败，可以给`Children1`加一个状态控制，如果渲染失败，那么终止`Children1`的render。

````js
function ErroMessage(){
  return <div>渲染出现错误～</div>
}

export default class Index extends React.Component{
  state={ errorRender:false }
  componentDidCatch(error,info){
      /* 补救措施 */
      this.setState({
        errorRender:true
      })
  }
  render(){
    return <div>
      <Children />
      { this.state.errorRender ? <ErroMessage/> : <Children1/>  }
    </div>
  }
}
````
如果出现错误，通过`setState`重新渲染，并移除失败的组件，这样组件就能正常渲染了，同样也不影响Children挂载。`componentDidCatch`一方面捕获在渲染阶段出现的错误，另一方面可以正在生命周期的内部执行副作用去挽回渲染异常带来的损失。

### componentDidCatch原理

`componentDidCatch`原理应该很好理解，内部可以通过`try{}catch(error){}`来捕获渲染错误，处理渲染错误。

````js
try {
  //尝试渲染子组件
} catch (error) {
  // 出现错误，componentDidCatch被调用，
}
````

### componentDidCatch思想能否迁移到Suspense上

那么回到我们的异步组件上来，如果让异步的代码放在同步执行，是肯定不会正常的渲染的，我们还是要先请求数据，**等**到数据返回，再用返回的数据进行渲染，那么重点在于这个**等**字，如何让同步的渲染停止下来，去等异步的数据请求呢？ 抛出异常可以吗? 异常可以让代码停止执行，当然也可以让渲染中止。

`Suspense` 就是用抛出异常的方式中止的渲染，`Suspense` 内提供了一个 `createFetcher` 函数会封装异步操作，当尝试从 `createFetcher` 返回的结果读取数据时，有两种可能：一种是数据已经就绪，那就直接返回结果；还有一种可能是异步操作还没有结束，数据没有就绪，这时候 `createFetcher` 会抛出一个“异常”。

这个“异常”是正常的代码错误吗？ 非也，这个异常是封装请求数据的Promise对象，里面是真正的数据请求方法，既然 Suspense 能够抛出异常，就能够通过类似 `componentDidCatch`的`try{}catch{} `去获取这个异常。

**获取这个异常之后干什么呢？** 我们知道这个异常是`Promise`，那么接下来当然是执行这个`Promise`，在成功状态后，获取数据，然后再次渲染组件，此时的渲染就已经读取到正常的数据，那么可以正常的渲染了。接下来我们模拟一下`createFetcher`和`Suspense`

**我们模拟一个简单createFetcher**

````js
/**
 * 
 * @param {*} fn  我们请求数据交互的函数，返回一个数据请求的Promise 
 */
function createFetcher(fn){
    const fetcher = {
        status:'pedding',
        result:null,
        p:null
    }
    return function (){
      const getDataPromise = fn()
      fetcher.p = getDataPromise
      getDataPromise.then(result=>{ /* 成功获取数据 */
         fetcher.result = result 
         fetcher.status = 'resolve'
      })
  
      if(fetcher.status === 'pedding'){ /* 第一次执行中断渲染，第二次 */
         throw fetcher
      }
      /* 第二次执行 */
      if(fetcher.status)
      return fetcher.result
    }
}
````

* 返回一个函数，在渲染阶段执行，第一次组件渲染，由于 `status = pedding` 所以抛出异常 `fetcher` 给 `Susponse`，渲染中止。
* `Susponse`会在内部`componentDidCatch`处理这个fetcher，执行 `getDataPromise.then`， 这个时候`status`已经是`resolve`状态，数据也能正常返回了。
* 接下来`Susponse`再次渲染组件，此时，此时就能正常的获取数据了。

**我们模拟一个简单的Suspense**

````js
export class Suspense extends React.Component{
   state={ isRender: true  }
   componentDidCatch(e){
     /* 异步请求中，渲染 fallback */
     this.setState({ isRender:false })
     const { p } = e
     Promise.resolve(p).then(()=>{
       /* 数据请求后，渲染真实组件 */
       this.setState({ isRender:true })
     })
   }
   render(){
     const { isRender } = this.state
     const { children , fallback } = this.props
     return isRender ? children : fallback
   }
}
````

* 用 componentDidCatch 捕获异步请求，如果有异步请求渲染 fallback，等到异步请求执行完毕，渲染真实组件，借此整个异步流程完毕。但为了让大家明白流程，只是一次模拟异步的过程，实际流程要比这个复杂的多。

**流程图：**

## 四 实践：从Suspense到React.lazy

### React.lazy简介

`Suspense`带来的异步组件的革命还没有一个实质性的成果，目前版本没有正式投入使用，但是**React.lazy**是目前版本Suspense的最佳实践。我们都知道`React.lazy`配合`Suspense`可以实现懒加载，按需加载，这样很利于代码分割，不会让初始化的时候加载大量的文件，减少首屏时间。

### React.lazy基本使用


````js
const LazyComponent = React.lazy(()=>import('./text'))
````
`React.lazy `接受一个函数，这个函数需要动态调用 `import()`。它必须返回一个 `Promise` ，该 `Promise `需要 `resolve` 一个 `default export` 的 `React` 组件。

我们先来看一下基本使用：
````js
const LazyComponent = React.lazy(() => import('./test.js'))

export default function Index(){
   return <Suspense fallback={<div>loading...</div>} >
       <LazyComponent />
   </Suspense>
}
````

我们用`Promise`模拟一下 `import()`效果，将如上 `LazyComponent`改成如下的样子：

````js
function Test(){
  return <div className="demo"  >《React进阶实践指南》即将上线～</div>
}
const LazyComponent =  React.lazy(()=> new Promise((resolve)=>{
  setTimeout(()=>{
      resolve({
          default: ()=> <Test />
      })
  },2000)
}))
````
**效果：**



### React.lazy原理解读

React.lazy 是如何配合Susponse 实现动态加载的效果的呢？**实际上,lazy内部就是做了一个createFetcher，而上面讲到createFetcher得到渲染的数据，而lazy里面自带的createFetcher异步请求的是组件。lazy内部模拟一个promiseA规范场景。我们完全可以理解React.lazy用Promise模拟了一个请求数据的过程，但是请求的结果不是数据，而是一个动态的组件。**

接下来我们看一下lazy是如何处理的

> react/src/ReactLazy.js

````js
function lazy(ctor){
    return {
         $$typeof: REACT_LAZY_TYPE,
         _payload:{
            _status: -1,  //初始化状态
            _result: ctor,
         },
         _init:function(payload){
             if(payload._status===-1){ /* 第一次执行会走这里  */
                const ctor = payload._result;
                const thenable = ctor();
                payload._status = Pending;
                payload._result = thenable;
                thenable.then((moduleObject)=>{
                    const defaultExport = moduleObject.default;
                    resolved._status = Resolved; // 1 成功状态
                    resolved._result = defaultExport;/* defaultExport 为我们动态加载的组件本身  */ 
                })
             }
            if(payload._status === Resolved){ // 成功状态
                return payload._result;
            }
            else {  //第一次会抛出Promise异常给Suspense
                throw payload._result; 
            }
         }
    }
}
````

* `React.lazy`包裹的组件会标记`REACT_LAZY_TYPE`类型的element，在调和阶段会变成 `LazyComponent` 类型的`fiber`，`React`对`LazyComponent`会有单独的处理逻辑，第一次渲染首先会执行 `_init` 方法。此时这个`_init`方法就可以理解成`createFetcher`。


我们看一下lazy中init函数的执行：
> react-reconciler/src/ReactFiberBeginWork.js

````js
function mountLazyComponent(){
    const init = lazyComponent._init;
    let Component = init(payload);
}
````


* 如上在`mountLazyComponent`初始化的时候执行 `_init` 方法，里面会执行`lazy`的第一个函数，得到一个`Promise`，绑定 `Promise.then `成功回调，回调里得到我们组件 `defaultExport`，这里要注意的是，如上面的函数当第二个if判断的时候，因为此时状态不是 `Resolved` ，所以会走`else`，抛出异常 Promise，抛出异常会让当前渲染终止。

* `Susponse`内部处理这个`promise`，然后再一次渲染组件，下一次渲染就直接渲染这个组件。达到了动态加载的目的。

**逻辑图**

## 五 展望：Suspense未来可期

> 你当下并不使用 Relay，那么你暂时无法在应用中试用 Suspense。因为迄今为止，在实现了 Suspense 的库中，Relay 是我们唯一在生产环境测试过，且对它的运作有把握的一个库。

目前Suspense还并不能，如果你想使用，可以尝试一下在生产环境使用集成了 `Suspense` 的 `Relay`。 [Relay 指南](https://relay.dev/docs/getting-started/step-by-step-guide/)！

**Suspense能解决什么？**

*  `Suspense`让数据获取库与 `React` 紧密整合。如果一个数据请求库实现了对 `Suspense` 的支持，那么，在 `React` 中使用 `Suspense` 将会是自然不过的事。
*  `Suspense`能够自由的展现，请求中的加载效果。能让视图加载有更主动的控制权。
*  `Suspense`能够让请求数据到渲染更流畅灵活，我们不用在`componentDidMount`请求数据，再次触发render，一切交给`Suspense`解决，一气呵成。

**Suspense面临挑战？**

对于未来的`Suspense`能否作为主流异步请求数据渲染的方案，笔者认为Suspense未来还是充满期待，那么对于Suspense的挑战，个人感觉在于以下几个方面：

* 1 `concurrent`模式下的`Susponse`可以带来更好的用户体验，facebook能够让未来的Suspense更灵活，有一套更清晰明确的`createFetcher`制作手册，是未来的`concurrent`模式下`Suspense`脱颖而出的关键。
* 2 `Suspense`能否广泛使用，更在于 `Suspense` 的生态发展，有一个稳定的数据请求库与`Suspense`完美契合。
* 3 开发者对`Suspense`的价值的认可，如果`Suspense`在未来的表现力更出色的话，会有更多开发者宁愿自己封装一套数据请求方法，给优秀的`Suspense`买单。

## 六 总结

本文讲了React Susponse的由来，实现原理，目前阶段状态，以及未来的展望，对于React前世与今生，你有什么看法呢? 欢迎在评论区写出你的看法，或者指出笔者的错误。

### 我写了一本深入系统学习React的小册
为了让大家系统的学习React，进阶React，笔者最近写了一本《React进阶实践指南》的小册，本小册从**基础进阶篇**，**优化进阶篇**，**原理进阶篇**，**生态进阶篇**，**实践进阶篇**，五个方向详细探讨 React 使用指南 和 原理介绍。

* 在**基础进阶篇**里，将重新认识react中 state，props，ref，context等模块，详解其基本使用和高阶玩法。

* 在**优化进阶篇**里，将讲解 React性能调优和细节处理，让React写的更优雅。

* 在**原理进阶篇**里，将针对React几个核心模块原理进行阐述，一次性搞定面试遇到React原理问题。

* 在**生态进阶篇**里，将重温React重点生态的用法，从原理角度分析内部运行的机制。

* 在**实践进阶篇**里，将串联前几个模块，进行强化实践。

至于小册为什么叫进阶实践指南，因为在讲解进阶玩法的同时，也包含了很多实践的小demo。还有一些面试中的问答环节，让读者从面试上脱颖而出。

目前以及完成20章节，小册即将上线，想要进阶React的可以看过来，关注小册最新动态。

最后, 送人玫瑰，手留余香，觉得有收获的朋友可以给笔者**点赞，关注**一波 ，陆续更新前端超硬核文章。

### 参考

[React中文文档](https://zh-hans.reactjs.org/)