# 「react进阶」 一文吃透react事件原理


## React事件
事件注册:

injectEventPluginsByName({
    SimpleEventPlugin: LegacySimpleEventPlugin,
    EnterLeaveEventPlugin: LegacyEnterLeaveEventPlugin,
    ChangeEventPlugin: LegacyChangeEventPlugin,
    SelectEventPlugin: LegacySelectEventPlugin,
    BeforeInputEventPlugin: LegacyBeforeInputEventPlugin
});


第一个对象:
**registrationNameModule**

 它包含了 `React` 事件到它对应的 `plugin` 的映射， 大致长下面这样，它包含了 `React` 所支持的所有事件类型，这个对象最大的作用是判断一个组件的 `prop` 是否是事件类型，这在处理原生组件的 `props` 时候将会用到，如果一个 `prop` 在这个对象中才会被当做事件处理。


````js
{
    onBlur: SimpleEventPlugin,
    onClick: SimpleEventPlugin,
    onClickCapture: SimpleEventPlugin,
    onChange: ChangeEventPlugin,
    onChangeCapture: ChangeEventPlugin,
    onMouseEnter: EnterLeaveEventPlugin,
    onMouseLeave: EnterLeaveEventPlugin,
    ...
}
````

第二个对象：

**registrationNameDependencies**
这个对象即是一开始我们说到的合成事件到原生事件的映射，对于onClick 和 onClickCapture事件， 只依赖原生click事件。但是对于 onMouseLeave它却是依赖了两个mouseout， mouseover， 这说明这个事件是 React 使用 mouseout 和 mouseover 模拟合成的。正是因为这种行为，使得 React 能够合成一些哪怕浏览器不支持的事件供我们代码里使用


````js
{
    onBlur: ['blur'],
    onClick: ['click'],
    onClickCapture: ['click'],
    onChange: ['blur', 'change', 'click', 'focus', 'input', 'keydown', 'keyup', 'selectionchange'],
    onMouseEnter: ['mouseout', 'mouseover'],
    onMouseLeave: ['mouseout', 'mouseover'],
    ...
}
````

第三个对象是 `plugins` ， 这个对象就是上面注册的所有插件列表。

````js
plugins = [LegacySimpleEventPlugin, LegacyEnterLeaveEventPlugin, ...];
````

看完上面这些信息后我们再反过头来看下一个普通的 `EventPlugin` 长什么样子。一个 `plugin` 就是一个对象， 这个对象包含了下面两个属性

````js
// event plugin
{
  eventTypes, // 一个数组，包含了所有合成事件相关的信息，包括其对应的原生事件关系
  extractEvents: // 一个函数，当原生事件触发时执行这个函数
}
````

* 1 我们将所有事件类型都注册到 `document` 上。
* 2 所有原生事件的 `listener` 都是 `dispatchEvent` 函数。
* 3 同一个类型的事件 `React` 只会绑定一次原生事件，例如无论我们写了多少个 `onClick` ， 最终反应在 `DOM` 事件上只会有一个 `listener` 。
* 4 `React` 并没有将我们业务逻辑里的 `listener` 绑在原生事件上，也没有去维护一个类似 `eventlistenermap` 的东西存放我们的 `listener` 。


由 3，4 条规则可以得出，我们业务逻辑的 `listener` 和实际 `DOM` 事件压根就没关系， `React` 只是会确保这个原生事件能够被它自己捕捉到，后续由 `React` 来派发我们的事件回调，当我们页面发生较大的切换时候， `React`  可以什么都不做，从而免去了去操作 `removeEventListener` 或者同步 `eventlistenermap` 的操作，所以其执行效率将会大大提高，相当于全局给我们做了一次事件委托，即便是渲染大列表，也不用开发者关心事件绑定问题。


## React事件触发

我们知道由于所有类型种类的事件都是绑定为React的 `dispatchEvent` 函数，所以就能在全局处理一些通用行为，下面就是整个行为过程。

