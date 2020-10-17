# react-router源码解析



## 正确理解react-router


## 理解history库

react-router路由离不开history库，history专注于记录路由history状态，以及path改变了，我们应该**做写什么**，
在history模式下用popstate监听路由变化，在hash模式下用hashchange监听路由的变化。

接下来我们看 Browser模式下的createBrowserHistory 和 Hash模式下的 createHashHistory方法。

### createBrowserHistory

Browser模式下路由的运行 ，一切都从**createBrowserHistory**开始。这里我们参考的history-4.7.2版本，最新版本中api可能有些出入，但是原理都是一样的，在解析history过程中，我们重点关注setState ,push ,handlePopState,listen方法

````js
/* 这里简化了createBrowserHistory，列出了几个核心api及其作用 */
function createBrowserHistory(){
    /* 全局history  */
    const globalHistory = window.history
    /* 处理路由转换管理者，记录了listens信息。 */
    const transitionManager = createTransitionManager()
    /* 改变location对象，通知组件更新 */
    const setState = () => { /* ... */ }
    
    /* 处理当path改变后，处理popstate变化的回调函数 */
    const handlePopState = () => { /* ... */ }
   
    /* history.push方法，改变路由，通过全局对象history.pushState 通知router触发更新，替换组件 */
    const push=() => { /*...*/ }
    
    /* 底层应用事件监听器，监听popstate事件 */
    const listen=()=>{ /*...*/ } 
    return {
       push,
       listen,
       /* .... */ 
    }
}
````
下面逐一分析各个api,和他们之前的相互作用

#### setState

````js
const setState = (nextState) => {
    /* 合并信息 */
    Object.assign(history, nextState)
    history.length = globalHistory.length
    /* 通知每一个listens 路由已经发生变化 */
    transitionManager.notifyListeners(
      history.location,
      history.action
    )
  }
````
**代码很简单：统一每个transitionManager管理的listener路由状态已经更新。**

什么时候绑定litener， 我们在接下来的**React-Router**代码中会介绍。


#### listen 

````js
const listen = (listener) => {
    /* 添加listen */
    const unlisten = transitionManager.appendListener(listener)
    checkDOMListeners(1)

    return () => {
      checkDOMListeners(-1)
      unlisten()
    }
}
````
**checkDOMListeners**

````js
const checkDOMListeners = (delta) => {
    listenerCount += delta
    if (listenerCount === 1) {
      addEventListener(window, PopStateEvent, handlePopState)
      if (needsHashChangeListener)
        addEventListener(window, HashChangeEvent, handleHashChange)
    } else if (listenerCount === 0) {
      removeEventListener(window, PopStateEvent, handlePopState)
      if (needsHashChangeListener)
        removeEventListener(window, HashChangeEvent, handleHashChange)
    }
  }
````

listen本质通过checkDOMListeners的参数 **1** 或 **-1** 来绑定/解绑  **popstate** 事件，当路由发生改变的时候，调用处理函数 **handlePopState**。

接下来我们看看push方法。

#### push

````js
 const push = (path, state) => {
    const action = 'PUSH'
    /* 1 创建location对象 */
    const location = createLocation(path, state, createKey(), history.location)
    /* 确定是否能进行路由转换，还在确认的时候又开始了另一个转变 ,可能会造成异常 */
    transitionManager.confirmTransitionTo(location, action, getUserConfirmation, (ok) => {
      if (!ok)
        return
      const href = createHref(location)
      const { key, state } = location
      if (canUseHistory) {
        /* 改变 url */
        globalHistory.pushState({ key, state }, null, href)
        if (forceRefresh) {
          window.location.href = href
        } else {
          /* 改变 react-router location对象, 创建更新环境 */
          setState({ action, location })
        }
      } else {
        window.location.href = href
      }
    })
  }
````
push ( history.push ) 流程大致是 **首先生成一个最新的locationd对象，然后通过window.history.pushState方法改变浏览器当前路由(即当前的path),最后通过setState方法通知React-Router更新，并传递当前的location对象**。

