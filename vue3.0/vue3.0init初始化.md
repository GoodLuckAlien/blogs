①②③④⑤⑥⑦⑧⑨⑩⑪⑫⑬⑭⑮⑯⑰⑱⑲⑳
vue3.0 
整体流程 （）
1 createApp() -> 通过ensureRenderer().createApp() 创建出app -> 调用app.mount()挂载#app

2 ensureRenderer() 返回 通过createRenderer renderer

3 createRenderer return {
    1 render -> 渲染方法
    2 hydrate :存放了diff算法 ，组件挂载，patchChildren mountChildren等方法 /*  */
    3 createApp:createAppAPI(render, hydrate)

}

4createAppAPI(render,hydrate) 返回真正的createApp 函数 第一个参数接受rootComponent <App/ >  第二个参数 rootprops rootContainer->#app
创建 app , createAppContext获取全局配置信息 minxins components direactives provides等信息 
返回 app对象可以调用初始化方法{
    use,
    mixin,
    component，
    directive，
    mount，
    unmount，
    provide
}

5 调用 mount方法（ 这里的mount经过createApp()处理的）-> mount("#app")
首次创建 vnode（ vnode设置不同的类型，下面的patch方法会对于不同vnode处理逻辑大相迳庭 ） 如果不是服务端渲染的情况，调用render方法 设置isMounted true
然后调用 patch方法 ,第一次的  shapeFlag -> Compoent ，调用 processComponent方法
n1 == null 不是keeplive ->调用 mountComponent 方法 


6 mountComponent 创建 instance 组件实例 -> setupComponent 初始化组件props 和  slots 然后调用,
setupStatefulComponent
setupStatefulComponent 函数中判断有没有 setup函数
如果有vue3.0 走有setup函数的逻辑。
**setup逻辑**

① createSetupContext -> pauseTracking -> 执行setup -> resetTracking

② handleSetupResult -> 处理setupResult setup函数返回的结果 
-> reactive 数据绑定  -> 最后执行finishComponentSetup

**不走setup逻辑**

直接执行 **finishComponentSetup** 逻辑

**finishComponentSetup**
判断有没有render函数，如果有render函数，绑定给instanceVue实例

判断有没有compile,执行**compile**方法

setupRenderEffect

7 setupRenderEffect  将实例绑定update方法 update
update 是由effect 创建出来的的 渲染effect

8 在effect 绑定过程中 ，如果没有islazy指令，回立刻执行 effect instance.isMounted 为false 执行第一段逻辑

① 通过 renderComponentRoot 建立树结构 ，normalizeVNode 处理根节点render


vue 3.0源码解析一 createApp 

 > ** 前言： 。