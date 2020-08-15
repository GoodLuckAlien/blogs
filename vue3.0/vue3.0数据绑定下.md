①②③④⑤⑥⑦⑧⑨⑩⑪⑫⑬⑭⑮⑯⑰⑱⑲⑳
# vue3.0 源码解析二 ：数据绑定原理（下)

## 回顾上文

上节我们讲了数据绑定proxy原理，vue3.0用到的基本的拦截器，以及reactive入口等等。调用reactive建立响应式，首先通过判断数据类型来确定使用的hander，然后创建proxy代理对象observed。这里的疑惑点就是hander对象具体做了什么？本文我们将已baseHandlers为着手点，继续分析响应式原理。


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

## 一 拦截器对象baseHandlers -> mutableHandlers


之前我们介绍过baseHandlers就是调用reactive方法createReactiveObject传进来的mutableHandlers对象。
我们先来看一下mutableHandlers对象

**mutableHandlers**

### 拦截器的作用域

````ts
export const mutableHandlers: ProxyHandler<object> = {
  get,
  set,
  deleteProperty,
  has,
  ownKeys
}
````
vue3.0 用到了以上几个拦截器，我们在上节已经介绍了这几个拦截器的基本用法,首先我们对几个基本用到的拦截器在做一下回顾。

①get,对数据的读取属性进行拦截，包括 target.点语法  和 target[]

②set，对数据的存入属性进行拦截 。

③deleteProperty delete操作符进行拦截。

**vue2.0**不能对对象的**delete操作符**进行属性拦截。

例子🌰： 
````js
delete object.a
````
是无法监测到的。

**vue3.0**proxy中**deleteProperty** 可以拦截 **delete 操作符**，这就表述vue3.0响应式可以监听到属性的删除操作。

④has，对 in 操作符进行属性拦截。

**vue2.0**不能对对象的**in操作符**进行属性拦截。

例子 
````js
a in object
````
has 是为了解决如上问题。这就表示了vue3.0可以对 **in 操作符** 进行拦截。

⑤ownKeys **Object.keys(proxy)** ,**for...in...循环** **Object.getOwnPropertySymbols(proxy)** ， **Object.getOwnPropertyNames(proxy)** 拦截器

例子 
````js
Object.keys(object)
````
说明vue3.0可以对以上这些方法进行拦截。

## 二 组件初始化阶段


如果我们想要弄明白整个响应式原理。那么组件初始化，到初始化过程中composition-api的reactive处理data，以及编译阶段对data属性进行依赖收集是分不开的。vue3.0提供了一套从初始化，到render过程中依赖收集，到组件更新,到组件销毁完整响应式体系，我们很难从一个角度把东西讲明白，所以在正式讲拦截器对象如何收集依赖，派发更新之前，我们看看effect做了些什么操作。


### 1 effect -> 新的渲染watcher

vue3.0用effect副作用钩子来代替vue2.0watcher。我们都知道在vue2.0中，有渲染watcher专门负责数据变化后的从新渲染视图。vue3.0改用effect来代替watcher达到同样的效果。

我们先简单介绍一下mountComponent流程，后面的文章会详细介绍mount阶段的
#### 1 mountComponent 初始化mountComponent

````js
  // 初始化组件
  const mountComponent: MountComponentFn = (
    initialVNode,
    container,
    anchor,
    parentComponent,
    parentSuspense,
    isSVG,
    optimized
  ) => {
    /* 第一步: 创建component 实例   */
    const instance: ComponentInternalInstance = (initialVNode.component = createComponentInstance(
      initialVNode,
      parentComponent,
      parentSuspense
    ))

    /* 第二步 ： TODO:初始化 初始化组件,建立proxy , 根据字符窜模版得到 */
    setupComponent(instance)
    /* 第三步：建立一个渲染effect，执行effect */
    setupRenderEffect(
      instance,     // 组件实例
      initialVNode, //vnode  
      container,    // 容器元素
      anchor,
      parentSuspense,
      isSVG,
      optimized
    )   
  }
