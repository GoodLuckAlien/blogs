react 入口

一个root React 入口应该写成这样的

## 从render到rootfiber

**render**
````jsx
ReactDOM.render(
    <App  />,                         /* element */
    document.getElementById('app'),   /* container */
    ()=>{                             /* callback */
        console.log('我是callback')    
    }
)
````

render三个参数 element container callback

````js
export function render(
  element: React$Element<any>,  /* <App>  */
  container: Container,         /* document.getElementById('app') */
  callback: ?Function,          /* callback */
) {
  
  return legacyRenderSubtreeIntoContainer(
    null,
    element,
    container,
    false,
    callback,
  );
}
````

**legacyRenderSubtreeIntoContainer**  创建渲染树结构，添加给container _reactRootContainer属性

````js
function legacyRenderSubtreeIntoContainer(
  parentComponent: ?React$Component<any, any>,
  children: ReactNodeList,
  container: Container,
  forceHydrate: boolean,
  callback: ?Function,
) {
  let root: RootType = (container._reactRootContainer: any);
  let fiberRoot;
  if (!root) { /* 初始化mount流程 */
    root = container._reactRootContainer = legacyCreateRootFromDOMContainer(
      container,
      forceHydrate,
    );
    fiberRoot = root._internalRoot;
    if (typeof callback === 'function') {
      const originalCallback = callback;
      callback = function() {
        const instance = getPublicRootInstance(fiberRoot);
        originalCallback.call(instance);
      };
    }
    /* 初始化mount应该被batchupdate */
    unbatchedUpdates(() => {
      updateContainer(children, fiberRoot, parentComponent, callback);
    });
  } else { /** 更新流程 */
    fiberRoot = root._internalRoot;
    if (typeof callback === 'function') {
      const originalCallback = callback;
      callback = function() {
        const instance = getPublicRootInstance(fiberRoot);
        originalCallback.call(instance);
      };
    }
    updateContainer(children, fiberRoot, parentComponent, callback);
  }
  return getPublicRootInstance(fiberRoot);
}

````
### 创建fiberRoot

**legacyCreateRootFromDOMContainer**
参数
contanir

````js
/* containr元素节点 ，forceHydrate 当正常的h5,不是native的时候forceHydrate -> false */
function legacyCreateRootFromDOMContainer(
  container: Container,
  forceHydrate: boolean,
): RootType {
  /* ... */
  return createLegacyRoot(
    container,
    shouldHydrate
      ? {
          hydrate: true,
        }
      : undefined,
  );
}
````

**createLegacyRoot** 的逻辑是创建一个实例化ReactDOMBlockingRoot

**tag = LegacyRoot = 0**

如下
````js
 this._internalRoot = createRootImpl(container, tag, options);
````

**createRootImpl主要逻辑**
````js
 const root = createContainer(container, tag, hydrate, hydrationCallbacks);

````

**我们简化上面的流程**

````js
root = new ReactDOMBlockingRoot()
root._internalRoot = createContainer(container, tag, hydrate, hydrationCallbacks);
fiberRoot = root._internalRoot 
````

**createContainer创建fiberRoot**

**createContainer**

````js
  return createFiberRoot(containerInfo, tag, hydrate, hydrationCallbacks);
````

#### 
**createFiberRoot**

````js
/* 创建fiberRoot */
export function createFiberRoot(
  containerInfo: any,
  tag: RootTag,
  hydrate: boolean,
  hydrationCallbacks: null | SuspenseHydrationCallbacks,
): FiberRoot {
  /* 创建一个root */
  const root: FiberRoot = (new FiberRootNode(containerInfo, tag, hydrate): any);
  if (enableSuspenseCallback) {
    root.hydrationCallbacks = hydrationCallbacks;
  }
  const uninitializedFiber = createHostRootFiber(tag);
  root.current = uninitializedFiber;
  uninitializedFiber.stateNode = root;

  initializeUpdateQueue(uninitializedFiber);
  return root;
}

````

#### fiberRoot 变量概念

````js
function FiberRootNode(containerInfo, tag, hydrate) {
  this.tag = tag; // root根节点为0
  this.current = null;
  this.containerInfo = containerInfo; // container
  this.pendingChildren = null;
  this.pingCache = null;
  this.finishedExpirationTime = NoWork;
  this.finishedWork = null;
  this.timeoutHandle = noTimeout;
  this.context = null;
  this.pendingContext = null;
  this.hydrate = hydrate;
  this.callbackNode = null;
  this.callbackPriority = NoPriority;
  this.firstPendingTime = NoWork;
  this.lastPendingTime = NoWork;
  this.firstSuspendedTime = NoWork;
  this.lastSuspendedTime = NoWork;
  this.nextKnownPendingLevel = NoWork;
  this.lastPingedTime = NoWork;
  this.lastExpiredTime = NoWork;
  this.mutableSourceFirstPendingUpdateTime = NoWork;
  this.mutableSourceLastPendingUpdateTime = NoWork;

  if (enableSchedulerTracing) {
    this.interactionThreadID = unstable_getThreadID();
    this.memoizedInteractions = new Set();
    this.pendingInteractionMap = new Map();
  }
  if (enableSuspenseCallback) {
    this.hydrationCallbacks = null;
  }
}
````

