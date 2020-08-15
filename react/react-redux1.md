# react-redux 源码解析一: Provider做了什么，发布订阅模式实现？

使用过react的同学都知道,redux作为react公共状态管理容器，配合react-redux可以很好的派发更新，更新视图渲染的作用，那么对于react-redux是如何做到根据state的改变，而更新组件，促使视图渲染的呢，让我们一起来探讨一下，react-redux源码的奥妙所在。
在正式分析之前我们不妨来想几个问题，
**1 为什么要在root跟组件上使用react-redux的provider组件包裹**
**2 redux是使用store.subscribe()来发布订阅 ，那么react-redux组件更新是否也是用这个模式呢**
**3 provide 用什么方式存放当前的redux的 store， 又是怎么传递给每一个需要管理state的组件的**
带着这个疑问我们不妨看一下Provider究竟做了什么


## 创建Subscription，context保存上下文 
````js
/* provider 组件代码 */
function Provider({ store, context, children }) {
   /* 利用useMemo，跟据store变化创建出一个contextValue 包含一个根元素订阅器和当前store  */ 
  const contextValue = useMemo(() => {
      /* 创建了一个 Subscription 订阅器 */
    const subscription = new Subscription(store)
    /* subscription 的 notifyNestedSubs 方法 ，赋值给  onStateChange方法 */
    subscription.onStateChange = subscription.notifyNestedSubs  
    return {
      store,
      subscription
    } /*  store 改变创建新的contextValue */
  }, [store])
  /*  获取更新之前的state值 ，函数组件里面的上下文要优先于组件更新渲染  */
  const previousState = useMemo(() => store.getState(), [store])

  useEffect(() => {
    const { subscription } = contextValue
    /* 触发trySubscribe方法执行，创建listens */
    subscription.trySubscribe()
    if (previousState !== store.getState()) {
        /* 组件更新渲染之后，如果此时state发生改变，那么立即出发 subscription.notifyNestedSubs 方法  */
      subscription.notifyNestedSubs() // 更新组件
    }
    /*   */
    return () => {
      subscription.tryUnsubscribe()  //卸载更新
      subscription.onStateChange = null
    }
    /*  contextValue state改变出发新的effect */
  }, [contextValue, previousState])

  const Context = context || ReactReduxContext
  /*  context 存在用跟元素传进来的context ，如果不存在 createContext创建一个context  ，这里的ReactReduxContext就是由createContext创建出的context */
  return <Context.Provider value={contextValue}>{children}</Context.Provider>
}

````

### 从源码中大致provider作用是这样的 
**1 首先创建一个contextValue ，里面包含一个创建出来的父级Subscription 我们姑且先称之为根级订阅器和redux提供的store。**

**2 通过react上下文context把contextValue传递给子孙组件。**

这就解释了我们在之前的三个问题中的
1 为什么要用provider包裹 ，如上。
3 通过什么保存store ，react的context上下文。


## Subscription作用是什么呢

在我们分析了不是很长的provider源码之后，随之一个Subscription 出现，那么这个Subscription由什么作用呢，我们先来看看在Provder里出现的Subscription方法，
**notifyNestedSubs**
**trySubscribe**
**trySubscribe**
**tryUnsubscribe**

在整个react-redux执行过程中 Subscription 作用非常重要，这里方便先透漏一下，他的作用是收集所有被connect包裹的组件的更新函数onstatechange，然后形成一个callback链表，再有父级Subscription统一派发执行更新，我们暂且不关心他怎么运作的，接下来就是Subscription源码 ，我们重点看一下如上出现的四个方法


````js
/* 发布订阅者模式 */
export default class Subscription {
  constructor(store, parentSub) {
    this.store = store
    this.parentSub = parentSub
    this.unsubscribe = null
    this.listeners = nullListeners

    this.handleChangeWrapper = this.handleChangeWrapper.bind(this)
  }
  /* 负责检测是否该组件订阅，然后添加订阅者也就是listener */
  addNestedSub(listener) {
    this.trySubscribe()
    return this.listeners.subscribe(listener)
  }
  /* 向listeners发布通知 */
  notifyNestedSubs() {
    this.listeners.notify()
  }
  /* 这个就是添加的订阅着listener ，处理由redux，state而订阅的回调函数 */
  handleChangeWrapper() {
    if (this.onStateChange) {
      this.onStateChange()
    }
  }
   /* 判断有没有开启订阅 */
  isSubscribed() {
    return Boolean(this.unsubscribe)
  }
  /* 开启订阅模式 首先判断当前订阅器有没有父级订阅器 ， 如果有父级订阅器(就是父级Subscription)，把自己的handleChangeWrapper放入到监听者链表中 */
  trySubscribe() {
    /*
    parentSub  即是provide value 里面的 Subscription 这里可以理解为 父级元素的 Subscription
    */
    if (!this.unsubscribe) {
      this.unsubscribe = this.parentSub
        ? this.parentSub.addNestedSub(this.handleChangeWrapper)
        /* provider的Subscription是不存在parentSub，所以此时trySubscribe 就会调用 store.subscribe   */
        : this.store.subscribe(this.handleChangeWrapper)
      this.listeners = createListenerCollection()
    }
  }
  /* 取消订阅 */
  tryUnsubscribe() {
    if (this.unsubscribe) {
      this.unsubscribe()
      this.unsubscribe = null
      this.listeners.clear()

      this.listeners = nullListeners
    }
  }
}


