①②③④⑤⑥⑦⑧⑨⑩⑪⑫⑬⑭⑮⑯⑰⑱⑲⑳
vue3.0 事件系统 , 声明周期钩子

/*  */

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