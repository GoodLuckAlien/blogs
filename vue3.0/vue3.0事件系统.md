①②③④⑤⑥⑦⑧⑨⑩⑪⑫⑬⑭⑮⑯⑰⑱⑲⑳
vue3.0 事件系统 , 声明周期钩子

## 理解声明周期

初始化声明周期

createHook( 不同的生命周期类型 ) 闭包函数 返回 
func()

/* 初始化 */
````ts
enum LifecycleHooks {
  BEFORE_CREATE = 'bc',  -> setup
  CREATED = 'c',         -> setup
  BEFORE_MOUNT = 'bm',    ✅
  MOUNTED = 'm',          ✅
  BEFORE_UPDATE = 'bu',   ✅
  UPDATED = 'u',          ✅
  BEFORE_UNMOUNT = 'bum', ✅
  UNMOUNTED = 'um',       ✅
  DEACTIVATED = 'da',
  ACTIVATED = 'a',
  RENDER_TRIGGERED = 'rtg',
  RENDER_TRACKED = 'rtc',
  ERROR_CAPTURED = 'ec'
}
````
func() 在组件初始化时候执行 -> injectHook(
    生命周期类型
    hook 生命周期函数（ 组件中的生命周期 ）
)

保存target组件实例 创建包装以后的 hooks wrappedHook

把当前的 wrappedHook 加入到 hooks数组当中。


/* 生命周期执行 ， 调度过程 */

在对应的render的阶段 ， 会出发不同的生命周期

vue3.0 取消生命周期 beforeCreated created 

新增 setup 用于初始化配置 

①beforeMounted 执行在  mountComponent  -> setupRenderEffect 中

执行的方式：不存在调度 ，数组依次执行

②mounted 执行在 patch subTree 之后 
patch 是一个循环过程 ， 一次 patch 树结构

执行方式： queuePostRenderEffect  执行调度

①② 我们可以知道 -> vue3.0 mounted执行顺序,也是由子到父 

子代 mounted -> 父代 mounted

③beforeUpdate,当组件实例已经被 isMounted之后 ，执行setupRenderEffect

执行方式 —> 不存在调度 数组方式一次执行


④update 当 从新patch之后 会执行之后，回调用  update方法

执行方式 queuePostRenderEffect  执行调度

**思考？？？**
**为什么 ③④要放在queuePostRenderEffect执行，而不是用数组执行方式一次执行** 


 
首先分析 queuePostRenderEffec 判断是否是Suspense ->
queuePostFlushCb
-> postFlushCbs.push(...cb)
-> queueFlush()
-> nextTick ( flushJop )
-> flushJop()
-> flushPostFlushCbs()
-> 依次顺序执行生命周期函数

**遗留问题？？？**

**为什么 在执行flushJop过程中会依次执行queue ，queue里保存了哪些信息**


// queuePostFlushCb 
// queueJob
//flushPostFlushCbs

## scheduler事件调度

必须理解两个常量的感念 **queue** 和 **postFlushCbs**

queue我们这里可以理解为更新队列，里面存在父子组件的更新effect，触发在组件更新之前，比如说是组件update函数。

postFlushCbs 我们可以理解为，一个数据更新带来的回调函数，比如watch回调函数本身等等，

必要要理解的连个变量

````js
let isFlushing = false      /* 是否正在刷新  */
let isFlushPending = false  /* 是否等待刷新 */
````

### queueJob

````js
export function queueJob(job: Job) {
  if (!queue.includes(job)) {
    queue.push(job)  /* 把当前job放入队列 */ 
    queueFlush()     /* 刷新队列 */
  }
}
````
这个函数的作用大致就是，首先判断队列中包含不包含，当前job这里可以当作为组件update,如果不包含则把当前update放入队列中。然后刷新队列。

#### 由queueJob引发的批量更新的思考

vue3.0 虽然没有react中batchupdate批量更新的概念，queueJob缺能起着批量更新的效果，原因就是因为着一行代码。想想真是绝了。

````js
!queue.includes(job)
````

写个demo详细说一下吧


### queueFlush刷新队列

````js
/* 如果没有正在刷新，也没有出于刷新等待 */
function queueFlush() {
  if (!isFlushing && !isFlushPending) {
    isFlushPending = true /* 设置等待刷新状态 */
    nextTick(flushJobs)   /* nextTick方法处理 flushJobs */
  }
}
````
这个函数大致意思是：如果没有正在刷新，也没有出于刷新等待，设置等待刷新状态 ，nextTick方法处理 flushJobs。

### nextTick

````js
const p = Promise.resolve()
export function nextTick(fn?: () => void): Promise<void> {
  return fn ? p.then(fn) : p
}
````
vue中nextTick的关键是内部用了Promise.resolve方法，不熟悉Promise.resolve的同学，建议可以先看看Promise api相关用法。

### 调度核心函数flushJobs ，执行更新队列quene

````js
/* 执行flushJobs */
function flushJobs(seen?: CountMap) {
  isFlushPending = false
  isFlushing = true
  let job
  //1。组件从父级更新到子级。（因为父母总是
  //在子对象之前创建，因此其渲染效果将更小编号优先）

  //2。如果在父组件更新期间卸载了组件，
  //它的更新可以跳过。
  //在刷新开始之前，作业永远不能为null，因为它们只会失效
  //在执行另一个刷新作业时。
  /* 根据queue的Id进行排序 */
  queue.sort((a, b) => getId(a!) - getId(b!))
  /* 依次执行 queue里面的回调函数 */
  while ((job = queue.shift()) !== undefined) {
    if (job === null) {
      continue
    }
    callWithErrorHandling(job, null, ErrorCodes.SCHEDULER)
  }
  /* 依次执行postFlushCbs */
  flushPostFlushCbs(seen)
  isFlushing = false
  /* 如果在执行flushPostFlushCbs，衍生出新的quene或者是postFlushCbs，那么继续刷新作业*/
  if (queue.length || postFlushCbs.length) {
    flushJobs(seen)
  }
}
````

### flushPostFlushCbs 执行每个更新回调任务

````js
export function flushPostFlushCbs(seen?: CountMap) {
  if (postFlushCbs.length) {
    const cbs = [...new Set(postFlushCbs)]
    postFlushCbs.length = 0
    for (let i = 0; i < cbs.length; i++) {
      cbs[i]()
    }
  }
}
````

## 分析事件调度流程