````
### 发布订阅模式的实现
Subscription 的作用就是先通过trySubscribe发起订阅模式，如果存在这父级订阅者，就把自己更新函数handleChangeWrapper，传递给父级订阅者，然后父级由addNestedSub 将此时的回调函数（更新函数）添加到当前的listeners中 。如果没有父级元素，则将此回调函数放在store.subscribe中，我们要确定的一点是什么情况下，不存在父级Subscription，我们这里姑且认为只有在provider父级Subscription不存在父级，那此时的handleChangeWrapper 函数中onStateChange，就是父级Subscription的notifyNestedSubs方法，而notifyNestedSubs方法会通知listens的notify方法来触发更新，之前我们说了子代会把更新自身的handleChangeWrapper传递给parentSub，来触发每一个connect组件更新
**这里我们弄明白一个问题**
**react-redux更新组件也是用了store.subscribe 而且store.subscribe只用在了父级Subscription(没有parentsub)中**

大致模型就是 **state更改 -> store.subscribe -> 触发父级Subscription的handleChangeWrapper 也就是notifyNestedSubs -> 通知listeners.notify()->通知每个被connect容器组件的更新->callback执行->触发子Subscription的handleChangeWrapper->触发子Subscription的onstatechange（可以提前透漏一下,onstatechange保存了更新组件的函数）** 

前边的内容提到了**createListenerCollection,listeners**，但是他具体有什么作用我们接下来一起看一下。

````js
function createListenerCollection() {
   /* batch 由getBatch得到的 unstable_batchedUpdates 方法 */
  const batch = getBatch()
  let first = null
  let last = null

  return {
    /* 清除当前listeners的所有listener */
    clear() {
      first = null
      last = null
    },
    /* 派发更新 */
    notify() {
      batch(() => {
        let listener = first
        while (listener) {
          listener.callback()
          listener = listener.next
        }
      })
    },
    /* 获取listeners的所有listener */
    get() {
      let listeners = []
      let listener = first
      while (listener) {
        listeners.push(listener)
        listener = listener.next
      }
      return listeners
    },
     /* 接收订阅，将当前的callback（handleChangeWrapper）存到当前的链表中  */
    subscribe(callback) {
      let isSubscribed = true

      let listener = (last = {
        callback,
        next: null,
        prev: last
      })

      if (listener.prev) {
        listener.prev.next = listener
      } else {
        first = listener
      }
      /* 取消当前 handleChangeWrapper 的订阅*/
      return function unsubscribe() {
        if (!isSubscribed || first === null) return
        isSubscribed = false

        if (listener.next) {
          listener.next.prev = listener.prev
        } else {
          last = listener.prev
        }
        if (listener.prev) {
          listener.prev.next = listener.next
        } else {
          first = listener.next
        }
      }
    }
  }
}
````
我们可以得出结论createListenerCollection 可以产生一个listeners,listeners的作用。
**1收集订阅： 已链表的形式收集对应的listeners(每一个Subscription) handleChangeWrapper。**
**2派发更新： 通过batch方法( react-dom中的unstable_batchedUpdates) 来进行批量更新。**

##总结
到这里我们明白了 
 **1 react-redux中的 provider 作用 ，通过react的context传递 subscription 和 redux中的store,并且建立了一个最顶部根Subscription。**
 **2 Subscription 的作用：起到发布订阅作用，一方面订阅connect包裹组件的更新函数，一方面通过store.subscribe统一发布更新。**
 **3 Subscription如果存在这父级的情况，会把自身的更新函数，传递给父级Subscription来统一订阅。**

那么随之带来的问题就是：

1 connect是怎么样连接我们的业务组件，然后传递我们组件更新函数的呢，更新函数本质是？
2 connect是怎么通过第一个参数，来订阅与之对应的state的呢？
3 connect怎么样将props，和redux的state合并的。
...

带着这些问题,希望能在后续的文章中和大家共同探讨～