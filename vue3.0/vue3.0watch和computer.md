①②③④⑤⑥⑦⑧⑨⑩⑪⑫⑬⑭⑮⑯⑰⑱⑲⑳
# vue3.0源码解析三 watch流程解析

## 前言介绍

之前我们分两个章节详细的介绍了vue3.0 数据相应原理，知道了用proxy代替Object.defineProperty 的利与弊，了解了依赖收集和派发更新的大致流程，知道了vue3.0响应式原理，这节我们一起研究vue3.0中的 watch 有那些变化。

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

## watch 和 watchEffect  

之前我们讲解到，vue3.0取消了渲染watch概念，取而代之的effect副作用钩子，来完成当依赖项更改而促使视图。
````js
 /* 创建一个渲染 effect */
instance.update = effect(function componentEffect() {
    //...省去的内容后面会讲到
},{ scheduler: queueJob })
````
接下来我们一起分析 **watch** 和 **watchEffect**

### watch 和 watchEffect 使用

#### watchEffect 

````ts
export function watchEffect(
  effect: WatchEffect,
  options?: BaseWatchOptions
): StopHandle {
  return doWatch(effect, null, options)
}
````
从watchEffect参数有两个，第一个是副作用函数effect，第二个是参数配置项 options ，我们接下来一一解析各参数的用法。

**①依赖项监听**

````js
import { reactive, watchEffect } from 'vue'

const state = reactive({
  count: 0
})
watchEffect(() => {
   const number = `my age is ${state.count}`
   console.log(number)
})
````
**watchEffect需要一个应用所需副作用的函数fn。它立即执行函数，并跟踪在执行过程中作为依赖项使用的所有反应状态属性。在这里state中引入的状态将在初始执行后作为此观察程序的依赖项进行跟踪。什么时候状态在将来的某个时间发生改变时，内部函数将再次执行。**

我们可以得出结论
1 首先这个watchEffect函数立即执行一次。
2 里面用到的reactive产生的state里面的count会被作为依赖项跟踪，当触发set，依赖项改变，函数再次执行，达到监听的目的。

**②清除副作用**

当我们在watchEffect 副作用函数中做一些，dom监听或者定时器延时器等操作的时候，组件卸载的时候需要及时清除这些副作用，避免带来一下滞后的影响，我们需要一个好比在react中useEffect钩子的clean清除函数的功能，同样vue3.0也提供了类似的方法。

````js
watchEffect((onInvalidate)=>{
   const handerClick = ()=>{} 
   document.addEventListener('click',handerClick)
   onInvalidate(()=>{
       /*
        执行时机:  在副作用即将重新执行时,如果在setup()或生命周期钩子函数中使用watchEffect, 则在卸载组件时执行此函数。
       */
       document.removeEventListener('click',handerClick)
    })	
})

````

**③停止监听**

vue3.0 对于2.0的watch也做了功能上的弥补，我们可以在必要的时候手动操作终止这些监听效果。

自动停止监听:当watchEffect在组件的setup()函数或生命周期钩子被调用时,侦听器会被链接到该组件的生命周期,并在组件卸载时自动停止。
	   		
手动停止监听:

````js
const watcherStop=watchEffect(()=>{})	  	            
watcherStop()

````
**③异步操作**

vue3.0 中watchEffect 并不像 react中 useEffect那样不支持异步 async await 预发糖，对异步操作完全支持。

````js
 watchEffect(async () => {})
````

对于watchEffect第二个参数，主要对watchEffect提供独立的配置项。对监听效果作出调试作用。

````js
export interface BaseWatchOptions {
  flush?: 'pre' | 'post' | 'sync'
  onTrack?: ReactiveEffectOptions['onTrack']
  onTrigger?: ReactiveEffectOptions['onTrigger']
}

````

**flush**

从源码中我们可以看出，options 配置参数有三个分别是flush，onTrack和onTrigger
**在需要同步或在组件更新之前重新运行watcher效果的情况下，可以使用flush选项传递一个附加的options对象（默认值为“post”）**

