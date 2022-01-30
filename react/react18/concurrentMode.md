# concurrent Mode


## 开启 concurrent Mode 模式

**createRoot**

````js
function createRoot(container,options){
    const root = createContainer(
        container,
        ConcurrentRoot,
        hydrate,
        hydrationCallbacks,
        isStrictMode,
        concurrentUpdatesByDefaultOverride,
    );
    return new ReactDOMRoot(root) 
}
````

**ReactDOMRoot**

````js
function ReactDOMRoot(internalRoot) {
  this._internalRoot = internalRoot;
}
/* 绑定 render 方法  */
ReactDOMRoot.prototype.render = function (children){
    const root = this._internalRoot;
     updateContainer(children, root, null, null);
} 
/* unmount 卸载 */
ReactDOMRoot.prototype.unmount = function (){
    const root = this._internalRoot;
    if (root !== null) {
        flushSync(() => {
            updateContainer(null, root, null, null);
        });
        unmarkContainerAsRoot(container);
    }
}

````

* `internalRoot` 通过 `createContainer` 创建出来的 `Root`。
* `render` 本质上调用 `updateContainer`。

**createContainer->createFiberRoot**

````js
function createFiberRoot(containerInfo,tag){
    /* 创建 fiber Root */
    const root = new FiberRootNode(containerInfo,tag)
    /* 创建 Root fiber */
    const uninitializedFiber = createHostRootFiber(tag)
    /* 初始化更新队列  */
    initializeUpdateQueue(uninitializedFiber);
}
````

**updateContainer**

````js
function updateContainer(){
    const current = container.current;
    const eventTime = requestEventTime();
    const lane = requestUpdateLane(current);
    const root = scheduleUpdateOnFiber(current, lane, eventTime);
    const update = createUpdate(eventTime, lane);
    update.payload = {element};

    enqueueUpdate(current, update, lane);
    const root = scheduleUpdateOnFiber(current, lane, eventTime);
}
````

**scheduleUpdateOnFiber** ： 正式进入调和调度流程。（ setState 从这里开始 ）


-> ensureRootIsScheduled ： 执行调度方法。


ensureRootIsScheduled -> 三种情况

* 不用 createRoot 紧急任务（ lecacy 模式 常规任务） -> scheduleLegacySyncCallback(performSyncWorkOnRoot.bind(null, root));
* 用 createRoot （ concurrent 模式 常规模式 ）-> scheduleSyncCallback(performSyncWorkOnRoot.bind(null, root));
* 用 createRoot ( concurrent 模式 transtion 模式 )  -> newCallbackNode = scheduleCallback(
      schedulerPriorityLevel,
      performConcurrentWorkOnRoot.bind(null, root),
);

**ensureRootIsScheduled**

````js
function ensureRootIsScheduled(root,currentTime){

    // 检查是否有任何优先级被其他工作所占用。如果是这样，请将它们标记为
    // 过期了，所以我们知道接下来要处理那些。
    markStarvedLanesAsExpired(root, currentTime);

     // 确定下一个任务的优先级。
    const nextLanes = getNextLanes(
        root,
        root === workInProgressRoot ? workInProgressRootRenderLanes : NoLanes,
    );

    if(newCallbackPriority === SyncLane){
          if (root.tag === LegacyRoot) {
              scheduleLegacySyncCallback(performSyncWorkOnRoot.bind(null, root));
          }else{
              scheduleSyncCallback(performSyncWorkOnRoot.bind(null, root));
          }
          /* 调度下一段任务 */
          scheduleCallback(ImmediateSchedulerPriority, flushSyncCallbacks);

    }else{
        newCallbackNode = scheduleCallback(
          schedulerPriorityLevel,
          performConcurrentWorkOnRoot.bind(null, root),
        );
    }
}
````

**performConcurrentWorkOnRoot**

````js
function performConcurrentWorkOnRoot(root,didTimeout){
    const shouldTimeSlice =
    !includesBlockingLane(root, lanes) &&
    !includesExpiredLane(root, lanes) &&
    (disableSchedulerTimeoutInWorkLoop || !didTimeout);


    /* TODO: */
    const originalCallbackNode = root.callbackNode;

    /* shouldTimeSlice 时间分片 */
    let exitStatus = shouldTimeSlice
    ? renderRootConcurrent(root, lanes)
    : renderRootSync(root, lanes);

    if(exitStatus !== RootIncomplete){
        if(exitStatus === RootErrored){
            /* 如果出现错误，尝试第二次渲染， */

        }
        if (exitStatus === RootFatalErrored) {
           /* 出现严重的错误情况*/
        }
        
        /* 需要再次 threw 错误 */
        if(renderWasConcurrent && !isRenderConsistentWithExternalStores(finishedWork) ){
            exitStatus = renderRootSync(root, lanes);
            if(exitStatus === RootErrored){

            }
            if(exitStatus === RootFatalErrored){

            }
        }
        root.finishedWork = finishedWork;
        root.finishedLanes = lanes;
        /* 完成 finish render */
        finishConcurrentRender(root, exitStatus, lanes);
    }
    /* 再次触发方法 */
    ensureRootIsScheduled(root, now());
    if (root.callbackNode === originalCallbackNode) {
       /* TODO:  */
       return performConcurrentWorkOnRoot.bind(null, root);
    }
    
}
````

**renderRootConcurrent**

````js
function renderRootConcurrent(root,lanes){
    /* 进入 workLoop */
    do {
       try{
            workLoopConcurrent();
       }catch(thrownValue){
           /* 处理错误情况 */
            handleError(root, thrownValue);
       }
    }while(true)

    if (workInProgress !== null) {
        // Still work remaining.
        if (enableSchedulingProfiler) {
           markRenderYielded();
        }
        return RootIncomplete; // 0 没有完成渲染情况 5 已经完成了 | transtion 并发场景下会走 0
   } else {
        // Completed the tree.
        if (enableSchedulingProfiler) {
            markRenderStopped();
        }

    // Set this to null to indicate there's no in-progress render.
    workInProgressRoot = null;
    workInProgressRootRenderLanes = NoLanes;

    // 返回最后的状态
    return workInProgressRootExitStatus;
  } 
}
````


 **`ensureRootIsSchedule` 通过 `getNextLanes` 获取下一个优先级的任务**
