
https://jelly.jd.com/article/5fbb4fe17482df01463debf8
①②③④⑤⑥⑦⑧⑨⑩⑪
# 「react进阶」一文吃透react-hooks原理

# 一 前言

之前的两篇文章，分别介绍了`react-hooks`如何使用，以及自定义`hooks`设计模式及其实战，本篇文章主要从`react-hooks`起源，原理，源码角度，开始剖析`react-hooks`运行机制和内部原理，相信这篇文章过后，对于面试的时候那些`hooks`问题，也就迎刃而解了。实际`react-hooks`也并没有那么难以理解，听起来很`cool`，实际就是函数组件**解决没有`state`，生命周期，逻辑不能复用**的一种技术方案。

> Hook 是 React 16.8 的新增特性。它可以让你在不编写 class 的情况下使用 state 以及其他的 React 特性。

老规矩,🤔️🤔️🤔️我们带着疑问开始今天的探讨(**能回答上几个，自己可以尝试一下，掌握程度**)：

* 1 在无状态组件每一次函数上下文执行的时候，`react`用什么方式记录了`hooks`的状态？
* 2 多个`react-hooks`用什么来记录每一个`hooks`的顺序的 ？ 换个问法！为什么不能条件语句中，声明`hooks`? `hooks`声明为什么在组件的最顶部？
* 3 `function`函数组件中的`useState`，和 `class`类组件 `setState`有什么区别？
* 4 `react` 是怎么捕获到`hooks`的执行上下文，是在函数组件内部的？
* 5 `useEffect`,`useMemo` 中，为什么`useRef`不需要依赖注入，就能访问到最新的改变值？
* 6 `useMemo`是怎么对值做缓存的？如何应用它优化性能？
* 7 为什么两次传入`useState`的值相同，函数组件不更新。
* ...

如果你认真读完这篇文章，这些问题全会迎刃而解。

## 无状态组件和有状态组件本质的区别

在解释`react-hooks`原理的之前，我们要加深理解一下， **无状态组件和有状态组件到底有什么区别**，废话不多说，我们先看
两个代码片段。

````js
class Index extends React.Component<any,any>{
    constructor(props){
        super(props)
        this.state={
            number:0
        }
    }
    handerClick=()=>{
       for(let i = 0 ;i<5;i++){
           setTimeout(()=>{
               this.setState({ number:this.state.number+1 })
               console.log(this.state.number)
           },1000)
       }
    }

    render(){
        return <div>
            <button onClick={ this.handerClick } >num++</button>
        </div>
    }
}
````
打印结果？

再来看看无状态组件中：

````js
function Index(){
    const [ num ,setNumber ] = React.useState(0)
    const handerClick=()=>{
        for(let i=0; i<5;i++ ){
           setTimeout(() => {
                setNumber(num+1)
                console.log(num)
           }, 1000)
        }
    }
    return <button onClick={ handerClick } >{ num }</button>
}
````
打印结果？

------------公布答案-------------
在第一个例子🌰打印结果：
1 2 3 4 5 

在第二个例子🌰打印结果：
0 0 0 0 0

这个问题实际很蒙人，我们来一起分析一下,第一个类组件中，由于执行上`setState`没有在`react`正常的函数执行上下文上执行，而是`setTimeout`中执行的，**批量更新**条件被破坏。原理这里我就不讲了,所以可以直接获取到变化后的`state`。

但是在无状态组件中，似乎没有生效。原因很简单，在`class`状态中，通过一个实例化的`class`，去维护组件中的各种状态；但是在`function`组件中，没有一个状态去保存这些信息，每一次函数上下文执行，所有变量，常量都重新声明，执行完毕，再被垃圾机制回收。所以如上，无论`setTimeout`执行多少次，都是在当前函数上下文执行,此时`num = 0`不会变，之后`setNumber`执行，函数组件重新执行之后，`num`才变化。


所以， 对于`class`组件，我们只需要实例化一次，实例中保存了组件的`state`等状态。对于每一次更新只需要调用`render`方法就可以。但是在`function`组件中，每一次更新都是一次新的函数执行,为了保存一些状态,执行一些副作用钩子,`react-hooks`应运而生，去帮助记录组件的状态，处理一些额外的副作用。


# 二  初识：揭开hooks的面纱 

## 1 当我们引入hooks时候发生了什么？

我们从引入 `hooks`开始，以`useState`为例子，当我们从项目中这么写：

````js
import { useState } from 'react'
````

于是乎我们去找`useState`,看看它到底是哪路神仙？

`react/src/ReactHooks.js`


**useState**

````js
export function useState(initialState){
  const dispatcher = resolveDispatcher();
  return dispatcher.useState(initialState);
}
````
`useState()` 的执行等于  `dispatcher.useState(initialState)`
这里面引入了一个`dispatcher`，我们看一下`resolveDispatcher`做了些什么？

**resolveDispatcher**

````js
function resolveDispatcher() {
  const dispatcher = ReactCurrentDispatcher.current
  return dispatcher
}
````