````js
export function dispatchEventForLegacyPluginEventSystem(
  topLevelType: DOMTopLevelEventType,
  eventSystemFlags: EventSystemFlags,
  nativeEvent: AnyNativeEvent,
  targetInst: null | Fiber,
): void {
  const bookKeeping = getTopLevelCallbackBookKeeping(
    topLevelType,
    nativeEvent,
    targetInst,
    eventSystemFlags
  );

  try {
    // Event queue being processed in the same cycle allows
    // `preventDefault`.
    batchedEventUpdates(handleTopLevel, bookKeeping);
  } finally {
    releaseTopLevelCallbackBookKeeping(bookKeeping);
  }
}
````

从事件注册开始,注册上述第一个对象：

````js
const namesToPlugins = {};
````

**injectEventPluginsByName** 

注册完成后：

````js
{
    SimpleEventPlugin: SimpleEventPlugin,
    EnterLeaveEventPlugin: EnterLeaveEventPlugin,
    ChangeEventPlugin: ChangeEventPlugin,
    SelectEventPlugin: SelectEventPlugin,
    BeforeInputEventPlugin: BeforeInputEventPlugin,
 }
````


````js
const discreteEventPairsForSimpleEventPlugin = [
  DOMTopLevelEventTypes.TOP_BLUR, 'blur',
  DOMTopLevelEventTypes.TOP_CANCEL, 'cancel',
  DOMTopLevelEventTypes.TOP_CLICK, 'click',
  DOMTopLevelEventTypes.TOP_CLOSE, 'close',
  DOMTopLevelEventTypes.TOP_CONTEXT_MENU, 'contextMenu',
  DOMTopLevelEventTypes.TOP_COPY, 'copy',
  DOMTopLevelEventTypes.TOP_CUT, 'cut',
  DOMTopLevelEventTypes.TOP_AUX_CLICK, 'auxClick',
  DOMTopLevelEventTypes.TOP_DOUBLE_CLICK, 'doubleClick',
  DOMTopLevelEventTypes.TOP_DRAG_END, 'dragEnd',
  DOMTopLevelEventTypes.TOP_DRAG_START, 'dragStart',
  DOMTopLevelEventTypes.TOP_DROP, 'drop',
  DOMTopLevelEventTypes.TOP_FOCUS, 'focus',
  DOMTopLevelEventTypes.TOP_INPUT, 'input',
  DOMTopLevelEventTypes.TOP_INVALID, 'invalid',
  DOMTopLevelEventTypes.TOP_KEY_DOWN, 'keyDown',
  DOMTopLevelEventTypes.TOP_KEY_PRESS, 'keyPress',
  DOMTopLevelEventTypes.TOP_KEY_UP, 'keyUp',
  DOMTopLevelEventTypes.TOP_MOUSE_DOWN, 'mouseDown',
  DOMTopLevelEventTypes.TOP_MOUSE_UP, 'mouseUp',
  DOMTopLevelEventTypes.TOP_PASTE, 'paste',
  DOMTopLevelEventTypes.TOP_PAUSE, 'pause',
  DOMTopLevelEventTypes.TOP_PLAY, 'play',
  DOMTopLevelEventTypes.TOP_POINTER_CANCEL, 'pointerCancel',
  DOMTopLevelEventTypes.TOP_POINTER_DOWN, 'pointerDown',
  DOMTopLevelEventTypes.TOP_POINTER_UP, 'pointerUp',
  DOMTopLevelEventTypes.TOP_RATE_CHANGE, 'rateChange',
  DOMTopLevelEventTypes.TOP_RESET, 'reset',
  DOMTopLevelEventTypes.TOP_SEEKED, 'seeked',
  DOMTopLevelEventTypes.TOP_SUBMIT, 'submit',
  DOMTopLevelEventTypes.TOP_TOUCH_CANCEL, 'touchCancel',
  DOMTopLevelEventTypes.TOP_TOUCH_END, 'touchEnd',
  DOMTopLevelEventTypes.TOP_TOUCH_START, 'touchStart',
  DOMTopLevelEventTypes.TOP_VOLUME_CHANGE, 'volumeChange',
];
processSimpleEventPluginPairsByPriority(
  discreteEventPairsForSimpleEventPlugin,
  DiscreteEvent,
);
````

