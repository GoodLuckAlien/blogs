## 更新组件流程
第一次 hostRoot之后 ，返回一个含有`ReactDom.render(element )` ` element fiber` 经过第二次 `beginWork` 此时的 `beginWork` `fiber` 是 `react.creatElement `的 `App`


## updateClassComponent

````js
function updateClassComponent(){
      const instance = workInProgress.stateNode;
  let shouldUpdate;
  if (instance === null) {
    if (current !== null) {
      // A class component without an instance only mounts if it suspended
      // inside a non-concurrent tree, in an inconsistent state. We want to
      // treat it like a new mount, even though an empty version of it already
      // committed. Disconnect the alternate pointers.
      current.alternate = null;
      workInProgress.alternate = null;
      // Since this is conceptually a new fiber, schedule a Placement effect
      workInProgress.effectTag |= Placement;
    }
    // 第一次逻辑 ， 执行 constructClassInstance 初始化实例
    constructClassInstance(workInProgress, Component, nextProps);
    mountClassInstance(
      workInProgress,
      Component,
      nextProps,
      renderExpirationTime,
    );
    shouldUpdate = true;
  } else if (current === null) {
    // In a resume, we'll already have an instance we can reuse.
    shouldUpdate = resumeMountClassInstance(
      workInProgress,
      Component,
      nextProps,
      renderExpirationTime,
    );
  } else {
    shouldUpdate = updateClassInstance(
      current,
      workInProgress,
      Component,
      nextProps,
      renderExpirationTime,
    );
  }
  const nextUnitOfWork = finishClassComponent(
    current,
    workInProgress,
    Component,
    shouldUpdate,
    hasContext,
    renderExpirationTime,
  );
  if (__DEV__) {
    const inst = workInProgress.stateNode;
    if (inst.props !== nextProps) {
      if (!didWarnAboutReassigningProps) {
        console.error(
          'It looks like %s is reassigning its own `this.props` while rendering. ' +
            'This is not supported and can lead to confusing bugs.',
          getComponentName(workInProgress.type) || 'a component',
        );
      }
      didWarnAboutReassigningProps = true;
    }
  }
  return nextUnitOfWork;
}
````

## constructClassInstance( workInProgress, Component, nextProps  )

workInProgress 当前 work 的fiber对象  `Component` class组件实例 , `nextProps` 初始化`props`


**constructClassInstance**

````js
function constructClassInstance(workInProgress,ctor,props){
    /* 实例化组件 */
  const instance = new ctor(props, context);
  const state = (workInProgress.memoizedState =
    instance.state !== null && instance.state !== undefined
      ? instance.state
      : null);
  adoptClassInstance(workInProgress, instance);
}

````

实例化 `instance` 

**adoptClassInstance** 

````js
function adoptClassInstance(workInProgress: Fiber, instance: any): void {
  instance.updater = classComponentUpdater;
  workInProgress.stateNode = instance;
  setInstance(instance, workInProgress);
}
````



**classComponentUpdater**

````js
const classComponentUpdater = {
  isMounted,
  // setState调用方法
  enqueueSetState(inst, payload, callback) {
    const fiber = getInstance(inst);
    const currentTime = requestCurrentTimeForUpdate();
    const suspenseConfig = requestCurrentSuspenseConfig();
    const expirationTime = computeExpirationForFiber(
      currentTime,
      fiber,
      suspenseConfig,
    );

    const update = createUpdate(expirationTime, suspenseConfig);
    update.payload = payload;
    if (callback !== undefined && callback !== null) {
      update.callback = callback;
    }

    enqueueUpdate(fiber, update);
    scheduleUpdateOnFiber(fiber, expirationTime);
  },
  enqueueReplaceState(inst, payload, callback) {
    const fiber = getInstance(inst);
    const currentTime = requestCurrentTimeForUpdate();
    const suspenseConfig = requestCurrentSuspenseConfig();
    const expirationTime = computeExpirationForFiber(
      currentTime,
      fiber,
      suspenseConfig,
    );

    const update = createUpdate(expirationTime, suspenseConfig);
    update.tag = ReplaceState;
    update.payload = payload;

    if (callback !== undefined && callback !== null) {
      if (__DEV__) {
        warnOnInvalidCallback(callback, 'replaceState');
      }
      update.callback = callback;
    }

    enqueueUpdate(fiber, update);
    scheduleUpdateOnFiber(fiber, expirationTime);
  },
  enqueueForceUpdate(inst, callback) {
    const fiber = getInstance(inst);
    const currentTime = requestCurrentTimeForUpdate();
    const suspenseConfig = requestCurrentSuspenseConfig();
    const expirationTime = computeExpirationForFiber(
      currentTime,
      fiber,
      suspenseConfig,
    );

    const update = createUpdate(expirationTime, suspenseConfig);
    update.tag = ForceUpdate;

    if (callback !== undefined && callback !== null) {
      if (__DEV__) {
        warnOnInvalidCallback(callback, 'forceUpdate');
      }
      update.callback = callback;
    }

    enqueueUpdate(fiber, update);
    scheduleUpdateOnFiber(fiber, expirationTime);
  },
};
````
class 组件中的 `setState` 方法.实际调用的就是 `enqueueSetState`方法。

