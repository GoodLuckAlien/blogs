# 一场升级 React-Router 带来的‘血案’

## 一 前言 

在前端开发过程中，有一种风险开发者值得警惕，就是正常情况下没有问题，但是因为一次小上线，或者一次服务器部署，造成的线上 bug 的情况，更有甚者线上的 bug 和上线的内容毫不相干，那么今天笔者就给大家分享一个真实案例。

本次案例覆盖的知识点如下：

* 1 项目中安装依赖包的规范。
* 2 context 的消费订阅。
* 3 `react-router` v5.2.0 版本变化。 
* 4 本地和线上事故排查。

## 二 问题背景

接下来介绍一下具体问题，最近有同学（化名小明）在开发中遇到了一个问题，就是使用 React-Router 带来的线上事故。事故的发生源头就是因为一个全局组件内使用了 `React-Router` 中的自定义 hooks —— useHistory，具体细节是这样的。

````js
import { useHistory } from 'react-router'
function Index(){
    /* 获取 histroy 对象 */
    const history = useHistory()
    console.log(history)
    return <div>
        {/* 展示 history 里面信息，期望当 history 中 location 信息变化的时候，组件也能更新 */}
    </div>
}
````

小明用 `React-Router` 中的 `useHistory` 来获取 history 对象里面的状态。并期望：

* 展示 location 里面的字段。
* 当路由跳转，history 发生变化，期望组件 Index 也重新渲染，更新展示内容。

这个功能在项目中是一直没有问题的。但是最近小明开发了一个和当前组件毫无关系的新功能，并上了线。

结果在线上就出现了事故：**当路由改变的时候，`Index`组件不再像原来一样更新了。**

更让人匪夷所思的是，小明在本地环境下，不会出现问题。所以这个问题也就伴随着上了线。也就是说这个问题只出现在线上。

这个突如其来的问题，让小明一脸懵逼，顿时慌了手脚。那么是什么原因造成的呢？

## 三 解决问题

### 本地和线上不一样

接下来我们来帮助小明解决这个问题。那么首先🤔思考一下：**为什么会出现本地和线上不一致的情况发生？**

**线上和本地不一致**，那么这种情况下，第一个应该想到的就是，**是不是线上的依赖包和本地的有区别**。那么验证也很简单，就是升级本地的所有包，因为线上部署的包，一般都是 `install` 一个的新的包。 那么可以通过如下方式验证一下：

* 下载本地 `node_modules`;
* 重新安装 `npm install`

经过上述方案折腾之后，发现本地现象和线上的一样了。那么又引出了一个新的问题，小明压根儿没有更新过项目依赖，那么为什么会造成依赖包的差别呢？

这个本质上和 npm 包安装机制有关系，也就是比如你的项目依赖了 x.x.x 版本的 a 模块，那么部署上线后项目中就一定安装 x.x.x 版本的 a 吗？ 答案是否定的，具体 npm 怎样处理，一会会重点介绍。通过上述情况，首先分析出，问题出现在 `React-Router` 库上，于是看一下小明项目中 `package.json`

````json
"react-router": "^5.1.2",
````

* 如上可以看到，小明项目中用的 `react-router` 是 `5.1.2` 版本的，那么问题就在 ^ 上。

### npm 版本安装机制

^ 在`package.json`中代表什么意思，原来在 `package.json` 中 **^** 会匹配最新的大版本依赖包。打个比方：

* 如果依赖版本这么写`^1.2.3`，表示安装1.x.x的最新版本（不低于1.2.3，包括1.3.0），但是不安装2.x.x，也就是说安装时不改变大版本号。

那么小明在项目中 "^5.1.2" 这么写，那么如果有更高版本的 `react-router` 比如 `5.2.x`，`5.3.x`，那么会下载最新安装包，一直到 `6.0.0` 为止（不会安装 6.0.0 ）。

需要注意的是，如果大版本号为0，则插入号的行为与波浪号相同，这是因为此时处于开发阶段，即使是次要版本号变动，也可能带来程序的不兼容。(主版本)

比如 `^0.2.3 ` 那么代表安装的版本范围是 `>=0.2.3 <0.3.0`。

#### 依赖版本对应关系

|  符号   | 例子  |  范围   | 说明   | 
|  ----  | ----  |   ----   | ----   | 
|   ^会匹配最新的大版本依赖包  | ^1.2.3  |  >=1.2.3 <2.0.0、    |  表示安装1.x.x的最新版本（不低于1.2.3，包括1.3.0），但是不安装2.x.x，也就是说安装时不改变大版本号。    | 
|  ~会匹配最近的小版本依赖包   | ~1.2.3  |  >=1.2.3 <1.3.0    | 表示安装1.2.x的最新版本（不低于1.2.3），但是不安装1.3.x，也就是说安装时不改变大版本号和次要版本号。    | 
|  >=   | >=2.1.0  |  >=2.1.0    | 大于等于2.1.0    | 
|  <=   | <=2.0.0  |  <=2.0.0    | 小于等于2.0.0    | 
|  laster   | --  |  --    | 安装最新的版本    | 
|  *   | --  |  --    | 任何版本    | 
|  -   | 1.2.3 - 2.3.4  |  >=1.2.3 <=2.3.4    | 两个版本之间    | 