**ReactCurrentDispatcher**

`react/src/ReactCurrentDispatcher.js`

````js
const ReactCurrentDispatcher = {
  current: null,
};
````
我们看到`ReactCurrentDispatcher.current`初始化的时候为`null`，然后就没任何下文了。我们暂且只能把**`ReactCurrentDispatcher`**记下来。看看`ReactCurrentDispatcher`什么时候用到的 ？


## 2 开工造物，从无状态组件的函数执行说起

想要彻底弄明白`hooks`，就要从其根源开始，上述我们在引入`hooks`的时候，最后以一个`ReactCurrentDispatcher`草草收尾，线索全部断了，所以接下来我们只能从函数组件执行开始。


### renderWithHooks 执行函数

对于`function`组件是什么时候执行的呢？

`react-reconciler/src/ReactFiberBeginWork.js`

`function`组件初始化：
````js
renderWithHooks(
    null,                // current Fiber
    workInProgress,      // workInProgress Fiber
    Component,           // 函数组件本身
    props,               // props
    context,             // 上下文
    renderExpirationTime,// 渲染 ExpirationTime
);
````
对于初始化是没有`current`树的，之后完成一次组件更新后，会把当前`workInProgress`树赋值给`current`树。

`function`组件更新：
````js
renderWithHooks(
    current,
    workInProgress,
    render,
    nextProps,
    context,
    renderExpirationTime,
);
````
我们从上边可以看出来，`renderWithHooks`函数作用是**调用`function`组件函数**的主要函数。我们重点看看`renderWithHooks`做了些什么？


**renderWithHooks**
`react-reconciler/src/ReactFiberHooks.js`

````js
export function renderWithHooks(
  current,
  workInProgress,
  Component,
  props,
  secondArg,
  nextRenderExpirationTime,
) {
  renderExpirationTime = nextRenderExpirationTime;
  currentlyRenderingFiber = workInProgress;
 
  workInProgress.memoizedState = null;
  workInProgress.updateQueue = null;
  workInProgress.expirationTime = NoWork;

  ReactCurrentDispatcher.current =
      current === null || current.memoizedState === null
        ? HooksDispatcherOnMount
        : HooksDispatcherOnUpdate;

  let children = Component(props, secondArg);

  if (workInProgress.expirationTime === renderExpirationTime) { 
       // ....这里的逻辑我们先放一放
  }

  ReactCurrentDispatcher.current = ContextOnlyDispatcher;

  renderExpirationTime = NoWork;
  currentlyRenderingFiber = null;

  currentHook = null
  workInProgressHook = null;

  didScheduleRenderPhaseUpdate = false;

  return children;
}
````
**所有的函数组件执行，都是在这里方法中**,首先我们应该明白几个感念，这对于后续我们理解`useState`是很有帮助的。

`current fiber树`: 当完成一次渲染之后，会产生一个`current`树,`current`会在`commit`阶段替换成真是的`Dom`树。

`workInProgress fiber树`: 即将调和渲染的 `fiber` 树。再一次新的组件更新过程中，会从`current`复制一份作为，``

`workInProgress.memoizedState`: 在`class`组件中，`memoizedState`存放`state`信息，在`function`组件中，**这里可以提前透漏一下，`memoizedState`存放一次调和渲染过程中，以链表的形式存放`hooks`信息**

`workInProgress.updateQueue` : 更新队列，里面存放负责更新的`update`对象。

`workInProgress.expirationTime`: `react`用不同的`expirationTime`,来确定更新的优先级。

`currentHook` : 可以理解 `current`树上的保存的 `hooks` 当前节点信息。

`workInProgressHook` : 可以理解成 `workInProgress`树上保存的`hooks` 当前节点信息。

`renderWithHooks`函数主要作用:

  首先先置空即将调和渲染的`workInProgress`树的`memoizedState`和`updateQueue`，为什么这么做，因为在接下来的函数组件执行过程中，要把新的`hooks`信息挂载到这两个属性上，然后在组件`commit`阶段，将`workInProgress`树替换成`current`树，替换真实的`DOM`元素节点。并在`current`树保存`hooks`信息。

  然后根据当前函数组件是否是第一次渲染，赋予`ReactCurrentDispatcher.current`不同的`hooks`,终于和上面讲到的`ReactCurrentDispatcher`联系到一起。对于第一次渲染组件，那么用的是`HooksDispatcherOnMount` hooks对象。
  对于渲染后，需要更新的函数组件，则是`HooksDispatcherOnUpdate`对象，那么两个不同就是通过`current`树上是否`memoizedState`（hook信息）来判断的。

  接下来，**调用`Component(props, secondArg);`执行我们的函数组件，我们的函数组件在这里真正的被执行了，然后，我们写的`hooks`被依次执行，把`hooks`信息依次保存到`workInProgress`树上。**，至于它是怎么保存的，我们马上会讲到。

  接下来，也很重要，将`ContextOnlyDispatcher`赋值给` ReactCurrentDispatcher.current`，由于`js`是单线程的，也就是说我们没有在函数组件中，调用的`hooks`，都是`ContextOnlyDispatcher`对象上`hooks`,我们看看`ContextOnlyDispatcher`hooks，到底是什么。