#### fiberRoot.current

**createHostRootFiber(tag)**

````js
/* 
在初始化的时候 tag === LegacyRoot  mode =  NoMode = 0b0000 
HostRoot = 3
 */
return createFiber(HostRoot, null, null, mode);
````

**createFiber**
````js
return new FiberNode(tag, pendingProps, key, mode);
````
以上可以简化为

````js
root.current = new FiberNode(tag =HostRoot = 3, null, null, mode)

````
#### fiberNode 变量概念

````js
  function FiberNode(
  tag: WorkTag,
  pendingProps: mixed,
  key: null | string,
  mode: TypeOfMode,
) {
  // Instance
  this.tag = tag;  //tag === LegacyRoot
  this.key = key;
  this.elementType = null;
  this.type = null;
  this.stateNode = null; // fiberRoot
  // Fiber 
  this.return = null;
  this.child = null;
  this.sibling = null;
  this.index = 0;
  this.ref = null;
  this.pendingProps = pendingProps;
  this.memoizedProps = null;
  this.updateQueue = null;
  this.memoizedState = null;
  this.dependencies = null;
  this.mode = mode; // 根节点 mode =  NoMode = 0b0000 
  // Effects
  this.effectTag = NoEffect;
  this.nextEffect = null;
  this.firstEffect = null;
  this.lastEffect = null;

  this.expirationTime = NoWork;
  this.childExpirationTime = NoWork;

  this.alternate = null;


}
````
**概念 fiberRoot和fiberNode**

#### initializeUpdateQueue初始化updatequeue

````ts
function initializeUpdateQueue<State>(fiber: Fiber): void {
  const queue: UpdateQueue<State> = {
    baseState: fiber.memoizedState,
    firstBaseUpdate: null,
    lastBaseUpdate: null,
    shared: {
      pending: null,
    },
    effects: null,
  };
  fiber.updateQueue = queue;
}
````
讲上述fiberNode 的 updateQueue添加一些初始化属性。

### updateContainer更新容器

**unbatchedUpdates(()=>{})暂且不考虑**

**updateContainer**

children, fiberRoot, parentComponent, callback

````js
function updateContainer(
  element: ReactNodeList,  // 初始化 elmenet-> <App>
  container: OpaqueRoot, //初始化 container -> fiberRoot
  parentComponent: ?React$Component<any, any>,
  callback: ?Function,
): ExpirationTime {
 
  /* current 就是 fiberNode */
  const current = container.current;
  const currentTime = requestCurrentTimeForUpdate();
  /* 计算expirationTime */
  const suspenseConfig = requestCurrentSuspenseConfig();
  const expirationTime = computeExpirationForFiber(
    currentTime,
    current,
    suspenseConfig,
  );
  /* 第一个parentComponent不存在 ，context为空对象 */
  const context = getContextForSubtree(parentComponent);
  if (container.context === null) {
    container.context = context;
  } else {
    container.pendingContext = context;
  }

  const update = createUpdate(expirationTime, suspenseConfig);
  update.payload = {element};

  callback = callback === undefined ? null : callback;
  if (callback !== null) {
    update.callback = callback;
  }

  enqueueUpdate(current, update);
  scheduleUpdateOnFiber(current, expirationTime);

  return expirationTime;
}
````


#### 第一步：requestCurrentTimeForUpdate 计算currentTime

**requestCurrentTimeForUpdate**
````js
let currentEventTime: ExpirationTime = NoWork;
function 第一步：requestCurrentTimeForUpdate (){
    currentEventTime = msToExpirationTime(now());
    return currentEventTime;
}
````
**msToExpirationTime**

````js
//1个到期时间单位表示10毫秒。
// ms时间转化成ExpirationTime
export function msToExpirationTime(ms: number): ExpirationTime {
  //1个过期时间单位表示10毫秒//总是从偏移量中减去，这样我们就不会与NoWork的神奇数字冲突
  return MAGIC_NUMBER_OFFSET - ((ms / UNIT_SIZE) | 0);
}
// ExpirationTime转成ms时间
export function expirationTimeToMs(expirationTime: ExpirationTime): number {
  return (MAGIC_NUMBER_OFFSET - expirationTime) * UNIT_SIZE;
}
````
currentTime是经过转化处理后的

