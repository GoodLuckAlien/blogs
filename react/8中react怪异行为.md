①②③④⑤⑥⑦⑧⑨⑩⑪⑫⑬⑭⑮⑯⑰⑱⑲⑳
# 「React进阶」探案揭秘六种React‘灵异’现象

## 前言

今天我们来一期不同寻常的React进阶文章，本文我们通过一些**不同寻常的**现象，以探案的流程分析原因，找到结果，从而认识React，走进React的世界，揭开React的面纱，我深信，更深的理解，方可更好的使用。

我承认起这个名字可能有点标题党了，灵感来源于小时候央视有一个叫做《走进科学》的栏目，天天介绍各种超自然的灵异现象，搞的神乎其神，最后揭秘的时候原来是各种小儿科的问题，现在想想都觉得搞笑😂😂。但是我今天介绍的这些React '灵异'现象本质可不是小儿科，每一个现象后都透露出 **React 运行机制**和**设计原理**。


![src=http___n.sinaimg.cn_sinacn_w640h360_20180113_9984-fyqrewh6822097.jpg&refer=http___n.sinaimg.jpg](https://p1-juejin.byteimg.com/tos-cn-i-k3u1fbpfcp/cacf876e6b614630a0a72c1f465b02a9~tplv-k3u1fbpfcp-watermark.image)

好的，废话不多说，我的大侦探们，are you ready ? 让我们开启今天的揭秘之旅把。

## 案件一: useState更新相同的State,函数组件执行2次

### 接到报案
这个问题实际很悬，大家可能平时没有注意到，引起我的注意的是掘金的一个掘友问我的一个问题，问题如下：


![5A277BDD17AADEF784FB22203DB74BEC.jpg](https://p3-juejin.byteimg.com/tos-cn-i-k3u1fbpfcp/3be17395340745f0be6bf37b5349faf4~tplv-k3u1fbpfcp-watermark.image)
首先非常感谢这位细心的掘友的报案，我在 [React-hooks 原理](https://juejin.cn/post/6944863057000529933) 中讲到过，对于更新组件的方法函数组件 `useState` 和类组件的`setState`有一定区别，`useState`源码中如果遇到两次相同的`state`，会默认阻止组件再更新，但是类组件中`setState`如果没有设置 `PureComponent`，两次相同的`state` 也会更新。

我们回顾一下 `hooks` 中是怎么样阻止组件更新的。

> react-reconciler/src/ReactFiberHooks.js -> dispatchAction

````js
if (is(eagerState, currentState)) { 
     return
}
scheduleUpdateOnFiber(fiber, expirationTime); // 调度更新
````

如果判断上一次的`state` -> `currentState` ，和这一次的`state` -> `eagerState` 相等，那么将直接 `return`阻止组件进行`scheduleUpdate`调度更新。**所以我们想如果两次 `useState`触发同样的state，那么组件只能更新一次才对，但是事实真的是这样吗？。**

### 立案调查
顺着这位掘友提供的线索，我们开始写 `demo`进行验证。

````js
const Index = () => {
  const [ number , setNumber  ] = useState(0)
  console.log('组件渲染',number)
  return <div className="page" >
    <div className="content" >
       <span>{ number }</span><br/>
       <button onClick={ () => setNumber(1) } >将number设置成1</button><br/>
       <button onClick={ () => setNumber(2) } >将number设置成2</button><br/>
       <button onClick={ () => setNumber(3) } >将number设置成3</button>
    </div>
  </div>
}
export default class Home extends React.Component{
  render(){
    return <Index />
  }
}
````
如上demo，三个按钮，我们期望连续点击每一个按钮，组件都会仅此渲染一次，于是我们开始实验：

**效果：**


![demo1.gif](https://p6-juejin.byteimg.com/tos-cn-i-k3u1fbpfcp/f3069ba1708c421992d22c8a9cce3ceb~tplv-k3u1fbpfcp-watermark.image)

果然，我们通过 `setNumber` 改变 `number`，每次连续点击按钮，组件都会更新2次，按照我们正常的理解，每次赋予 `number` 相同的值，只会渲染一次才对，但是为什么执行了2次呢？

可能刚开始会陷入困境，不知道怎么破案，但是我们在想 `hooks`原理中讲过，每一个函数组件用对应的函数组件的 `fiber` 对象去保存 `hooks` 信息。所以我们只能从 `fiber`找到线索。

### 顺藤摸瓜

那么如何找到函数组件对应的fiber对象呢，这就顺着函数组件的父级 `Home` 入手了，因为我们可以从类组件`Home`中找到对应的fiber对象，然后根据 `child` 指针找到函数组件 `Index`对应的 `fiber`。说干就干，我们将上述代码改造成如下的样子：

````js
const Index = ({ consoleFiber }) => {
  const [ number , setNumber  ] = useState(0)
  useEffect(()=>{  
      console.log(number)
      consoleFiber() // 每次fiber更新后，打印 fiber 检测 fiber变化
  })
  return <div className="page" >
    <div className="content" >
       <span>{ number }</span><br/>
       <button onClick={ () => setNumber(1) } >将number设置成1</button><br/>
    </div>
  </div>
}
export default class Home extends React.Component{
  consoleChildrenFiber(){
     console.log(this._reactInternalFiber.child) /* 用来打印函数组件 Index 对应的fiber */
  }
  render(){
    return <Index consoleFiber={ this.consoleChildrenFiber.bind(this) }  />
  }
}
````

**我们重点关心fiber上这几个属性，这对破案很有帮助**

* `Index fiber`上的 `memoizedState` 属性，`react hooks` 原理文章中讲过，函数组件用 `memoizedState` 保存所有的 `hooks` 信息。
* `Index fiber`上的 `alternate` 属性
* `Index fiber`上的 `alternate` 属性上的 `memoizedState`属性。是不是很绕😂，马上会揭晓是什么。
* `Index`组件上的 `useState`中的`number`。

首先我们讲一下 `alternate` 指针指的是什么？ 

说到`alternate` 就要从`fiber`架构设计说起，每个`React`元素节点，用两颗fiber树保存状态，一颗树保存当前状态，一个树保存上一次的状态，两棵 `fiber` 树用 `alternate` 相互指向。就是我们耳熟能详的**双缓冲**。

#### 初始化打印

**效果图：**


![fiber1.jpg](https://p3-juejin.byteimg.com/tos-cn-i-k3u1fbpfcp/3c982e14dd314b2d98e98d0f506b8590~tplv-k3u1fbpfcp-watermark.image)

**初始化完成第一次render后，我们看一下fiber树上的这几个状态**

第一次打印结果如下，

*  `fiber`上的 `memoizedState` 中 **`baseState = 0`** 即是初始化 `useState` 的值。
*  `fiber`上的 `alternate` 为 `null`。
*  `Index`组件上的 `number` 为 0。

初始化流程：首先对于组件第一次初始化，会调和渲染形成一个fiber树（我们**简称为树A**）。树A的`alternate`属性为 `null`。

#### 第一次点击 setNumber(1) 

**我们第一次点击发现组件渲染了，然后我们打印结果如下：**


![fiber2.jpg](https://p1-juejin.byteimg.com/tos-cn-i-k3u1fbpfcp/99633029451c4ceaa2affd9a5559c962~tplv-k3u1fbpfcp-watermark.image)

* 树A上的 `memoizedState` 中 **`baseState = 0`。
* 树A上的 `alternate` 指向 另外一个`fiber`(我们这里称之为树B)。
*  `Index`组件上的 `number` 为 1。

接下来我们打印树B上的 `memoizedState` 


![fiber3.jpg](https://p1-juejin.byteimg.com/tos-cn-i-k3u1fbpfcp/ebc9e5d6f93b40db95dc1bdd5f23e33f~tplv-k3u1fbpfcp-watermark.image)

结果我们发现树B上 `memoizedState`上的 `baseState = 1`。

得出结论：更新的状态都在树B上，而树A上的 baseState还是之前的0。

我们大胆猜测一下更新流程：在第一次更新渲染的时候，由于树A中，不存在`alternate`，所以直接复制一份树A作为 `workInProgress`（我们这里称之为**树B**）所有的更新都在当前树B中进行，所以 baseState 会被更新成 1,然后用当前的**树B**进行渲染。结束后树A和树B通过`alternate`相互指向。树B作为下一次操作的`current`树。



#### 第二次点击 setNumber(1) 

**第二次打印，组件同样渲染了，然后我们打印fiber对象，效果如下：**


![fiber4.jpg](https://p6-juejin.byteimg.com/tos-cn-i-k3u1fbpfcp/663a955a66ec4e4abe266dd03ffbc757~tplv-k3u1fbpfcp-watermark.image)

* fiber对象上的 `memoizedState` 中 `baseState`更新成了 1。

然后我们打印一下 `alternate` 中 `baseState`也更新成了 1。


![fiber5.jpg](https://p6-juejin.byteimg.com/tos-cn-i-k3u1fbpfcp/fb05af3b409846ad8d2a07ff00421b63~tplv-k3u1fbpfcp-watermark.image)

第二次点击之后 ，树A和树B都更新到最新的 baseState = 1

首先我们分析一下流程：当我们第二次点击时候，是通过上一次树A中的 `baseState = 0` 和 `setNumber(1)` 传入的 1做的比较。所以发现 `eagerState !== currentState` ，组件又更新了一次。接下来会以current树（树B）的 `alternate`指向的树A作为新的`workInProgress`进行更新，此时的树A上的 baseState 终于更新成了 1 ，这就解释了为什么上述两个 baseState 都等于 1。接下来组件渲染完成。树A作为了新的 current 树。

在我们第二次打印，打印出来的实际是交替后树B，树A和树B就这样交替着作为最新状态用于渲染的`workInProgress`树和缓存上一次状态用于下一次渲染的`current`树。

#### 第三次点击（三者言其多也）

那么第三次点击组件没有渲染，就很好解释了，第三次点击上一次树B中的 `baseState = 1` 和 `setNumber(1)`相等，也就直接走了return逻辑。

### 揭开谜底（我们学到了什么）

* 双缓冲树：React 用 `workInProgress`树(内存中构建的树) 和 `current`(渲染树) 来实现更新逻辑。我们console.log打印的fiber都是在内存中即将 `workInProgress`的fiber树。双缓存一个在内存中构建，在下一次渲染的时候，直接用缓存树做为下一次渲染树，上一次的渲染树又作为缓存树，这样可以防止只用一颗树更新状态的丢失的情况，又加快了`dom`节点的替换与更新。

* 更新机制：在一次更新中，首先会获取current树的 `alternate`作为当前的 `workInProgress`，渲染完毕后，`workInProgress` 树变为 `current` 树。我们用如上的树A和树B和已经保存的baseState模型，来更形象的解释了更新机制 。 hooks中的useState进行state对比，用的是缓存树上的state和当前最新的state。所有就解释了为什么更新相同的state，函数组件执行2次了。

**我们用一幅流程图来描述整个流程。**


![FFB125E7-6A34-4F44-BB6E-A11D598D0A01.jpg](https://p9-juejin.byteimg.com/tos-cn-i-k3u1fbpfcp/a7c02434133f4e6a803b65a364c065d2~tplv-k3u1fbpfcp-watermark.image)

此案已破，通过这个容易忽略的案件，我们学习了双缓冲和更新机制。

## 案件二：事件源e.target离奇失踪

### 突发案件

化名（小明）在一个月黑风高的夜晚，突发奇想写一个受控组件。写的什么内容具体如下：

````js
export default class EventDemo extends React.Component{
  constructor(props){
    super(props)
    this.state={
        value:''
    }
  }
  handerChange(e){
    setTimeout(()=>{
       this.setState({
         value:e.target.value
       })
    },0)
  }
  render(){
    return <div>
      <input placeholder="请输入用户名？" onChange={ this.handerChange.bind(this) }  />
    </div>
  }
}
````
`input`的值受到 `state`中`value`属性控制，小明想要通过`handerChange`改变`value`值，但是他期望在`setTimeout`中完成更新。可以当他想要改变input值时候，意想不到的事情发生了。


![event.jpg](https://p9-juejin.byteimg.com/tos-cn-i-k3u1fbpfcp/fc9dba3d16ff4a75937291bf90609d7e~tplv-k3u1fbpfcp-watermark.image)

控制台报错如上所示。`Cannot read property 'value' of null` 也就是说明`e.target`为`null`。事件源 `target`怎么说没就没呢？

### 线索追踪

接到这个案件之后，我们首先排查问题，那么我们先在`handerChange`直接打印`e.target`，如下：

![event1.jpg](https://p9-juejin.byteimg.com/tos-cn-i-k3u1fbpfcp/2e5a3aa61d144a9fbf14294e58287323~tplv-k3u1fbpfcp-watermark.image)

看来首先排查不是 `handerChange` 的原因，然后我们接着在`setTimeout`中打印发现：


![event2.jpg](https://p6-juejin.byteimg.com/tos-cn-i-k3u1fbpfcp/25b900a45c2149a794b27a5a3c2a50be~tplv-k3u1fbpfcp-watermark.image)

果然是`setTimeout`的原因，为什么`setTimeout`中的事件源 e.target 就莫名的失踪了呢？ 首先，事件源肯定不是莫名的失踪了，肯定 React 底层对事件源做了一些额外的处理，首先我们知道React采用的是**事件合成**机制，也就是绑定的 `onChange`不是真实绑定的 `change`事件，小明绑定的 `handerChange`也不是真正的事件处理函数。那么也就是说React底层帮我们处理了事件源。这一切可能只有我们从 React 源码中找到线索。经过对源码的排查，我发现有一处线索十分可疑。

> react-dom/src/events/DOMLegacyEventPluginSystem.js

````js

function dispatchEventForLegacyPluginEventSystem(topLevelType,eventSystemFlags,nativeEvent,targetInst){
    const bookKeeping = getTopLevelCallbackBookKeeping(topLevelType,nativeEvent,targetInst,eventSystemFlags);
    batchedEventUpdates(handleTopLevel, bookKeeping);
}
````
`dispatchEventForLegacyPluginEventSystem`是`legacy`模式下，所有事件都必定经过的主要函数，`batchedEventUpdates`是处理批量更新的逻辑，里面会执行我们真正的事件处理函数，我们在事件原理篇章讲过 `nativeEvent` 就是**真正原生的事件对象 `event`**。`targetInst` 就是`e.target`对应的`fiber`对象。我们在`handerChange`里面获取的事件源是React合成的事件源，那么了解事件源是什么时候，怎么样被合成的？ 这对于破案肯能会有帮助。

事件原理篇我们将介绍React采用事件插件机制，比如我们的onClick事件对应的是 `SimpleEventPlugin`，那么小明写`onChange`也有专门 `ChangeEventPlugin`事件插件，这些插件有一个至关重要的作用就是用来合成我们事件源对象e，所以我们来看一下`ChangeEventPlugin`。

> react-dom/src/events/ChangeEventPlugin.js
````js
const ChangeEventPlugin ={
   eventTypes: eventTypes,
   extractEvents:function(){
        const event = SyntheticEvent.getPooled(
            eventTypes.change,
            inst, // 组件实例
            nativeEvent, // 原生的事件源 e
            target,      // 原生的e.target
     );
     accumulateTwoPhaseListeners(event); // 这个函数按照冒泡捕获逻辑处理真正的事件函数，也就是  handerChange 事件
     return event; // 
   }   
}
````
我们看到合成事件的事件源`handerChange`中的 e，就是`SyntheticEvent.getPooled`创建出来的。那么这个是破案的关键所在。

> legacy-events/SyntheticEvent.js
````js
SyntheticEvent.getPooled = function(){
    const EventConstructor = this; //  SyntheticEvent
    if (EventConstructor.eventPool.length) {
    const instance = EventConstructor.eventPool.pop();
    EventConstructor.call(instance,dispatchConfig,targetInst,nativeEvent,nativeInst,);
    return instance;
  }
  return new EventConstructor(dispatchConfig,targetInst,nativeEvent,nativeInst,);
}
````
番外：在事件系统篇章，文章的事件池感念，讲的比较仓促，笼统，这篇这个部分将详细补充事件池感念。<br/>

**`getPooled`引出了事件池的真正的概念，它主要做了两件事：**
* 判断事件池中有没有空余的事件源，如果有取出事件源复用。
* 如果没有，通过 `new SyntheticEvent` 的方式创建一个新的事件源对象。那么 `SyntheticEvent`就是创建事件源对象的构造函数，我们一起研究一下。

````js
const EventInterface = {
  type: null,
  target: null,
  currentTarget: function() {
    return null;
  },
  eventPhase: null,
  ...
};
function SyntheticEvent( dispatchConfig,targetInst,nativeEvent,nativeEventTarget){
  this.dispatchConfig = dispatchConfig; 
  this._targetInst = targetInst;    // 组件对应fiber。
  this.nativeEvent = nativeEvent;   // 原生事件源。
  this._dispatchListeners = null;   // 存放所有的事件监听器函数。
  for (const propName in Interface) {
      if (propName === 'target') {
        this.target = nativeEventTarget; // 我们真正打印的 target 是在这里
      } else {
        this[propName] = nativeEvent[propName];
      }
  }
}
SyntheticEvent.prototype.preventDefault = function (){ /* .... */ }     /* 组件浏览器默认行为 */
SyntheticEvent.prototype.stopPropagation = function () { /* .... */  }  /* 阻止事件冒泡 */

SyntheticEvent.prototype.destructor = function (){ /* 情况事件源对象*/
      for (const propName in Interface) {
           this[propName] = null
      }
    this.dispatchConfig = null;
    this._targetInst = null;
    this.nativeEvent = null;
}
const EVENT_POOL_SIZE = 10; /* 最大事件池数量 */
SyntheticEvent.eventPool = [] /* 绑定事件池 */
SyntheticEvent.release=function (){ /* 清空事件源对象，如果没有超过事件池上限，那么放回事件池 */
    const EventConstructor = this; 
    event.destructor();
    if (EventConstructor.eventPool.length < EVENT_POOL_SIZE) {
       EventConstructor.eventPool.push(event);
    }
}
````
我把这一段代码精炼之后，真相也就渐渐浮出水面了，我们先来看看 `SyntheticEvent` 做了什么：

* 首先赋予一些初始化的变量`nativeEvent`等。然后按照 `EventInterface` 规则把**原生的事件源**上的属性，复制一份给**React 事件源。然后一个重要的就是我们打印的e.target就是this.target，在事件源初始化的时候绑定了真正的`e.target->nativeEventTarget`**

* 然后React事件源，绑定了自己的阻止默认行为`preventDefault`，阻止冒泡`stopPropagation`等方法。但是这里有一个重点方法就`destructor`,**这个函数置空了React自己的事件源对象。那么我们终于找到了答案，我们的事件源e.target消失大概率就是因为这个`destructor`，`destructor`在`release`中被触发，然后将事件源放进事件池，等待下一次复用。**

现在所有的矛头都指向了`release`，那么`release`是什么时候触发的呢？

> legacy-events/SyntheticEvent.js

````js
function executeDispatchesAndRelease(){
    event.constructor.release(event);
}
````
当 React 事件系统执行完所有的 `_dispatchListeners`，就会触发这个方法 `executeDispatchesAndRelease`释放当前的事件源。

### 真相大白

回到小明遇到的这个问题，我们上面讲到，React最后会同步的置空事件源，然后放入事件池，因为`setTimeout`是异步执行，执行时候事件源对象已经被重置并释放会事件池，所以我们打印 `e.target = null`，到此为止，案件真相大白。

通过这个案件我们明白了 React 事件池的一些概念：

* React 事件系统有独特合成事件，也有自己的事件源，而且还有对一些特殊情况的处理逻辑，比如冒泡逻辑等。
* React 为了防止每次事件都创建事件源对象，浪费性能，所以引入了**事件池概念**，每一次用户事件都会从事件池中取出一个e，如果没有，就创建一个，然后赋值事件源，等到事件执行之后，重置事件源，放回事件池，借此做到复用。

**用一幅流程图表示：**


![eventloop.jpg](https://p1-juejin.byteimg.com/tos-cn-i-k3u1fbpfcp/bb61ad12ce47403bb7d380b62a2ba921~tplv-k3u1fbpfcp-watermark.image)
## 案件三：真假React

### 案发现场 

这个是发生在笔者身上的事儿，之前在开发 React 项目时候，为了逻辑复用，我把一些封装好的自定义 Hooks 上传到公司私有的 package 管理平台上，在开发另外一个 React 项目的时候，把公司的包下载下来，在组件内部用起来。代码如下：

````js
function Index({classes, onSubmit, isUpgrade}) {
   /* useFormQueryChange 是笔者写好的自定义hooks，并上传到私有库，主要是用于对表单控件的统一管理  */
  const {setFormItem, reset, formData} = useFormQueryChange()
  React.useEffect(() => {
    if (isUpgrade)  reset()
  }, [ isUpgrade ])
  return <form
    className={classes.bootstrapRoot}
    autoComplete='off'
  >
    <div className='btnbox' >
       { /* 这里是业务逻辑，已经省略 */ }
    </div>
  </form>
}
````

`useFormQueryChange` 是笔者写好的自定义 `hooks` ，并上传到私有库，主要是用于对表单控件的统一管理，没想到引入就直接爆红了。错误内容如下：


![hooks.jpg](https://p9-juejin.byteimg.com/tos-cn-i-k3u1fbpfcp/f389c3704e7344219ed7337545e4dc14~tplv-k3u1fbpfcp-watermark.image)

### 逐一排查

我们按照 React 报错的内容，逐一排查问题所在：

* 第一个可能报错原因 `You might have mismatching versions of React and the renderer (such as React DOM)`，意思是 `React`和 `React Dom `版本不一致，造成这种情况，但是我们项目中的 `React` 和 `React Dom` 都是 `v16.13.1`，所以排除这个的嫌疑。

* 第二个可能报错原因 `You might be breaking the Rules of Hooks` 意思是你打破了Hooks 规则，这种情况也是不可能的，因为笔者代码里没有破坏`hoos`规则的行为。所以也排除嫌疑。

* 第三个可能报错原因` You might have more than one copy of React in the same app` 意思是在同一个应用里面，可能有多个 React。目前来看所有的嫌疑都指向第三个，首先我们引用的自定义 hooks，会不会内部又存在一个React 呢？ 

按照上面的提示我排查到自定义hooks对应的`node_modules`中果然存在另外一个React，是这个`假React`（我们姑且称之为假React）搞的鬼。我们在[Hooks原理](https://juejin.cn/post/6944863057000529933) 文章中讲过，`React Hooks`用`ReactCurrentDispatcher.current` 在组件初始化，组件更新阶段赋予不同的hooks对象，更新完毕后赋予`ContextOnlyDispatcher`，如果调用这个对象下面的hooks，就会报如上错误，那么说明了**这个错误是因为我们这个项目，执行上下文引入的React是项目本身的React,但是自定义Hooks引用的是假React Hooks中的`ContextOnlyDispatcher`**

接下来我看到组件库中的`package.json`中,
````json
"dependencies": {
  "react": "^16.13.1",
  "@babel/runtime-corejs3": "^7.11.2",
  "react-dom": "^16.13.1"
},
````
原来是React作为 `dependencies`所以在下载自定义`Hooks`的时候，把`React`又下载了一遍。那么如何解决这个问题呢。对于封装React组件库，hooks库，不能用 `dependencies`，因为它会以当前的`dependencies`为依赖下载到自定义hooks库下面的`node_modules`中。取而代之的应该用`peerDependencies`，使用`peerDependencies`，自定义`hooks`再找相关依赖就会去我们的项目的`node_modules`中找，就能根本上解决这个问题。
所以我们这么改
````json
"peerDependencies": {
    "react": ">=16.8",
    "react-dom": ">=16.8",
},
````
就完美的解决了这个问题。

### 拨开迷雾
这个问题让我们明白了如下：

* 对于一些hooks库，组件库，本身的依赖，已经在项目中存在了，所以用`peerDependencies`声明。

* 在开发的过程中，很可能用到不同版本的同一依赖，比如说项目引入了 A 版本的依赖，组件库引入了 B 版本的依赖。那么这种情况如何处理呢。在 `package.json` 文档中提供了一个resolutions配置项可以解决这个问题，在 `resolutions` 中锁定同一的引入版本，这样就不会造成如上存在多个版本的项目依赖而引发的问题。

项目`package.json`这么写
````json
{
  "resolutions": {
    "react": "16.13.1",
    "react-dom": "16.13.1"
  },
}
````
这样无论项目中的依赖，还是其他库中依赖，都会使用统一的版本，从根本上解决了多个版本的问题。


## 案件四：PureComponet/memo功能失效问题

### 案情描述

在 React 开发的时候，但我们想要用 `PureComponent` 做性能优化，调节组件渲染，但是写了一段代码之后，发现 `PureComponent` 功能竟然失效了，具体代码如下：

````js

class Index extends React.PureComponent{
   render(){
     console.log('组件渲染')
     const { name , type } = this.props
     return <div>
       hello , my name is { name }
       let us learn { type }
     </div>
   }
}

export default function Home (){
   const [ number , setNumber  ] = React.useState(0)
   const [ type , setType ] = React.useState('react')
   const changeName = (name) => {
       setType(name)
   }
   return <div>
       <span>{ number }</span><br/>
       <button onClick={ ()=> setNumber(number + 1) } >change number</button>
       <Index type={type}  changeType={ changeName } name="alien"  />
   </div>
}

````
我们本来期望：

* 对于 Index 组件，只有`props`中 `name`和`type`改变，才促使组件渲染。但是实际情况却是这样：

点击按钮效果：


![purecomponent.gif](https://p1-juejin.byteimg.com/tos-cn-i-k3u1fbpfcp/bd8ec5aaf652469bb5f2a84e45d94e79~tplv-k3u1fbpfcp-watermark.image)

### 水落石出

为什么会出现这种情况呢？ 我们再排查一下`Index`组件，发现 `Index` 组件上有一个 `changeType`，那么是不是这个的原因呢？ 我们来分析一下，首先状态更新是在父组件 `Home`上，`Home`组件更新每次会产生一个新的`changeName`，所以`Index`的`PureComponent`每次会**浅比较**，发现`props`中的`changeName`每次都相等，所以就更新了，给我们直观的感觉是失效了。

那么如何解决这个问题，`React hooks` 中提供了 `useCallback`，可以对`props`传入的回调函数进行缓存，我们来改一下`Home`代码。

````js
const changeName = React.useCallback((name) => {
    setType(name)
},[])
````
效果：


![pureComponent1.gif](https://p1-juejin.byteimg.com/tos-cn-i-k3u1fbpfcp/4b05e03a72ba4177a8e33ab1fd49b11b~tplv-k3u1fbpfcp-watermark.image)

这样就根本解决了问题，用 `useCallback`对`changeName`函数进行缓存，在每一次 `Home` 组件执行，只要`useCallback`中`deps`没有变，`changeName`内存空间还指向原来的函数，这样`PureComponent`浅比较就会发现是相同`changeName`，从而不渲染组件，至此案件已破。

### 继续深入

大家用函数组件+类组件开发的时候，如果用到` React.memo React.PureComponent`等api，要注意给这些组件绑定事件的方式，如果是函数组件，那么想要持续保持**纯组件的渲染控制的特性**的话，那么请用 `useCallback`,`useMemo`等api处理，如果是类组件，请不要用箭头函数绑定事件，箭头函数同样会造成失效的情况。

上述中提到了一个浅比较`shallowEqual`，接下来我们重点分析一下 `PureComponent`是如何`shallowEqual`，接下来我们在深入研究一下`shallowEqual`的奥秘。这样从类租价的更新开始。

> react-reconciler/src/ReactFiberClassComponent.js 

````js
function updateClassInstance(){
    const shouldUpdate =
    checkHasForceUpdateAfterProcessing() ||
    checkShouldComponentUpdate(
      workInProgress,
      ctor,
      oldProps,
      newProps,
      oldState,
      newState,
      nextContext,
    );
    return shouldUpdate
}
```` 
我这里简化`updateClassInstance`，只保留了涉及到`PureComponent`的部分。`updateClassInstance`这个函数主要是用来，执行生命周期，更新state，判断组件是否重新渲染，返回的 `shouldUpdate`用来决定当前类组件是否渲染。`checkHasForceUpdateAfterProcessing`检查更新来源是否来源与 forceUpdate ， 如果是`forceUpdate`组件是一定会更新的，`checkShouldComponentUpdate`检查组件是否渲染。我们接下来看一下这个函数的逻辑。

````js
function checkShouldComponentUpdate(){
    /* 这里会执行类组件的生命周期 shouldComponentUpdate */
    const shouldUpdate = instance.shouldComponentUpdate(
      newProps,
      newState,
      nextContext,
    );
    /* 这里判断组件是否是 PureComponent 纯组件，如果是纯组件那么会调用 shallowEqual 浅比较  */
    if (ctor.prototype && ctor.prototype.isPureReactComponent) {
        return (
        !shallowEqual(oldProps, newProps) || !shallowEqual(oldState, newState)
        );
    }
}
````
`checkShouldComponentUpdate`有两个至关重要的作用：
* 第一个就是如果类组件有生命周期`shouldComponentUpdate`，会执行生命周期`shouldComponentUpdate`，判断组件是否渲染。
* 如果发现是纯组件`PureComponent`，会浅比较新老`props`和`state`是否相等，如果相等，则不更新组件。`isPureReactComponent`就是我们使用`PureComponent`的标识，证明是纯组件。

接下来就是重点`shallowEqual`，以`props`为例子，我们看一下。

> shared/shallowEqual
````js
function shallowEqual(objA: mixed, objB: mixed): boolean {
  if (is(objA, objB)) { // is可以 理解成  objA === objB 那么返回相等
    return true;
  }

  if (
    typeof objA !== 'object' ||
    objA === null ||
    typeof objB !== 'object' ||
    objB === null
  ) {
    return false;  
  } // 如果新老props有一个不为对象，或者不存在，那么直接返回false

  const keysA = Object.keys(objA); // 老props / 老state key组成的数组
  const keysB = Object.keys(objB); // 新props / 新state key组成的数组

  if (keysA.length !== keysB.length) { // 说明props增加或者减少，那么直接返回不想等
    return false;
  }

  for (let i = 0; i < keysA.length; i++) { // 遍历老的props ,发现新的props没有，或者新老props不同等,那么返回不更新组件。
    if (
      !hasOwnProperty.call(objB, keysA[i]) ||
      !is(objA[keysA[i]], objB[keysA[i]])
    ) {
      return false;
    }
  }

  return true; //默认返回相等
}
````
`shallowEqual`流程是这样的，`shallowEqual` 返回 `true` 则证明相等，那么不更新组件；如果返回`false` 证明不想等，那么更新组件。`is` 我们暂且可以理解成 ===

* 第一步，直接通过 === 判断是否相等，如果相等，那么返回`true`。正常情况只要调用 `React.createElement` 会重新创建`props`，`props`都是不相等的。
* 第二步，如果新老`props`有一个不为对象，或者不存在，那么直接返回`false`。
* 第三步，判断新老`props`，`key`组成的数组数量等不想等，说明`props`有增加或者减少，那么直接返回`false`。
* 第四步，遍历老的`props` ,发现新的`props`没有与之对应，或者新老`props`不同等,那么返回`false`。
* 默认返回`true`。

这就是`shallowEqual`逻辑，代码还是非常简单的。感兴趣的同学可以看一看。

## 案件五：组件莫名其妙重复挂载

### 接到报案

之前的一位同学遇到一个诡异情况，他希望在组件更新，`componentDidUpdate`执行后做一些想要做的事，组件更新源来源于父组件传递 `props` 的改变。但是父组件改变 `props`发现视图渲染，但是`componentDidUpdate`没有执行，更怪异的是`componentDidMount`执行。代码如下：

````js
// TODO: 重复挂载
class Index extends React.Component{
   componentDidMount(){
     console.log('组件初始化挂载')
   }
   componentDidUpdate(){
     console.log('组件更新')
     /* 想要做一些事情 */
   }
   render(){
      return <div>《React进阶实践指南》  👍 { this.props.number } +   </div>
   }
}
````

**效果如下**


![didupdate.gif](https://p3-juejin.byteimg.com/tos-cn-i-k3u1fbpfcp/2748d8a7ef274a96ae1743db3494dab7~tplv-k3u1fbpfcp-watermark.image)

`componentDidUpdate`没有执行，`componentDidMount`执行，说明组件根本**没有走更新逻辑**，而是**走了重复挂载**。

### 逐一排查

子组件一头雾水，根本不找原因，我们只好从父组件入手。让我们看一下父组件如何写的。

````js
const BoxStyle = ({ children })=><div className='card' >{ children }</div>

export default function Home(){
   const [ number , setNumber ] = useState(0)
   const NewIndex = () => <BoxStyle><Index number={number}  /></BoxStyle>
   return <div>
      <NewIndex  />
      <button onClick={ ()=>setNumber(number+1) } >点赞</button>
   </div>
}
````
从父组件中找到了一些端倪。在父组件中，首先通过`BoxStyle`做为一个容器组件，添加样式，渲染我们的子组件`Index`，但是每一次通过组合容器组件形成一个新的组件`NewIndex`，真正挂载的是`NewIndex`，真相大白。

### 注意事项

造成这种情况的本质，是每一次 `render` 过程中，都形成一个新组件，对于新组件，React 处理逻辑是直接卸载老组件，重新挂载新组件，所以我们开发的过程中，注意一个问题那就是：
* 对于函数组件，不要在其函数执行上下文中声明新组件并渲染，这样每次函数更新会促使组件重复挂载。
* 对于类组件，不要在 `render` 函数中，做如上同样的操作，否则也会使子组件重复挂载。

## 案件六：useEffect修改DOM元素导致怪异闪现

### 鬼使神差

小明（化名）在动态挂载组件的时候，遇到了灵异的Dom闪现现象，让我们先来看一下现象。

**闪现现象：**


![effect.gif](https://p3-juejin.byteimg.com/tos-cn-i-k3u1fbpfcp/45ce069fe2084d74badac352a6eb5166~tplv-k3u1fbpfcp-watermark.image)

**代码：**

````js
function Index({ offset }){
    const card  = React.useRef(null)
    React.useEffect(()=>{
       card.current.style.left = offset
    },[])
    return <div className='box' >
        <div className='card custom' ref={card}   >《 React进阶实践指南 》</div>
    </div>
}

export default function Home({ offset = '300px' }){
   const [ isRender , setRender ] = React.useState(false)
   return <div>
       { isRender && <Index offset={offset}  /> }
       <button onClick={ ()=>setRender(true) } > 挂载</button>
   </div>
}
````

* 在父组件用 `isRender` 动态加载 `Index`，点击按钮控制 `Index`渲染。
* 在 `Index`的接受动态的偏移量`offset`。并通过操纵用`useRef`获取的原生`dom`直接改变偏移量，使得划块滑动。但是出现了如上图的闪现现象，很不友好，那么为什么会造成这个问题呢？

### 深入了解

初步判断产生这个闪现的问题应该是 `useEffect`造成的，为什么这么说呢，因为类组件生命周期 `componentDidMount`写同样的逻辑，然而并不会出现这种现象。那么为什么`useEffect`会造成这种情况，我们只能顺藤摸瓜找到 `useEffect` 的 `callback`执行时机说起。

`useEffect` `，useLayoutEffect` , `componentDidMount`执行时机都是在 `commit`阶段执行。我们知道 React 有一个 `effectList`存放不同`effect`。因为 `React` 对不同的 `effect` 执行逻辑和时机不同。我们看一下`useEffect`被定义的时候，定义成了什么样类型的 `effect`。

> react-reconciler/src/ReactFiberHooks.js
````js
function mountEffect(create, deps){
  return mountEffectImpl(
    UpdateEffect | PassiveEffect, // PassiveEffect 
    HookPassive,
    create,
    deps,
  );
}
````
这个函数的信息如下：
* `useEffect` 被赋予 `PassiveEffect`类型的 `effect` 。
* 小明改原生dom位置的函数，就是 `create`。

那么 `create`函数什么时候执行的，React又是怎么处理`PassiveEffect`的呢，这是破案的关键。记下来我们看一 下React 怎么处理`PassiveEffect`。 

> react-reconciler/src/ReactFiberCommitWork.js
````js
function commitBeforeMutationEffects() {
  while (nextEffect !== null) {
    if ((effectTag & Passive) !== NoEffect) {
      if (!rootDoesHavePassiveEffects) {
        rootDoesHavePassiveEffects = true;
        /*  异步调度 - PassiveEffect */
        scheduleCallback(NormalPriority, () => {
          flushPassiveEffects();
          return null;
        });
      }
    }
    nextEffect = nextEffect.nextEffect;
  }
}
````
在`commitBeforeMutationEffects` 函数中，会异步调度 `flushPassiveEffects`方法，`flushPassiveEffects`方法中，对于React hooks 会执行 `commitPassiveHookEffects`，然后会执行 `commitHookEffectListMount` 。

````js
function commitHookEffectListMount(){
     if (lastEffect !== null) {
          effect.destroy = create(); /* 执行useEffect中饿 */
     }
}
````

在 `commitHookEffectListMount`中，`create`函数会被调用。我们给`dom`元素加的位置就会生效。

那么问题来了，异步调度做了些什么呢？ React的异步调度，为了防止一些任务执行耽误了浏览器绘制，而造成卡帧现象，react 对于一些优先级不高的任务，采用异步调度来处理，也就是让浏览器才空闲的时间来执行这些异步任务，异步任务执行在不同平台，不同浏览器上首先方式不同，我们在下一篇React调度中会讲解到。这里先姑且认为效果和`setTimeout`一样。

### 雨过天晴

通过上述我们发现 `useEffect` 的第一个参数 `create`，采用的异步调用的方式，那么闪现就很好理解了，**在点击按钮组件第一次渲染过程中，首先执行函数组件`render`，然后`commit`替换真实dom节点,然后浏览器绘制完毕。此时浏览器已经绘制了一次，然后浏览器有空余时间执行异步任务，所以执行了`create`，修改了元素的位置信息，因为上一次元素已经绘制，此时又修改了一个位置，所以感到闪现的效果，此案已破。**，

那么我们怎么样解决闪现的现象呢，那就是 `React.useLayoutEffect` ，`useLayoutEffect`的 `create`是同步执行的，所以浏览器绘制一次，直接更新了最新的位置。

````js
  React.useLayoutEffect(()=>{
      card.current.style.left = offset
  },[])
````

## 总结 + 号外，号外，号外

### 本节可我们学到了什么？

本文以破案的角度，从原理角度讲解了 `React` 一些意想不到的现象，透过这些现象，我们学习了一些 React 内在的东西，我对如上案例总结，

* 案件一-实际是对`fiber`双缓存树的讲解。
* 案件二-实际事件池概念的补充。
* 案件三-是对一些组件库引入多个版本 `React` 的思考和解决方案。
* 案件四-要注意给 `memo` / `PureComponent` 绑定事件，已经如果处理 `PureComponent` 逻辑，以及`shallowEqual`的原理。
* 案件五-对一些组件渲染和组件错误时机声明的理解
* 案件六-是对 `useEffect create` 执行时机的讲解。


### 注意啦！！

这里想给大家说两件事，具体内容如下:

#### 1 React进阶系列专栏
最近掘金平台出了**创作者中心**和**技术专栏**等新功能，用起来真的非常方便，体验非常好，这里很感激掘金平台，希望掘金平台越做越好。
我把往期的**React进阶系列**文章放到了 [React进阶专栏](https://juejin.cn/column/6961274930306482206) ,想要进阶 React技术栈的同学可以关注一下。目前收录的文章有：

* [「react进阶」一文吃透react事件系统原理](https://juejin.cn/post/6955636911214067720) `244+`👍

* [「react进阶」一文吃透react-hooks原理](https://juejin.cn/post/6944863057000529933) `946+`👍

* [「React进阶」 React全部api解读+基础实践大全(夯实基础2万字总结)](https://juejin.cn/post/6950063294270930980) `1740+`👍

* [「react进阶」年终送给react开发者的八条优化建议](https://juejin.cn/post/6908895801116721160)  `978+` 👍 

* [「react进阶」一文吃透React高阶组件(HOC)](https://juejin.cn/post/6940422320427106335) `368+` 👍



#### 2 我写了一本深入系统学习React的小册

为了让大家系统的学习React，进阶React，笔者最近写了一本《React进阶实践指南》的小册，本小册从**基础进阶篇**，**优化进阶篇**，**原理进阶篇**，**生态进阶篇**，**实践进阶篇**，五个方向详细探讨 React 使用指南 和 原理介绍。

* 在**基础进阶篇**里，将重新认识react中 state，props，ref，context等模块，详解其基本使用和高阶玩法。

* 在**优化进阶篇**里，将讲解 React性能调优和细节处理，让React写的更优雅。

* 在**原理进阶篇**里，将针对React几个核心模块原理进行阐述，一次性搞定面试遇到React原理问题。

* 在**生态进阶篇**里，将重温React重点生态的用法，从原理角度分析内部运行的机制。

* 在**实践进阶篇**里，将串联前几个模块，进行强化实践。

至于小册为什么叫进阶实践指南，因为在讲解进阶玩法的同时，也包含了很多实践的小demo。还有一些面试中的问答环节，让读者从面试上脱颖而出。

小册目前已经完成章节最多的**基础进阶篇**，其他篇章，相信不久之后将与大家见面，感兴趣的同学可以关注我！接下来每篇文章都会透露小册最新状态。
