# 「React进阶」react-router v6 原理通关指南

## 一 前言

不知不觉 `react-router` 已经到了 `v6` 版本了，可能很多同学发现，`v6`相比之前的 `v5` 有着翻天覆地的变化，因为最近接触到了 React 的新项目，用到了 `v6` 版本的 `react-router`，亲身体验发现这还是我认识的 `router` 吗 ？ 从 api 到原理都有较大的改动，所以今天就和大家一起看一下新版路由的变化。

对于这次的改动，笔者的建议是：**如果是新项目，可以尝试新版本的 `Rouer`，对于老项目，建议还是不要尝试升级 v6 ，升级的代价是会造成大量的功能改动，而且如果用到了依赖于 `router` 的第三方库，可能会让这些库失效。** 所以一些依赖于 react-router 的第三方库，也需要升级去迎合 `v6` 版本了，比如笔者之前的缓存页面功能的 `react-keepalive-router`，也会有大版本的更新。

通过本章节的学习，你将学习到以下内容：

* 新版本路由和老版本的差异，使用区别，API 区别。
* 新版本路由组件 Router ，Routes ，和 Route 的原理。
* Outlet 组件原理。
* useRoutes 原理。

让我们开始今天的 `router` v6 学习之旅吧。送人玫瑰🌹，手有余香，希望看完觉的有收获的同学，可以给笔者点赞 ➕ 关注一波 ，以此鼓励我继续创作前端硬文。


## 二 基本使用

首先我们从路由的使用方法上，来看一下 v6 的变化，还是举例一个场景。比如有如下的路由结构：

如上图所示，页面分为简单的 2 级路由结构：

* 第一级页面有 `home` 页面， `list` 页面，和 `children` 页面。
* 第二级页面是 children 页面的子路由，包括：`child1` 和 `child2`。

接下来看一下，新老版本路由在使用上有什么区别。

### 1 老版本路由

#### 配置老版本路由

**入口文件 -> 一级路由**

````js
const index = () => {
  return <div className="page" >
    <div className="content" >
      <BrowserRouter>
         <Menus />
         <Switch>
            <Route component={Children} /* children 组件  */
                path="/children"
            ></Route>
            <Route component={Home}     /* home 组件  */
                path={'/home'}
            ></Route>
            <Route component={List}     /* list 组件 */
                path="/list"
            ></Route>
         </Switch>
      </BrowserRouter>
    </div>
  </div>
}
````
上述为配置的一级路由的情况。我们看一下大体的功能职责分配：

* **`BrowserRouter`** ：通过 history 库，传递 `history` 对象，`location` 对象。
* **`Switch`**：匹配唯一的路由 `Route`，展示正确的路由组件。
* **`Route`**： 视图承载容器，控制渲染 `UI` 组件。

如上是一级路由的配置和对应组件的展示，接下来看一下二级路由的配置，二级路由配置在 `Children` 中：

````js
function Children (){
    return <div>
        这里是 children 页面
       <Menus />
       <Route component={Child1}
           path="/children/child1"
       />
       <Route component={Child2}
           path="/children/child2"
       />

    </div>
}
````
* 可以看到在 `Children` 中，有 `Child1` 和 `Child2` 两个组件。

看一下整体效果：


那么整体路由层级的结构图，如下所示（重点看和 v6 的整体设计的区别 ）：



#### 路由状态和页面跳转

**v5可以通过以下方式获取路由状态**

* **`props` + `Route`**： Route 承载的 ui 组件可以通过 props 来获取路由状态，如果想要把路由状态传递给子孙组件，那么可以通过 props 逐层传递的方式。  
* **`withRouter`** ： withRouter 是一个高阶组件 HOC ，因为默认只有被 `Route` 包裹的组件才能获取到路由状态，如果当前非路由组件获取状态，那么可以通过 withRouter 包裹来获取 `history` ，`location` 等信息。
* **`useHistory`** ：函数组件可以通过 `useHistory` 获取 `history` 对象。
* **`useLocation`** ：函数组件可以通过 `useLocation` 获取 `location` 对象。

**v5通过以下方式实现路由跳转**

上面介绍了路由状态获取，那么还有一个场景就是切换路由，那么 v5 主要是通过两种方式改变路由：

* 通过 `react-router-dom` 内置的 `Link`， `NavLink` 组件来实现路由跳转。
* 通过 `history` 对象下面的路由跳转方法，比如 push 等，来实现路由的跳转。


#### 整体架构设计

**路由状态传递**

至于在 React 应用中，路由状态是通过什么传递的呢，我们都知道，在 React 应用中， `Context` 是一个非常不错的状态传递方案，那么在 Router 中也是通过 context 来传递的，在 `react-router` `v5.1.0`及之前的版本，是把 history ，location 对象等信息通过一个 `RouterContext` 来传递的。

在 v5.2.0 到新版本 v5 React-Router 中，除了用 `RouterContext` 保存状态之外，history 状态由 `HistoryContext` 单独保存。

**路由模块的整体设计**

接下来我们看一下 v5 的 react-router 的整体设计：



### 2 v6 router 尝鲜


## 三 原理分析

### 1 新版 Route 设计

### 2 branch 感念

### 3 Routes 

## 四 v5 和 v6 区别 

## 五 总结



### 参考资料

* [Upgrading from v5](https://github.com/remix-run/react-router/blob/main/docs/upgrading/v5.md)


/*----------------------*/

Routes -> useRoutes 

useRoutes -> matchRoutes 匹配唯一路由 -> _renderMatches

flattenRoutes

matchRoutes -> matchRouteBranch 

/*
branch = {
   path:'',
   routesMeta:[ routeItem ],
   score:24
}

routeItem = {
   caseSensitive,
   childrenIndex,
   relativePath,
   route: { children }
}

route = {
   caseSensitive,
   children,
   element, // 组件
   index,
   path
}
*/