#### 第二步：计算 expirationTime 

````js
  /* 计算expirationTime */
  const suspenseConfig = requestCurrentSuspenseConfig();
  const expirationTime = computeExpirationForFiber(
    currentTime,
    current,
    suspenseConfig,
  );

````

**computeExpirationForFiber**

根据不同的 priorityLevel 用不同的方法计算expirationTime,初始化走的
computeAsyncExpiration 创建出一个较低优先级的expirationTime

#### 第三步 getContextForSubtree 创建context

````js
function getContextForSubtree(
  parentComponent: ?React$Component<any, any>,
): Object {
    /* parentComponent 不存在，返回空对象 */
  if (!parentComponent) {
    return emptyContextObject;
  }
  const fiber = getInstance(parentComponent);
  const parentContext = findCurrentUnmaskedContext(fiber);
  if (fiber.tag === ClassComponent) {
    const Component = fiber.type;
    if (isLegacyContextProvider(Component)) {
      return processChildContext(fiber, Component, parentContext);
    }
  }
  return parentContext;
}
````
#### 第四步 创建一个update 

````js
 // 创建一个update
 const update = createUpdate(expirationTime, suspenseConfig);
 update.payload = {element};
````
创建createUpdate

````ts
export function createUpdate(
  expirationTime: ExpirationTime,
  suspenseConfig: null | SuspenseConfig,
): Update<*> {
  const update: Update<*> = {
    expirationTime,
    suspenseConfig,

    tag: UpdateState, //0
    payload: null,
    callback: null,

    next: null,
  };
  if (__DEV__) {
    update.priority = getCurrentPriorityLevel();
  }
  return update;
}
````
update的 payload属性，配上 element <App>

#### 第五步 enqueueUpdate

````js
export function enqueueUpdate<State>(fiber: Fiber, update: Update<State>) {
  const updateQueue = fiber.updateQueue;
  if (updateQueue === null) {
    return;
  }
  /* 将update 赋值给 sharedQueue.pendding 和 update.next */
  const sharedQueue = updateQueue.shared;
  const pending = sharedQueue.pending;
  if (pending === null) {
    /* 当第一次的时候,shared.pending === null  */
    update.next = update;
  } else {
    update.next = pending.next;
    pending.next = update;
  }
  sharedQueue.pending = update;
}
````

新概念 **update**       通过createUpdate产生更新。 
      **updateQueue**  fiberNode 中属性记录update队列信息。 

把上一步骤产生的update赋值给sharedQueue.pendding 和 update.next。

#### 第六步 scheduleUpdateOnFiber 进入workloop工作循环中



### scheduleUpdateOnFiber

````js
export function scheduleUpdateOnFiber(
  fiber: Fiber,
  expirationTime: ExpirationTime,
) {
  checkForNestedUpdates();
  warnAboutRenderPhaseUpdatesInDEV(fiber);
  // root = rootFiber
  const root = markUpdateTimeFromFiberToRoot(fiber, expirationTime);
  if (root === null) {
    warnAboutUpdateOnUnmountedFiberInDEV(fiber);
    return;
  }

  const priorityLevel = getCurrentPriorityLevel();
  /* 第一次 expirationTime !== sync */
  if (expirationTime === Sync) {
    if (
      
      (executionContext & LegacyUnbatchedContext) !== NoContext &&
      (executionContext & (RenderContext | CommitContext)) === NoContext
    ) {
     
      schedulePendingInteractions(root, expirationTime);

      performSyncWorkOnRoot(root);
    } else {
      ensureRootIsScheduled(root);
      schedulePendingInteractions(root, expirationTime);
      if (executionContext === NoContext) {
        flushSyncCallbackQueue();
      }
    }
  } else {
    ensureRootIsScheduled(root);
    schedulePendingInteractions(root, expirationTime);
  }

  if (
    (executionContext & DiscreteEventContext) !== NoContext &&
    // Only updates at user-blocking priority or greater are considered
    // discrete, even inside a discrete event.
    (priorityLevel === UserBlockingPriority ||
      priorityLevel === ImmediatePriority)
  ) {
    // This is the result of a discrete event. Track the lowest priority
    // discrete update per root so we can flush them early, if needed.
    if (rootsWithPendingDiscreteUpdates === null) {
      rootsWithPendingDiscreteUpdates = new Map([[root, expirationTime]]);
    } else {
      const lastDiscreteTime = rootsWithPendingDiscreteUpdates.get(root);
      if (lastDiscreteTime === undefined || lastDiscreteTime > expirationTime) {
        rootsWithPendingDiscreteUpdates.set(root, expirationTime);
      }
    }
  }
}
````