````js
function processSimpleEventPluginPairsByPriority(
  eventTypes,
  priority,
) {
  for (let i = 0; i < eventTypes.length; i += 2) {
    const topEvent = ((eventTypes[i]: any): DOMTopLevelEventType);
    const event = ((eventTypes[i + 1]: any): string);
    const capitalizedEvent = event[0].toUpperCase() + event.slice(1);
    const onEvent = 'on' + capitalizedEvent;

    const config = {
      phasedRegistrationNames: {
        bubbled: onEvent,
        captured: onEvent + 'Capture',
      },
      dependencies: [topEvent],
      eventPriority: priority,
    };
    eventPriorities.set(topEvent, priority);
    topLevelEventsToDispatchConfig.set(topEvent, config);
    /*  重点这里，建立起map关系  */
    simpleEventPluginEventTypes[event] = config;
  }
}
````

````js
const SimpleEventPlugin = {
    /* 事件合成 */
    eventTypes: simpleEventPluginEventTypes,
    extractEvents:(
        topLevelType
        targetInst,
        nativeEvent,
        nativeEventTarget,
        eventSystemFlags,
        targetContainer,
    )=>{
         const dispatchConfig = topLevelEventsToDispatchConfig.get(topLevelType);
        if (!dispatchConfig) {
            return null;
        }
        let EventConstructor;
        switch (topLevelType) {
            /* 如果是click事件 */
             EventConstructor = SyntheticMouseEvent;
        }
        //创建一个事件对象
         const event = EventConstructor.getPooled(
            dispatchConfig,
            targetInst,
            nativeEvent,
            nativeEventTarget,
        );

    },
}
````

registrationNameDependencies






ensureListeningTo -> legacyListenToEvent -> legacyListenToTopLevelEvent -> legacyTrapBubbledEvent

-> addTrappedEventListener

**addTrappedEventListener** 

````js
function addTrappedEventListener(){
    const listenerWrapper = dispatchEvent
    listener = listenerWrapper.bind(
        null,
        topLevelType,
        eventSystemFlags,
        targetContainer, // documnet
    );
    unsubscribeListener = addEventBubbleListener(
        targetContainer, // document
        rawEventName, // click input ....
        listener,  // dispatchEvent
    );
}
````

`react-dom/src/event/ReactDOMEventListener.js`
**dispatchEvent**

````js
function dispatchEvent(
    topLevelType: DOMTopLevelEventType,
    eventSystemFlags: EventSystemFlags,
    targetContainer: EventTarget,
    nativeEvent: AnyNativeEvent,
){

    const blockedOn = attemptToDispatchEvent(
        topLevelType,
        eventSystemFlags,
        targetContainer,
        nativeEvent,
    );

    queueDiscreteEvent(
      blockedOn, // Flags that we're not actually blocked on anything as far as we know.
      topLevelType,
      eventSystemFlags,
      targetContainer,
      nativeEvent,
    );
}
````


**尝试调度事件**
````js
export function attemptToDispatchEvent(
  topLevelType: DOMTopLevelEventType, // eventType
  eventSystemFlags: EventSystemFlags,
  targetContainer: EventTarget, // document
  nativeEvent: AnyNativeEvent, // event
){
   const nativeEventTarget = getEventTarget(nativeEvent); // 获取 target
   let targetInst = getClosestInstanceFromNode(nativeEventTarget); // host
    dispatchEventForLegacyPluginEventSystem(
        topLevelType,
        eventSystemFlags,
        nativeEvent,
        null,
    );
}
````

**dispatchEventForLegacyPluginEventSystem**

````js
export function dispatchEventForLegacyPluginEventSystem(
  topLevelType: DOMTopLevelEventType,
  eventSystemFlags: EventSystemFlags,
  nativeEvent: AnyNativeEvent,
  targetInst: null | Fiber,
): void {
    /*  */
  const bookKeeping = getTopLevelCallbackBookKeeping(
    topLevelType,
    nativeEvent,
    targetInst,
    eventSystemFlags,
  );
  try {
    batchedEventUpdates(handleTopLevel, bookKeeping);
  } finally {
    releaseTopLevelCallbackBookKeeping(bookKeeping);
  }
}
````

**getTopLevelCallbackBookKeeping**

