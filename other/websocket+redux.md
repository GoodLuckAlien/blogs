
# websocket长连接和公共状态管理方案（vuex + websocket or redux + websocket ）

## 为什么将websocket和公共状态管理扯到一起

我们都知道在vue和react这种单页面组件化项目中，建立socket连接会遇到:**重复连接**，**切换页面连接中断** ,**状态丢失**等问题，而且如果想要在任何页面接受到来自socket传递的信息，所以在建立socket连接时候就要考虑是否要把连接实例化放在公共state里边统一管理，这样可以方便在任何组件中调用socket方法。这里会介绍socket与Vuex和redux进行连接实时接受信息改变数据的方案。



**此方案根本解决问题:**

① 根本上解决单页面组件重复连接，切换页面组件连接中断，状态丢失等问题。
② 状态统一管理，统一调度中心。任意页面共享数据源，任意页面实现推送数据。
③ socket连接层面和组件层面的耦合程度降到最低。

## websocket与公共状态管理逻辑图


**总结**

**本方案的大体思路就是如上图所示，现在页面初始化的时候根据需要向vuex或者redux发起dispatch触发初始化的方法，初始化的时候触发websocket,js构造函数或者类的实例，并且要把改变公共状态方法的commit作为参数传递给socket实例 ， 而真正建立起socket连接的方法实在webosocket实例中进行的，websocket实例会暴露出两个方法，一个subscribe用来监听服务端传递的信息来改变管理状态，当然这里的触发是根据调用commit函数来触发的，另一个是又任意组件调用的emit方法 ，来把信息传递给服务端，从而实现了双向通信，并把通信回执内容放在公共状态管理，避免切换组件信息丢失，重新连接，丢失连接等情况发生。下面会拿vuex例子具体讲一下流程。**

## 成功案例(websocket与vue及vuex为例子)

### 方案结构及其初始化流程

**目录文件**

以上就是文件的格式（这里简化了）， **websocket.js**就是socket调度中心(此方案的核心)，里边集成了**订阅器**，**发布器**，**失败调度**，**心跳机制**的等等 ， vuex下边的socket.js就是一个vuex模块, 在dva中可以理解成一个model, 
socket.vue就是要用到socket连接的组件，废话不说，下面一一解释.

**在页面组件中初始化**

首先我们来看socket初始化

```javascript
 if (!socket.ws) {
            //在socket.vue文件中初始化socket连接
     this.$store.dispatch('socketInit')
 }
```
这是只是单独触发了一个**dispatch** ,  在调用了一个**socketInit**方法，然后我们来看vuex中socket.js中的socketInit方法。

````javascript
import Socket from '../websocket' //socket 方法类
import socketAction from '../../config/socket' //这个是对服务端的数据处理的中间件函数，这里可以忽略

export default {
    state: {
        ws: null, // websorket实例
    
    },
    mutations: {
        subscribe_socket (state,{data}){
            //这里的data为socket连接后端返回来的数据
        },
        contentSocket (state, { commit }) {
            state.ws = new Socket(commit, socketAction)
        }
    },
    actions: {
        // 创建实例
        socketInit ({commit, state}) {
            commit('contentSocket', { commit }) //把commit作为参数
        }
    }
}
````
在vuex的异步函数actions调用了初始化的方法，然后把触发contentSocket 发法来创建实例，并绑定在state上的ws上，这里一定要把commit 来作为参数，一边socket实例能触发方法改变state,我们知道了socket实例如何绑定和commit传递的了 ，下面我们看看websocket.js 整个核心调度是怎么运作的。

**socket核心调度**
````javascript
function socket (commit, actions) {
    if (isType(commit) !== 'Function') {
        throw new Error('commit must be a function')
    }  
    this.commit = commit //触发vuex中mutations的commit
    this.actions = actions || null
    this.timer = null
    this.errorResetNumber = 0      // 错误重连间隔
    this.closeWs = false
    this.errorFrom = 0             // socket断开来源
    this.errorResetTimer = null    // 错误重连轮询
    this.errorDispatchOpen = true  // 开启错误调度
    this.heartSocketOpen = false   // 心跳
    isSocketContent()
    this.$soctket_init() //
}

````
我们看到了websocket函数是一个构造函数用来做初始化操作， isSocketContent()是用来获取token等操作大家不必在意， 这里触发了一个$socket_init()方法，接下来我们看一下$soctket_init()方法