#### 第一步 标记updatetime
第一步通过 markUpdateTimeFromFiberToRoot 标记更新时间,返回fiberRoot

**markUpdateTimeFromFiberToRoot**

markUpdateTimeFromFiberToRoot第一次执行的代码逻辑
````js
function markUpdateTimeFromFiberToRoot(){
  let node = fiber.return;
  let root = null;
 /* 初始化的时候 root == stateNode = fiberRoot */
  if (node === null && fiber.tag === HostRoot) {
    root = fiber.stateNode;
  } else {
     /* ..... */
  }
  if (root !== null) {
    /* 第一次不相等 */
    if (workInProgressRoot === root) {
       /* ..... */  
    }
    // Mark that the root has a pending update.
    /* 初始化执行逻辑  root === fiberRoot */
    /*  */
    markRootUpdatedAtTime(root, expirationTime);
  }
  return root
}
 
````
markRootUpdatedAtTime 第一次执行逻辑

````js
function markRootUpdatedAtTime(){
  /* 第一次逻辑是 将  firstPendingTime = lastPendingTime = expirationTime */
  const firstPendingTime = root.firstPendingTime;
  if (expirationTime > firstPendingTime) {
    root.firstPendingTime = expirationTime;
  }
  const lastPendingTime = root.lastPendingTime;
  if (lastPendingTime === NoWork || expirationTime < lastPendingTime) {
    root.lastPendingTime = expirationTime;
  }
}
````
第一次逻辑是 将 expirationTime赋值给 firstPendingTime 和 lastPendingTime  

#### 第二步 ensureRootIsScheduled

ensureRootIsScheduled 第一次执行逻辑

````js
function ensureRootIsScheduled(root){
   const lastExpiredTime = root.lastExpiredTime;
  if (lastExpiredTime !== NoWork) {
    root.callbackExpirationTime = Sync;
    root.callbackPriority = ImmediatePriority;
    root.callbackNode = scheduleSyncCallback(
      performSyncWorkOnRoot.bind(null, root),
    );
    return;
  }
}
````
callbackExpirationTime = Sync
callbackPriority = ImmediatePriority

主要执行 **performSyncWorkOnRoot** 代码

#### 第三步 performSyncWorkOnRoot

主要逻辑：
````js
function performSyncWorkOnRoot(){
   const lastExpiredTime = root.lastExpiredTime;

  let expirationTime;
  if (lastExpiredTime !== NoWork) {
    if (
      root === workInProgressRoot &&
      renderExpirationTime >= lastExpiredTime
    ) {
      expirationTime = renderExpirationTime;
    } else {
      // Start a fresh tree. 第一次执行逻辑
      expirationTime = lastExpiredTime;
    }
  } else {
    // There's no expired work. This must be a new, synchronous render.
    expirationTime = Sync;
  }

  let exitStatus = renderRootSync(root, expirationTime);
}
````
expirationTime = lastExpiredTime

#### 第四步 renderRootSync

````js
function renderRootSync(root, expirationTime) {
  const prevExecutionContext = executionContext;
  executionContext |= RenderContext;
  const prevDispatcher = pushDispatcher(root);
  /* 如果当前root 不是 workInProgressRoot */
  if (root !== workInProgressRoot || expirationTime !== renderExpirationTime) {
    /* 把当前的root 赋值给 workInProgressRoot */
    prepareFreshStack(root, expirationTime);
    startWorkOnPendingInteractions(root, expirationTime);
  }

  const prevInteractions = pushInteractions(root);
  do {
    try {
      workLoopSync();
      break;
    } catch (thrownValue) {
      handleError(root, thrownValue);
    }
  } while (true);
  resetContextDependencies();
  if (enableSchedulerTracing) {
    popInteractions(((prevInteractions: any): Set<Interaction>));
  }

  executionContext = prevExecutionContext;
  popDispatcher(prevDispatcher);

  

  // Set this to null to indicate there's no in-progress render.
  workInProgressRoot = null;

  return workInProgressRootExitStatus;
}
````
workLoopSync 

````js
while (workInProgress !== null) {
    workInProgress = performUnitOfWork(workInProgress);
}
````
workLoopSync 循环执行 performUnitOfWork 方法

#### 第五步 performUnitOfWork

performUnitOfWork 核心逻辑

````js
next = beginWork(current, unitOfWork, renderExpirationTime);
````
在开发环境下 **beginWork = originalBeginWork**