````js
function getTopLevelCallbackBookKeeping(
  topLevelType: DOMTopLevelEventType,
  nativeEvent: AnyNativeEvent,
  targetInst: Fiber | null,
  eventSystemFlags: EventSystemFlags,
): BookKeepingInstance {
  if (callbackBookkeepingPool.length) {
    const instance = callbackBookkeepingPool.pop();
    instance.topLevelType = topLevelType;
    instance.eventSystemFlags = eventSystemFlags;
    instance.nativeEvent = nativeEvent;
    instance.targetInst = targetInst;
    return instance;
  }
  return {
    topLevelType,
    eventSystemFlags,
    nativeEvent,
    targetInst,
    ancestors: [],
  };
}
````

重点来了：这个函数信息量很大

````js
function handleTopLevel(bookKeeping: BookKeepingInstance) {
  let targetInst = bookKeeping.targetInst;
  let ancestor = targetInst;
  do {
    if (!ancestor) {
      const ancestors = bookKeeping.ancestors;
      ((ancestors: any): Array<Fiber | null>).push(ancestor);
      break;
    }
    const root = findRootContainerNode(ancestor);
    if (!root) {
      break;
    }
    const tag = ancestor.tag;
    if (tag === HostComponent || tag === HostText) {
      bookKeeping.ancestors.push(ancestor);
    }
    ancestor = getClosestInstanceFromNode(root);
  } while (ancestor);

  for (let i = 0; i < bookKeeping.ancestors.length; i++) {
    targetInst = bookKeeping.ancestors[i];
    const eventTarget = getEventTarget(bookKeeping.nativeEvent);
    const topLevelType = ((bookKeeping.topLevelType: any): DOMTopLevelEventType);
    const nativeEvent = ((bookKeeping.nativeEvent: any): AnyNativeEvent);
    let eventSystemFlags = bookKeeping.eventSystemFlags;
    // If this is the first ancestor, we mark it on the system flags
    if (i === 0) {
      eventSystemFlags |= IS_FIRST_ANCESTOR;
    }
    runExtractedPluginEventsInBatch(
      topLevelType,
      targetInst,
      nativeEvent,
      eventTarget,
      eventSystemFlags,
    );
  }
}
````

**runExtractedPluginEventsInBatch**

````js
function runExtractedPluginEventsInBatch(
  topLevelType: TopLevelType,
  targetInst: null | Fiber,
  nativeEvent: AnyNativeEvent,
  nativeEventTarget: null | EventTarget,
  eventSystemFlags: EventSystemFlags,
) {
// 得到 react 处理后的事件对象。
  const events = extractPluginEvents(
    topLevelType,
    targetInst,
    nativeEvent,
    nativeEventTarget,
    eventSystemFlags,
  );
  runEventsInBatch(events);
}
````

**extractPluginEvents**

````js
function extractPluginEvents(
  topLevelType: TopLevelType,
  targetInst: null | Fiber,
  nativeEvent: AnyNativeEvent,
  nativeEventTarget: null | EventTarget,
  eventSystemFlags: EventSystemFlags,
): Array<ReactSyntheticEvent> | ReactSyntheticEvent | null {
  let events = null;
  for (let i = 0; i < plugins.length; i++) {
    // Not every plugin in the ordering may be loaded at runtime.
    const possiblePlugin: PluginModule<AnyNativeEvent> = plugins[i];
    if (possiblePlugin) {

      /* 得到事件对象 */
      const extractedEvents = possiblePlugin.extractEvents(
        topLevelType,
        targetInst,
        nativeEvent,
        nativeEventTarget,
        eventSystemFlags,
      );
      if (extractedEvents) {
        events = accumulateInto(events, extractedEvents);
      }
    }
  }
  return events;
}
````

**runEventsInBatch**

````js
function runEventsInBatch(events){
    if (event) {
    executeDispatchesInOrder(event);

    if (!event.isPersistent()) {
        // 添加到事件池
      event.constructor.release(event);
    }
  }
}
````

**executeDispatchesInOrder**\

