# 一文理解react-hooks

重点讲解： useMemo / useState / useEffect / useRef / 

* `react-hooks`解决了那些问题。

* `react-hooks` 和 `class` 区别

* 每个 `react-hooks` 是通过什么来记录的？ 为什么必须放在顶端，不能放在条件判断语句中。


## react-hooks 根源

`resolveDispatcher`

`react/src/ReactHooks.js`

**useState**

````js
export function useState(
  initialState
) {
  const dispatcher = resolveDispatcher();
  return dispatcher.useState(initialState);
}
````
 
**resolveDispatcher**

````js
function resolveDispatcher() {
  const dispatcher = ReactCurrentDispatcher.current;
  return dispatcher;
}
````

### 四种不同的ReactCurrentDispatcher对象

**HooksDispatcherOnMount**

**HooksDispatcherOnUpdate**

****

## renderWithHooks

**memoizedState**

`react-reconciler/src/ReactFiberHooks.js`

````js
export function renderWithHooks<Props, SecondArg>(
  current: Fiber | null,
  workInProgress: Fiber,
  Component: (p: Props, arg: SecondArg) => any,
  props: Props,
  secondArg: SecondArg,
  nextRenderExpirationTime: ExpirationTime,
): any {
  renderExpirationTime = nextRenderExpirationTime;
  currentlyRenderingFiber = workInProgress;

  workInProgress.memoizedState = null;
  workInProgress.updateQueue = null;
  workInProgress.expirationTime = NoWork;

 // 当前 memoizedState 为空 ，初始化 hooks HooksDispatcherOnMount
  ReactCurrentDispatcher.current =
      current === null || current.memoizedState === null
        ? HooksDispatcherOnMount
        : HooksDispatcherOnUpdate;


  let children = Component(props, secondArg);

  //检查是否有渲染阶段更新
  if (workInProgress.expirationTime === renderExpirationTime) {
    //只要渲染阶段更新继续，就保持循环渲染
    //安排时间。使用计数器防止无限循环。
    let numberOfReRenders: number = 0;
    do {
      workInProgress.expirationTime = NoWork;
      numberOfReRenders += 1;
      currentHook = null;
      workInProgressHook = null;

      workInProgress.updateQueue = null;

      ReactCurrentDispatcher.current = __DEV__
        ? HooksDispatcherOnRerenderInDEV
        : HooksDispatcherOnRerender;

      children = Component(props, secondArg);
    } while (workInProgress.expirationTime === renderExpirationTime);
  }

  ReactCurrentDispatcher.current = ContextOnlyDispatcher;

  // This check uses currentHook so that it works the same in DEV and prod bundles.
  // hookTypesDev could catch more cases (e.g. context) but only in DEV bundles.
  const didRenderTooFewHooks =
    currentHook !== null && currentHook.next !== null;

  renderExpirationTime = NoWork;
  currentlyRenderingFiber = (null: any);

  currentHook = null;
  workInProgressHook = null;

  didScheduleRenderPhaseUpdate = false;

  return children;
}

````


**第一次初始化`hooks`**

`HooksDispatcherOnMount`

````js
const HooksDispatcherOnMount ={
  useEffect: mountEffect,
  useRef: mountRef,
  useState: mountState,
  useMemo: mountMemo,
}
````


**第二次更新update``**

`HooksDispatcherOnUpdate`

````js
const HooksDispatcherOnUpdate = {
  useEffect: updateEffect,
  useState: updateState,
  useRef: updateRef,
  useMemo: updateMemo,
}

````

**如果在render阶段**

`HooksDispatcherOnRerender`

````js
const HooksDispatcherOnRerender = {
  useEffect: updateEffect,
  useMemo: updateMemo,
  useRef: updateRef,
  useState: rerenderState,
}
````


## mounted 阶段

### mountWorkInProgressHook

创建一个`hook`

````js
function mountWorkInProgressHook {
  const hook = {
    memoizedState: null, // 保存 usestate

    baseState: null,
    baseQueue: null,  //  保存 effect
    queue: null,    //  保存 effect
    next: null, // 指向下一个hooks
  };
  if (workInProgressHook === null) {
    currentlyRenderingFiber.memoizedState = workInProgressHook = hook;
  } else {
    workInProgressHook = workInProgressHook.next = hook;
  }
  return workInProgressHook;
}
````


### mountState