#### handlePopState

最后我们来看看当popState监听的函数，当path改变的时候会发生什么，

````js
/* 我们简化一下handlePopState */
const handlePopState = (event)=>{
     /* 获取当前location对象 */
    const location = getDOMLocation(event.state)
    const action = 'POP'

    transitionManager.confirmTransitionTo(location, action, getUserConfirmation, (ok) => {
        if (ok) {
          setState({ action, location })
        } else {
          revertPop(location)
        }
    })
}
````
handlePopState 代码很简单 ，判断一下action类型为pop,然后 setState ，从新加载组件。

**我们用一幅图来描述了一下整体流程。**


### createHashHistory


## react-router使用


## 核心api

### Router

**Router 作用是把 history location 等路由信息 传递下去**

**Router**
````js
/* Router 作用是把 history location 等路由信息 传递下去  */
class Router extends React.Component {
  static computeRootMatch(pathname) {
    return { path: '/', url: '/', params: {}, isExact: pathname === '/' };
  }
  constructor(props) {
    super(props);
    this.state = {
      location: props.history.location
    };
    //这有点麻烦。我们得开始监听位置
    //如果存在任何<Redirect>，则在构造函数中进行更改
    //在初始渲染时。如果有，它们将在
    //由于cDM在子组件身上发生火灾，我们可能会
    //在安装<Router>之前获取一个新位置。
    this._isMounted = false;
    this._pendingLocation = null;
    /* 此时的history，是history创建的history对象 */
    if (!props.staticContext) {
      /* 这里判断 componentDidMount 和 history.listen 执行顺序 然后把 location复制 ，防止组件重新渲染 */
      this.unlisten = props.history.listen(location => {
        /* 创建监听者 */
        if (this._isMounted) {
          this.setState({ location });
        } else {
          this._pendingLocation = location;
        }
      });
    }
  }
  componentDidMount() {
    this._isMounted = true;
    if (this._pendingLocation) {
      this.setState({ location: this._pendingLocation });
    }
  }
  componentWillUnmount() {
    /* 解除监听 */
    if (this.unlisten) this.unlisten();
  }
  render() {
    return (
      /*  这里可以理解 react.createContext 创建一个 context上下文 ，保存router基本信息。children */
      <RouterContext.Provider
          children={this.props.children || null}
          value={{
          history: this.props.history,
          location: this.state.location,
          match: Router.computeRootMatch(this.state.location.pathname),
          staticContext: this.props.staticContext
        }}
      />
    );
  }
}
````
总结：

初始化绑定listen, 路由变化,通知改变location,改变组件。 react的history路由状态是保存在React.Content上下文之间, 状态更新。

**一个项目应该有一个根Router ， 来产生切换路由组件之前的更新作用。**
**如果存在多个Router会造成，会造成切换路由，页面不更新的情况。**

### Switch

根据router更新流，来渲染当前组件。

````js
/* switch组件 */
class Switch extends React.Component {
  render() {
    return (
      <RouterContext.Consumer>
        {/* 含有 history location 对象的 context */}
        {context => {
          invariant(context, 'You should not use <Switch> outside a <Router>');
          const location = this.props.location || context.location;
          let element, match;
          //我们使用React.Children.forEach而不是React.Children.toArray（）.find（）
          //这里是因为toArray向所有子元素添加了键，我们不希望
          //为呈现相同的两个<Route>s触发卸载/重新装载
          //组件位于不同的URL。
          // 这里只需然第一个 含有 match === null 的组件
          React.Children.forEach(this.props.children, child => {
            if (match == null && React.isValidElement(child)) {
              element = child;
              // 子组件 也就是 获取 Route中的 path 或者 rediect 的 from
              const path = child.props.path || child.props.from;
              match = path
                ? matchPath(location.pathname, { ...child.props, path })
                : context.match;
            }
          });
          return match
            ? React.cloneElement(element, { location, computedMatch: match })
            : null;
        }}
      </RouterContext.Consumer>
    );
  }
}