````js
export function executeDispatchesInOrder(event) {
  const dispatchListeners = event._dispatchListeners;
  const dispatchInstances = event._dispatchInstances;
  if (Array.isArray(dispatchListeners)) {
    for (let i = 0; i < dispatchListeners.length; i++) {
      if (event.isPropagationStopped()) {
        break;
      }
      // Listeners and Instances are two parallel arrays that are always in sync.
      executeDispatch(event, dispatchListeners[i], dispatchInstances[i]);
    }
  } else if (dispatchListeners) {
    executeDispatch(event, dispatchListeners, dispatchInstances);
  }
  event._dispatchListeners = null;
  event._dispatchInstances = null;
}

````

**什么时候注册的事件:**

export const HostComponent = 5; 是什  `div`

在 `plugin` 中 `extractEvents`函数中最后 ,

````js
accumulateTwoPhaseListeners(event, true);
````


**accumulateTwoPhaseListeners**

````js

export default function accumulateTwoPhaseListeners(
  event: ReactSyntheticEvent,
  accumulateUseEventListeners?: boolean,
): void {
  const phasedRegistrationNames = event.dispatchConfig.phasedRegistrationNames;
  const dispatchListeners = [];
  const dispatchInstances = [];
  const dispatchCurrentTargets = [];

  const {bubbled, captured} = phasedRegistrationNames;
  // If we are not handling EventTarget only phase, then we're doing the
  // usual two phase accumulation using the React fiber tree to pick up
  // all relevant useEvent and on* prop events.
  let instance = event._targetInst;
  let lastHostComponent = null;

  // Accumulate all instances and listeners via the target -> root path.
  while (instance !== null) {
    const {stateNode, tag} = instance;
    // Handle listeners that are on HostComponents (i.e. <div>)
    if (tag === HostComponent && stateNode !== null) {
      const currentTarget = stateNode;
      lastHostComponent = currentTarget;
      // For useEvent listenrs
      if (
        enableModernEventSystem &&
        enableUseEventAPI &&
        accumulateUseEventListeners
      ) {
        // useEvent event listeners
        const targetType = event.type;
        const listeners = getListenersFromTarget(currentTarget);

        if (listeners !== null) {
          const listenersArr = Array.from(listeners);
          for (let i = 0; i < listenersArr.length; i++) {
            const listener = listenersArr[i];
            const {
              callback,
              event: {capture, type},
            } = listener;
            if (type === targetType) {
              if (capture === true) {
                dispatchListeners.unshift(callback);
                dispatchInstances.unshift(instance);
                dispatchCurrentTargets.unshift(currentTarget);
              } else {
                dispatchListeners.push(callback);
                dispatchInstances.push(instance);
                dispatchCurrentTargets.push(currentTarget);
              }
            }
          }
        }
      }
      // Standard React on* listeners, i.e. onClick prop
      if (captured !== null) {
        const captureListener = getListener(instance, captured);
        if (captureListener != null) {
          // Capture listeners/instances should go at the start, so we
          // unshift them to the start of the array.
          dispatchListeners.unshift(captureListener);
          dispatchInstances.unshift(instance);
          dispatchCurrentTargets.unshift(currentTarget);
        }
      }
      if (bubbled !== null) {
        const bubbleListener = getListener(instance, bubbled);
        if (bubbleListener != null) {
          // Bubble listeners/instances should go at the end, so we
          // push them to the end of the array.
          dispatchListeners.push(bubbleListener);
          dispatchInstances.push(instance);
          dispatchCurrentTargets.push(currentTarget);
        }
      }
    }
    if (
      enableModernEventSystem &&
      enableUseEventAPI &&
      enableScopeAPI &&
      accumulateUseEventListeners &&
      tag === ScopeComponent &&
      lastHostComponent !== null
    ) {
      const reactScope = stateNode.methods;
      const eventTypeMap = reactScopeListenerStore.get(reactScope);
      if (eventTypeMap !== undefined) {
        const type = ((event.type: any): DOMTopLevelEventType);
        const listeners = eventTypeMap.get(type);
        if (listeners !== undefined) {
          const captureListeners = Array.from(listeners.captured);
          const bubbleListeners = Array.from(listeners.bubbled);
          const lastCurrentTarget = ((lastHostComponent: any): Element);

          for (let i = 0; i < captureListeners.length; i++) {
            const listener = captureListeners[i];
            const {callback} = listener;
            dispatchListeners.unshift(callback);
            dispatchInstances.unshift(instance);
            dispatchCurrentTargets.unshift(lastCurrentTarget);
          }
          for (let i = 0; i < bubbleListeners.length; i++) {
            const listener = bubbleListeners[i];
            const {callback} = listener;
            dispatchListeners.push(callback);
            dispatchInstances.push(instance);
            dispatchCurrentTargets.push(lastCurrentTarget);
          }
        }
      }
    }
    instance = instance.return;
  }

  if (dispatchListeners.length > 0) {
    event._dispatchListeners = dispatchListeners;
    event._dispatchInstances = dispatchInstances;
    event._dispatchCurrentTargets = dispatchCurrentTargets;
  }
}
````

