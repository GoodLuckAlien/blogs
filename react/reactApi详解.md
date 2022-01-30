# 「react进阶」 react全部api解读+基础实践大全(夯实基础)

---
theme: juejin
highlight: a11y-dark
---


很多同学用`react`开发的时候，真正用到的`React`的`api`少之又少，基本停留在`Component`,`React.memo`等层面,实际`react`源码中，暴露出来的方法并不少，只是我们平时很少用。但是`React`暴露出这么多`api`并非没有用，想要玩转`react`,就要明白这些`API`究竟是干什么的，应用场景是什么，今天就让我们从`react` 到 `react-dom`,一次性把`react`生产环境的暴露`api`复习个遍(涵盖90%+)。

我们把`react`,`API`，分为**组件类**，**工具类**，**`hooks`**，再加上 **`react-dom`**  ，一共四大方向，分别加以探讨。

为了能让屏幕前的你，更理解`api`,我是绞尽脑汁,本文的每一个`api`基本都会出一个`demo`演示效果,弥补一下天书般的`react`文档😂😂😂，还有就是我对`api`基本概念的理解。创作不易，希望屏幕前的你能给笔者赏个**赞**，以此鼓励我继续创作前端硬文。

老规矩，我们带着疑问开始今天的阅读(**自测掌握程度**)？

* 1 `react`暴露的`api`有哪些，该如何使用？
* 2 `react`提供了哪些自测性能的手段？
* 3  `ref`既然不能用在函数组件中，那么父组件如何控制函数子组件内的`state`和方法？
* 4 `createElement`和`cloneElement`有什么区别，应用场景是什么？
* 5 `react`内置的`children`遍历方法，和数组方法,有什么区别？
* 6 `react`怎么将子元素渲染到指定父元素之外的指定容器中？
* ...

我相信读完这篇文章，这些问题全都会迎刃而解？ 

# 组件类

组件类，详细分的话有三种类，第一类说白了就是我平时用于继承的基类组件`Component`,`PureComponent`,还有就是`react`提供的内置的组件，比如`Fragment`,`StrictMode`,另一部分就是高阶组件`forwardRef`,`memo`等。


