**内容摘要**

## 基础概念

### workTag

上述 fiber 对象的 tag 属性值，称作 workTag，用于标识一个 React 元素的类型，如下所示：

````js
export const FunctionComponent = 0;
export const ClassComponent = 1;
export const IndeterminateComponent = 2; // Before we know whether it is function or class
export const HostRoot = 3; // Root of a host tree. Could be nested inside another node.
export const HostPortal = 4; // A subtree. Could be an entry point to a different renderer.
export const HostComponent = 5;
export const HostText = 6;
export const Fragment = 7;
export const Mode = 8;
export const ContextConsumer = 9;
export const ContextProvider = 10;
export const ForwardRef = 11;
export const Profiler = 12;
export const SuspenseComponent = 13;
export const MemoComponent = 14;
export const SimpleMemoComponent = 15;
export const LazyComponent = 16;
export const IncompleteClassComponent = 17;
export const DehydratedSuspenseComponent = 18;
export const EventComponent = 19;
export const EventTarget = 20;
export const SuspenseListComponent = 21;

````

### EffectTag

上述 fiber 对象的 effectTag 属性值，每一个 fiber 节点都有一个和它相关联的 effectTag 值。
我们把不能在 render 阶段完成的一些 work 称之为副作用，React 罗列了可能存在的各类副作用，如下所示：

````js
export const NoEffect = /*              */ 0b000000000000;
export const PerformedWork = /*         */ 0b000000000001;

export const Placement = /*             */ 0b000000000010;
export const Update = /*                */ 0b000000000100;
export const PlacementAndUpdate = /*    */ 0b000000000110;
export const Deletion = /*              */ 0b000000001000;
export const ContentReset = /*          */ 0b000000010000;
export const Callback = /*              */ 0b000000100000;
export const DidCapture = /*            */ 0b000001000000;
export const Ref = /*                   */ 0b000010000000;
export const Snapshot = /*              */ 0b000100000000;
export const Passive = /*               */ 0b001000000000;

export const LifecycleEffectMask = /*   */ 0b001110100100;
export const HostEffectMask = /*        */ 0b001111111111;

export const Incomplete = /*            */ 0b010000000000;
export const ShouldCapture = /*         */ 0b100000000000;

````

### Reconciliation 和 Scheduling

协调（Reconciliation）：
简而言之，根据 diff 算法来比较虚拟 DOM，从而可以确认哪些部分的 React 元素需要更改。

调度（Scheduling）：
可以简单理解为是一个确定在什么时候执行 work 的过程。

### Render 阶段和 Commit 阶段

React 的生命周期主要分为两个阶段：render 阶段和 commit 阶段。其中 commit 阶段又可以细分为 pre-commit 阶段和 commit 阶段。

#### 废弃的声明周期
[UNSAFE_]componentWillMount (deprecated)
[UNSAFE_]componentWillReceiveProps (deprecated)
[UNSAFE_]componentWillUpdate (deprecated)

在 React 官网中明确提到了废弃的原因，这些被标记为不安全的生命周期由于常常被开发者错误理解甚至被滥用，比如一些开发人员会倾向于将带有请求数据等副作用的逻辑放在这些生命周期方法中，认为能带来更好的性能，而实际上真正带来的收益几乎可以忽略。在未来， React 逐步推崇异步渲染模式下，这很有可能会因为不兼容而带来很多问题。
在 render 阶段，React 可以根据当前可用的时间片处理一个或多个 fiber 节点，并且得益于 fiber 对象中存储的元素上下文信息以及指针域构成的链表结构，使其能够将执行到一半的工作保存在内存的链表中。当 React 停止并完成保存的工作后，让出时间片去处理一些其他优先级更高的事情。之后，在重新获取到可用的时间片后，它能够根据之前保存在内存的上下文信息通过快速遍历的方式找到停止的 fiber 节点并继续工作。由于在此阶段执行的工作并不会导致任何用户可见的更改，因为并没有被提交到真实的 DOM。所以，我们说是 fiber 让调度能够实现暂停、中止以及重新开始等增量渲染的能力。相反，在 commit 阶段，work 执行总是同步的，这是因为在此阶段执行的工作将导致用户可见的更改。这就是为什么在 commit 阶段， React 需要一次性提交并完成这些工作的原因。

