# 「React进阶」 推荐 8 个很棒的 React 工具库，强烈建议收藏～

俗话说的好 工欲善其事，必先利其器。笔者在开发 React 项目的时候，总结出一些很不错的 React 库，可以提高开发效率，满足业务需求，接下来将一一介绍它们。


## UI组件库 Ant Design

要说 React 最受欢迎的 UI 组件库，那么我第一个想到的就是 `Ant Design`，`Ant Design` 提供了数十种常用的组件，比如 `Button`，`Menu` ，`Table` 等。


`Ant Design`不仅功能强大，还配置灵活，深受广大 React 开发者的喜爱。而且在 github 上已经取得 `74.6k+` 的 `star`


![1.jpg](https://p9-juejin.byteimg.com/tos-cn-i-k3u1fbpfcp/7f67fb63a7f14d1ebe9b1d49ba6da0d2~tplv-k3u1fbpfcp-watermark.image?)

* 参考官网：[传送门](https://ant.design/index-cn)
* 项目地址：[传送门](https://github.com/ant-design/ant-design)


![2.jpg](https://p3-juejin.byteimg.com/tos-cn-i-k3u1fbpfcp/276a940be5dc4700902d5ff08c0eb959~tplv-k3u1fbpfcp-watermark.image?)



![3.jpg](https://p9-juejin.byteimg.com/tos-cn-i-k3u1fbpfcp/42bf093332af4d4ba70671468b0aaee3~tplv-k3u1fbpfcp-watermark.image?)


![4.jpg](https://p1-juejin.byteimg.com/tos-cn-i-k3u1fbpfcp/b0ddbc4838d14f9abc930841dcc008d1~tplv-k3u1fbpfcp-watermark.image?)
## 富文本编辑器 braft-editor 

`braft-editor` 是一个基于 `draftjs` 的 `Web` 富文本编辑器，适用于 React 框架，兼容主流现代浏览器。draft-js 是 facebook 开源的一个富文本编译器，braft-editor 在 draft-js 基础上进行了功能的拓展。

`braft-editor` 在 github 上得到了 `4.2k+` 的 `star`。


![5.jpg](https://p6-juejin.byteimg.com/tos-cn-i-k3u1fbpfcp/2fe77e4c693949b4a72d87559d7967cb~tplv-k3u1fbpfcp-watermark.image?)

* 项目地址：[传送门](https://github.com/margox/braft-editor)

我们看一下 `braft-editor` 的基本使用。

````js
# Install using yarn
yarn add braft-editor
# Install using npm
npm install braft-editor --save
````

````js
import BraftEditor from 'braft-editor'
import 'braft-editor/dist/index.css'

export default function BraftEditorDemo(){
   const [ editorState , setEditorState ] = useState(null)
   const handleEditorChange = ()=>{ /* 富文本  */

   }
   return <div className="box" >
       <BraftEditor
           onChange={handleEditorChange}
           value={editorState}
       />
   </div>
}
````


BraftEditor 用起来还是很方便的， 支持**全屏**，**拖拽上传** ，**代码块** ，**引用** 等功能。


![6.jpg](https://p1-juejin.byteimg.com/tos-cn-i-k3u1fbpfcp/6926ddc7e42d4eef9e79f552bfa969c1~tplv-k3u1fbpfcp-watermark.image?)

## 状态管理工具 Dvajs 

Dvajs 是基于 `redux` ， `react-redux` ，`redux-saga` 的状态管理工具，

在 dva 中，同步触发的 `reducers` ，异步触发 `effects` 和订阅监听的 `subscriptions` 构成了状态管理组织模型。`dvajs` 在 `github` 目前获得 `15.8k+` star 。


![7.jpg](https://p1-juejin.byteimg.com/tos-cn-i-k3u1fbpfcp/12b9f1221b1346c6adb078208c7ae4ac~tplv-k3u1fbpfcp-watermark.image?)

原理图：

![8.png](https://p3-juejin.byteimg.com/tos-cn-i-k3u1fbpfcp/5e6e40211dd1499fb6cc2023178f4c6c~tplv-k3u1fbpfcp-watermark.image?)

* 参考官网：[传送门](https://dvajs.com/)
* 项目地址：[传送门](https://github.com/dvajs/dva)


dvajs 上手也是十分简单的。


![9.jpg](https://p9-juejin.byteimg.com/tos-cn-i-k3u1fbpfcp/7e7aa99b606c43b0b9d147c6947df1dc~tplv-k3u1fbpfcp-watermark.image?)


## 拖拽库 React dnd

React dnd 是 React 的一个推拽库，用起来还是比较得心应手的。`react-dnd` 在 `github` 上得到了 `16.4k+` 的 `star`。


![10.jpg](https://p6-juejin.byteimg.com/tos-cn-i-k3u1fbpfcp/d7b6b68d9eb84027ac04b655bceeb3f1~tplv-k3u1fbpfcp-watermark.image?)

* 参考官网：[传送门](https://react-dnd.github.io/react-dnd/docs/overview)
* 项目地址：[传送门](https://github.com/react-dnd/react-dnd)


![11.jpg](https://p3-juejin.byteimg.com/tos-cn-i-k3u1fbpfcp/7fec774c69754701bfd05ccb1ebdb025~tplv-k3u1fbpfcp-watermark.image?)

对于上手 react-dnd ，官网已经很详细了，感兴趣的同学，可以尝试一下。


## 可视化图表 echarts-for-react

`echarts-for-react` 是使用 React 基于 echarts 封装的图表库，能够满足基本的可视化图表需求。把 echarts 的配置参数通过 React 组件的 props 形式进行传递配置。目前在 `github` 上获得 `3.3k+` star 。


![12.jpg](https://p9-juejin.byteimg.com/tos-cn-i-k3u1fbpfcp/a461be1f64cc4565a5c85053a549931d~tplv-k3u1fbpfcp-watermark.image?)

* 参考官网：[传送门](https://git.hust.cc/echarts-for-react/examples/simple)
* 项目地址：[传送门](https://github.com/hustcc/echarts-for-react)

快速上手：

````shell
npm install --save echarts-for-react
````

````js
import React from 'react';
import ReactECharts from 'echarts-for-react';  
// or var ReactECharts = require('echarts-for-react');

<ReactECharts
  option={this.getOption()}
  notMerge={true}
  lazyUpdate={true}
  theme={"theme_name"}
  onChartReady={this.onChartReadyCallback}
  onEvents={EventsDict}
  opts={}
/>
````


![13.jpg](https://p1-juejin.byteimg.com/tos-cn-i-k3u1fbpfcp/768ed5eff3044ffc8fdb161ce033c665~tplv-k3u1fbpfcp-watermark.image?)

## markdown 预览器  react-markdown

如果想要让 React 项目展示 `md` 格式的文档结构，那么 `react-markdown` 是一个不错的选择。react-markdown 用法非常简单。

我们来看一下 `react-markdown` ，目前 `react-markdown` 在 github 上共获得 `7.7k+` 🌟。


![19.jpg](https://p3-juejin.byteimg.com/tos-cn-i-k3u1fbpfcp/26e7bc0cc2aa4b868b00c5190c4b8945~tplv-k3u1fbpfcp-watermark.image?)

* 参考官网：[传送门](http://remarkjs.github.io/react-markdown/)
* 项目地址：[传送门](https://github.com/remarkjs/react-markdown)

使用：
````js
import React from 'react'
import ReactMarkdown from 'react-markdown'
import ReactDom from 'react-dom'
import remarkGfm from 'remark-gfm'

ReactDom.render(
  <ReactMarkdown remarkPlugins={[[remarkGfm, {singleTilde: false}]]}>
    This ~is not~ strikethrough, but ~~this is~~!
  </ReactMarkdown>,
  document.body
)
````

展示效果：


![14.gif](https://p3-juejin.byteimg.com/tos-cn-i-k3u1fbpfcp/19699cb21f724ae69f6a0032c1208043~tplv-k3u1fbpfcp-watermark.image?)


## 二维码展示 qrcode.react

如果想在 React 项目中，使用链接生成二维码，可以尝试一下 `qrcode.react`，它在 github 上共获得 `2.6k+` 🌟。


![15.jpg](https://p9-juejin.byteimg.com/tos-cn-i-k3u1fbpfcp/1f5e0e56d740435499e194ed27cbb041~tplv-k3u1fbpfcp-watermark.image?)

* 项目地址：[传送门](https://github.com/zpao/qrcode.react)

上手：

````js
import QRCode from 'qrcode.react'

export default function Index(){
    return <div>
          <QRCode fgColor={'pink'} size={100}  value="https://juejin.cn/user/2418581313687390" />
          <QRCode fgColor={'blue'} size={200} value="https://juejin.cn/user/2418581313687390" />
          <QRCode size={300} value="https://juejin.cn/user/2418581313687390" />
    </div>
}
````

效果：


![16.jpg](https://p3-juejin.byteimg.com/tos-cn-i-k3u1fbpfcp/58a7ff34acec453aa1af5b086e04f7cd~tplv-k3u1fbpfcp-watermark.image?)


## 缓存页面 React-keepalive-router

这个插件是笔者开发的，主要是用于一些 React 中需要缓存页面的需求，这里推广一下，目前在 github 上获得 `519`颗 🌟。**觉得不错的同学可以赏个小星星 🌟。**


![17.jpg](https://p6-juejin.byteimg.com/tos-cn-i-k3u1fbpfcp/25fd309e3f814796ad0cfbc56572da12~tplv-k3u1fbpfcp-watermark.image?)

该插件基于react 16.8+ ,react-router 4+ 开发的 react 缓存组件，可以用于缓存页面组件，类似 `vue` 的 `keepalive` 包裹 ` vue-router` 的效果功能。

* 项目地址+参考文档：[传送门](https://github.com/GoodLuckAlien/react-keepalive-router)

````js
<KeepaliveRouterSwitch withoutRoute >
  <div>
     <Route path="/a" component={ComponentA}  />
     <Route path="/b" component={ComponentB}  />
     <KeepaliveRoute path={'/detail'} component={ Detail } />
  </div>
</KeepaliveRouterSwitch>
````
效果：


![18.gif](https://p1-juejin.byteimg.com/tos-cn-i-k3u1fbpfcp/996ff1adb203478da57ed192c9cdbeb4~tplv-k3u1fbpfcp-watermark.image?)


## 总结

今天给大家介绍一些不错的 React 工具库，希望看到的朋友可以尝试着用起来。