````
上面是整个mountComponent的主要分为了三步，我们这里分别介绍一下每个步骤干了什么：
**① 第一步: 创建component 实例 。**
**② 第二步：初始化组件,建立proxy ,根据字符窜模版得到render函数。生命周期钩子函数处理等等**
**③ 第三步：建立一个渲染effect，执行effect。**

从如上方法中我们可以看到，在**setupComponent**已经构建了响应式对象，但是还没有**初始化收集依赖**。


#### 2 setupRenderEffect 构建渲染effect 

````js
 const setupRenderEffect: SetupRenderEffectFn = (
    instance,
    initialVNode,
    container,
    anchor,
    parentSuspense,
    isSVG,
    optimized
  ) => {
    /* 创建一个渲染 effect */
    instance.update = effect(function componentEffect() {
      //...省去的内容后面会讲到
    },{ scheduler: queueJob })
  }
````
**为了让大家更清楚的明白响应式原理，我这只保留了和响应式原理有关系的部分代码。**

**setupRenderEffect的作用**

**① 创建一个effect，并把它赋值给组件实例的update方法，作为渲染更新视图用。**
**② componentEffect作为回调函数形式传递给effect作为第一个参数**

#### 3 effect做了些什么

````js
export function effect<T = any>(
  fn: () => T,
  options: ReactiveEffectOptions = EMPTY_OBJ
): ReactiveEffect<T> {
  const effect = createReactiveEffect(fn, options)
  /* 如果不是懒加载 立即执行 effect函数 */
  if (!options.lazy) {
    effect()
  }
  return effect
}
````
**effect作用如下**

**① 首先调用。createReactiveEffect**
**② 如果不是懒加载 立即执行 由createReactiveEffect创建出来的ReactiveEffect函数**

#### 4 ReactiveEffect

````js
function createReactiveEffect<T = any>(
  fn: (...args: any[]) => T, /**回调函数 */
  options: ReactiveEffectOptions
): ReactiveEffect<T> {
  const effect = function reactiveEffect(...args: unknown[]): unknown {
    try {
        enableTracking()
        effectStack.push(effect) //往effect数组中里放入当前 effect
        activeEffect = effect //TODO: effect 赋值给当前的 activeEffect
        return fn(...args) //TODO:    fn 为effect传进来 componentEffect
      } finally {
        effectStack.pop() //完成依赖收集后从effect数组删掉这个 effect
        resetTracking() 
        /* 将activeEffect还原到之前的effect */
        activeEffect = effectStack[effectStack.length - 1]
    }
  } as ReactiveEffect
  /* 配置一下初始化参数 */
  effect.id = uid++
  effect._isEffect = true
  effect.active = true
  effect.raw = fn
  effect.deps = [] /* TODO:用于收集相关依赖 */
  effect.options = options
  return effect
}
````
createReactiveEffect

**createReactiveEffect**的作用主要是配置了一些初始化的参数，然后包装了之前传进来的fn，**重要的一点是把当前的effect赋值给了activeEffect,这一点非常重要，和收集依赖有着直接的关系**



在这里留下了一个疑点，

**①为什么要用effectStack数组来存放这里effect**

### 总结

我们这里个响应式初始化阶段进行总结 

**① setupComponent创建组件，调用composition-api,处理options（构建响应式）得到Observer对象。**

**② 创建一个渲染effect，里面包装了真正的渲染方法componentEffect，添加一些effect初始化属性。**

**③ 然后立即执行effect，然后将当前渲染effect赋值给activeEffect**

最后我们用一张图来解释一下整个流程。

## 三 依赖收集，get做了些什么？

### 1 回归mutableHandlers中的get方法

#### 1 不同类型的get

````js
/* 深度get */
const get = /*#__PURE__*/ createGetter()
/* 浅get */
const shallowGet = /*#__PURE__*/ createGetter(false, true)
/* 只读的get */
const readonlyGet = /*#__PURE__*/ createGetter(true)
/* 只读的浅get */
const shallowReadonlyGet = /*#__PURE__*/ createGetter(true, true)
````
上面我们可以知道，对于之前讲的四种不同的建立响应式方法，对应了四种不同的get,下面是一一对应关系。