````
找到与当前path,匹配的组件进行渲染。 通过 pathname 和 组件的path进行匹配。找到服务path的router组件。

#### matchPath
````js
function matchPath(pathname, options = {}) {
  if (typeof options === "string" || Array.isArray(options)) {
    options = { path: options };
  }

  const { path, exact = false, strict = false, sensitive = false } = options;

  const paths = [].concat(path);

  return paths.reduce((matched, path) => {
    if (!path && path !== "") return null;
    if (matched) return matched;

    const { regexp, keys } = compilePath(path, {
      end: exact,
      strict,
      sensitive
    });
    const match = regexp.exec(pathname);
    /* 匹配不成功，返回null */
    if (!match) return null;

    const [url, ...values] = match;
    const isExact = pathname === url;

    if (exact && !isExact) return null;

    return {
      path, // the path used to match
      url: path === "/" && url === "" ? "/" : url, // the matched portion of the URL
      isExact, // whether or not we matched exactly
      params: keys.reduce((memo, key, index) => {
        memo[key.name] = values[index];
        return memo;
      }, {})
    };
  }, null);
}
````

### Route

````js
/**
 * The public API for matching a single path and rendering.
 */
class Route extends React.Component {
  render() {
    return (
      <RouterContext.Consumer>
        {context => {
          /* router / route 会给予警告警告 */
          invariant(context, "You should not use <Route> outside a <Router>");
          // computedMatch 为 经过 swich处理后的 path
          const location = this.props.location || context.location;
          const match = this.props.computedMatch 
            ? this.props.computedMatch // <Switch> already computed the match for us
            : this.props.path
            ? matchPath(location.pathname, this.props)
            : context.match;
          const props = { ...context, location, match };
          let { children, component, render } = this.props;

          if (Array.isArray(children) && children.length === 0) {
            children = null;
          }

          return (
            <RouterContext.Provider value={props}>
              {props.match
                ? children
                  ? typeof children === "function"
                    ? __DEV__
                      ? evalChildrenDev(children, props, this.props.path)
                      : children(props)
                    : children
                  : component
                  ? React.createElement(component, props)
                  : render
                  ? render(props)
                  : null
                : typeof children === "function"
                ? __DEV__
                  ? evalChildrenDev(children, props, this.props.path)
                  : children(props)
                : null}
            </RouterContext.Provider>
          );
        }}
      </RouterContext.Consumer>
    );
  }
}
````

匹配path,渲染组件。

### Redirect

重定向组件， 如果来路由匹配上，会重定向对应的路由。

````js
function Redirect({ computedMatch, to, push = false }) {
  return (
    <RouterContext.Consumer>
      {context => {
        invariant(context, 'You should not use <Redirect> outside a <Router>');

        const { history, staticContext } = context;

        const method = push ? history.push : history.replace;
        /* 找到符合match的location ，格式化location*/
        const location = createLocation(
          computedMatch
            ? typeof to === 'string'
              ? generatePath(to, computedMatch.params)
              : {
                  ...to,
                  pathname: generatePath(to.pathname, computedMatch.params)
                }
            : to
        )
        /* 初始化的时候进行路由跳转，当初始化的时候，mounted执行push方法，当组件更新的时候，如果location不相等。同样会执行history方法重定向 */
        return (
          <Lifecycle
              onMount={() => {
              method(location);
            }}
              onUpdate={(self, prevProps) => {
              const prevLocation = createLocation(prevProps.to);
              if (
                !locationsAreEqual(prevLocation, {
                  ...location,
                  key: prevLocation.key
                })
              ) {
                method(location);
              }
            }}
              to={to}
          />
        );
      }}
    </RouterContext.Consumer>
  );
}

````

**初始化的时候进行路由跳转，当初始化的时候，mounted执行push方法，当组件更新的时候，如果location不相等。同样会执行history方法重定向**


## 总结+流程分析