````js
const ContextOnlyDispatcher = {
    useState:throwInvalidHookError
}
function throwInvalidHookError() {
  invariant(
    false,
    'Invalid hook call. Hooks can only be called inside of the body of a function component. This could happen for' +
      ' one of the following reasons:\n' +
      '1. You might have mismatching versions of React and the renderer (such as React DOM)\n' +
      '2. You might be breaking the Rules of Hooks\n' +
      '3. You might have more than one copy of React in the same app\n' +
      'See https://fb.me/react-invalid-hook-call for tips about how to debug and fix this problem.',
  );
}
````
原来如此，`react-hooks`就是通过这种函数组件执行赋值不同的`hooks`对象方式，判断在`hooks`执行是否在函数组件内部，捕获并抛出异常的。

最后，重新置空一些变量比如`currentHook`，`currentlyRenderingFiber`,`workInProgressHook`等。



## 3 不同的`hooks`对象

上述讲到在函数第一次渲染组件和更新组件分别调用不同的`hooks`对象，我们现在就来看看`HooksDispatcherOnMount` 和 `HooksDispatcherOnUpdate`。

第一次渲染(我这里只展示了常用的`hooks`)：

````js
const HooksDispatcherOnMount = {
  useCallback: mountCallback,
  useEffect: mountEffect,
  useLayoutEffect: mountLayoutEffect,
  useMemo: mountMemo,
  useReducer: mountReducer,
  useRef: mountRef,
  useState: mountState,
};
````

````js
const HooksDispatcherOnUpdate = {
  useCallback: updateCallback,
  useEffect: updateEffect,
  useLayoutEffect: updateLayoutEffect,
  useMemo: updateMemo,
  useReducer: updateReducer,
  useRef: updateRef,
  useState: updateState
};
````
看来对于第一次渲染组件，和更新组件，`react-hooks`采用了两套`Api`，本文的第二部分和第三部分，将重点两者的联系。

TODO: 我们用流程图来描述整个过程：



# 三 hooks初始化，我们写的hooks会变成什么样子

本文将重点围绕四个中重点`hooks`展开，分别是负责组件更新的`useState`，负责执行副作用`useEffect` ,负责保存数据的`useRef`,负责缓存优化的`useMemo`， 至于`useCallback`,`useReducer`,`useLayoutEffect`原理和那四个重点`hooks`比较相近，就不一一解释了。

我们先写一个组件，并且用到上述四个主要`hooks`：

**请记住如下代码片段，后面讲解将以如下代码段展开**
````js
import React , { useEffect , useState , useRef , useMemo  } from 'react'
function Index(){
    const [ number , setNumber ] = useState(0)
    const curRef  = useRef(null)
    const DivDemo = useMemo(() => <div> hello , i am useMemo </div>,[])
    useEffect(()=>{
       console.log(curRef.current)
    },[])
    return <div ref={ curRef } >
        hello,world { number } 
        { DivDemo }
        <button onClick={() => setNumber(number+1) } >number++</button>
     </div>
}
````
接下来我们一起研究一下我们上述写的四个`hooks`最终会变成什么？


## 1 mountWorkInProgressHook 

在组件初始化的时候,每一次`hooks`执行，如`useState()`,`useRef()`,都会调用`mountWorkInProgressHook`,`mountWorkInProgressHook`到底做了写什么，让我们一起来分析一下：

`react-reconciler/src/ReactFiberHooks.js -> mountWorkInProgressHook`

````js
function mountWorkInProgressHook() {
  const hook: Hook = {
    memoizedState: null,  // useState中 保存 state信息 ｜ useEffect 中 保存着 effect 对象 ｜ useMemo 中 保存的是缓存的值和deps ｜ useRef中保存的是ref 对象
    baseState: null,
    baseQueue: null,
    queue: null,
    next: null,
  };
  if (workInProgressHook === null) { // 例子中的第一个`hooks`-> useState(0) 走的就是这样。
    currentlyRenderingFiber.memoizedState = workInProgressHook = hook;
  } else {
    workInProgressHook = workInProgressHook.next = hook;
  }
  return workInProgressHook;
}
````


`mountWorkInProgressHook`这个函数做的事情很简单，首先每次执行一个`hooks`函数，都产生一个`hook`对象，里面保存了当前`hook`信息,然后将每个`hooks`以链表形式串联起来，并赋值给`workInProgress`的`memoizedState`。也就证实了上述所说的，函数组件用`memoizedState`存放`hooks`链表。

至于`hook`对象中都保留了那些信息？我这里先分别介绍一下
:
**memoizedState**： `useState中` 保存 `state` 信息 ｜ `useEffect` 中 保存着 `effect` 对象 ｜ `useMemo` 中 保存的是缓存的值和 `deps` ｜ `useRef` 中保存的是 `ref` 对象。