````js
function mountState(
  initialState
) {
  const hook = mountWorkInProgressHook();
  if (typeof initialState === 'function') {
    initialState = initialState();
  }
  hook.memoizedState = hook.baseState = initialState;
  const queue = (hook.queue = {
    pending: null,
    dispatch: null,
    lastRenderedReducer: basicStateReducer,
    lastRenderedState: initialState, //上一次渲染完成的 state
  });
  const dispatch = (queue.dispatch = (dispatchAction.bind(
    null,
    currentlyRenderingFiber,
    queue,
  )));
  return [hook.memoizedState, dispatch];
}
````

#### dispatchAction 

一次 `useState` 过程，可以存在多个 `dispatchAction` 行为，每一次`dispatchAction` 创建一个 `update`,
````js
function dispatchAction(
  fiber,
  queue,
  action,
) {

  const currentTime = requestCurrentTimeForUpdate();
  const suspenseConfig = requestCurrentSuspenseConfig();
  const expirationTime = computeExpirationForFiber(
    currentTime,
    fiber,
    suspenseConfig,
  );

  const update = {
    expirationTime,
    suspenseConfig,
    action,
    eagerReducer: null,
    eagerState: null,
    next: null,
  };

  //将更新添加到列表的末尾
  const pending = queue.pending;
  if (pending === null) {
    // 这是第一次更新。创建循环列表
    update.next = update;
  } else {
    update.next = pending.next;
    pending.next = update;
  }
  queue.pending = update;

  const alternate = fiber.alternate;
  if (
    fiber === currentlyRenderingFiber ||
    (alternate !== null && alternate === currentlyRenderingFiber)
  ) {
  //这是渲染阶段更新。  
  //队列->更新的链接列表。在这个渲染过程之后，我们将重新开始
  //并将隐藏的更新应用到正在进行的工作挂钩上。
    didScheduleRenderPhaseUpdate = true;
    update.expirationTime = renderExpirationTime;
    currentlyRenderingFiber.expirationTime = renderExpirationTime;
  } else {
    if (
      fiber.expirationTime === NoWork &&
      (alternate === null || alternate.expirationTime === NoWork)
    ) {
      // The queue is currently empty, which means we can eagerly compute the
      // next state before entering the render phase. If the new state is the
      // same as the current state, we may be able to bail out entirely.
      //队列当前为空，这意味着我们可以急切地计算
       //进入渲染阶段前的下一个状态。如果新的state是
      //和目前的情况一样，我们也许能够完全摆脱困境
      const lastRenderedReducer = queue.lastRenderedReducer;
      if (lastRenderedReducer !== null) {
        let prevDispatcher;
        try {
          const currentState =(queue.lastRenderedState);
          const eagerState = lastRenderedReducer(currentState, action);
          // Stash the eagerly computed state, and the reducer used to compute
          // it, on the update object. If the reducer hasn't changed by the
          // time we enter the render phase, then the eager state can be used
          // without calling the reducer again.
          update.eagerReducer = lastRenderedReducer;
          update.eagerState = eagerState;
          if (is(eagerState, currentState)) {
            // Fast path. We can bail out without scheduling React to re-render.
            // It's still possible that we'll need to rebase this update later,
            // if the component re-renders for a different reason and by that
            // time the reducer has changed.
            return;
          }
        } catch (error) {
          // Suppress the error. It will throw again in the render phase.
        } finally {
        }
      }
    }
    /* 调度渲染更新 */
    scheduleUpdateOnFiber(fiber, expirationTime);
  }
}
````

### mountEffect 

````js
function mountEffect(
  create,
  depsl,
): void {
  return mountEffectImpl(
    UpdateEffect | PassiveEffect,
    HookPassive,
    create,
    deps,
  );
}
````

#### mountEffectImpl
````js
function mountEffectImpl(fiberEffectTag, hookEffectTag, create, deps) {
  const hook = mountWorkInProgressHook();
  const nextDeps = deps === undefined ? null : deps;
  currentlyRenderingFiber.effectTag |= fiberEffectTag;
  hook.memoizedState = pushEffect(
    HookHasEffect | hookEffectTag,
    create,
    undefined,
    nextDeps,
  );
}
````

#### pushEffect