#### Current 树和 WorkInProgress 树

首次渲染之后，React 会生成一个对应于 UI 渲染的 fiber 树，称之为 current 树。实际上，React 在调用生命周期钩子函数时就是通过判断是否存在 current 来区分何时执行 componentDidMount 和 componentDidUpdate。当 React 遍历 current 树时，它会为每一个存在的 fiber 节点创建了一个替代节点，这些节点构成一个 workInProgress 树。后续所有发生 work 的地方都是在 workInProgress 树中执行，如果该树还未创建，则会创建一个 current 树的副本，作为 workInProgress 树。当 workInProgress 树被提交后将会在 commit 阶段的某一子阶段被替换成为 current 树。
这里增加两个树的主要原因是为了避免更新的丢失。比如，如果我们只增加更新到 workInProgress 树，当 workInProgress 树通过从 current 树中克隆而重新开始时，一些更新可能会丢失。同样的，如果我们只增加更新到 current 树，当 workInProgress 树被提交后会被替换为 current 树，更新也会被丢失。通过在两个队列都保持更新，可以确保更新始终是下一个 workInProgress 树的一部分。并且，因为 workInProgress 树被提交成为 current 树，并不会出现相同的更新而被重复应用两次的情况。


#### Effects list

effect list 可以理解为是一个存储 effectTag 副作用列表容器。它是由 fiber 节点和指针 nextEffect 构成的单链表结构，这其中还包括第一个节点 firstEffect，和最后一个节点 lastEffect。如下图所示：

React 采用深度优先搜索算法，在 render 阶段遍历 fiber 树时，把每一个有副作用的 fiber 筛选出来，最后构建生成一个只带副作用的 effect list 链表。
在 commit 阶段，React 拿到 effect list 数据后，通过遍历 effect list，并根据每一个 effect 节点的 effectTag 类型，从而对相应的 DOM 树执行更改。

## render阶段

### enqueueSetState

每个 React 组件都有一个相关联的 updater，作为组件层和核心库之间的桥梁。
react.Component 本质上就是一个函数，在它的原型对象上挂载了 setState 方法

````js

// Component函数
function Component(props, context, updater) {
    this.props = props;
    this.context = context;
    this.updater = updater || ReactNoopUpdateQueue;
}
// Component原型对象挂载 setState
Component.prototype.setState = function (partialState, callback) {
    this.updater.enqueueSetState(this, partialState, callback, 'setState');
}
````

React 给 work 大致分成以下几种优先级类型，其中 immediate 比较特殊，它的优先级最高，可以理解为是同步调度，调度过程中不会被中断。

````js
export const NoPriority = 0;
export const ImmediatePriority = 1;
export const UserBlockingPriority = 2;
export const NormalPriority = 3;
export const LowPriority = 4;
export const IdlePriority = 5;

````
React 有一套计算逻辑，根据不同的优先级类型为不同的 work 计算出一个过期时间 expirationTime，其实就是一个时间戳。所谓的 React 在新的更新到来时，能为不同类型的更新分配优先级顺序的能力，本质上是根据过期时间 expirationTime 的大小来确定优先级顺序，expirationTime 数值越小，则优先级越高。在相差一定时间范围内的 work，React 会认为它们是同一个批次（batch）的，因此这一批次的 work 会在一次更新中完成。

````js
const classComponentUpdater = {
    enqueueSetState(inst, payload, callback) {
        // 获取 fiber 对象
        const fiber = getInstance(inst);
        const currentTime = requestCurrentTime();

        // 计算到期时间 expirationTime
        const expirationTime = computeExpirationForFiber(currentTime, fiber, suspenseConfig);

        const update = createUpdate(expirationTime, suspenseConfig);
        // 插入 update 到队列
        enqueueUpdate(fiber, update);
        // 调度 work 方法
        scheduleWork(fiber, expirationTime);
    },
};

````
### renderRoot

协调过程总是 renderRoot 开始，方法调用栈：scheduleWork -->  scheduleCallbackForRoot  --> renderRoot

代码如下
````js
function renderRoot(
  root: FiberRoot,
  expirationTime: ExpirationTime,
  isSync: boolean,
) | null {
  do {
    // 优先级最高，走同步分支
    if (isSync) {
      workLoopSync();
    } else {
      workLoop();
    }
  } while (true);
}