**baseState** : `usestate`和`useReducer`中 保存最新的更新队列。

**baseState** ： 一次 更新中 ，产生的最新`state`值。

**queue** ： 保存待更新队列 `pendingQueue` ，更新函数 `dispatch` 等信息。

**next**: 指向下一个 `hooks`对象。


那么当我们函数组件执行之后，四个`hooks`和`workInProgress`将是如图的关系。



知道每个`hooks`关系之后，我们应该理解了，为什么不能条件语句中，声明`hooks`，因为一旦在条件语句中声明`hooks`，在下一次函数组件更新，`hooks`链表结构，将会被破坏，`current`树的`memoizedState`缓存`hooks`信息，和当前`workInProgress`不一致，如果涉及到读取`state`等操作，就会发生异常。

我们用一幅图表示如果在条件语句中声明会出现什么情况发生。


上述介绍了 `hooks`通过什么来证明唯一性的，答案 ，通过`hooks`链表顺序。和为什么不能在条件语句中，声明`hooks`，接下来我们按照四个方向，分别介绍初始化的时候发生了什么？

## 2 初始化useState -> mountState

**mountState**

````js
function mountState(
  initialState
){
  const hook = mountWorkInProgressHook();
  if (typeof initialState === 'function') {
    // 如果 useState 第一个参数为函数，执行函数得到state
    initialState = initialState();
  }
  hook.memoizedState = hook.baseState = initialState;
  const queue = (hook.queue = {
    pending: null,  // 带更新的
    dispatch: null, // 负责更新函数
    lastRenderedReducer: basicStateReducer, //用于得到最新的 state ,
    lastRenderedState: initialState, // 最后一次得到的 state
  });

  const dispatch = (queue.dispatch = (dispatchAction.bind( // 负责更新的函数
    null,
    currentlyRenderingFiber,
    queue,
  )))
  return [hook.memoizedState, dispatch];
}
````
`mountState`到底做了些什么，首先会得到初始化的`state`，将它赋值给`mountWorkInProgressHook`产生的`hook`对象的
`memoizedState`和`baseState`属性，然后创建一个`queue`对象，里面保存了负责更新的信息。

这里先说一下，在无状态组件中，`useState`和`useReducer`触发函数更新的方法都是`dispatchAction`,`useState`，可以看成一个简化版的`useReducer`,至于`dispatchAction`怎么更新`state`，更新组件的，我们接着往下研究`dispatchAction`。

在研究之前 我们**先要弄明白`dispatchAction`是什么?** 

````ts
function dispatchAction<S, A>(
  fiber: Fiber,
  queue: UpdateQueue<S, A>,
  action: A,
)
````

````js
const [ number , setNumber ] = useState(0)
````

**`dispatchAction` 就是 `setNumber`** , `dispatchAction` 第一个参数和第二个参数，已经被`bind`给改成`currentlyRenderingFiber`和 `queue`,我们传入的参数是第三个参数`action`


### dispatchAction 无状态组件更新机制

作为更新的主要函数，我们一下来研究一下，我把 `dispatchAction` 精简，精简，再精简，

````js
function dispatchAction(fiber, queue, action) {

  // 计算 expirationTime 过程略过。
  /* 创建一个update */
  const update= {
    expirationTime,
    suspenseConfig,
    action,
    eagerReducer: null,
    eagerState: null,
    next: null,
  }
  /* 把创建的update */
  const pending = queue.pending;
  if (pending === null) {  // 证明第一次更新
    update.next = update;
  } else { // 不是第一次更新
    update.next = pending.next;
    pending.next = update;
  }
  
  queue.pending = update;
  const alternate = fiber.alternate;
  /* 判断当前是否在渲染阶段 */
  if ( fiber === currentlyRenderingFiber || (alternate !== null && alternate === currentlyRenderingFiber)) {
    didScheduleRenderPhaseUpdate = true;
    update.expirationTime = renderExpirationTime;
    currentlyRenderingFiber.expirationTime = renderExpirationTime;
  } else { /* 当前函数组件对应fiber没有处于调和渲染阶段 ，那么获取最新state , 执行更新 */
    if (fiber.expirationTime === NoWork && (alternate === null || alternate.expirationTime === NoWork)) {
      const lastRenderedReducer = queue.lastRenderedReducer;
      if (lastRenderedReducer !== null) {
        let prevDispatcher;
        try {
          const currentState = queue.lastRenderedState; /* 上一次的state */
          const eagerState = lastRenderedReducer(currentState, action); /**/
          update.eagerReducer = lastRenderedReducer;
          update.eagerState = eagerState;
          if (is(eagerState, currentState)) { 
            return
          }
        } 
      }
    }
    scheduleUpdateOnFiber(fiber, expirationTime);
  }
}
````
无论是类组件调用`setState`,还是函数组件的`dispatchAction` ，都会产生一个 `update`对象，里面记录了此次更新的信息，然后将此`update`放入待更新的`pending`队列中，`dispatchAction`第二步就是判断当前函数组件的`fiber`对象是否处于渲染阶段，如果处于渲染阶段，那么不需要我们在更新当前函数组件，只需要更新一下当前`update`的`expirationTime`即可。