````js
function pushEffect(tag, create, destroy, deps) {
  const effect: Effect = {
    tag,
    create,
    destroy,
    deps,
    // Circular
    next: null,
  };
  let componentUpdateQueue = (currentlyRenderingFiber.updateQueue: any)
  if (componentUpdateQueue === null) {
    componentUpdateQueue = createFunctionComponentUpdateQueue();
    currentlyRenderingFiber.updateQueue = componentUpdateQueue
    componentUpdateQueue.lastEffect = effect.next = effect;
  } else {
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


### mountRef

````js
function mountRef(initialValue) {
  const hook = mountWorkInProgressHook()
  const ref = {current: initialValue}
  hook.memoizedState = ref
  return ref
}

````


### mountMemo

````js
function mountMemo<T>(
  nextCreate,
  deps,
) {
  const hook = mountWorkInProgressHook();
  const nextDeps = deps === undefined ? null : deps;
  const nextValue = nextCreate();
  hook.memoizedState = [nextValue, nextDeps];
  return nextValue;
}
````


## update阶段 ，更新阶段


### updateWorkInProgressHook

````js
function updateWorkInProgressHook() {
  // This function is used both for updates and for re-renders triggered by a
  // render phase update. It assumes there is either a current hook we can
  // clone, or a work-in-progress hook from a previous render pass that we can
  // use as a base. When we reach the end of the base list, we must switch to
  // the dispatcher used for mounts.
  //此函数既用于更新，也用于由
  //渲染阶段更新。它假设我们可以
  //从上一个渲染过程中克隆，或者一个正在进行的工作挂钩，我们可以
  //用作底座。当我们到达基本列表的末尾时，我们必须切换到
  //用于装载的调度器。
  let nextCurrentHook;
  // 如果 currentHook = null 证明它是第一个hooks
  if (currentHook === null) {
    const current = currentlyRenderingFiber.alternate;
    if (current !== null) {
      nextCurrentHook = current.memoizedState;
    } else {
      nextCurrentHook = null;
    }
  } else {
    // 指向第二个hooks
    nextCurrentHook = currentHook.next;
  }

  let nextWorkInProgressHook /* 逻辑和上面一样 */
  if (workInProgressHook === null) {
    nextWorkInProgressHook = currentlyRenderingFiber.memoizedState;
  } else {
    nextWorkInProgressHook = workInProgressHook.next;
  }

  if (nextWorkInProgressHook !== null) {
    // There's already a work-in-progress. Reuse it.
    //已经有一项工作在进行中。再利用它。
    workInProgressHook = nextWorkInProgressHook;
    nextWorkInProgressHook = workInProgressHook.next;

    currentHook = nextCurrentHook;
  } else { 
    // 当前hook 上一次渲染多。
    invariant(
      nextCurrentHook !== null,
      'Rendered more hooks than during the previous render.',
    );
    currentHook = nextCurrentHook;
    const newHook = {
      memoizedState: currentHook.memoizedState,
      baseState: currentHook.baseState,
      baseQueue: currentHook.baseQueue,
      queue: currentHook.queue,
      next: null,
    }
    if (workInProgressHook === null) {
      // 这是链表中第一个hooks
      currentlyRenderingFiber.memoizedState = workInProgressHook = newHook;
    } else {
       // 添加到最后一个列表中
      workInProgressHook = workInProgressHook.next = newHook;
    }
  }
  return workInProgressHook;
}
````


**memoizedState** ,在每一次，`renderWithHooks`  ， `memoizedState` 都被设置成 `null`。

````js
  workInProgress.memoizedState = null;
  workInProgress.updateQueue = null;
  workInProgress.expirationTime = NoWork;

````


### updateState
````js
function updateState(
  initialState
){
  return updateReducer(basicStateReducer, initialState);
}
````

#### updateReducer

````js
function updateReducer(
  reducer,
  initialArg,
  init?: ,
) {
  const hook = updateWorkInProgressHook();
  const queue = hook.queue;
  invariant(
    queue !== null,
    'Should have a queue. This is likely a bug in React. Please file an issue.',
  );

  queue.lastRenderedReducer = reducer;

  const current = currentHook;

  // The last rebase update that is NOT part of the base state.
  let baseQueue = current.baseQueue;
  // 尚未处理的最后一个挂起的更新
  // The last pending update that hasn't been processed yet.
  const pendingQueue = queue.pending;
  //把 pendingQueue 放入 baseQueue , 置空 pending
  if (pendingQueue !== null) {
    // We have new updates that haven't been processed yet.
    // We'll add them to the base queue.
    if (baseQueue !== null) {
      // Merge the pending queue and the base queue.
      const baseFirst = baseQueue.next;
      const pendingFirst = pendingQueue.next;
      baseQueue.next = pendingFirst;
      pendingQueue.next = baseFirst;
    }
   
    current.baseQueue = baseQueue = pendingQueue;
    queue.pending = null;
  }

  if (baseQueue !== null) {
    // We have a queue to process.
    const first = baseQueue.next;
    let newState = current.baseState;

    let newBaseState = null;
    let newBaseQueueFirst = null;
    let newBaseQueueLast = null;
    let update = first;
    do {
      const updateExpirationTime = update.expirationTime;
      if (updateExpirationTime < renderExpirationTime) {
        //优先级不足。跳过此更新。如果这是第一个
        //跳过更新，以前的更新/状态是新的基础
        //更新/状态。
        const clone = {
          expirationTime: update.expirationTime,
          suspenseConfig: update.suspenseConfig,
          action: update.action,
          eagerReducer: update.eagerReducer,
          eagerState: update.eagerState,
          next: null,
        };
        if (newBaseQueueLast === null) {
          newBaseQueueFirst = newBaseQueueLast = clone;
          newBaseState = newState;
        } else {
          newBaseQueueLast = newBaseQueueLast.next = clone;
        }
        // 更新队列中的剩余优先级。
        if (updateExpirationTime > currentlyRenderingFiber.expirationTime) {
          currentlyRenderingFiber.expirationTime = updateExpirationTime;
          markUnprocessedUpdateTime(updateExpirationTime);
        }
      } else {
        // This update does have sufficient priority.
        //此更新确实具有足够的优先级。
        if (newBaseQueueLast !== null) {
          const clone = {
            expirationTime: Sync, // This update is going to be committed so we never want uncommit it.
            suspenseConfig: update.suspenseConfig,
            action: update.action,
            eagerReducer: update.eagerReducer,
            eagerState: update.eagerState,
            next:null,
          };
          newBaseQueueLast = newBaseQueueLast.next = clone;
        }

        // Mark the event time of this update as relevant to this render pass.
        // TODO: This should ideally use the true event time of this update rather than
        // its priority which is a derived and not reverseable value.
        // TODO: We should skip this update if it was already committed but currently
        // we have no way of detecting the difference between a committed and suspended
        // update here.
        //将此更新的事件时间标记为与此渲染过程相关。
        // TODO：理想情况下，应使用此更新的真实事件时间，而不是
        //其优先级，它是派生的且不可逆的值。
        // TODO：如果已提交但当前不执行此更新，则应跳过此更新
        //我们无法检测已提交和已暂停之间的差异
        //在这里更新。
        markRenderEventTimeAndConfig(
          updateExpirationTime,
          update.suspenseConfig,
        );

        // Process this update.
        if (update.eagerReducer === reducer) {
          // If this update was processed eagerly, and its reducer matches the
          // current reducer, we can use the eagerly computed state.
          newState = ((update.eagerState: any): S);
        } else {
          const action = update.action;
          newState = reducer(newState, action);
        }
      }
      update = update.next;
    } while (update !== null && update !== first);

    if (newBaseQueueLast === null) {
      newBaseState = newState;
    } else {
      newBaseQueueLast.next = (newBaseQueueFirst: any);
    }
    // Mark that the fiber performed work, but only if the new state is
    // different from the current state.
    if (!is(newState, hook.memoizedState)) {
      markWorkInProgressReceivedUpdate();
    }
    hook.memoizedState = newState;
    hook.baseState = newBaseState;
    hook.baseQueue = newBaseQueueLast;

    queue.lastRenderedState = newState;
  }
  const dispatch = (queue.dispatch: any);
  return [hook.memoizedState, dispatch];
}
````

### updateEffect

````js
function updateEffect(
  create,
  deps,
) {
  return updateEffectImpl(
    UpdateEffect | PassiveEffect,
    HookPassive,
    create,
    deps,
  );
}
````


#### updateEffectImpl 

````js
function updateEffectImpl(fiberEffectTag, hookEffectTag, create, deps) {
  
  const hook = updateWorkInProgressHook()
  const nextDeps = deps === undefined ? null : deps
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
  currentlyRenderingFiber.effectTag |= fiberEffectTag;
  hook.memoizedState = pushEffect(
    HookHasEffect | hookEffectTag,
    create,
    destroy,
    nextDeps,
  );
}
````

### updateMemo

````js
function updateMemo(
  nextCreate,
  deps,
){
  const hook = updateWorkInProgressHook();
  const nextDeps = deps === undefined ? null : deps;
  const prevState = hook.memoizedState;
  if (prevState !== null) {
    if (nextDeps !== null) {
      const prevDeps = prevState[1];
      if (areHookInputsEqual(nextDeps, prevDeps)) {
        /* 取缓存值， nextDeps 相等的情况*/
        return prevState[0];
      }
    }
  }
  const nextValue = nextCreate()
  hook.memoizedState = [nextValue, nextDeps];
  return nextValue;
}
````

### updateRef

````js
function updateRef(initialValue){
  const hook = updateWorkInProgressHook();
  return hook.memoizedState;
}
````
