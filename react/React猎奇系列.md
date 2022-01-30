# 「React进阶」从原理颠覆对 React 认识， 这些你以为的真的是你以为吗？
<!-- ## 一 前言

## 三 谁说 hooks 不能写在条件语句中的 —— hooks 加载顺序原理

## 四 key 真的只用在循环结构里吗？

## 五 你以为 usecallback 只能用于函数么

## 六 你以为 context 不可以自由订阅吗？

## 七 新特性外部数据源介入

## 总结 -->


## 二 「React进阶」我在函数组件中可以随便写 —— 最通俗异步组件原理

本文已参与「掘力星计划」，赢取创作大礼包，挑战创作激励金。

本文已参与「[掘力星计划](https://juejin.cn/post/7012210233804079141/ "https://juejin.cn/post/7012210233804079141/")」，赢取创作大礼包，挑战创作激励金。。

## 前言

接下来的几篇文章将围绕一些‘**猎奇**’场景，从原理颠覆对 React 的认识。每一个场景下背后都透漏出 React 原理，

我可以认真的说，看完这篇文章，你将掌握：
* 1 componentDidCatch 原理
* 2 susponse 原理
* 3 异步组件原理。

## 不可能的事

`我的函数组件中里可以随便写`，很多同学看到这句话的时候，脑海里应该浮现的四个字是：怎么可能？因为我们印象中的函数组件，是不能直接使用异步的，而且必须返回一段 Jsx 代码。


![1.jpg](https://p3-juejin.byteimg.com/tos-cn-i-k3u1fbpfcp/55f68be82b534cd0b585500f8944a999~tplv-k3u1fbpfcp-watermark.image?)

那么今天我将打破这个规定，在我们认为是组件的函数里做一些意想不到的事情。接下来跟着我的思路往下看吧。

首先先来看一下 jsx ，在 `React JSX` 中 `<div />` 代表 `DOM` 元素，而 `<Index>` 代表组件， `Index` 本质是**函数组件**或**类组件**。

````js
<div />
<Index />
````

透过现象看本质，JSX 为 React element 的表象，JSX 语法糖会被 `babel` 编译成 `React element` 对象 ，那么上述中: 

*  `<div />` 不是真正的 `DOM` 元素，是 type 属性为 `div` 的 element 对象。
*  组件 `Index` 是 type 属性为类或者组件本身的 element 对象。 

言归正传，那么以函数组件为参考，Index 已经约定俗成为这个样子：

````js
function Index(){
    /* 不能直接的进行异步操作 */
    /* return 一段 jsx 代码 */
    return <div></div>
}
````
如果不严格按照这个格式写，通过 jsx `<Index />`形式挂载，就会报错。看如下的例子🌰：

````js
/* Index  不是严格的组件形式 */
function Index(){
    return {
       name:'《React进阶实践指南》'
    }
}
/* 正常挂载 Index 组件 */
export default class App extends React.Component{
    render(){
        return <div>
            hello world , let us learn React! 
            <Index />
        </div>
    }
}
````


![2.jpg](https://p1-juejin.byteimg.com/tos-cn-i-k3u1fbpfcp/59c696c5736c4089b6ceb291ab72e5fa~tplv-k3u1fbpfcp-watermark.image?)

我们通过报错信息，不难发现原因，children 类型错误，children 应该是一个 React element 对象，但是 Index 返回的却是一个普通的对象。

既然不能是普通的对象，那么如果 Index 里面更不可能有异步操作了，比如如下这种情况：

````js
 /* 例子2 */
function Index(){
    return new Promise((resolve)=>{
        setTimeout(()=>{
            resolve({ name:'《React进阶实践指南》'  })
        },1000)
    })
}
````

同样也会报上面的错误，所以在一个标准的 React 组件规范下：

* 必须返回 jsx 对象结构，不能返回普通对象。
* render 执行过程中，不能出现异步操作。

## 不可能的事变为可能

那么如何破局，将不可能的事情变得可能。首先要解决的问题是 **报错问题** ，只要不报错，`App` 就能正常渲染。不难发现产生的错误时机都是在 `render` 过程中。那么就可以用 React 提供的两个渲染错误边界的生命周期 **componentDidCatch** 和 **getDerivedStateFromError**。

因为我们要在捕获渲染错误之后做一些骚操作，所以这里选 **componentDidCatch**。接下来我们用 **componentDidCatch** 改造一下 App。

````js
export default class App extends React.Component{
    state = {
       isError:false
    }
    componentDidCatch(e){
         this.setState({ isError:true })
    }
    render(){
        return <div>
            hello world , let us learn React!
            {!this.state.isError &&  <Index />}
        </div>
    }
}
````
* 用 `componentDidCatch` 捕获异常，渲染异常 


![3.jpg](https://p1-juejin.byteimg.com/tos-cn-i-k3u1fbpfcp/e034699d42e341519dc4a19306ccf0df~tplv-k3u1fbpfcp-watermark.image?)

可以看到，虽然还是报错，但是至少页面可以正常渲染了。现在做的事情还不够，以第一 Index 返回一个正常对象为例，我们想要挂载这个组件，还要获取 Index 返回的数据，那么怎么办呢？

突然想到 `componentDidCatch` 能够捕获到渲染异常，那么它的内部就应该像 `try{}catch(){}` 一样，通过 catch 捕获异常。类似下面这种：

````js
try{
    // 尝试渲染
}catch(e){
     // 渲染失败，执行componentDidCatch(e)
     componentDidCatch(e) 
}
````

那么如果在 Index 中抛出的错误，是不是也可以在 `componentDidCatch` 接收到。于是说干就干。我们把 Index 改变由 `return` 变成 `throw` ，然后在 componentDidCatch 打印错误 `error`。


````js
function Index(){
    throw {
       name:'《React进阶实践指南》'
    }
}
````
* 将 throw 对象返回。
````js
componentDidCatch(e){
    console.log('error:',e)
    this.setState({ isError:true })
}
````
* 通过 componentDidCatch 捕获错误。此时的 e 就是 Index `throw` 的对象。接下来用子组件抛出的对象渲染。


![5.jpeg](https://p3-juejin.byteimg.com/tos-cn-i-k3u1fbpfcp/be0ef12689ff4acfb4b7f2c964fc80be~tplv-k3u1fbpfcp-watermark.image?)

````js
export default class App extends React.Component{
    state = {
       isError:false,
       childThrowMes:{}
    }
    componentDidCatch(e){
          console.log('error:',e)
         this.setState({ isError:true , childThrowMes:e })
    }
    render(){
        return <div>
            hello world , let us learn React!
            {!this.state.isError ?  <Index /> : <div> {this.state.childThrowMes.name} </div>}
        </div>
    }
}
````
* 捕获到 Index 抛出的异常对象，用对象里面的数据重新渲染。

效果：


![6.jpg](https://p6-juejin.byteimg.com/tos-cn-i-k3u1fbpfcp/e0b55e4083294072bcc3d3ca281cffe1~tplv-k3u1fbpfcp-watermark.image?)

大功告成，子组件 throw 错误，父组件 componentDidCatch 接受并渲染，这波操作是不是有点...


![4.gif](https://p1-juejin.byteimg.com/tos-cn-i-k3u1fbpfcp/3793c939ff264354a84ec3a1f628c5f5~tplv-k3u1fbpfcp-watermark.image?)

但是 `throw` 的所有对象，都会被正常捕获吗？ 于是我们把第二个 Index 抛出的 **`Promise` 对象**用 componentDidCatch 捕获。看看会是什么吧？


![7.jpg](https://p6-juejin.byteimg.com/tos-cn-i-k3u1fbpfcp/65d31a07bca6461ba7623d8275ce5812~tplv-k3u1fbpfcp-watermark.image?)

如上所示，**`Promise` 对象**没有被正常捕获，捕获的是异常的提示信息。在异常提示中，可以找到 Suspense 的字样。那么 `throw Promise` 和 `Suspense` 之间肯定存在着关联，换句话说就是 `Suspense` 能够捕获到 `Promise` 对象。而这个错误警告，就是 React 内部发出找不到上层的 Suspense 组件的错误。

到此为止，可以总结出：
* componentDidCatch 通过 `try{}catch(e){}` 捕获到异常，如果我们在渲染过程中，throw 出来的普通对象，也会被捕获到。但是 `Promise` 对象，会被 React 底层第 2 次抛出异常。
* Suspense 内部可以接受 throw 出来的 Promise 对象，那么内部有一个 `componentDidCatch` 专门负责异常捕获。

## 鬼畜版——我的组件可以写异步

即然直接 throw Promise 会在 React 底层被拦截，那么如何在组件内部实现正常编写异步操作的功能呢？既然 React 会拦截组件抛出的 Promise 对象，那么如果把 Promise 对象包装一层呢? 于是我们把 Index 内容做修改。

````js
function Index(){
    throw {
        current:new Promise((resolve)=>{
            setTimeout(()=>{
                resolve({ name:'《React进阶实践指南》'  })
            },1000)
        })
    }
}
````
* 如上，这回不在直接抛出 Promise，而是在 Promise 的外面在包裹一层对象。接下来打印错误看一下。


![8.jpg](https://p9-juejin.byteimg.com/tos-cn-i-k3u1fbpfcp/6a1a4bc78bf0422c8fb1e5078a28e1e4~tplv-k3u1fbpfcp-watermark.image?)

可以看到，能够直接接收到 Promise 啦，接下来我们执行 `Promise` 对象，模拟异步请求，用请求之后的数据进行渲染。于是修改 App 组件。

````js
export default class App extends React.Component{
    state = {
       isError:false,
       childThrowMes:{}
    }
    componentDidCatch(e){
         const errorPromise = e.current
         Promise.resolve(errorPromise).then(res=>{
            this.setState({ isError:true , childThrowMes:res })
         })
    }
    render(){
        return <div>
            hello world , let us learn React!
            {!this.state.isError ?  <Index /> : <div> {this.state.childThrowMes.name} </div>}
        </div>
    }
}
````

* 在 componentDidCatch 的参数 e 中获取 Promise ，`Promise.resolve` 执行 Promise 获取数据并渲染。

效果：

![9.jpg](https://p1-juejin.byteimg.com/tos-cn-i-k3u1fbpfcp/b7ee7ed296844acd975d4d155cae1078~tplv-k3u1fbpfcp-watermark.image?)

可以看到数据正常渲染了，但是面临一个新的问题：目前的 Index 不是一个真正意义上的组件，而是一个函数，所以接下来，改造 Index 使其变成正常的组件，通过获取异步的数据。

````js
function Index({ isResolve = false , data }){
    const [ likeNumber , setLikeNumber ] = useState(0)
    if(isResolve){
        return <div>
            <p> 名称：{data.name} </p>
            <p> star：{likeNumber} </p>
            <button onClick={()=> setLikeNumber(likeNumber+1)} >点赞</button>
        </div>
    }else{
        throw {
            current:new Promise((resolve)=>{
                setTimeout(()=>{
                    resolve({ name:'《React进阶实践指南》'  })
                },1000)
            })
        }
    }
}
````
* Index 中通过 `isResolve` 判断组件是否加在完成，第一次的时候 `isResolve = false` 所以 `throw Promise`。
* 父组件 App 中接受 Promise ，得到数据，改变状态 isResolve ，二次渲染，那么第二次 Index 就会正常渲染了。看一下 App 如何写：

````js
export default class App extends React.Component{
    state = {
       isResolve:false,
       data:{}
    }
    componentDidCatch(e){
         const errorPromise = e.current
         Promise.resolve(errorPromise).then(res=>{
            this.setState({ data:res,isResolve:true  })
         })
    }
    render(){
        const {  isResolve ,data } = this.state
        return <div>
            hello world , let us learn React!
            <Index data={data} isResolve={isResolve} />
        </div>
    }
}
````

* 通过 componentDidCatch 捕获错误，然后进行第二次渲染。

**效果：**



![10.gif](https://p9-juejin.byteimg.com/tos-cn-i-k3u1fbpfcp/1fe30679c8a342c193b7531092b78b24~tplv-k3u1fbpfcp-watermark.image?)

达到了目的。这里就简单介绍了一下异步组件的原理。上述引入了一个 Susponse 的概念，接下来研究一下 Susponse。

## 飞翔版——实现一个简单 Suspense 

Susponse 是什么？ Susponse 英文翻译 **悬停**。在 React 中 Susponse 是什么呢？ 那么正常情况下组件染是一气呵成的，在 Susponse 模式下的组件渲染就变成了可以先悬停下来。

**首先解释为什么悬停？** 

Susponse 在 React 生态中的位置，重点体现在以下方面。

* **code splitting（代码分割）** ：哪个组件加载，就加载哪个组件的代码，听上去挺拗口，可确实打实的解决了主文件体积过大的问题，间接优化了项目的首屏加载时间，我们知道过浏览器加载资源也是耗时的，这些时间给用户造成的影响就是白屏效果。

* **spinner 解耦**：正常情况下，页面展示是需要前后端交互的，数据加载过程不期望看到 **无数据状态->闪现数据**的场景，更期望的是一种**spinner数据加载状态->加载完成展示页面**状态。比如如下结构：

````js
<List1 />
<List2 />
````
`List1` 和 `List2` 都使用服务端请求数据，那么在加载数据过程中，需要 Spin 效果去优雅的展示 UI，所以需要一个 Spin 组件，但是 Spin 组件需要放入 `List1` 和 `List2` 的内部，就造成耦合关系。现在通过 Susponse 来接耦 Spin，在业务代码中这么写道：

````js
<Suspense fallback={ <Spin /> }  >
    <List1 />
    <List2 />
</Suspense>
````

当 `List1` 和 `List2` 数据加载过程中，用 Spin 来 loading 。把 Spin 解耦出来，就像看电影，如果电影加载视频流卡住，不期望给用户展示黑屏幕，取而代之的是用海报来填充屏幕，而海报就是这个 Spin 。

* **render data**： 整个 render 过程都是同步执行一气呵成的，那样就会 组件 Render => 请求数据 => 组件 reRender ，但是在 Suspense 异步组件情况下允许调用 Render => 发现异步请求 => 悬停，等待异步请求完毕 => 再次渲染展示数据。这样无疑减少了一次渲染。

**接下来解释如何悬停**

上面理解了 Suspense 初衷，接下来分析一波原理，首先通过上文中，已经交代了 Suspense 原理，如何悬停，很简单粗暴，直接抛出一个异常；

异常是什么，一个 Promise ，这个 Promise 也分为二种情况：

* 第一种就是异步请求数据，这个 `Promise` 内部封装了请求方法。请求数据用于渲染。
* 第二种就是异步加载组件，配合 `webpack` 提供的 require() api，实现代码分割。

**悬停后再次render**

在 Suspense 悬停后，如果想要恢复渲染，那么 rerender 一下就可以了。

如上详细介绍了 Suspense 。接下来到了实践环节，我们去尝试实现一个 Suspense ，首先声明一下这个 Suspense 并不是 React 提供的 Suspense ，这里只是模拟了一下它的大致实现细节。

本质上 Suspense 落地瓶颈也是对请求函数的的封装，Suspense 主要接受 Promise，并 `resolve` 它，那么对于成功的状态回传到异步组件中，对于开发者来说是未知的，对于 Promise 和状态传递的函数 createFetcher，应该满足如下的条件。

````js
const fetch = createFetcher(function getData(){
    return new Promise((resolve)=>{
       setTimeout(()=>{
            resolve({
                name:'《React进阶实践指南》',
                author:'alien'
            })
       },1000)
    })
})
function Text(){
    const data = fetch()
    return <div>
        name: {data.name}
        author:{data.author}
    </div>
}
````
* 通过 `createFetcher` 封装请求函数。请求函数 getData 返回一个 Promise ，这个 Promise 的使命就是完成数据交互。
* 一个模拟的异步组件，内部使用 createFetcher 创建的请求函数，请求数据。

接下来就是 `createFetcher` 函数的编写。

````js
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
        if(fetcher.status==='resolve')
        return fetcher.result
    }
}
````

* 这里要注意的是 `fn` 就是 `getData`， getDataPromise 就是 `getData`返回的 Promise。
* 返回一个函数 `fetch` ，在 `Text` 内部执行，第一次组件渲染，由于 status = pedding 所以抛出异常 fetcher 给 Susponse，渲染中止。
* Susponse 会在内部 componentDidCatch 处理这个fetcher，执行 getDataPromise.then， 这个时候status已经是resolve状态，数据也能正常返回了。
* 接下来Susponse再次渲染组件，此时就能正常的获取数据了。

既然有了 createFetcher 函数，接下来就要模拟上游组件 Susponse 。

````js
class MySusponse extends React.Component{
    state={
        isResolve:true
    }
    componentDidCatch(fetcher){
        const p = fetcher.p
        this.setState({ isResolve:false })
        Promise.resolve(p).then(()=>{
            this.setState({ isResolve:true })
        })
    }
    render(){
        const { fallback, children  } = this.props
        const { isResolve } = this.state
        return isResolve ? children : fallback
    }
}

````

我们编写的 Susponse 起名字叫 **MySusponse** 。

* MySusponse 内部 componentDidCatch 通过 `Promise.resolve` 捕获 Promise 成功的状态。成功后，取缔 fallback UI 效果。

大功告成，接下来就是体验环节了。我们尝试一下 MySusponse 效果。

````js
export default function Index(){
    return <div>
        hello，world
       <MySusponse fallback={<div>loading...</div>} >
            <Text />
       </MySusponse>
    </div>
}
````
**效果：**


![11.gif](https://p6-juejin.byteimg.com/tos-cn-i-k3u1fbpfcp/32dbc9b0e7324d0ca99c2029dfa6d0df~tplv-k3u1fbpfcp-watermark.image?)

虽然实现了效果，但是和真正的 Susponse 还差的很远，首先暴露出的问题就是**数据可变**的问题。上述编写的 MySusponse 数据只加载一次，但是通常情况下，数据交互是存在变数的，数据也是可变的。

## 衍生版——实现一个错误异常处理组件

言归正传，我们不会在函数组件中做如上的骚操作，也不会自己去编写 `createFetcher` 和 `Susponse`。但是有一个场景还是蛮实用的，那就是对渲染错误的处理，以及 UI 的降级，这种情况通常出现在服务端数据的不确定的场景下，比如我们通过服务端的数据 data 进行渲染，像如下场景：

````js
<div>{ data.name }</div>
````
如果 data 是一个对象，那么会正常渲染，但是如果 data 是 null，那么就会报错，如果不加渲染错误边界，那么一个小问题会导致整个页面都渲染不出来。

那么对于如上情况，如果每一个页面组件，都加上 `componentDidCatch` 这样捕获错误，降级 UI 的方式，那么代码过于冗余，难以复用，无法把降级的 UI 从业务组件中解耦出来。

所以可以统一写一个 RenderControlError 组件，目的就是在组件的出现异常的情况，统一展示降级的 UI ，也确保了整个前端应用不会奔溃，同样也让服务端的数据格式容错率大大提升。接下来看一下具体实现。


````js
class RenderControlError extends React.Component{
    state={
        isError:false
    }
    componentDidCatch(){
        this.setState({ isError:true })
    }
    render(){
        return !this.state.isError ?
             this.props.children :
             <div style={styles.errorBox} >
                 <img url={require('../../assets/img/error.png')}
                     style={styles.erroImage}
                 />
                 <span style={styles.errorText}  >出现错误</span>
             </div>
    }
}
````

* 如果 children 出错，那么降级 UI。

**使用**
````js
<RenderControlError>
    <Index />
</RenderControlError>
````


##  总结

本文通过一些脑洞大开，奇葩的操作，让大家明白了 Susponse ，componentDidCatch 等原理。我相信不久之后，随着 React 18 发布，Susponse 将崭露头角，未来可期。

最后， 送人玫瑰，手留余香，觉得有收获的朋友可以给笔者点赞，关注一波 ，陆续更新前端超硬核文章。

奉上几个小册《React进阶实践指南》 7 折 优惠码 **2KEeJFjm** ，先到先得～

### 参考文章

* [「React进阶」漫谈React异步组件前世与今生](https://juejin.cn/post/6970845778713509919)