如果当前`fiber`没有处于更新阶段。那么通过调用`lastRenderedReducer`获取最新的`state`,和上一次的`currentState`，进行浅比较，如果相等，那么就退出，这就证实了为什么`useState`，两次值相等的时候，组件不渲染的原因了，这个机制和`Component`模式下的`setState`有一定的区别。

如果两次`state`不相等，那么调用`scheduleUpdateOnFiber`调度渲染当前`fiber`，`scheduleUpdateOnFiber`是`react`渲染更新的主要函数。

我们把**初始化`mountState`**和**无状态组件更新机制**讲明白了，接下来看一下其他的**hooks**初始化做了些什么操作？

## 3 初始化useEffect -> mountEffect

上述讲到了无状态组件中`fiber`对象`memoizedState`保存当前的`hooks`形成的链表。那么`updateQueue`保存了什么信息呢，我们会在接下来探索`useEffect`过程中找到答案。
当我们调用`useEffect`的时候，在组件第一次渲染的时候会调用`mountEffect`方法，这个方法到底做了些什么？

### mountEffect
````js
function mountEffect(
  create,
  deps,
) {
  const hook = mountWorkInProgressHook();
  const nextDeps = deps === undefined ? null : deps;
  hook.memoizedState = pushEffect(
    HookHasEffect | hookEffectTag, 
    create, // useEffect 第一次参数，就是副作用函数
    undefined,
    nextDeps, // useEffect 第二次参数，deps
  );
}

````
每个`hooks`初始化都会创建一个`hook`对象，然后将hook的`memoizedState`保存当前`effect hook`信息。

**有两个`memoizedState`大家千万别混淆了，我这里在友情提示一遍**

* `workInProgress / current` 树上的 `memoizedState` 保存的是当前函数组件每个`hooks`形成的链表。

*  每个`hooks`上的`memoizedState` 保存了当前`hooks`信息，不同种类的`hooks`的`memoizedState`内容不同。上述的方法最后执行了一个`pushEffect`，我们一起看看`pushEffect`做了些什么？

### pushEffect 创建effect对象，挂载updateQueue

````js
function pushEffect(tag, create, destroy, deps) {
  const effect = {
    tag,
    create,
    destroy,
    deps,
    next: null,
  };
  let componentUpdateQueue = currentlyRenderingFiber.updateQueue
  if (componentUpdateQueue === null) { // 如果是第一个 useEffect
    componentUpdateQueue = {  lastEffect: null  }
    currentlyRenderingFiber.updateQueue = componentUpdateQueue
    componentUpdateQueue.lastEffect = effect.next = effect;
  } else {  // 存在多个effect
    const lastEffect = componentUpdateQueue.lastEffect;
    if (lastEffect === null) {
      componentUpdateQueue.lastEffect = effect.next = effect;
    } else {
      const firstEffect = lastEffect.next;
      lastEffect.next = effect;
      effect.next = firstEffect;
      componentUpdateQueue.lastEffect = effect;
    }
  }
  return effect;
}
````
这一段实际很简单，首先创建一个 `effect` ，判断组件如果第一次渲染，那么创建 `componentUpdateQueue` ，就是`workInProgress`的`updateQueue`。然后将`effect`放入`updateQueue`中，不过这里顺序要主要，越靠后的`effect`，越在`updateQueue`前边。

假设我们在一个函数组件中这么写：

````js
useEffect(()=>{
    console.log(1)
},[ props.a ])
useEffect(()=>{
    console.log(2)
},[])
useEffect(()=>{
    console.log(3)
},[])
````

最后`workInProgress.updateQueue`会以这样的形式保存：

TODO: 图

### 拓展:effectList

`effect list` 可以理解为是一个存储 `effectTag` 副作用列表容器。它是由 `fiber` 节点和指针 `nextEffect` 构成的单链表结构，这其中还包括第一个节点 `firstEffect` ，和最后一个节点 `lastEffect`。
`React` 采用深度优先搜索算法，在 `render` 阶段遍历 `fiber` 树时，把每一个有副作用的 `fiber` 筛选出来，最后构建生成一个只带副作用的 `effect list` 链表。
在 `commit` 阶段，`React` 拿到 `effect list` 数据后，通过遍历 `effect list`，并根据每一个 `effect` 节点的 `effectTag` 类型，执行每个`effect`，从而对相应的 `DOM` 树执行更改。


## 4 初始化useMemo -> mountMemo

不知道大家是否把 `useMemo` 想象的过于复杂了，实际相比其他 `useState` , `useEffect`等，它的逻辑实际简单的很。