````js

export default function getListener(
  inst: Fiber,
  registrationName: string,
): Function | null {
  const stateNode = inst.stateNode
  if (stateNode === null) {
    // Work in progress (ex: onload events in incremental mode).
    return null
  }
  const props = getFiberCurrentPropsFromNode(stateNode)
  if (props === null) {
    // Work in progress.
    return null
  }
  const listener = props[registrationName];
  if (shouldPreventMouseEvent(registrationName, inst.type, props)) {
    return null;
  }
  return listener;
}

````

事件绑定




React并不是将click事件绑在该div的真实DOM上，而是在document处监听所有支持的事件，当事件发生并冒泡至document处时，React将事件内容封装并交由真正的处理函数运行。这样的方式不仅减少了内存消耗，还能在组件挂载销毁时统一订阅和移除事件。
另外冒泡到 document 上的事件也不是原生浏览器事件，而是 React 自己实现的合成事件（SyntheticEvent）。因此我们如果不想要事件冒泡的话，调用 event.stopPropagation 是无效的，而应该调用 event.preventDefault。

## 1 事件注册

组件装载 / 更新。
通过lastProps、nextProps判断是否新增、删除事件分别调用事件注册、卸载方法。
调用EventPluginHub的enqueuePutListener进行事件存储
获取document对象。
根据事件名称（如onClick、onCaptureClick）判断是进行冒泡还是捕获。
判断是否存在addEventListener方法，否则使用attachEvent（兼容IE）。
给document注册原生事件回调为dispatchEvent（统一的事件分发机制）。

## 2 事件存储

EventPluginHub负责管理React合成事件的callback，它将callback存储在listenerBank中，另外还存储了负责合成事件的Plugin。
EventPluginHub的putListener方法是向存储容器中增加一个listener。
获取绑定事件的元素的唯一标识key。
将callback根据事件类型，元素的唯一标识key存储在listenerBank中。
listenerBank的结构是：listenerBank[registrationName][key]。

````js
{
    onClick:{
        nodeid1:()=>{...}
        nodeid2:()=>{...}
    },
    onChange:{
        nodeid3:()=>{...}
        nodeid4:()=>{...}
    }
}
````

## 3 事件触发执行

触发document注册原生事件的回调dispatchEvent
获取到触发这个事件最深一级的元素
这里的事件执行利用了React的批处理机制
代码示例

````html
<div onClick={this.parentClick} ref={ref => this.parent = ref}>
      <div onClick={this.childClick} ref={ref => this.child = ref}>
          test
     </div>
</div>
````

首先会获取到this.child
遍历这个元素的所有父元素，依次对每一级元素进行处理。
构造合成事件。
将每一级的合成事件存储在eventQueue事件队列中。
遍历eventQueue。
通过isPropagationStopped判断当前事件是否执行了阻止冒泡方法。
如果阻止了冒泡，停止遍历，否则通过executeDispatch执行合成事件。
释放处理完成的事件。


## 4 合成事件

调用EventPluginHub的extractEvents方法。
循环所有类型的EventPlugin（用来处理不同事件的工具方法）。
在每个EventPlugin中根据不同的事件类型，返回不同的事件池。
在事件池中取出合成事件，如果事件池是空的，那么创建一个新的。
根据元素nodeid(唯一标识key)和事件类型从listenerBink中取出回调函数
返回带有合成事件参数的回调函数