**reactive ---------> get**

**shallowReactive --------> shallowGet**

**readonly ----------> readonlyGet**
 
**shallowReadonly --------------->   shallowReadonlyGet**

四种方法都是调用了createGetter方法，只不过是参数的配置不同，我们这里那第一个get方法做参考，接下来探索一下createGetter。

#### createGetter

````js
function createGetter(isReadonly = false, shallow = false) {
  return function get(target: object, key: string | symbol, receiver: object) {
    const res = Reflect.get(target, key, receiver)
    /* 浅逻辑 */
    if (shallow) {
      !isReadonly && track(target, TrackOpTypes.GET, key)
      return res
    }
    /* 数据绑定 */
    !isReadonly && track(target, TrackOpTypes.GET, key)
    return isObject(res)
      ? isReadonly
        ?
          /* 只读属性 */
          readonly(res)
          /*  */
        : reactive(res)
      : res
  }
}
````
这就是createGetter主要流程，**特殊的数据类型**和**ref**我们暂时先不考虑。
这里用了一些流程判断，我们用流程图来说明一下这个函数主要做了什么？




我们可以得出结论：
**在vue2.0的时候。响应式是在初始化的时候就深层次递归处理了**
但是

**与vue2.0不同的是,即便是深度响应式我们也只能在获取上一级get之后才能触发下一级的深度响应式。**
比如
````js
setup(){
 const state = reactive({ a:{ b:{} } })
 return {
     state
 }
}
````
**在初始化的时候，只有a的一层级建立了响应式，b并没有建立响应式，而当我们用state.a的时候，才会真正的将b也做响应式处理，也就是说我们访问了上一级属性后，下一代属性才会真正意义上建立响应式**

这样做好处是，
**1 初始化的时候不用递归去处理对象，造成了不必要的性能开销。**
**2 有一些没有用上的state，这里就不需要在深层次响应式处理。*

### 2 track->依赖收集器

我们先来看看track源码：

#### track做了些什么
````js

/* target 对象本身 ，key属性值  type 为 'GET' */
export function track(target: object, type: TrackOpTypes, key: unknown) {
  /* 当打印或者获取属性的时候 console.log(this.a) 是没有activeEffect的 当前返回值为0  */
  let depsMap = targetMap.get(target)
  if (!depsMap) {
    /*  target -map-> depsMap  */
    targetMap.set(target, (depsMap = new Map()))
  }
  let dep = depsMap.get(key)
  if (!dep) {
    /* key : dep dep观察者 */
    depsMap.set(key, (dep = new Set()))
  }
   /* 当前activeEffect */
  if (!dep.has(activeEffect)) {
    /* dep添加 activeEffect */
    dep.add(activeEffect)
    /* 每个 activeEffect的deps 存放当前的dep */
    activeEffect.deps.push(dep)
  }
}
````
里面主要引入了两个概念 **targetMap** 和 **depsMap**

**targetMap**
键值对 proxy  :  depsMap 
proxy ： 为reactive代理后的 Observer对象 。
depsMap ：为存放依赖dep的 map 映射。

**depsMap**
键值对：key : deps
key 为当前get访问的属性名，
deps 存放effect的set数据类型。

**我们知道track作用大致是，首先根据 proxy对象，获取存放deps的depsMap，然后通过访问的属性名key获取对应的dep,然后将当前激活的effect存入当前dep收集依赖。**

主要作用
**①找到与当前proxy 和 key对应的dep。**
**②dep与当前activeEffect建立联系，收集依赖。**

为了方便理解，**targetMap** 和 **depsMap**的关系，下面我们用一个例子来说明：
例子：
父组件A
````html

<div id="app" >
  <span>{{ state.a }}</span>
  <span>{{ state.b }}</span>