那么我们回到小明遇到的问题的上，既然知道了原因是自动升级了，那么如果解决这个问题呢？

现在到了解决问题的时候了，**如果出现线上和本地版本差异带来的 bug ，那么最直接快速的方式就是固定版本。** 

````js
"react-router": "5.1.2",
````
版本号前面不加任何符号，固定版本 `5.1.2`，最根本有效的解决了问题。

显然这个不是最佳答案，首先我们应该从问题的本质入手，为什么 `react-router` 不能通过 usehistory 订阅路由信息了。那么本质上到底改了些什么呢？我们找到 `react-routerV5.1.2`源码， 

````js
export function useHistory() {
  return useContext(Context).history;
}
````

* 如上可以看到 `useHistory` 本质上调用了 `useContext` ，使用了整个路由库中 `Context` 的 `history` 对象。
* Context 上保存了整个路由状态信息，每次路由改变，就是通过 Context 变化来通知路由组件渲染对应视图的。对于 React Router 还不熟悉的同学，可以看一下笔者的另外一篇文章：[「源码解析 」这一次彻底弄懂react-router路由原理](https://juejin.cn/post/6886290490640039943)

如果对 context 的订阅消费机制不熟悉的话，请往下👇看。


### context 消费机制

useHistory 本质上用的是 useContext , useContext 本质上是订阅了新版本的 React Context 对象。这里有必要介绍一下 React Context 订阅更新机制。

新版本的 Context 对象包括提供者 `Provider` 和订阅者 `Consumer`：

* `Provider` : 传递 context value 值。
* `Consumer `: 消费 Provider 提供的 value 值。
* 类组件 `contextType` 和函数组件的 `useContext`也可以订阅消费 context value  ，并且 context value 改变的时候，它们会重新渲染，而且不受到 `PureComponent` ，`memo` ， `shouldComponentUpdate` 优化策略的影响。

我们回到小明遇到的问题，之前小明用 useHistory 来订阅路由变化，当**路由更新，那么使用 useHistory 的组件会重新渲染**，因为之前的逻辑是，路由更新就会更新 `history` 对象 。我们来模拟一下流程。

````js
const Context = React.createContext()

function useName (){
    return React.useContext(Context).name
}

const Child = ()=>{
    const name = useName()
    return <div>
        {name}
    </div>
}

const Index = memo(function(){
    return <div>
        <p>root 组件 </p>
        <Child/>
    </div>
})

export default function App(){
    const [ value , changeValue   ] = React.useState({ name:'列表' , path:'/list'  })
    return <div>
        <Context.Provider value={value} >
            <Index />
        </Context.Provider>
        <button onClick={()=> changeValue({ name:'首页',path:'/detail' })} >改变 value </button>
    </div>
}
````

* 切换路由相当于调用 `changeValue`，改变了 `Provider` 中的 `value`。
* 小明使用的组件就是 Child ，而使用的 `useHistory` 类似于 `useName`。
* 当点击按钮改变 value 。Child 更新视图。


### react-router改版

上面知道了 context 的订阅更新机制，那么为什么现在的 `useHistory` ，那么新版本的 `react-router` 改动了些什么呢？后来查看更新日志发现，在 `react-router` v5.2.0 的时候，已经把 history 的 Context 中抽离出来，而且已经有了自己的 Context 。

然后我们又去看了下源码：

````js

export function useHistory() {
  return useContext(HistoryContext);
}

export function useLocation() {
  return useContext(Context).location;
}
````

通过上面可以看到:

* useHistory 已经不再订阅 `Context` ，而是 `HistoryContext`。
* useLocation 依旧订阅 `Context`。
* 当我们改变路由的时候，本质上改变的是 `Context`，所以使用 `useLocation` 的组件会更新，使用 `useHistory` 的组件不会更新。

到这里恍然大悟，真相终于浮出了水面。

## 四 总结

通过本文的学习，可以收获一下内容：

* 线上和本地不一致问题排查。
* `package.json`版本号问题。
* useHistory 原理。
* context

希望觉得有收获的同学可以给笔者 点赞 + 关注，持续分享前端好友。

### 参考资源

* [package.json详解](https://juejin.cn/post/6844904114762022926#heading-6)
* [「源码解析 」这一次彻底弄懂react-router路由原理](https://juejin.cn/post/6886290490640039943)