![comp.jpg](https://p1-juejin.byteimg.com/tos-cn-i-k3u1fbpfcp/5b4241cc9e044c608c5ca9c2648bcd48~tplv-k3u1fbpfcp-watermark.image)

## Component

`Component`是`class`组件的根基。类组件一切始于`Component`。对于`React.Component`使用，我们没有什么好讲的。我们这里重点研究一下`react`对`Component`做了些什么。


`react/src/ReactBaseClasses.js`

````js
function Component(props, context, updater) {
  this.props = props;
  this.context = context;
  this.refs = emptyObject;
  this.updater = updater || ReactNoopUpdateQueue;
}
````
这就是`Component`函数，其中`updater`对象上保存着更新组件的方法。

**我们声明的类组件是什么时候以何种形式被实例化的呢？**

`react-reconciler/src/ReactFiberClassComponent.js`

**constructClassInstance**

````js
function constructClassInstance(
    workInProgress,
    ctor,
    props
){
   const instance = new ctor(props, context);
    instance.updater = {
        isMounted,
        enqueueSetState(){
            /* setState 触发这里面的逻辑 */
        },
        enqueueReplaceState(){},
        enqueueForceUpdate(){
            /* forceUpdate 触发这里的逻辑 */
        }
    }
}
````
对于`Component`， `react` 处理逻辑还是很简单的，实例化我们类组件，然后赋值`updater`对象，负责组件的更新。然后在组件各个阶段，执行类组件的`render`函数，和对应的生命周期函数就可以了。


## PureComponent

`PureComponent`和 `Component`用法，差不多一样，唯一不同的是，纯组件`PureComponent`会浅比较，`props`和`state`是否相同，来决定是否重新渲染组件。所以一般用于**性能调优**，减少**render**次数。

什么叫做**浅比较**，我这里举个列子：

````js
class Index extends React.PureComponent{
    constructor(props){
        super(props)
        this.state={
           data:{
              name:'alien',
              age:28
           }
        }
    }
    handerClick= () =>{
        const { data } = this.state
        data.age++
        this.setState({ data })
    }
    render(){
        const { data } = this.state
        return <div className="box" >
        <div className="show" >
            <div> 你的姓名是: { data.name } </div>
            <div> 年龄： { data.age  }</div>
            <button onClick={ this.handerClick } >age++</button>
        </div>
    </div>
    }
}
````


![pureComponent.gif](https://p3-juejin.byteimg.com/tos-cn-i-k3u1fbpfcp/030e96abf31d46ab8dd9f4f72389127c~tplv-k3u1fbpfcp-watermark.image)
**点击按钮，没有任何反应**，因为`PureComponent`会比较两次`data`对象，都指向同一个`data`,没有发生改变，所以不更新视图。

解决这个问题很简单，只需要在`handerClick`事件中这么写：

````js
 this.setState({ data:{...data} })
````

**浅拷贝**就能根本解决问题。



## memo

`React.memo`和`PureComponent`作用类似，可以用作性能优化，`React.memo` 是高阶组件，函数组件和类组件都可以使用， 和区别`PureComponent`是 `React.memo`只能对`props`的情况确定是否渲染，而`PureComponent`是针对`props`和`state`。

`React.memo` 接受两个参数，第一个参数原始组件本身，第二个参数，可以根据一次更新中`props`是否相同决定原始组件是否重新渲染。是一个返回布尔值，`true` 证明组件无须重新渲染，`false`证明组件需要重新渲染，这个和类组件中的`shouldComponentUpdate()`正好相反 。

**React.memo: 第二个参数 返回 `true` 组件不渲染 ， 返回 `false` 组件重新渲染。**
**shouldComponentUpdate: 返回 `true` 组件渲染 ， 返回 `false` 组件不渲染。**




接下来我们做一个场景，控制组件在仅此一个`props`数字变量，一定范围渲染。

例子🌰：

控制 `props` 中的 `number` ：

* 1 只有 `number` 更改，组件渲染。

* 2 只有 `number` 小于 5 ，组件渲染。

````js
function TextMemo(props){
    console.log('子组件渲染')
    if(props)
    return <div>hello,world</div> 
}

const controlIsRender = (pre,next)=>{
   if(pre.number === next.number  ){ // number 不改变 ，不渲染组件
       return true 
   }else if(pre.number !== next.number && next.number > 5 ) { // number 改变 ，但值大于5 ， 不渲染组件
       return true
   }else { // 否则渲染组件
       return false
   }
}

const NewTexMemo = memo(TextMemo,controlIsRender)
class Index extends React.Component{
    constructor(props){
        super(props)
        this.state={
            number:1,
            num:1
        }
    }
    render(){
        const { num , number }  = this.state
        return <div>
            <div>
                改变num：当前值 { num }  
                <button onClick={ ()=>this.setState({ num:num + 1 }) } >num++</button>
                <button onClick={ ()=>this.setState({ num:num - 1 }) } >num--</button>  
            </div>
            <div>
                改变number： 当前值 { number } 
                <button onClick={ ()=>this.setState({ number:number + 1 }) } > number ++</button>
                <button onClick={ ()=>this.setState({ number:number - 1 }) } > number -- </button>  
            </div>
            <NewTexMemo num={ num } number={number}  />
        </div>
    }
}
````
**效果：**

![memo.gif](https://p1-juejin.byteimg.com/tos-cn-i-k3u1fbpfcp/823787ff6ac5492c9da013b1acb4dfbc~tplv-k3u1fbpfcp-watermark.image)


完美达到了效果，`React.memo`一定程度上，可以等价于组件外部使用`shouldComponentUpdate` ，用于拦截新老`props`，确定组件是否更新。

 
## forwardRef

官网对`forwardRef`的概念和用法很笼统，也没有给定一个具体的案例。很多同学不知道 `forwardRef`具体怎么用，下面我结合具体例子给大家讲解`forwardRef`应用场景。

**1 转发引入Ref**

这个场景实际很简单，比如父组件想获取孙组件，某一个`dom`元素。这种隔代`ref`获取引用，就需要`forwardRef`来助力。

````js
function Son (props){
    const { grandRef } = props
    return <div>
        <div> i am alien </div>
        <span ref={grandRef} >这个是想要获取元素</span>
    </div>
}

class Father extends React.Component{
    constructor(props){
        super(props)
    }
    render(){
        return <div>
            <Son grandRef={this.props.grandRef}  />
        </div>
    }
}

const NewFather = React.forwardRef((props,ref)=><Father grandRef={ref}  {...props} />  )

class GrandFather extends React.Component{
    constructor(props){
        super(props)
    }
    node = null 
    componentDidMount(){
        console.log(this.node)
    }
    render(){
        return <div>
            <NewFather ref={(node)=> this.node = node } />
        </div>
    }
}
````

**效果**

![forwaedRef.jpg](https://p6-juejin.byteimg.com/tos-cn-i-k3u1fbpfcp/4a2cd13003af4b5880b0bee19973fd44~tplv-k3u1fbpfcp-watermark.image)

`react`不允许`ref`通过`props`传递，因为组件上已经有 `ref` 这个属性,在组件调和过程中，已经被特殊处理，`forwardRef`出现就是解决这个问题，把`ref`转发到自定义的`forwardRef`定义的属性上，让`ref`，可以通过`props`传递。

**2 高阶组件转发Ref**

一文吃透`hoc`文章中讲到，由于属性代理的`hoc`，被包裹一层，所以如果是类组件，是通过`ref`拿不到原始组件的实例的，不过我们可以通过`forWardRef`转发`ref`。

````js
function HOC(Component){
  class Wrap extends React.Component{
     render(){
        const { forwardedRef ,...otherprops  } = this.props
        return <Component ref={forwardedRef}  {...otherprops}  />
     }
  }
  return  React.forwardRef((props,ref)=> <Wrap forwardedRef={ref} {...props} /> ) 
}
class Index extends React.Component{
  componentDidMount(){
      console.log(666)
  }
  render(){
    return <div>hello,world</div>
  }
}
const HocIndex =  HOC(Index,true)
export default ()=>{
  const node = useRef(null)
  useEffect(()=>{
     /* 就可以跨层级，捕获到 Index 组件的实例了 */ 
    console.log(node.current.componentDidMount)
  },[])
  return <div><HocIndex ref={node}  /></div>
}

````

如上，解决了高阶组件引入`Ref`的问题。


## lazy

> React.lazy 和 Suspense 技术还不支持服务端渲染。如果你想要在使用服务端渲染的应用中使用，我们推荐 Loadable Components 这个库

`React.lazy`和`Suspense`配合一起用，能够有动态加载组件的效果。`React.lazy` 接受一个函数，这个函数需要动态调用 `import()`。它必须返回一个 `Promise` ，该 `Promise` 需要 `resolve` 一个 `default export` 的 `React` 组件。

我们模拟一个动态加载的场景。

**父组件**

````js
import Test from './comTest'
const LazyComponent =  React.lazy(()=> new Promise((resolve)=>{
      setTimeout(()=>{
          resolve({
              default: ()=> <Test />
          })
      },2000)
}))
class index extends React.Component{   
    render(){
        return <div className="context_box"  style={ { marginTop :'50px' } }   >
           <React.Suspense fallback={ <div className="icon" ><SyncOutlined  spin  /></div> } >
               <LazyComponent />
           </React.Suspense>
        </div>
    }
}
````
我们用`setTimeout`来模拟`import`异步引入效果。

**Test**

````js
class Test extends React.Component{
    constructor(props){
        super(props)
    }
    componentDidMount(){
        console.log('--componentDidMount--')
    }
    render(){
        return <div>
            <img src={alien}  className="alien" />
        </div>
    }
}
````

**效果**



![lazy.gif](https://p3-juejin.byteimg.com/tos-cn-i-k3u1fbpfcp/bf576c3e03714c1594bfddf2467fe877~tplv-k3u1fbpfcp-watermark.image)

## Suspense

何为`Suspense`, `Suspense` 让组件“等待”某个异步操作，直到该异步操作结束即可渲染。

用于数据获取的 `Suspense` 是一个新特性，你可以使用 `<Suspense>` 以声明的方式来“等待”任何内容，包括数据。本文重点介绍它在数据获取的用例，它也可以用于等待图像、脚本或其他异步的操作。

上面讲到高阶组件`lazy`时候，已经用 `lazy` + `Suspense`模式，构建了异步渲染组件。我们看一下官网文档中的案例：

````js
const ProfilePage = React.lazy(() => import('./ProfilePage')); // 懒加载
<Suspense fallback={<Spinner />}>
  <ProfilePage />
</Suspense>
````


## Fragment

`react`不允许一个组件返回多个节点元素，比如说如下情况

````js
render(){
    return <li> 🍎🍎🍎 </li>
           <li> 🍌🍌🍌 </li>
           <li> 🍇🍇🍇 </li>
}
````

如果我们想解决这个情况，很简单，只需要在外层套一个容器元素。

````js
render(){
    return <div>
           <li> 🍎🍎🍎 </li>
           <li> 🍌🍌🍌 </li>
           <li> 🍇🍇🍇 </li>
    </div>
}
````
但是我们不期望，增加额外的`dom`节点，所以`react`提供`Fragment`碎片概念，能够让一个组件返回多个元素。
所以我们可以这么写

````js
<React.Fragment>
    <li> 🍎🍎🍎 </li>
    <li> 🍌🍌🍌 </li>
    <li> 🍇🍇🍇 </li>
</React.Fragment>
````
还可以简写成：

````js
<>
    <li> 🍎🍎🍎 </li>
    <li> 🍌🍌🍌 </li>
    <li> 🍇🍇🍇 </li>
</>
````

和`Fragment`区别是，`Fragment`可以支持`key`属性。`<></>`不支持`key`属性。

**温馨提示**。我们通过`map`遍历后的元素，`react`底层会处理，默认在外部嵌套一个`<Fragment>`。

比如：

````js
{
   [1,2,3].map(item=><span key={item.id} >{ item.name }</span>)
}
````

`react`底层处理之后，等价于：

````html
<Fragment>
   <span></span>
   <span></span>
   <span></span>
</Fragment>
````


## Profiler

`Profiler`这个`api`一般用于开发阶段，性能检测，检测一次`react`组件渲染用时，性能开销。

`Profiler` 需要两个参数：

第一个参数：是 `id`，用于表识唯一性的`Profiler`。

第二个参数：`onRender`回调函数，用于渲染完成，接受渲染参数。

**实践：**

````js
const index = () => {
  const callback = (...arg) => console.log(arg)
  return <div >
    <div >
      <Profiler id="root" onRender={ callback }  >
        <Router  >
          <Meuns/>
          <KeepaliveRouterSwitch withoutRoute >
              { renderRoutes(menusList) }
          </KeepaliveRouterSwitch>
        </Router>
      </Profiler> 
    </div>
  </div>
}
````

**结果**


![Profiler.jpg](https://p3-juejin.byteimg.com/tos-cn-i-k3u1fbpfcp/229b794fe0f2449e9a18dc7f3733a395~tplv-k3u1fbpfcp-watermark.image)


onRender

* 0 -id: `root`  ->  `Profiler` 树的 `id` 。
* 1 -phase: `mount` ->  `mount` 挂载 ， `update` 渲染了。
* 2 -actualDuration: `6.685000262223184`  -> 更新 `committed` 花费的渲染时间。
* 3 -baseDuration:  `4.430000321008265`  -> 渲染整颗子树需要的时间
* 4 -startTime : `689.7299999836832` ->  本次更新开始渲染的时间
* 5 -commitTime : `698.5799999674782` ->  本次更新committed 的时间
* 6 -interactions: `set{}` -> 本次更新的 `interactions` 的集合

> 尽管 Profiler 是一个轻量级组件，我们依然应该在需要时才去使用它。对一个应用来说，每添加一些都会给 CPU 和内存带来一些负担。


## StrictMode

`StrictMode`见名知意，严格模式，用于检测`react`项目中的潜在的问题，。与 `Fragment` 一样， `StrictMode` 不会渲染任何可见的 `UI` 。它为其后代元素触发额外的检查和警告。

> 严格模式检查仅在开发模式下运行；它们不会影响生产构建。

`StrictMode`目前有助于：

* ①识别不安全的生命周期。
* ②关于使用过时字符串 `ref API` 的警告
* ③关于使用废弃的 `findDOMNode` 方法的警告
* ④检测意外的副作用
* ⑤检测过时的 `context API`


**实践:识别不安全的生命周期**

对于不安全的生命周期，指的是`UNSAFE_componentWillMount`，`UNSAFE_componentWillReceiveProps` , `UNSAFE_componentWillUpdate`

`外层开启严格模式：`

````js
<React.StrictMode> 
    <Router  >
        <Meuns/>
        <KeepaliveRouterSwitch withoutRoute >
            { renderRoutes(menusList) }
        </KeepaliveRouterSwitch>
    </Router>
</React.StrictMode>
````

`我们在内层组件中，使用不安全的生命周期:`

````js
class Index extends React.Component{    
    UNSAFE_componentWillReceiveProps(){
    }
    render(){      
        return <div className="box" />   
    }
}
````

`效果：`


![strictMode.jpg](https://p3-juejin.byteimg.com/tos-cn-i-k3u1fbpfcp/5c84f768c1d440ccb4523d51a7065b79~tplv-k3u1fbpfcp-watermark.image)




# 工具类

接下来我们一起来探究一下`react`工具类函数的用法。


![utils.jpg](https://p9-juejin.byteimg.com/tos-cn-i-k3u1fbpfcp/4a55db52d97845b2bc29d9078680ef82~tplv-k3u1fbpfcp-watermark.image)

## createElement

一提到`createElement`，就不由得和`JSX`联系一起。我们写的`jsx`，最终会被 `babel`，用`createElement`编译成`react`元素形式。我写一个组件，我们看一下会被编译成什么样子，

如果我们在`render`里面这么写：

````js
render(){
    return <div className="box" >
        <div className="item"  >生命周期</div>
        <Text  mes="hello,world"  />
        <React.Fragment> Flagment </React.Fragment>
        { /*  */ }
        text文本
    </div>
}
````

会被编译成这样：

````js
render() {
    return React.createElement("div", { className: "box" },
            React.createElement("div", { className: "item" }, "\u751F\u547D\u5468\u671F"),
            React.createElement(Text, { mes: "hello,world" }),
            React.createElement(React.Fragment, null, " Flagment "),
            "text\u6587\u672C");
    }
````

当然我们可以不用`jsx`模式，而是直接通过`createElement`进行开发。

**`createElement`模型:**

````js
React.createElement(
  type,
  [props],
  [...children]
)
````
`createElement`参数：

**第一个参数:**如果是组件类型，会传入组件，如果是`dom`元素类型，传入`div`或者`span`之类的字符串。

**第二个参数:**:第二个参数为一个对象，在`dom`类型中为**属性**，在`组件`类型中为**props**。

**其他参数:**，依次为`children`，根据顺序排列。

**createElement做了些什么？**

经过`createElement`处理，最终会形成 `$$typeof = Symbol(react.element)`对象。对象上保存了该`react.element`的信息。



## cloneElement

可能有的同学还傻傻的分不清楚`cloneElement`和`createElement`区别和作用。

`createElement`把我们写的`jsx`，变成`element`对象;  而`cloneElement`的作用是以 `element` 元素为样板克隆并返回新的 `React` 元素。返回元素的 `props` 是将新的 `props` 与原始元素的 `props` 浅层合并后的结果。

那么`cloneElement`感觉在我们实际业务组件中，可能没什么用，但是在**一些开源项目，或者是公共插槽组件中**用处还是蛮大的，比如说，我们可以在组件中，劫持`children element`，然后通过`cloneElement`克隆`element`，混入`props`。经典的案例就是 `react-router`中的`Swtich`组件，通过这种方式，来匹配唯一的 `Route`并加以渲染。

我们设置一个场景，在组件中，去劫持`children`，然后给`children`赋能一些额外的`props`:

````js
function FatherComponent({ children }){
    const newChildren = React.cloneElement(children, { age: 18})
    return <div> { newChildren } </div>
}

function SonComponent(props){
    console.log(props)
    return <div>hello,world</div>
}

class Index extends React.Component{    
    render(){      
        return <div className="box" >
            <FatherComponent>
                <SonComponent name="alien"  />
            </FatherComponent>
        </div>   
    }
}
````
**打印：**


![cloneElment.jpg](https://p6-juejin.byteimg.com/tos-cn-i-k3u1fbpfcp/8d4b0529cbea4e25bfcf1168d6e6d7b6~tplv-k3u1fbpfcp-watermark.image)


完美达到了效果！

## createContext

`createContext`用于创建一个`Context`对象，`createContext`对象中，包括用于传递 `Context` 对象值 `value`的`Provider`，和接受`value`变化订阅的`Consumer`。

````js
const MyContext = React.createContext(defaultValue)
````
`createContext`接受一个参数`defaultValue`，如果`Consumer`上一级一直没有`Provider`,则会应用`defaultValue`作为`value`。**只有**当组件所处的树中没有匹配到 `Provider` 时，其 `defaultValue` 参数才会生效。

我们来模拟一个 `Context.Provider`和`Context.Consumer`的例子：

````js
function ComponentB(){
    /* 用 Consumer 订阅， 来自 Provider 中 value 的改变  */
    return <MyContext.Consumer>
        { (value) => <ComponentA  {...value} /> }
    </MyContext.Consumer>
}

function ComponentA(props){
    const { name , mes } = props
    return <div> 
            <div> 姓名： { name }  </div>
            <div> 想对大家说： { mes }  </div>
         </div>
}

function index(){
    const [ value , ] = React.useState({
        name:'alien',
        mes:'let us learn React '
    })
    return <div style={{ marginTop:'50px' }} >
        <MyContext.Provider value={value}  >
          <ComponentB />
    </MyContext.Provider>
    </div>
}
````

**打印结果：**


![createContent.jpg](https://p6-juejin.byteimg.com/tos-cn-i-k3u1fbpfcp/4393bac1d6b2428d9365b0f3ff480419~tplv-k3u1fbpfcp-watermark.image)

`Provider`和`Consumer`的良好的特性，可以做数据的**存**和**取**，`Consumer`一方面传递`value`,另一方面可以订阅`value`的改变。

`Provider`还有一个特性可以层层传递`value`，这种特性在`react-redux`中表现的淋漓尽致。

## createFactory

````js
React.createFactory(type)
````

返回用于生成指定类型 React 元素的函数。类型参数既可以是标签名字符串（像是 '`div`' 或 '`span`'），也可以是 React 组件 类型 （ `class` 组件或函数组件），或是 `React fragment` 类型。

使用：
````js
 const Text = React.createFactory(()=><div>hello,world</div>) 
function Index(){  
    return <div style={{ marginTop:'50px'  }} >
        <Text/>
    </div>
}
````
**效果**


![createFactory.jpg](https://p6-juejin.byteimg.com/tos-cn-i-k3u1fbpfcp/9984deb7d57d42fd8661c4c14ea19d72~tplv-k3u1fbpfcp-watermark.image)

报出警告，这个`api`将要被废弃，我们这里就不多讲了，如果想要达到同样的效果，请用`React.createElement`



## createRef

`createRef`可以创建一个 `ref` 元素，附加在`react`元素上。

**用法：**
````js
class Index extends React.Component{
    constructor(props){
        super(props)
        this.node = React.createRef()
    }
    componentDidMount(){
        console.log(this.node)
    }
    render(){
        return <div ref={this.node} > my name is alien </div>
    }
}
````
个人觉得`createRef`这个方法，很鸡肋，我们完全可以`class`类组件中这么写，来捕获`ref`。

````js
class Index extends React.Component{
    node = null
    componentDidMount(){
        console.log(this.node)
    }
    render(){
        return <div ref={(node)=> this.node } > my name is alien </div>
    }
}
````
或者在`function`组件中这么写：

````js
function Index(){
    const node = React.useRef(null)
    useEffect(()=>{
        console.log(node.current)
    },[])
    return <div ref={node} >  my name is alien </div>
}
````

## isValidElement

这个方法可以用来检测是否为`react element`元素,接受待验证对象，返回`true`或者`false`。这个api可能对于业务组件的开发，作用不大，因为对于组件内部状态，都是已知的，我们根本就不需要去验证，是否是`react element` 元素。
但是，对于一起公共组件或是开源库，`isValidElement`就很有作用了。

**实践**

我们做一个场景，验证容器组件的所有子组件，过滤到非`react element`类型。

没有用`isValidElement`验证之前：

````js
const Text = () => <div>hello,world</div> 
class WarpComponent extends React.Component{
    constructor(props){
        super(props)
    }
    render(){
        return this.props.children
    }
}
function Index(){
    return <div style={{ marginTop:'50px' }} >
        <WarpComponent>
            <Text/>
            <div> my name is alien </div>
            Let's learn react together!
        </WarpComponent>
    </div>
}
````

**过滤之前的效果**

![isValidElement.jpg](https://p3-juejin.byteimg.com/tos-cn-i-k3u1fbpfcp/dfad646de7b3453bbb2c3d66c635f13b~tplv-k3u1fbpfcp-watermark.image)

**我们用`isValidElement`进行`react element`验证:**

````js
class WarpComponent extends React.Component{
    constructor(props){
        super(props)
        this.newChidren = this.props.children.filter(item => React.isValidElement(item) )
    }
    render(){
        return this.newChidren
    }
}
````

**过滤之后效果**

![isValidElement111.jpg](https://p3-juejin.byteimg.com/tos-cn-i-k3u1fbpfcp/b7ef80c8874c4a509c74fefd8b1e4e05~tplv-k3u1fbpfcp-watermark.image)

过滤掉了非`react element` 的 `Let's learn react together!`。

## Children.map

接下来的五个`api`都是和`react.Chidren`相关的，我们来分别介绍一下，我们先来看看官网的描述，`React.Children` 提供了用于处理 `this.props.children` 不透明数据结构的实用方法。

有的同学会问遍历 `children`用数组方法,`map` ，`forEach` 不就可以了吗？ 请我们注意一下`不透明数据结构`,什么叫做不透明结构?

**我们先看一下透明的结构：**

````js
class Text extends React.Component{
    render(){
        return <div>hello,world</div>
    }
}
function WarpComponent(props){
    console.log(props.children)
    return props.children
}
function Index(){
    return <div style={{ marginTop:'50px' }} >
        <WarpComponent>
            <Text/>
            <Text/>
            <Text/>
            <span>hello,world</span>
        </WarpComponent>
    </div>
}
````
**打印**


![chidrenmap.jpg](https://p3-juejin.byteimg.com/tos-cn-i-k3u1fbpfcp/4247073612eb4b609a1ca7528a1a07f1~tplv-k3u1fbpfcp-watermark.image)

但是我们把`Index`结构改变一下：

````js
function Index(){
    return <div style={{ marginTop:'50px' }} >
        <WarpComponent>
            { new Array(3).fill(0).map(()=><Text/>) }
            <span>hello,world</span>
        </WarpComponent>
    </div>
}
````
**打印**


![chidrenmap2.jpg](https://p3-juejin.byteimg.com/tos-cn-i-k3u1fbpfcp/b8e1630e79f54b54b4291b7f4130aebe~tplv-k3u1fbpfcp-watermark.image)



这个数据结构，我们不能正常的遍历了，即使遍历也不能遍历，每一个子元素。此时就需要 `react.Chidren` 来帮忙了。

但是我们把`WarpComponent`组件用`react.Chidren`处理`children`:

````js
function WarpComponent(props){
    const newChildren = React.Children.map(props.children,(item)=>item)
    console.log(newChildren)
    return newChildren
} 
````

此时就能正常遍历了，达到了预期效果。


![C71364B2-25E8-4F7D-A26D-50CA36AF4E33.jpg](https://p6-juejin.byteimg.com/tos-cn-i-k3u1fbpfcp/0158172495a648df8e804a0707f993bc~tplv-k3u1fbpfcp-watermark.image)


**注意**
如果 `children` 是一个 `Fragment` 对象，它将被视为单一子节点的情况处理，而不会被遍历。

## Children.forEach

`Children.forEach`和`Children.map` 用法类似，`Children.map`可以返回新的数组，`Children.forEach`仅停留在遍历阶段。

我们将上面的`WarpComponent`方法，用`Children.forEach`改一下。

````js
function WarpComponent(props){
    React.Children.forEach(props.children,(item)=>console.log(item))
    return props.children
}   
````

## Children.count

`children` 中的组件总数量，等同于通过 `map` 或 `forEach` 调用回调函数的次数。对于更复杂的结果，`Children.count`可以返回同一级别子组件的数量。

我们还是把上述例子进行改造：

````js
function WarpComponent(props){
    const childrenCount =  React.Children.count(props.children)
    console.log(childrenCount,'childrenCount')
    return props.children
}   
function Index(){
    return <div style={{ marginTop:'50px' }} >
        <WarpComponent>
            { new Array(3).fill(0).map((item,index) => new Array(2).fill(1).map((item,index1)=><Text key={index+index1} />)) }
            <span>hello,world</span>
        </WarpComponent>
    </div>
}
````

**效果:**


![chidrencunt.jpg](https://p1-juejin.byteimg.com/tos-cn-i-k3u1fbpfcp/04f10179d259460884beb8f035fa15e4~tplv-k3u1fbpfcp-watermark.image)


## Children.toArray

`Children.toArray`返回，`props.children`扁平化后结果。

````js
function WarpComponent(props){
    const newChidrenArray =  React.Children.toArray(props.children)
    console.log(newChidrenArray,'newChidrenArray')
    return newChidrenArray
}   
function Index(){
    return <div style={{ marginTop:'50px' }} >
        <WarpComponent>
            { new Array(3).fill(0).map((item,index)=>new Array(2).fill(1).map((item,index1)=><Text key={index+index1} />)) }
            <span>hello,world</span>
        </WarpComponent>
    </div>
}
````
**效果：**


![chuldeanarrgy.jpg](https://p1-juejin.byteimg.com/tos-cn-i-k3u1fbpfcp/64a4a789f44747ba93fa54bc94fa7f8b~tplv-k3u1fbpfcp-watermark.image)

**newChidrenArray** ,就是扁平化的数组结构。`React.Children.toArray()` 在拉平展开子节点列表时，更改 `key` 值以保留嵌套数组的语义。也就是说， `toArray` 会为返回数组中的每个 `key` 添加前缀，以使得每个元素 `key` 的范围都限定在此函数入参数组的对象内。



## Children.only

验证 `children` 是否只有一个子节点（一个 `React` 元素），如果有则返回它，否则此方法会抛出错误。

**不唯一**
````js
function WarpComponent(props){
    console.log(React.Children.only(props.children))
    return props.children
}   
function Index(){
    return <div style={{ marginTop:'50px' }} >
        <WarpComponent>
            { new Array(3).fill(0).map((item,index)=><Text key={index} />) }
            <span>hello,world</span>
        </WarpComponent>
    </div>
}
````
**效果**


![falseonly.jpg](https://p3-juejin.byteimg.com/tos-cn-i-k3u1fbpfcp/a16924238b9042739100e51034e5f810~tplv-k3u1fbpfcp-watermark.image)

**唯一**

````js
function WarpComponent(props){
    console.log(React.Children.only(props.children))
    return props.children
}   
function Index(){
    return <div style={{ marginTop:'50px' }} >
        <WarpComponent>
           <Text/>
        </WarpComponent>
    </div>
}
````

**效果**


![only.jpg](https://p6-juejin.byteimg.com/tos-cn-i-k3u1fbpfcp/05aa09a275e6472a8ce50ec58e29a8ab~tplv-k3u1fbpfcp-watermark.image)

`React.Children.only()` 不接受 `React.Children.map()` 的返回值，因为它是一个数组而并不是 `React` 元素。

# react-hooks

对于`react-hooks`,我已经写了三部曲，介绍了`react-hooks`使用，自定义`hooks`，以及`react-hooks`原理，感兴趣的同学可以去看看，文章末尾有链接，对于常用的`api`，我这里参考了`react-hooks`如何使用那篇文章。并做了相应整理和补充。


![hooks.jpg](https://p3-juejin.byteimg.com/tos-cn-i-k3u1fbpfcp/978f814d97e441838bad1d654ba1ef42~tplv-k3u1fbpfcp-watermark.image)

## useState

`useState`可以弥补函数组件没有`state`的缺陷。`useState`可以接受一个初识值，也可以是一个函数`action`，`action`返回值作为新的`state`。返回一个数组，第一个值为`state`读取值，第二个值为改变`state`的`dispatchAction`函数。

我们看一个例子：

 ````jsx
 const DemoState = (props) => {
    /* number为此时state读取值 ，setNumber为派发更新的函数 */
    let [number, setNumber] = useState(0) /* 0为初始值 */
    return (<div>
        <span>{ number }</span>
        <button onClick={ ()=> {
          setNumber(number+1) /* 写法一 */
          setNumber(number=>number + 1 ) /* 写法二 */
          console.log(number) /* 这里的number是不能够即时改变的  */
        } } >num++</button>
    </div>)
}
````

## useEffect

`useEffect`可以弥补函数组件没有生命周期的缺点。我们可以在`useEffect`第一个参数回调函数中，做一些请求数据，事件监听等操作，第二个参数作为`dep`依赖项，当依赖项发生变化，重新执行第一个函数。

**useEffect可以用作数据交互。**

````jsx
/* 模拟数据交互 */
function getUserInfo(a){
    return new Promise((resolve)=>{
        setTimeout(()=>{ 
           resolve({
               name:a,
               age:16,
           }) 
        },500)
    })
}
const DemoEffect = ({ a }) => {
    const [ userMessage , setUserMessage ] :any= useState({})
    const div= useRef()
    const [number, setNumber] = useState(0)
    /* 模拟事件监听处理函数 */
    const handleResize =()=>{}
    /* useEffect使用 ，这里如果不加限制 ，会是函数重复执行，陷入死循环*/
    useEffect(()=>{
        /* 请求数据 */
       getUserInfo(a).then(res=>{
           setUserMessage(res)
       })
       /* 操作dom  */
       console.log(div.current) /* div */
       /* 事件监听等 */
        window.addEventListener('resize', handleResize)
    /* 只有当props->a和state->number改变的时候 ,useEffect副作用函数重新执行 ，如果此时数组为空[]，证明函数只有在初始化的时候执行一次相当于componentDidMount */
    },[ a ,number ])
    return (<div ref={div} >
        <span>{ userMessage.name }</span>
        <span>{ userMessage.age }</span>
        <div onClick={ ()=> setNumber(1) } >{ number }</div>
    </div>)
}

````
**useEffect可以用作事件监听，还有一些基于`dom`的操作。**,别忘了在`useEffect`第一个参数回调函数，返一个函数用于清除事件监听等操作。

````jsx
const DemoEffect = ({ a }) => {
    /* 模拟事件监听处理函数 */
    const handleResize =()=>{}
    useEffect(()=>{
       /* 定时器 延时器等 */
       const timer = setInterval(()=>console.log(666),1000)
       /* 事件监听 */
       window.addEventListener('resize', handleResize)
       /* 此函数用于清除副作用 */
       return function(){
           clearInterval(timer) 
           window.removeEventListener('resize', handleResize)
       }
    },[ a ])
    return (<div  >
    </div>)
}

````

## useMemo

`useMemo`接受两个参数，第一个参数是一个函数，返回值用于产生**保存值**。 第二个参数是一个数组，作为`dep`依赖项，数组里面的依赖项发生变化，重新执行第一个函数，产生**新的值**。

应用场景：
**1 缓存一些值，避免重新执行上下文**

````js
const number = useMemo(()=>{
    /** ....大量的逻辑运算 **/
   return number
},[ props.number ]) // 只有 props.number 改变的时候，重新计算number的值。
````

**2 减少不必要的`dom`循环**

````js
/* 用 useMemo包裹的list可以限定当且仅当list改变的时候才更新此list，这样就可以避免selectList重新循环 */
 {useMemo(() => (
      <div>{
          selectList.map((i, v) => (
              <span
                  className={style.listSpan}
                  key={v} >
                  {i.patentName} 
              </span>
          ))}
      </div>
), [selectList])}

````

**3 减少子组件渲染**
````js
/* 只有当props中，list列表改变的时候，子组件才渲染 */
const  goodListChild = useMemo(()=> <GoodList list={ props.list } /> ,[ props.list ])
````

## useCallback

`useMemo` 和 `useCallback` 接收的参数都是一样，都是在其依赖项发生变化后才执行，都是返回缓存的值，区别在于 `useMemo` 返回的是函数运行的结果， `useCallback` 返回的是函数。 返回的`callback`可以作为`props`回调函数传递给子组件。

````js
/* 用react.memo */
const DemoChildren = React.memo((props)=>{
   /* 只有初始化的时候打印了 子组件更新 */
    console.log('子组件更新')
   useEffect(()=>{
       props.getInfo('子组件')
   },[])
   return <div>子组件</div>
})
const DemoUseCallback=({ id })=>{
    const [number, setNumber] = useState(1)
    /* 此时usecallback的第一参数 (sonName)=>{ console.log(sonName) }
     经过处理赋值给 getInfo */
    const getInfo  = useCallback((sonName)=>{
          console.log(sonName)
    },[id])
    return <div>
        {/* 点击按钮触发父组件更新 ，但是子组件没有更新 */}
        <button onClick={ ()=>setNumber(number+1) } >增加</button>
        <DemoChildren getInfo={getInfo} />
    </div>
}
````

## useRef

`useRef`的作用： 
* 一 是可以用来获取`dom`元素，或者`class`组件实例 。 
* 二 `react-hooks原理`文章中讲过，创建`useRef`时候，会创建一个原始对象，只要函数组件不被销毁，原始对象就会一直存在，那么我们可以利用这个特性，来通过`useRef`保存一些数据。

````jsx
const DemoUseRef = ()=>{
    const dom= useRef(null)
    const handerSubmit = ()=>{
        /*  <div >表单组件</div>  dom 节点 */
        console.log(dom.current)
    }
    return <div>
        {/* ref 标记当前dom节点 */}
        <div ref={dom} >表单组件</div>
        <button onClick={()=>handerSubmit()} >提交</button> 
    </div>
}
````

## useLayoutEffect

**`useEffect`执行顺序:** 组件更新挂载完成 -> 浏览器 `dom` 绘制完成 -> 执行 `useEffect` 回调。
**`useLayoutEffect` 执行顺序:** 组件更新挂载完成 ->  执行 `useLayoutEffect` 回调-> 浏览器`dom`绘制完成。 

所以说 `useLayoutEffect` 代码可能会阻塞浏览器的绘制 。我们写的 `effect`和 `useLayoutEffect`，`react`在底层会被分别打上`PassiveEffect`，`HookLayout`，在`commit`阶段区分出，在什么时机执行。

````jsx
const DemoUseLayoutEffect = () => {
    const target = useRef()
    useLayoutEffect(() => {
        /*我们需要在dom绘制之前，移动dom到制定位置*/
        const { x ,y } = getPositon() /* 获取要移动的 x,y坐标 */
        animate(target.current,{ x,y })
    }, []);
    return (
        <div >
            <span ref={ target } className="animate"></span>
        </div>
    )
}
````

## useReducer 

在`react-hooks`原理那篇文章中讲解到，`useState`底层就是一个简单版的`useReducer`

`useReducer` 接受的第一个参数是一个函数，我们可以认为它就是一个 `reducer` , `reducer` 的参数就是常规 `reducer` 里面的 `state` 和  `action` ,返回改变后的 `state` , `useReducer` 第二个参数为 `state` 的初始值 返回一个数组，数组的第一项就是更新之后 `state` 的值 ，第二个参数是派发更新的 `dispatch` 函数。

我们来看一下`useReducer`如何使用：

````js
const DemoUseReducer = ()=>{
    /* number为更新后的state值,  dispatchNumbner 为当前的派发函数 */
   const [ number , dispatchNumbner ] = useReducer((state,action)=>{
       const { payload , name  } = action
       /* return的值为新的state */
       switch(name){
           case 'add':
               return state + 1
           case 'sub':
               return state - 1 
           case 'reset':
             return payload       
       }
       return state
   },0)
   return <div>
      当前值：{ number }
      { /* 派发更新 */ }
      <button onClick={()=>dispatchNumbner({ name:'add' })} >增加</button>
      <button onClick={()=>dispatchNumbner({ name:'sub' })} >减少</button>
      <button onClick={()=>dispatchNumbner({ name:'reset' ,payload:666 })} >赋值</button>
      { /* 把dispatch 和 state 传递给子组件  */ }
      <MyChildren  dispatch={ dispatchNumbner } State={{ number }} />
   </div>
}
````

## useContext

我们可以使用 `useContext` ，来获取父级组件传递过来的 `context` 值，这个当前值就是最近的父级组件 `Provider` 设置的 `value` `值，useContext` 参数一般是由 `createContext` 方式引入 ,也可以父级上下文 `context` 传递 ( 参数为 `context` )。`useContext` 可以代替 `context.Consumer` 来获取 `Provider` 中保存的 `value` 值

````jsx
/* 用useContext方式 */
const DemoContext = ()=> {
    const value:any = useContext(Context)
    /* my name is alien */
return <div> my name is { value.name }</div>
}
/* 用Context.Consumer 方式 */
const DemoContext1 = ()=>{
    return <Context.Consumer>
         {/*  my name is alien  */}
        { (value)=> <div> my name is { value.name }</div> }
    </Context.Consumer>
}

export default ()=>{
    return <div>
        <Context.Provider value={{ name:'alien' , age:18 }} >
            <DemoContext />
            <DemoContext1 />
        </Context.Provider>
    </div>
}
````

## useImperativeHandle

`useImperativeHandle` 可以配合 `forwardRef `自定义暴露给父组件的实例值。这个很有用，我们知道，对于子组件，如果是`class`类组件，我们可以通过`ref`获取类组件的实例，但是在子组件是函数组件的情况，如果我们不能直接通过`ref`的，那么此时`useImperativeHandle`和 `forwardRef`配合就能达到效果。

`useImperativeHandle`接受三个参数：

* 第一个参数ref: 接受 `forWardRef` 传递过来的 `ref`。

* 第二个参数 `createHandle` ：处理函数，返回值作为暴露给父组件的`ref`对象。

* 第三个参数 `deps`:依赖项 `deps`，依赖项更改形成新的`ref`对象。

**我们来模拟给场景，用`useImperativeHandle`，使得父组件能让子组件中的`input`自动赋值并聚焦。**

````js
function Son (props,ref) {
    console.log(props)
    const inputRef = useRef(null)
    const [ inputValue , setInputValue ] = useState('')
    useImperativeHandle(ref,()=>{
       const handleRefs = {
           /* 声明方法用于聚焦input框 */
           onFocus(){
              inputRef.current.focus()
           },
           /* 声明方法用于改变input的值 */
           onChangeValue(value){
               setInputValue(value)
           }
       }
       return handleRefs
    },[])
    return <div>
        <input
            placeholder="请输入内容"
            ref={inputRef}
            value={inputValue}
        />
    </div>
}

const ForwarSon = forwardRef(Son)

class Index extends React.Component{
    cur = null
    handerClick(){
    
       const { onFocus , onChangeValue } =this.cur
       onFocus()
       onChangeValue('let us learn React!')
    }
    render(){
        return <div style={{ marginTop:'50px' }} >
            <ForwarSon ref={cur => (this.cur = cur)} />
            <button onClick={this.handerClick.bind(this)} >操控子组件</button>
        </div>
    }
}
````
**效果:**


![useImperativeHandle.gif](https://p1-juejin.byteimg.com/tos-cn-i-k3u1fbpfcp/8e8c05f0c82c43719079d4db9536abc0~tplv-k3u1fbpfcp-watermark.image)


## useDebugValue

`useDebugValue` 可用于在 `React` 开发者工具中显示自定义 `hook` 的标签。这个`hooks`目的就是检查自定义`hooks`


````js
function useFriendStatus(friendID) {
  const [isOnline, setIsOnline] = useState(null);
  // ...
  // 在开发者工具中的这个 Hook 旁边显示标签
  // e.g. "FriendStatus: Online"
  useDebugValue(isOnline ? 'Online' : 'Offline');

  return isOnline;
}
````

> 我们不推荐你向每个自定义 Hook 添加 debug 值。当它作为共享库的一部分时才最有价值。在某些情况下，格式化值的显示可能是一项开销很大的操作。除非需要检查 Hook，否则没有必要这么做。因此，useDebugValue 接受一个格式化函数作为可选的第二个参数。该函数只有在 Hook 被检查时才会被调用。它接受 debug 值作为参数，并且会返回一个格式化的显示值。


## useTransition

`useTransition`允许延时由`state`改变而带来的视图渲染。避免不必要的渲染。它还允许组件将速度较慢的数据获取更新推迟到随后渲染，以便能够立即渲染更重要的更新。

````js
const TIMEOUT_MS = { timeoutMs: 2000 }
const [startTransition, isPending] = useTransition(TIMEOUT_MS)
````
* `useTransition` 接受一个对象， `timeoutMs`代码需要延时的时间。

* 返回一个数组。**第一个参数：**  是一个接受回调的函数。我们用它来告诉 `React` 需要推迟的 `state` 。 **第二个参数：** 一个布尔值。表示是否正在等待，过度状态的完成(延时`state`的更新)。

下面我们引入官网的列子，来了解`useTransition`的使用。

````js
const SUSPENSE_CONFIG = { timeoutMs: 2000 };

function App() {
  const [resource, setResource] = useState(initialResource);
  const [startTransition, isPending] = useTransition(SUSPENSE_CONFIG);
  return (
    <>
      <button
        disabled={isPending}
        onClick={() => {
          startTransition(() => {
            const nextUserId = getNextId(resource.userId);
            setResource(fetchProfileData(nextUserId));
          });
        }}
      >
        Next
      </button>
      {isPending ? " 加载中..." : null}
      <Suspense fallback={<Spinner />}>
        <ProfilePage resource={resource} />
      </Suspense>
    </>
  );
}
````

在这段代码中，我们使用 `startTransition` 包装了我们的数据获取。这使我们可以立即开始获取用户资料的数据，同时推迟下一个用户资料页面以及其关联的 `Spinner` 的渲染 2 秒钟（ `timeoutMs`  中显示的时间）。

这个`api`目前处于实验阶段，没有被完全开放出来。









# react-dom

接下来，我们来一起研究`react-dom`中比较重要的`api`。


![react-dom.jpg](https://p9-juejin.byteimg.com/tos-cn-i-k3u1fbpfcp/23d877cf3a5b417ba6162f0c259b1c45~tplv-k3u1fbpfcp-watermark.image)

## render

`render` 是我们最常用的`react-dom`的 `api`，用于渲染一个`react`元素，一般`react`项目我们都用它，渲染根部容器`app`。

````js
ReactDOM.render(element, container[, callback])
````

**使用**

````jsx
ReactDOM.render(
    < App / >,
    document.getElementById('app')
)
````

`ReactDOM.render`会控制`container`容器节点里的内容，但是不会修改容器节点本身。


## hydrate

服务端渲染用`hydrate`。用法与 `render()` 相同，但它用于在 `ReactDOMServer` 渲染的容器中对 `HTML` 的内容进行 `hydrate` 操作。

````js
ReactDOM.hydrate(element, container[, callback])
````

## createPortal

`Portal` 提供了一种将子节点渲染到存在于父组件以外的 `DOM` 节点的优秀的方案。`createPortal` 可以把当前组件或 `element` 元素的子节点，渲染到组件之外的其他地方。

那么具体应用到什么场景呢？

比如一些全局的弹窗组件`model`,`<Model/>`组件一般都写在我们的组件内部，倒是真正挂载的`dom`，都是在外层容器，比如`body`上。此时就很适合`createPortal`API。

`createPortal`接受两个参数：

````js
ReactDOM.createPortal(child, container)
````
第一个： `child` 是任何可渲染的 `React` 子元素
第二个： `container`是一个 `DOM` 元素。

接下来我们实践一下：

````js
function WrapComponent({ children }){
    const domRef = useRef(null)
    const [ PortalComponent, setPortalComponent ] = useState(null)
    React.useEffect(()=>{
        setPortalComponent( ReactDOM.createPortal(children,domRef.current) )
    },[])
    return <div> 
        <div className="container" ref={ domRef } ></div>
        { PortalComponent }
     </div>
}

class Index extends React.Component{
    render(){
        return <div style={{ marginTop:'50px' }} >
             <WrapComponent>
               <div  >hello,world</div>
            </WrapComponent>
        </div>
    }
}
````

**效果**

![createPortal.jpg](https://p9-juejin.byteimg.com/tos-cn-i-k3u1fbpfcp/1842abaa8cb840108f6a5c90cb349aac~tplv-k3u1fbpfcp-watermark.image)


我们可以看到，我们`children`实际在`container` 之外挂载的，但是已经被`createPortal`渲染到`container`中。


## unstable_batchedUpdates

在`react-legacy`模式下，对于事件，`react`事件有批量更新来处理功能,但是这一些非常规的事件中，批量更新功能会被打破。所以我们可以用`react-dom`中提供的`unstable_batchedUpdates` 来进行批量更新。

**一次点击实现的批量更新**

````js
class Index extends React.Component{
    constructor(props){
       super(props)
       this.state={
           numer:1,
       }
    }
    handerClick=()=>{
        this.setState({ numer : this.state.numer + 1 })
        console.log(this.state.numer)
        this.setState({ numer : this.state.numer + 1 })
        console.log(this.state.numer)
        this.setState({ numer : this.state.numer + 1 })
        console.log(this.state.numer)
    }
    render(){
        return <div  style={{ marginTop:'50px' }} > 
            <button onClick={ this.handerClick } >click me</button>
        </div>
    }
}
````

**效果**


![batch1.jpg](https://p9-juejin.byteimg.com/tos-cn-i-k3u1fbpfcp/29b6f884f2c147ee9a20400ad7477e77~tplv-k3u1fbpfcp-watermark.image)

渲染次数一次。

**批量更新条件被打破**

````js
 handerClick=()=>{
    Promise.resolve().then(()=>{
        this.setState({ numer : this.state.numer + 1 })
        console.log(this.state.numer)
        this.setState({ numer : this.state.numer + 1 })
        console.log(this.state.numer)
        this.setState({ numer : this.state.numer + 1 })
        console.log(this.state.numer)
    })
  }
````

**效果**


![batch2.jpg](https://p6-juejin.byteimg.com/tos-cn-i-k3u1fbpfcp/4b799b2b8f514ae183382d5ed875d0e9~tplv-k3u1fbpfcp-watermark.image)

渲染次数三次。

**unstable_batchedUpdate助力**

````js
 handerClick=()=>{
        Promise.resolve().then(()=>{
            ReactDOM.unstable_batchedUpdates(()=>{
                this.setState({ numer : this.state.numer + 1 })
                console.log(this.state.numer)
                this.setState({ numer : this.state.numer + 1 })
                console.log(this.state.numer)
                this.setState({ numer : this.state.numer + 1 })
                console.log(this.state.numer)
            }) 
        })
    }
````



渲染次数一次,完美解决批量更新问题。

## flushSync

`flushSync` 可以将回调函数中的更新任务，放在一个较高的优先级中。我们知道`react`设定了很多不同优先级的更新任务。如果一次更新任务在`flushSync`回调函数内部，那么将获得一个较高优先级的更新。比如
````js
ReactDOM.flushSync(()=>{
    /* 此次更新将设置一个较高优先级的更新 */
    this.setState({ name: 'alien'  })
})
````

为了让大家理解`flushSync`，我这里做一个`demo`奉上，
````js
/* flushSync */
import ReactDOM from 'react-dom'
class Index extends React.Component{
    state={ number:0 }
    handerClick=()=>{
        setTimeout(()=>{
            this.setState({ number: 1  })
        })
        this.setState({ number: 2  })
        ReactDOM.flushSync(()=>{
            this.setState({ number: 3  })
        })
        this.setState({ number: 4  })
    }
    render(){
        const { number } = this.state
        console.log(number) // 打印什么？？
        return <div>
            <div>{ number }</div>
            <button onClick={this.handerClick} >测试flushSync</button>
        </div>
    }
}
````
先不看答案，点击一下按钮，打印什么呢？

**我们来点击一下看看**


![flushSync.gif](https://p9-juejin.byteimg.com/tos-cn-i-k3u1fbpfcp/f7eba600db1c44cb956e380cb922226d~tplv-k3u1fbpfcp-watermark.image)

打印 0 3 4 1 ，相信不难理解为什么这么打印了。

* 首先 `flushSync` `this.setState({ number: 3  })`设定了一个高优先级的更新，所以3 先被打印
* 2 4 被批量更新为 4

相信这个`demo`让我们更深入了解了`flushSync`。


## findDOMNode

`findDOMNode`用于访问组件`DOM`元素节点，`react`推荐使用`ref`模式，不期望使用`findDOMNode`。

````js
ReactDOM.findDOMNode(component)
````
注意的是：

* 1 `findDOMNode`只能用在已经挂载的组件上。

* 2  如果组件渲染内容为 `null` 或者是 `false`，那么 `findDOMNode`返回值也是 `null`。

* 3 `findDOMNode` 不能用于函数组件。

接下来让我们看一下，`findDOMNode`具体怎么使用的：

````js
class Index extends React.Component{
    handerFindDom=()=>{
        console.log(ReactDOM.findDOMNode(this))
    }
    render(){
        return <div style={{ marginTop:'100px' }} >
            <div>hello,world</div>
            <button onClick={ this.handerFindDom } >获取容器dom</button>
        </div>
    }
}
````

**效果：**


![findNodedom.gif](https://p6-juejin.byteimg.com/tos-cn-i-k3u1fbpfcp/f9acc582f69e461caf0887f49d710a35~tplv-k3u1fbpfcp-watermark.image)


我们完全可以将外层容器用`ref`来标记，获取捕获原生的`dom`节点。



## unmountComponentAtNode

从 `DOM` 中卸载组件，会将其事件处理器和 `state` 一并清除。 如果指定容器上没有对应已挂载的组件，这个函数什么也不会做。如果组件被移除将会返回 `true` ，如果没有组件可被移除将会返回  `false` 。

我们来简单举例看看`unmountComponentAtNode`如何使用？

````js
function Text(){
    return <div>hello,world</div>
}

class Index extends React.Component{
    node = null
    constructor(props){
       super(props)
       this.state={
           numer:1,
       }
    }
    componentDidMount(){
        /*  组件初始化的时候，创建一个 container 容器 */
        ReactDOM.render(<Text/> , this.node )
    }
    handerClick=()=>{
       /* 点击卸载容器 */ 
       const state =  ReactDOM.unmountComponentAtNode(this.node)
       console.log(state)
    }
    render(){
        return <div  style={{ marginTop:'50px' }}  > 
             <div ref={ ( node ) => this.node = node  }  ></div>  
            <button onClick={ this.handerClick } >click me</button>
        </div>
    }
}
````

**效果**


![unmounted.gif](https://p1-juejin.byteimg.com/tos-cn-i-k3u1fbpfcp/15ebcd1a23e64561ae6346d4be7e958a~tplv-k3u1fbpfcp-watermark.image)


# 总结

本文通过`react`组件层面，工具层面，`hooks`层面，`react-dom`了解了`api`的用法，希望看完的同学，能够对着文章中的`demo`自己敲一遍，到头来会发现自己成长不少。

最后, 送人玫瑰，手留余香，觉得有收获的朋友可以给笔者**点赞，关注**一波 ，陆续更新前端超硬核文章。

提前透漏：接下来会出一部揭秘`react`事件系统的文章。感兴趣的同学请关注我！

## 往期react文章

文章中，对于其他没有讲到的`react-hooks`，建议大家看`react-hooks`三部曲。

**react-hooks三部曲**

* [第一部： react-hooks如何使用](https://juejin.cn/post/6864438643727433741) `150+` 赞👍

* [第二部：玩转react-hooks,自定义hooks设计模式及其实战](https://juejin.cn/post/6890738145671938062) `240+` 👍赞

* [第三部：「react进阶」一文吃透react-hooks原理](https://juejin.cn/post/6944863057000529933) `820`


**react进阶系列**

* [「react进阶」一文吃透react-hooks原理](https://juejin.cn/post/6944863057000529933) `820`

* [「react进阶」年终送给react开发者的八条优化建议](https://juejin.cn/post/6908895801116721160)  `918+` 赞👍 

* [「react进阶」一文吃透React高阶组件(HOC)](https://juejin.cn/post/6940422320427106335) `330+` 赞👍


**react源码系列**

* [「源码解析 」这一次彻底弄懂react-router路由原理](https://juejin.cn/post/6886290490640039943) `132+` 赞👍 

* [「源码解析」一文吃透react-redux源码（useMemo经典源码级案例）](https://juejin.cn/post/6937491452838559781)  `143+` 赞👍 

* [「源码解析」react-hooks源码解析](https://juejin.cn/post/6944863057000529933) `820`

**开源项目系列**

* [「react缓存页面」从需求到开源（我是怎么样让产品小姐姐刮目相看的）](https://juejin.cn/post/6922340460136513549) `300+` 赞👍

* [「前端工程化」从0-1搭建react，ts脚手架（1.2w字超详细教程）](https://juejin.cn/post/6919308174151385096)  `330+` 赞👍


## 参考文档

[react中文文档](https://reactjs.org/)