// 所有的fiber节点都在workLoop 中被处理
function workLoop() {
  while (workInProgress !== null && !shouldYield()) {
    workInProgress = performUnitOfWork(workInProgress);
  }
}
````

### performUnitOfWork

所有的 fiber 节点都在 workLoop 方法处理。协调过程总是从最顶层的 hostRoot 节点开始进行 workInProgress 树的遍历。但是，React 会跳过已经处理过的 fiber 节点，直到找到还未完成工作的节点。例如，如果在组件树的深处调用 setState，React 将从顶部开始，但会快速跳过父节点，直到到达调用了 setState 方法的组件。整个过程采用的是深度优先搜索算法，处理完当前 fiber 节点后，workInProgress 将包含对树中下一个 fiber 节点的引用，如果下一个节点为 null 不存在，则认为执行结束退出 workLoop 循环并准备进行一次提交更改。
方法调用栈如下：
performUnitOfWork  -->  beginWork -->  updateClassComponent --> finishedComponent --> completeUnitOfWork

````js
function performUnitOfWork(unitOfWork: Fiber): Fiber | null {
    const current = unitOfWork.alternate;
    let next;
    next = beginWork(current, unitOfWork, renderExpirationTime);

    // 如果没有新的 work，则认为已完成当前工作
    if (next === null) {
        next = completeUnitOfWork(unitOfWork);
    }
    return next;
}
````

### completeUnitOfWork


在 completeUnitOfWork 方法中构建 effect-list 链表，该 effect list 在下一个 commit 阶段非常重要，关于 effect list 上述有介绍。

````js

function completeUnitOfWork(unitOfWork: Fiber): Fiber | null {
    // 深度优先搜索算法
    workInProgress = unitOfWork;
    do {
        const current = workInProgress.alternate;
        const returnFiber = workInProgress.return;

        /*
    	构建 effect-list部分
    */
        if (returnFiber.firstEffect === null) {
            returnFiber.firstEffect = workInProgress.firstEffect;
        }
        if (workInProgress.lastEffect !== null) {
            if (returnFiber.lastEffect !== null) {
                returnFiber.lastEffect.nextEffect = workInProgress.firstEffect;
            }
            returnFiber.lastEffect = workInProgress.lastEffect;
        }

        if (returnFiber.lastEffect !== null) {
            returnFiber.lastEffect.nextEffect = workInProgress;
        } else {
            returnFiber.firstEffect = workInProgress;
        }
        returnFiber.lastEffect = workInProgress;

        const siblingFiber = workInProgress.sibling;
        if (siblingFiber !== null) {
            // If there is more work to do in this returnFiber, do that next.
            return siblingFiber;
        }
        // Otherwise, return to the parent
        workInProgress = returnFiber;
    } while (workInProgress !== null);
}

````

## Commit阶段

commit 阶段是 React 更新真实 DOM 并调用 pre-commit phase 和 commit phase 生命周期方法的地方。与 render 阶段不同，commit 阶段的执行始终是同步的，它将依赖上一个 render 阶段构建的 effect list 链表来完成。

### commitRootImpl

commit 阶段实质上被分为如下三个子阶段：

before mutation
mutation phase
layout phase

mutation 阶段主要做的事情是遍历 effect-list 列表，拿到每一个 effect 存储的信息，根据副作用类型 effectTag 执行相应的处理并提交更新到真正的 DOM。所有的 mutation effects 都会在 layout phase 阶段之前被处理。当该阶段执行结束时，workInProgress 树会被替换成 current 树。因此在 mutation phase 阶段之前的子阶段 before mutation，是调用 getSnapshotBeforeUpdate 生命周期的地方。在 before mutation 这个阶段，真正的 DOM 还没有被变更。最后一个子阶段是 layout phase，在这个阶段生命周期 componentDidMount/Update 被执行。