### setState

````js
Component.prototype.setState = function(partialState, callback) {
  this.updater.enqueueSetState(this, partialState, callback, 'setState');
};
````


`construct` 执行

## mountClassInstance ,mountClassInstance

**mountClassInstance**

````js
mountClassInstance(
    workInProgress,
    Component,
    nextProps,
    renderExpirationTime,
);
shouldUpdate = true;
````
**mountClassInstance**


````js
  const instance = workInProgress.stateNode;
  instance.props = newProps;
  instance.state = workInProgress.memoizedState;
  instance.refs = emptyRefsObject;
   
   /* 加入 Update 对象*/ 
  initializeUpdateQueue(workInProgress);

  processUpdateQueue(workInProgress, newProps, instance, renderExpirationTime);
  instance.state = workInProgress.memoizedState;


   callComponentWillMount(workInProgress, instance);
    // If we had additional state updates during this life-cycle, let's
    // process them now.
    processUpdateQueue(
      workInProgress,
      newProps,
      instance,
      renderExpirationTime,
    );
    instance.state = workInProgress.memoizedState;

````


### initializeUpdateQueue 
````js
/* 上述fiberNode的updateQueue添加一些初始化属性。 */
export function initializeUpdateQueue<State>(fiber: Fiber): void {
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

### callComponentWillMount

执行声明周期 `callComponentWillMount`

**callComponentWillMount**

````js
function callComponentWillMount(workInProgress, instance) {
  const oldState = instance.state;
  /* 执行声明周期 */ 
  if (typeof instance.componentWillMount === 'function') {
    instance.componentWillMount();
  }
  if (typeof instance.UNSAFE_componentWillMount === 'function') {
    instance.UNSAFE_componentWillMount();
  }

  if (oldState !== instance.state) {
    /* 发现 state 被替换 ， 重新更新 队列  reReplace */
    classComponentUpdater.enqueueReplaceState(instance, instance.state, null);
  }
}

````



在`mountclass`阶段主要做的事

 1 初始化 initializeUpdateQueue 


 `processUpdateQueue`  调和 `updateQueue` ，合并 `updateQueue` 的  `state` ,设置不同的 `expirationTime` 过期时间。


### 回到 updateClassComponent 方法


````js
let shouldUpdate;
mountClassInstance(
    workInProgress,
    Component,
    nextProps,
    renderExpirationTime,
);
shouldUpdate = true
const nextUnitOfWork = finishClassComponent(
    current,  // curent  组件实例
    workInProgress,  // 当前 work fiber
    Component,   // compoent 组件
    shouldUpdate, // true
    hasContext,
    renderExpirationTime, // 渲染到期时间
);
````

## finishClassComponent 完成组件挂载


````js
function finishClassComponent(){

    markRef(current, workInProgress);
    const instance = workInProgress.stateNode;
    let nextChildren;
    nextChildren = instance.render();
    if (current !== null && didCaptureError) {

    forceUnmountCurrentAndReconcile(
        current,
        workInProgress,
        nextChildren,
        renderExpirationTime,
    );
    } else {
    reconcileChildren(
        current,
        workInProgress,
        nextChildren,
        renderExpirationTime,
    );
    }
    workInProgress.memoizedState = instance.state;

    return workInProgress.child;
}
````

## reconcileChildren

````js
export function reconcileChildren(
  current: Fiber | null,
  workInProgress: Fiber,
  nextChildren: any,
  renderExpirationTime: ExpirationTime,
) {
  if (current === null) {
    /* 第一次时候  current ===  null  */
    workInProgress.child = mountChildFibers(
      workInProgress,
      null,
      nextChildren,
      renderExpirationTime,
    );
  } else {
    workInProgress.child = reconcileChildFibers(
      workInProgress,
      current.child,
      nextChildren,
      renderExpirationTime,
    );
  }
}
````

当初始化组件之后,通过调用`render`方法，得到子节点，然后进行`mountChildFibers`

## mountChildFibers 挂在新的节点



