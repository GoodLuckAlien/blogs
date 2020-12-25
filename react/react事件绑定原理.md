# react事件绑定原理

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