````js
function mountMemo(nextCreate,deps){
  const hook = mountWorkInProgressHook();
  const nextDeps = deps === undefined ? null : deps;
  const nextValue = nextCreate();
  hook.memoizedState = [nextValue, nextDeps];
  return nextValue;
}
````
初始化`useMemo`，就是创建一个`hook`，然后执行`useMemo`的第一个参数,得到需要缓存的值，然后将值和`deps`记录下来，赋值给当前`hook`的`memoizedState`。整体上并没有复杂的逻辑。


## 5 初始化useRef -> mountRef

对于`useRef`初始化处理，似乎更是简单，我们一起来看一下：

````js
function mountRef(initialValue) {
  const hook = mountWorkInProgressHook();
  const ref = {current: initialValue};
  hook.memoizedState = ref;
  return ref;
}
````
`mountRef`初始化很简单，用一个对象下的, 创建一个ref对象， 对象额`current` 属性来保存初始化的值，最后用`memoizedState`保存`ref`，完成整个操作。

## 6 mounted 阶段 hooks 总结

我们来总结一下初始化阶段,`react-hooks`做的事情，在一个函数组件第一次渲染执行上下文过程中，每个`react-hooks`执行，都会产生一个`hook`对象，并形成链表结构，绑定在`workInProgress`的`memoizedState`属性上，然后`react-hooks`上的状态，绑定在当前`hooks`对象的`memoizedState`属性上。对于`effect`副作用钩子，会绑定在`workInProgress.updateQueue`上，等到`commit`阶段，`dom`树构建完成，在执行每个 `effect` 副作用钩子。

# 四 hooks更新阶段
上述介绍了第一次渲染函数组件，`react-hooks`初始化都做些什么，接下来，我们分析一下，

对于更新阶段，说明上一次 `workInProgress` 树已经赋值给了 `current` 树。存放`hooks`信息的`memoizedState`，此时已经存在`current`树上，`react`对于`hooks`的处理逻辑和`fiber`树逻辑类似。

对于一次函数组件更新，当再次执行`hooks`函数的时候，比如 `useState(0)` ，首先要从`current`的`hooks`中找到与当前`workInProgressHook`，对应的`currentHooks`，然后复制一份`currentHooks`给`workInProgressHook`,接下来`hooks`函数执行的时候,把最新的状态更新到`workInProgressHook`，保证`hooks`状态不丢失。

所以函数组件每次更新，每一次`react-hooks`函数执行，都需要有一个函数去做上面的操作，这个函数就是`updateWorkInProgressHook`,我们接下来一起看这个`updateWorkInProgressHook`。


## 1 updateWorkInProgressHook

````js
function updateWorkInProgressHook() {
  let nextCurrentHook;
  if (currentHook === null) {  /* 如果 currentHook = null 证明它是第一个hooks */
    const current = currentlyRenderingFiber.alternate;
    if (current !== null) {
      nextCurrentHook = current.memoizedState;
    } else {
      nextCurrentHook = null;
    }
  } else { /* 不是第一个hooks，那么指向下一个 hooks */
    nextCurrentHook = currentHook.next;
  }
  let nextWorkInProgressHook
  if (workInProgressHook === null) {  //第一次执行hooks
    // 这里应该注意一下，当函数组件更新也是调用 renderWithHooks ,memoizedState属性是置空的
    nextWorkInProgressHook = currentlyRenderingFiber.memoizedState;
  } else { 
    nextWorkInProgressHook = workInProgressHook.next;
  }

  if (nextWorkInProgressHook !== null) { 
      /* 这个情况说明 renderWithHooks 执行 过程发生多次函数组件的执行 ，我们暂时先不考虑 */
    workInProgressHook = nextWorkInProgressHook;
    nextWorkInProgressHook = workInProgressHook.next;
    currentHook = nextCurrentHook;
  } else {
    invariant(
      nextCurrentHook !== null,
      'Rendered more hooks than during the previous render.',
    );
    currentHook = nextCurrentHook;
    const newHook = { //创建一个新的hook
      memoizedState: currentHook.memoizedState,
      baseState: currentHook.baseState,
      baseQueue: currentHook.baseQueue,
      queue: currentHook.queue,
      next: null,
    };
    if (workInProgressHook === null) { // 如果是第一个hooks
      currentlyRenderingFiber.memoizedState = workInProgressHook = newHook;
    } else { // 重新更新 hook
      workInProgressHook = workInProgressHook.next = newHook;
    }
  }
  return workInProgressHook;
}
````

这一段的逻辑大致是这样的：

* 首先如果是第一次执行`hooks`函数，那么从`current`树上取出`memoizedState` ，也就是旧的`hooks`
* 然后声明变量`nextWorkInProgressHook`，这里应该值得注意，正常情况下，一次`renderWithHooks`执行，`workInProgress`上的`memoizedState`会被置空，`hooks`函数顺序执行，`nextWorkInProgressHook`应该一直为`null`，那么什么情况下`nextWorkInProgressHook`不为`null`,也就是当一次`renderWithHooks`执行过程中，执行了多次函数组件，也就是在`renderWithHooks`中这段逻辑