<div>
<script>
const { createApp, reactive } = Vue

/* 子组件 */
const Children ={
    template="<div> <span>{{ state.c }}</span> </div>",
    setup(){
       const state = reactive({
          c:1
       })
       return {
           state
       }
    }
}
/* 父组件 */
createApp({
   component:{
       Children
   } 
   setup(){
       const state = reactive({
           a:1,
           b:2
       })
       return {
           state
       }
   }
})mount('#app')

</script>

````

我们用一幅图表示如上关系：




### 渲染effect函数如何触发get

我们在前面说过，创建一个渲染renderEffect，然后把赋值给activeEffect，最后执行renderEffect ，在这个期间是怎么做依赖收集的呢，让我们一起来看看,update函数中做了什么，我们回到之前讲的componentEffect逻辑上来

````js
function componentEffect() {
    if (!instance.isMounted) {
        let vnodeHook: VNodeHook | null | undefined
        const { el, props } = initialVNode
        const { bm, m, a, parent } = instance
        /* TODO: 触发instance.render函数，形成树结构 */
        const subTree = (instance.subTree = renderComponentRoot(instance))
        if (bm) {
          //触发 beforeMount声明周期钩子
          invokeArrayFns(bm)
        }
        patch(
            null,
            subTree,
            container,
            anchor,
            instance,
            parentSuspense,
            isSVG
        )
        /* 触发声明周期 mounted钩子 */
        if (m) {
          queuePostRenderEffect(m, parentSuspense)
        }
        instance.isMounted = true
      } else {
        // 更新组件逻辑
        // ......
      }
}


````

**这边代码大致首先会通过renderComponentRoot方法形成树结构，这里要注意的是，我们在最初mountComponent的setupComponent方法中，已经通过编译方法compile编译了template模版的内容，state.a state.b等抽象语法树，最终返回的render函数在这个阶段会被触发，在render函数中在模版中的表达式 state.a state.b 点语法会被替换成data中真实的属性，这时候就进行了真正的依赖收集，触发了get方法。接下来就是触发生命周期 beforeMount ,然后对整个树结构重新patch,patch完毕后，调用mounted钩子**

### 依赖收集流程总结


① 首先执行renderEffect ，赋值给activeEffect ，调用renderComponentRoot方法，然后触发render函数。

② 根据render函数，解析经过compile，语法树处理过后的模版表达式，访问真实的data属性，触发get。

③ get方法首先经过之前不同的reactive，通过track方法进行依赖收集。

④ track方法通过当前proxy对象target,和访问的属性名key来找到对应的dep。

⑤ 将dep与当前的activeEffect建立起联系。将activeEffect压入dep数组中，（此时的dep中已经含有当前组件的渲染effect,这就是响应式的根本原因）如果我们触发set，就能在数组中找到对应的effect，依次执行。

最后我们用一个流程图来表达一下依赖收集的流程。

## 四 set 派发更新

接下来我们set部分逻辑。

````js

const set = /*#__PURE__*/ createSetter()
/* 浅逻辑 */
const shallowSet = /*#__PURE__*/ createSetter(true)
````
set也是分两个逻辑，set和shallowSet,两种方法都是由createSetter产生，我们这里主要以set进行剖析。

### createSetter创建set

````js
function createSetter(shallow = false) {
  return function set(
    target: object,
    key: string | symbol,
    value: unknown,
    receiver: object
  ): boolean {
    const oldValue = (target as any)[key]
    /* shallowSet逻辑 */

    const hadKey = hasOwn(target, key)
    const result = Reflect.set(target, key, value, receiver)
    /* 判断当前对象，和存在reactiveToRaw 里面是否相等 */
    if (target === toRaw(receiver)) {
      if (!hadKey) { /* 新建属性 */
        /*  TriggerOpTypes.ADD -> add */
        trigger(target, TriggerOpTypes.ADD, key, value)
      } else if (hasChanged(value, oldValue)) {
        /* 改变原有属性 */
        /*  TriggerOpTypes.SET -> set */
        trigger(target, TriggerOpTypes.SET, key, value, oldValue)
      }
    }
    return result
  }
}
````
**createSetter的流程大致是这样的**