````js

watchEffect(
  () => {
  },
  {
    flush: 'sync' // 同步触发
  }
)

watchEffect(
  () => {
  },
  {
    flush: 'pre' // 在组件更新之前触发
  }
)
````
**onTrack和onTrigger**

````js
watchEffect(
  () => {
  },
  {  
    onTrigger(e) {  //当依赖项的变化触发watcher回调时，将调用onTrigger
       console.log('依赖项改变，触发set')
    },
    onTrack(e){ //
       console.log('依赖项被调用，触发get) 
    }
  }
)

````
如上我们可以得知：
**onTrack** 当依赖项的变化触发watcher回调时，将调用onTrigger
**onTrigger** 当state性属性或ref作为依赖项被调用时候，将调用onTrack。

讲完了watchEffect的基本用法，接下来我们看看watch的用法。

#### watch

watchapi完全等同于2.x this.$watch（以及相应的watch options）。监视需要监视特定的数据源，并在单独的回调函数中应用副作用。默认情况下，它也是惰性的，即只有当被监视的源发生变化时才调用回调。

与watchEffect相比，watch允许我们：

**1 懒散地执行副作用**

**2 更具体地说明什么状态应该触发观察者重新运行；**

**3 访问被监视状态的先前值和当前值。**

````js
// 监听state
const state = reactive({ count: 0 })
watch(
  () => state.count,
  (count, prevCount) => {
    /* ... */
  }
)
/* 监听一个ref */
const count = ref(0)
watch(count, (count, prevCount) => {
  /* ... */
})
````
我们可以总结出，监听对象可以是reactive产生的state对象下某属性，也可以是ref属性。

watch 可以同时监听多个。

````js
watch([fooRef, barRef], ([foo, bar], [prevFoo, prevBar]) => {
  /* ... */
})
````





###  watch 和 watchEffect 原理

知道了watch 和 watchEffect 用法之后，我们来看看watch 和 watchEffect原理，废话不说直接上源码。

**watch源码**

````ts
export function watch<T = any>(
  source: WatchSource<T> | WatchSource<T>[],  /* getter方法  */
  cb: WatchCallback<T>,                       /* hander回调函数 */
  options?: WatchOptions                      /* watchOptions */
): StopHandle { 
  return doWatch(source, cb, options)
}
````
watch接受三个参数，上面三个参数已经给大家介绍过了，分别是getter方法，回调函数，和options配置项。接下来是watchEffect

**watchEffect源码**

````ts
export function watchEffect(
  effect: WatchEffect,         /* watch effect */ 
  options?: BaseWatchOptions   /* watchOptions */
): StopHandle {
  return doWatch(effect, null, options)
}
````
无论是 watch 还是 watchEffect 最后走的逻辑都是 **doWatch**方法，那么doWatch 具体做了什么呢

### doWatch核心方法

watch流程核心代码如下
````js
function doWatch(
  source: WatchSource | WatchSource[] | WatchEffect,
  cb: WatchCallback | null,
  { immediate, deep, flush, onTrack, onTrigger }: WatchOptions = EMPTY_OBJ
): StopHandle {
  /* 此时的 instance 是当前正在初始化操作的 instance  */
  const instance = currentInstance
  let getter: () => any
  if (isArray(source)) { /*  判断source 为数组 ，此时是watch情况 */
    getter = () =>
      source.map(
        s =>
          isRef(s)
            ? s.value
            : callWithErrorHandling(s, instance, ErrorCodes.WATCH_GETTER)
      )
  /* 判断ref情况 ，此时watch api情况*/
  } else if (isRef(source)) {
    getter = () => source.value
   /* 正常watch情况，处理getter () => state.count */
  } else if (cb) { 
    getter = () =>
      callWithErrorHandling(source, instance, ErrorCodes.WATCH_GETTER)
  } else {
    /*  watchEffect 情况 */
    getter = () => {
      if (instance && instance.isUnmounted) {
        return
      }
      if (cleanup) {
        cleanup()
      }
      return callWithErrorHandling(
        source,
        instance,
        ErrorCodes.WATCH_CALLBACK,
        [onInvalidate]
      )
    }
  }
   /* 处理深度监听逻辑 */
  if (cb && deep) {
    const baseGetter = getter
    /* 将当前 */
    getter = () => traverse(baseGetter())
  }

  let cleanup: () => void
  /* 清除当前watchEffect */
  const onInvalidate: InvalidateCbRegistrator = (fn: () => void) => {
    cleanup = runner.options.onStop = () => {
      callWithErrorHandling(fn, instance, ErrorCodes.WATCH_CLEANUP)
    }
  }
  
  let oldValue = isArray(source) ? [] : INITIAL_WATCHER_VALUE

  const applyCb = cb
    ? () => {
        if (instance && instance.isUnmounted) {
          return
        }
        const newValue = runner()
        if (deep || hasChanged(newValue, oldValue)) {
          if (cleanup) {
            cleanup()
          }
          callWithAsyncErrorHandling(cb, instance, ErrorCodes.WATCH_CALLBACK, [
            newValue,
            oldValue === INITIAL_WATCHER_VALUE ? undefined : oldValue,
            onInvalidate
          ])
          oldValue = newValue
        }
      }
    : void 0
  /* TODO:  scheduler事件调度*/
  let scheduler: (job: () => any) => void
  if (flush === 'sync') { /* 同步执行 */
    scheduler = invoke
  } else if (flush === 'pre') { /* 在组件更新之前执行 */
    scheduler = job => {
      if (!instance || instance.isMounted) {
        queueJob(job)
      } else {
        job()
      }
    }
  } else {  /* 正常情况 */
    scheduler = job => queuePostRenderEffect(job, instance && instance.suspense)
  }
  const runner = effect(getter, {
    lazy: true, /* 此时 lazy 为true ,当前watchEffect不会立即执行 */
    computed: true,
    onTrack,
    onTrigger,
    scheduler: applyCb ? () => scheduler(applyCb) : scheduler
  })

  recordInstanceBoundEffect(runner)

  if (applyCb) {
    if (immediate) {
      applyCb()
    } else {
      oldValue = runner()
    }
  } else {
    runner()
  }
  /* 返回函数 ，用终止当前的watchEffect */
  return () => {
    stop(runner)
    if (instance) {
      remove(instance.effects!, runner)
    }
  }
}
````
watchApi的大致逻辑是 ： 

### 1 封装getter方法
  **首先watch会根据source不同的类型，来形成getter方法。**

  为什么要得到getter方法？ 原因很简单，**在接下来形成执行effect函数的时候，getter方法会执行，可以读取proxy处理的data属性 或者是ref属性，触发proxy对象getter拦截器，收集依赖。**

### 2 形成applyCb监听回调
此时如果是composition api中 watch调用的doWatch方法，会有cb回调函数 ，如果有cb，会在下一次getter方法执行后，形成新的newValue，然后执行回调函数，也就是**watch的监听函数**。

### 3 effect处理,得到runner

将第一步形成的getter传递给effect处理 ，此时生成runner方法 ，首先此时的runner方法经过 createReactiveEffect 创造出的一个effect函数 这里可以称作 watcheffect，effect中deps用来收集依赖 ,**watch的监听函数**通过scheduler处理传递给当前的effect，getter方法作为fn 传递给当前effect，当依赖项发生变化的时候，首先执行fn即getter方法。

### 4执行runner

接下来执行 runner 方法 ,在runner方法的执行过程中 ，会做几件重要的事 
   **一 把当前的 effect 作为activeEffect.**
   **二 执行getter方法收集依赖,此时收集的依赖会，存放到当前effect的deps中.** 
   **三 当前属性的 deps 存放当前的 effect.**

### 5依赖跟踪   

当deps中依赖项改变的时候，会出发proxy属性 set方法 ，然后会遍历属性deps ，执行判断当前effect上有没有scheduler 如果有先执行 scheduler 此事的scheduler就是经过调度处理后，watch函数本身。