````javascript
socket.prototype.$socket_init = function (callback) {
    const _this = this
    if (_this.closeWs) {
        throw new Error('socket is closed ,$socker_init is fail ,  all methods is invalid')
    }
    const token = window.localStorage.getItem('token') || window.sessionStorage.getItem('token') || null

    if (!token) {
        throw new Error('token  is underfined')
    } 
    const handerErrorMachine = () => { 
        if (_this.errorResetNumber === 4) {
            _this.errorResetNumber = 0
            _this.errorResetTimer = null
            _this.errorFrom = 0
            _this.errorDispatchOpen = false
            _this.ws = null
            console.log('socket连接失败')
            return
        }
        _this.errorResetTimer = setTimeout(() => {
            /* 失败重新连接 */
            _this.$soctket_init()
            _this.errorResetNumber++
        }, _this.errorResetNumber * 2000)
    } 
    
    const errorDispatch = (eventment) => { //错误调度
        let event = eventment
        return function () {
            if (_this.errorFrom === 0 && _this.errorDispatchOpen) {
                _this.errorFrom = event
            }
            event === 1 ? console.log('web socket has failed  from closeState ') : console.log('web socket has failed  from errorState ')
            if (_this.errorFrom === event && !_this.closeWs) {
                _this.errorResetTimer && clearTimeout(_this.errorResetTimer)
                handerErrorMachine()
            }   
        }
    }
    if (this.timer) clearTimeout(this.timer)

    _this.ws = new WebSocket(socketUrl + '?token=' + token) //这里才进行了真正的socket连接

    _this.ws.onopen = function () {
        callback && callback()
        _this.errorResetNumber = 0
        _this.errorResetTimer = null
        _this.errorFrom = 0
        _this.errorDispatchOpen = true
        /* 接受消息，改变状态 */
        _this.$soctket_subscribe()
        _this.$soctket_heartSoctket()
        console.log('web socket has connected ')
    }

    _this.ws.onclose = errorDispatch(1)
    _this.ws.onerror = errorDispatch(2)
}
````
这里才是真正的socket连接 和一些错误处理方式 ， 这里把socket连接和构造函数中的ws绑定在一起，以及一个连接失败的调度机制 ， 里边有一个之前一直提到的方法，$socket_subscribe() 没错就是它，监听后端传来信息的方法，并且触发vuex ,commit方法，改变state，通知view视图更新，值得提出的一点是.$socket_heartSoctket() 是一个心脏搏动机制，我们知道如果socket连接长时间没有通话会自动断开连接，所以这里有一个心脏搏动机制。接下来我们看一下，socket_subscribe 方法。

### subscribe订阅接受信息，改变状态

```javascript
/**
* 接受广播 -> 督促view更新
*/

socket.prototype.$socket_subscribe = function () {
    const _this = this
    _this.ws.onmessage = function (res) {
        if (_this.actions) {
            if (isType(_this.actions) !== 'Function') {
                throw new Error('actions')
            } else {
               
                _this.commit(..._this.actions(res.data))
            }
        } else {
            _this.commit(res.data)
            
        }    
        _this.$soctket_heartSoctket()
    }
}
```
我们才看到原来之前vuex传进来的 commit 在这里发挥了作用，也就是触发mutations 来改变state里边 的数据 ，来重新渲染试图 ，接下来我们看一下emit触发器。

### emit 任意组件传递信息

````javascript
 /**
* 触发器->发布信息
* @param callback 状态处理
* @param value 数据处理
*/
socket.prototype.$socket_emit = function (value, callback) {
    const _this = this
    const poll = function () {
        return _this.ws.readyState
    }
    if (callback && isType(callback) !== 'Function') {
        throw new Error('$socket_emit arugment[1] must be a function')
    }
    if (!_this.ws) {
        throw new Error('$socket dispatch is fail please use $socket_open method')
    }
    if (_this.ws.readyState === 1) { // 连接成功状态
        _this.ws.send(value)
        _this.$soctket_heartSoctket()
        callback && callback()
    }
    else if (_this.ws.readyState === 0) { // 连接中状态 ，轮询查询连接
        eventPoll(poll, 1, 500, () => {
            _this.ws.send(value)                                                             
            _this.$soctket_heartSoctket()
            callback && callback()
        })
    }
    else { // 失败重新连接
        _this.$soctket_init(() => {
            _this.$soctket_emit(value, callback)
        })
    }
}
````

这个就是之前提到的emit 触发器 用来在vue中调用， 来向服务端发起数据通信，就实现了双向的数据通信， 里边有一个轮询器 来轮询eventPoll ，websocket 的状态是否是已经连通的状态
，那么在Vue文件中是怎么调用emit的呢 ，很简单就是调用vuex中之前绑定的state里边的wx。

**任意组件中**

````javascript
 const { ws } = this.$store.state.socket
   ws.$soctket_emit(JSON.stringify({
                data: 'hello , world'
    }), () => {
        console.log('发送成功')
    })
````
就是这么简单触发的。以上整个机制都已经讲解了一边，那么还有心跳机制，给大家介绍一下。

### heart心跳机制

````javascript
/**
* 心脏搏动机制->防止断开连接
*/
socket.prototype.$soctket_heartSoctket = function () {  
    if (this.timer) clearTimeout(this.timer)
    console.log(this.timer)
    this.timer = setTimeout(() => {
        if (this.ws.readyState === 1 || this.ws.readyState === 0) {
            this.ws.send('heart , socket')
            this.$soctket_heartSoctket()
        } else {
            this.$soctket_init()
        }
    }, 59000)
```
就是不断向服务端发起消息，来防止断开连接。
还有两个方法来控制ws的连接和关闭。

````javascript
/**
* 开启，关闭 socket
*/
/**
* 关闭socket连接
*/
socket.prototype.$soctket_close = function () {
    if (this.timer) clearTimeout(this.timer)
    if (this.errorResetTimer)clearTimeout(this.errorResetTimer)
    this.closeWs = true
    this.ws.close()
}
/**
* 重启socket连接
*/
socket.prototype.$soctket_open = function () {
    if (!this.closeWs) {
        throw new Error('socket is connected')
    }
    this.timer = null
    this.errorResetNumber = 0
    this.closeWs = false
    this.errorFrom = 0
    this.errorResetTimer = null
    this.errorDispatchOpen = true
    this.heartSocketOpen = false
    this.closeWs = false
    this.$soctket_init()
}

````

## 小程序的socket连接 ，
小程序的socket连接和h 的差不多一个体系，也是用此方案连接, 收到不同小程序框架影响,commit的传递方式和h5有点出入，这里就不解释了，这套体系在项目中还是比较稳定的，[喜欢的朋友欢迎来到gitHub上下载源码](https://github.com/AlienZhaolin/websocket-vue-react-)。