**① 首先通过toRaw判断当前的proxy对象和建立响应式存入reactiveToRaw的proxy对象是否相等。**
**② 判断target有没有当前key,如果存在的话，改变属性，执行trigger(target, TriggerOpTypes.SET, key, value, oldValue)。**
**③ 如果当前key不存在，说明是赋值新属性，执行trigger(target, TriggerOpTypes.ADD, key, value)。**

### trigger

````js
/* 根据value值的改变，从effect和computer拿出对应的callback ，然后依次执行 */
export function trigger(
  target: object,
  type: TriggerOpTypes,
  key?: unknown,
  newValue?: unknown,
  oldValue?: unknown,
  oldTarget?: Map<unknown, unknown> | Set<unknown>
) {
  /* 获取depssMap */
  const depsMap = targetMap.get(target)
  /* 没有经过依赖收集的 ，直接返回 */
  if (!depsMap) {
    return
  }
  const effects = new Set<ReactiveEffect>()        /* effect钩子队列 */
  const computedRunners = new Set<ReactiveEffect>() /* 计算属性队列 */
  const add = (effectsToAdd: Set<ReactiveEffect> | undefined) => {
    if (effectsToAdd) {
      effectsToAdd.forEach(effect => {
        if (effect !== activeEffect || !shouldTrack) {
          if (effect.options.computed) { /* 处理computed逻辑 */
            computedRunners.add(effect)  /* 储存对应的dep */
          } else {
            effects.add(effect)  /* 储存对应的dep */
          }
        }
      })
    }
  }

  add(depsMap.get(key))

  const run = (effect: ReactiveEffect) => {
    if (effect.options.scheduler) { /* 放进 scheduler 调度*/
      effect.options.scheduler(effect)
    } else {
      effect() /* 不存在调度情况，直接执行effect */
    }
  }

  //TODO: 必须首先运行计算属性的更新，以便计算的getter
  //在任何依赖于它们的正常更新effect运行之前，都可能失效。

  computedRunners.forEach(run) /* 依次执行computedRunners 回调*/
  effects.forEach(run) /* 依次执行 effect 回调（ TODO: 里面包括渲染effect ）*/
}
````
我们这里保留了trigger的核心逻辑

**① 首先从targetMap中，根据当前proxy找到与之对应的depsMap。**
**② 根据key找到depsMap中对应的deps，然后通过add方法分离出对应的effect回调函数和computed回调函数。**
**③ 依次执行computedRunners 和 effects 队列里面的回调函数，如果发现需要调度处理,放进scheduler事件调度**

值得注意的的是：

**此时的effect队列中有我们上述负责渲染的renderEffect，还有通过effectAPI建立的effect，以及通过watch形成的effect。我们这里只考虑到渲染effect。至于后面的情况会在接下来的文章中和大家一起分享。**

我们用一幅流程图说明一下set过程。


## 五 总结

我们总结一下整个数据绑定建立响应式大致分为三个阶段

1 初始化阶段： 初始化阶段通过组件初始化方法形成对应的**proxy**对象，然后形成一个负责渲染的effect。

2 get依赖收集阶段：通过解析template，替换真实data属性，来触发get,然后通过**stack**方法，通过proxy对象和key形成对应的deps，将负责渲染的effect存入deps。（这个过程还有其他的effect，比如watchEffect存入deps中 ）。

3 set派发更新阶段：当我们 this[key] = value 改变属性的时候，首先通过**trigger**方法，通过proxy对象和key找到对应的deps，然后给deps分类分成computedRunners和effect,然后依次执行，如果需要**调度**的，直接放入调度。

还有一些问题没有解决，比如：

① 为什么要用effectStack数组来存放这里effect。
② 什么时候向deps存入其他的effect。
等等...


带着这些问题，希望我们在接下来的文章中，一起探讨。