````js
  if (workInProgress.expirationTime === renderExpirationTime) { 
       // ....这里的逻辑我们先放一放
  }
````
这里面的逻辑，实际就是判定，如果当前函数组件执行后，当前函数组件的还是处于渲染优先级，说明函数组件又有了新的更新任务，那么循坏执行函数组件。这就造成了上述的，`nextWorkInProgressHook`不为null的情况。

* 最后复制`current`的`hooks`，把它赋值给`workInProgressHook`,用于更新新的一轮`hooks`状态。

接下来我们看一下四个种类的`hooks`，在一次组件更新中，分别做了那些操作。

## 2 updateState

useState

````js
function updateReducer(
  reducer,
  initialArg,
  init,
){
  const hook = updateWorkInProgressHook();
  const queue = hook.queue;
  queue.lastRenderedReducer = reducer;
  const current = currentHook;
  let baseQueue = current.baseQueue;
  const pendingQueue = queue.pending;
  if (pendingQueue !== null) {
     // 这里省略... 第一步：将 pending  queue 合并到 basequeue
  }
  if (baseQueue !== null) {
    const first = baseQueue.next;
    let newState = current.baseState;
    let newBaseState = null;
    let newBaseQueueFirst = null;
    let newBaseQueueLast = null;
    let update = first;
    do {
      const updateExpirationTime = update.expirationTime;
      if (updateExpirationTime < renderExpirationTime) { //优先级不足
        const clone  = {
          expirationTime: update.expirationTime,
          ...
        };
        if (newBaseQueueLast === null) {
          newBaseQueueFirst = newBaseQueueLast = clone;
          newBaseState = newState;
        } else {
          newBaseQueueLast = newBaseQueueLast.next = clone;
        }
      } else {  //此更新确实具有足够的优先级。
        if (newBaseQueueLast !== null) {
          const clone= {
            expirationTime: Sync, 
             ...
          };
          newBaseQueueLast = newBaseQueueLast.next = clone;
        }
        /* 得到新的 state */
        newState = reducer(newState, action);
      }
      update = update.next;
    } while (update !== null && update !== first);
    if (newBaseQueueLast === null) {
      newBaseState = newState;
    } else {
      newBaseQueueLast.next = newBaseQueueFirst;
    }
    hook.memoizedState = newState;
    hook.baseState = newBaseState;
    hook.baseQueue = newBaseQueueLast;
    queue.lastRenderedState = newState;
  }
  const dispatch = queue.dispatch
  return [hook.memoizedState, dispatch];
}
````
这一段看起来很复杂，让我们慢慢吃透，首先将上一次更新的`pending  queue` 合并到 `basequeue`，为什么要这么做，比如我们再一次点击事件中这么写，

````js
function Index(){
   const [ number ,setNumber ] = useState(0)
   const handerClick = ()=>{
    //    setNumber(1)
    //    setNumber(2)
    //    setNumber(3)
       setNumber(state=>state+1)
       // 获取上次 state = 1 
       setNumber(state=>state+1)
       // 获取上次 state = 2
       setNumber(state=>state+1)
   }
   console.log(number) // 3 
   return <div>
       <div>{ number }</div>
       <button onClick={ ()=> handerClick() } >点击</button>
   </div>
}
````
**点击按钮， 打印 3 **

三次`setNumber`产生的`update`会暂且放入`pending  queue`，在下一次函数组件执行时候，三次 `update`被合并到 `baseQueue`。结构如下图：

接下来会把当前`useState`或是`useReduer`对应的`hooks`上的`baseState`和`baseQueue`更新到最新的状态。会循环`baseQueue`的`update`，复制一份`update`,更新
`expirationTime`，对于有足够优先级的`update`（上述三个`setNumber`产生的`update`都具有足够的优先级），我们要获取最新的`state`状态。，会一次执行`useState`上的每一个`action`。得到最新的`state`。

这里有会有两个疑问🤔️:

* 问题一：这里不是执行最后一个`action`不就可以了嘛? 
答案： 原因很简单，上面说了 `useState`逻辑和`useReducer`差不多。如果第一个参数是一个函数，会引用上一次 `update`产生的 `state`, 所以需要**循环调用，每一个`update`的`reducer`**，如果`setNumber(2)`是这种情况，那么只用更新值，如果是`setNumber(state=>state+1)`,那么传入上一次的 `state` 得到最新`state`。

* 问题二：什么情况下会有优先级不足的情况(`updateExpirationTime < renderExpirationTime`)？

答案： 这种情况，一般会发生在，当我们调用`setNumber`时候，调用`scheduleUpdateOnFiber`渲染当前组件时，又产生了一次新的更新，所以把最终执行`reducer`更新`state`任务交给下一次更新。


## 3 updateEffect