````js
function commitRootImpl(root) {
    if (firstEffect !== null) {
        // before mutation 阶段，遍历 effect list
        do {
            try {
                commitBeforeMutationEffects();
            } catch (error) {
                nextEffect = nextEffect.nextEffect;
            }
        } while (nextEffect !== null);

        // the mutation phase 阶段，遍历 effect list
        nextEffect = firstEffect;
        do {
            try {
                commitMutationEffects();
            } catch (error) {
                nextEffect = nextEffect.nextEffect;
            }
        } while (nextEffect !== null);

        // 将 work-in-progress 树替换为 current 树
        root.current = finishedWork;

        // layout phase 阶段，遍历 effect list
        nextEffect = firstEffect;
        do {
            try {
                commitLayoutEffects(root, expirationTime);
            } catch (error) {
                captureCommitPhaseError(nextEffect, error);
                nextEffect = nextEffect.nextEffect;
            }
        } while (nextEffect !== null);

        nextEffect = null;
    } else {
        // No effects.
        root.current = finishedWork;
    }
}
````

### commitBeforeMutationEffects

before mutation 调用链路：commitRootImpl -->  commitBeforeMutationEffects --> commitBeforeMutationLifeCycles

代码如下：

````js
function commitBeforeMutationLifeCycles(
  current: Fiber | null,
  finishedWork: Fiber,
): void {
  switch (finishedWork.tag) {
    case FunctionComponent:
    case ForwardRef:
    case SimpleMemoComponent:
    ...
    // 属性 stateNode 表示对应组件的实例
    // 在这里 class 组件实例执行 instance.getSnapshotBeforeUpdate()
    case ClassComponent: {
      if (finishedWork.effectTag & Snapshot) {
        if (current !== null) {
          const prevProps = current.memoizedProps;
          const prevState = current.memoizedState;
          const instance = finishedWork.stateNode;
          const snapshot = instance.getSnapshotBeforeUpdate(
            finishedWork.elementType === finishedWork.type
              ? prevProps
              : resolveDefaultProps(finishedWork.type, prevProps),
            prevState,
          );

          instance.__reactInternalSnapshotBeforeUpdate = snapshot;
        }
      }
      return;
    }
    case HostRoot:
    case HostComponent:
    case HostText:
    case HostPortal:
    case IncompleteClassComponent:
      ...
  }
}
````


### commitMutationEffects

mutation phase 阶段调用链路：
commitRootImpl -->  commitMutationEffects --> commitWork
代码如下：

````js
function commitMutationEffects() {
  while (nextEffect !== null) {
    const effectTag = nextEffect.effectTag;

    let primaryEffectTag = effectTag & (Placement | Update | Deletion);
    switch (primaryEffectTag) {
      case Placement:
        ...
      case PlacementAndUpdate:
        ...
      case Update: {
        const current = nextEffect.alternate;
        commitWork(current, nextEffect);
        break;

      }
      case Deletion: {
        commitDeletion(nextEffect);
        break;
      }
    }
  }
}

````

### commitLayoutEffects

layout phase 调用链路：commitRootImpl -->  commitLayoutEffects --> commitLifeCycles

````js

function commitLifeCycles(
  finishedRoot: FiberRoot,
  current: Fiber | null,
  finishedWork: Fiber,
  committedExpirationTime: ExpirationTime,
): void {
  switch (finishedWork.tag) {
    case FunctionComponent:
    case ForwardRef:
    case SimpleMemoComponent:
      ...
    case ClassComponent: {
      // 属性 stateNode 表示对应组件的实例
      // 在这里 class 组件实例执行 componentDidMount/DidUpdate
      const instance = finishedWork.stateNode;
      if (finishedWork.effectTag & Update) {
        // 首次渲染时，还没有 current 树
        if (current === null) {
          instance.componentDidMount();
        } else {
          const prevProps =
            finishedWork.elementType === finishedWork.type
              ? current.memoizedProps
              : resolveDefaultProps(finishedWork.type, current.memoizedProps);
          const prevState = current.memoizedState;
          instance.componentDidUpdate(
            prevProps,
            prevState,
            instance.__reactInternalSnapshotBeforeUpdate,
          );
        }
      }
      const updateQueue = finishedWork.updateQueue;
      if (updateQueue !== null) {
        commitUpdateQueue(
          finishedWork,
          updateQueue,
          instance,
          committedExpirationTime,
        );
      }
      return;
    }
    case HostRoot:
    case HostComponent:
    case HostText:
    case HostPortal:
    case Profiler:
    case SuspenseComponent:
    case SuspenseListComponent:
      ...
  }
}

````