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
  /* 执行watcherEffect函数 */
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

当deps中依赖项改变的时候，会出发proxy属性 set方法 ，然后会遍历属性deps ，执行判断当前effect上有没有scheduler ，在watch处理流程中，是存在scheduler。那么会 执行响应式set逻辑中的trigger逻辑。

````js
 effect.options.scheduler(effect)
````
而此时的**scheduler**，有两种情况

````js
 applyCb ? () => scheduler(applyCb) : scheduler
````

① 当我们用composition-api 中 watchEffect 是不存在 applyCb回调函数的，此时执行 **scheduler(effect)** ，会在调度中执行当前effect，也就是watchEffect。

② 当我们用composition-api 中 watch，此时会执行 **scheduler(applyCb)** ，那么当前的 applyCb 回调函数（我们这里可以理解watch监听函数）会被传进scheduler执行，而不是当前的watchEffect本身。

### 举例分析



**拿watch为 下面我们举一个例子来解析watch整个流程**

例子🌰：
````html
<div id="app">
   <p>{{ count }}</p>
   <button @input="add" >add</button>
</div>

<script>
const { reactive, watch, toRefs } = Vue
Vue.createApp({
  setup(){
    const state = reactive({
       count:1,
    })
    const add = () => state.count++
    watch(state.count,(count, prevCount) => {
       console.log('新的count=' , count )
    })
    return {
      ...toRefs(state),
      add
    }
  }
}).mount('#app')
</script>

````
如上所示，当我们点击按钮的时候 ,触发 **state.count++** , watch监听函数applyCb就会触发，打印出新的count ，那么我们把整个流程，结合这个例子做一个图解。







## computed计算属性

之前讲的watch侧重点是对数据更新所产生的**依赖追踪**，而computer侧重点是对**数据的缓存**与**处理引用**，这就是**watch和computed本质的区别**，computed计算属性,上面我们一起分析了watch流程，接下来一起看看computed原理。


### computed使用

computed 接受一个getter函数，并为getter返回的值返回一个不可变的reactive ref对象。首先我们先一起看看computed使用

**用法一：Composition API**

````html
<div id="app">
   <p>{{ plusOne }}</p>
</div>
<script>
const { ref, computed } = Vue
Vue.createApp({
  setup() {
    const count = ref(1)
    const plusOne = computed(() => count.value + 1)
    return {
      plusOne
    }
  }
}).mount('#app')
</script>
````

**用法二：vue2.0options**

````html
<div id="app">
   <p>{{ plusOne }}</p>
</div>

<script>
Vue.createApp({
  data: () => ({
    number: 1
  }),
  computed: {
    plusOne() {
      return this.number + 1
    }  
  }
}).mount('#app')
</script>

````

### computed原理

**computer源码**

````js
export function computed<T>(
  options: WritableComputedOptions<T>
): WritableComputedRef<T>
export function computed<T>(
  getterOrOptions: ComputedGetter<T> | WritableComputedOptions<T>
) {
  let getter: ComputedGetter<T>
  let setter: ComputedSetter<T>
  if (isFunction(getterOrOptions)) {  /* 处理只有get函数的逻辑 */
    getter = getterOrOptions
    setter = () => {}
  } else { /* 还有 getter 和 setter情况 */
    getter = getterOrOptions.get
    setter = getterOrOptions.set
  }
  let dirty = true
  let value: T
  let computed: ComputedRef<T>
  const runner = effect(getter, {
    lazy: true,
    computed: true,
    scheduler: () => {
      if (!dirty) {
        dirty = true /* 派发所有引用当前计算属性的副作用函数effect */
        trigger(computed, TriggerOpTypes.SET, 'value')
      }
    }
  })
  computed = {
    _isRef: true,
    effect: runner,
    get value() { 
      if (dirty) {
        /* 运行computer函数内容 */
        value = runner()
        dirty = false
      }/* 收集引入当前computer属性的依赖 */
      track(computed, TrackOpTypes.GET, 'value')
      return value
    },
    set value(newValue: T) {
      setter(newValue)
    }
  } as any
  return computed
}
````
无论是vue3.0 特有的Composition API，还是 vue2.0的options形式，最后走的逻辑都是computed，**Composition AP和options初始化流程会在接下来的章节中讲到。**

### 总结
三大阶段：
**①形成computedEffect: 首先根据当前参数类型判断当前计算属性，是单纯getter,还是可以修改属性的 setter 和 getter，将getter作为callback传入effect函数形成一个effect，我们这里姑且称之为computedEffect，computedEffec的调度函数中，是对当前computed里面引用的reactive或者ref变化，而追溯到引入自身计算属性的依赖追踪，然后形成并返回一个computed对象**
**②依赖收集：当我们引用computed属性的时候，会调用track方法进行依赖收集，会执行和响应式一样的流程，这里重要的是，当在收集本身computed对象依赖的同时，会调用runner()方法，runner()执行了getter方法，此时又收集了当前computed引用的reactive或者ref的依赖项，也就是说，为什么当computed中依赖项更新时候，当前的getter函数会执行，形成新的value** 
**③派发更新：当reactive或者ref的依赖项更新的时候会触发set然后会触发runner函数的执行，runner函数执行会重新计算出新的value,runner函数执行会执行scheduler函数，scheduler里面会执行当前computed计算属性的依赖项，追踪到所有引用当前computer的依赖项,更新新的value**

例子🌰：
````html
<div id="app">
   <p>{{ plusOne }}</p>
   <button @input="add" >add</button>
</div>

<script>
Vue.createApp({
  data: () => ({
    number: 1
  }),
  computed: {
    plusOne() {
      return this.number + 1
    }  
  },
  methods: {
    add(){
      this.number++
    }
  }
}).mount('#app')
</script>

````

结合computer流程，以及上述例子形成的流程图如下

当上述列子中，点击add按钮方法的时候，会触发 number依赖项的set方法，然后会调用当前 plusOne产生**computedEffect(在源码中runner函数)**，然后会执行plusOne本身，产生新的value，然后回调用**trigger** ，依次执行派发computed产生依赖更新 -> 替换 <p>{{ plusOne }}</p>中的plusOne。


## 声明

在讲watch流程和computer过程中，会多次引入scheduler感念，对于vue3.0事件调度，我们会在接下来事件的章节一起和大家分享。