````js
function updateEffect(create, deps): void {
  const hook = updateWorkInProgressHook();
  const nextDeps = deps === undefined ? null : deps;
  let destroy = undefined;
  if (currentHook !== null) {
    const prevEffect = currentHook.memoizedState;
    destroy = prevEffect.destroy;
    if (nextDeps !== null) {
      const prevDeps = prevEffect.deps;
      if (areHookInputsEqual(nextDeps, prevDeps)) {
        pushEffect(hookEffectTag, create, destroy, nextDeps);
        return;
      }
    }
  }
  currentlyRenderingFiber.effectTag |= fiberEffectTag
  hook.memoizedState = pushEffect(
    HookHasEffect | hookEffectTag,
    create,
    destroy,
    nextDeps,
  );
}
````

`useEffect` 做的事很简单，判断两次`deps` 相等，如果相等说明此次更新不需要执行，则直接调用 `pushEffect`,这里注意 `effect`的标签，`hookEffectTag`,如果不相等，那么更新effect,并且赋值给`hook.memoizedState`，这里标签是 `HookHasEffect | hookEffectTag`,然后在`commit`阶段，`react`会通过标签来判断，是否执行当前的effect函数。

## 4 updateMemo

````js
function updateMemo(
  nextCreate,
  deps,
) {
  const hook = updateWorkInProgressHook();
  const nextDeps = deps === undefined ? null : deps; // 新的 deps 值
  const prevState = hook.memoizedState; 
  if (prevState !== null) {
    if (nextDeps !== null) {
      const prevDeps = prevState[1]; // 之前保存的 deps 值
      if (areHookInputsEqual(nextDeps, prevDeps)) { //判断两次 deps 值
        return prevState[0];
      }
    }
  }
  const nextValue = nextCreate();
  hook.memoizedState = [nextValue, nextDeps];
  return nextValue;
}
````
在组件更新过程中，我们执行`useMemo`函数，做的事情实际很简单，就是判断两次 `deps`是否相等，如果不想等，证明依赖项发生改变，那么执行 `useMemo`的第一个函数，得到新的值，然后重新赋值给`hook.memoizedState`,如果相等 证明没有依赖项改变，那么直接获取缓存的值。

不过这里有一点，值得注意，`nextCreate()`执行，如果里面引用了`usestate`等信息，变量会被引用，无法被垃圾回收机制回收，就是闭包原理，那么访问的属性有可能不是最新的值，所以需要把引用的值，添加到依赖项 `dep` 数组中。每一次`dep`改变，重新执行，就不会出现问题了。

**温馨小提示： 有很多同学说 `useMemo`怎么用，到底什么场景用，用了会不会起到反作用，通过对源码原理解析，我可以明确的说，基本上可以放心使用，说白了就是可以定制化缓存，存值取值而已。**




## 5 updateRef

````js
function updateRef(initialValue){
  const hook = updateWorkInProgressHook()
  return hook.memoizedState
}
````

函数组件更新useRef做的事情更简单，就是返回了缓存下来的值，也就是无论函数组件怎么执行，执行多少次，`hook.memoizedState`内存中都指向了一个对象，所以解释了`useEffect`,`useMemo` 中，为什么`useRef`不需要依赖注入，就能访问到最新的改变值。


## 总原理图




# 五 总结

上面我们从**函数组件初始化**，到**函数组件更新渲染**，两个维度分解讲解了`react-hooks`原理，掌握了`react-hooks`原理和内部运行机制，有助于我们在工作中，更好的使用`react-hooks`。


最后, 送人玫瑰，手留余香，觉得有收获的朋友可以给笔者**点赞，关注**一波 ，陆续更新前端超硬核文章。

## react好文汇总

**react-hooks三部曲另外两部**

* [玩转react-hooks,自定义hooks设计模式及其实战](https://juejin.cn/post/6890738145671938062) `205+` 👍赞

* [react-hooks如何使用](https://juejin.cn/post/6864438643727433741) `120+` 赞👍

**react进阶系列**

* [「react进阶」年终送给react开发者的八条优化建议](https://juejin.cn/post/6908895801116721160)  `880+` 赞👍 

* [「react进阶」一文吃透React高阶组件(HOC)](https://juejin.cn/post/6940422320427106335) `300+` 赞👍

**react源码系列**

* [「源码解析 」这一次彻底弄懂react-router路由原理](https://juejin.cn/post/6886290490640039943) `120+` 赞👍 

* [「源码解析」一文吃透react-redux源码（useMemo经典源码级案例）](https://juejin.cn/post/6937491452838559781)  `133+` 赞👍 


**开源项目系列**

* [「react缓存页面」从需求到开源（我是怎么样让产品小姐姐刮目相看的）](https://juejin.cn/post/6922340460136513549) `300+` 赞👍

* [「前端工程化」从0-1搭建react，ts脚手架（1.2w字超详细教程）](https://juejin.cn/post/6919308174151385096)  `300+` 赞👍

## 参考文档

* [react源码](https://github.com/facebook/react)

* [React Fiber 源码解析](https://juejin.cn/post/6859528127010471949)