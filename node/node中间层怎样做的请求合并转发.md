# node中间层怎样做的请求合并转发


## 1 什么是中间层

就是前端---请求---> nodejs ----请求---->后端 ----响应--->nodejs--数据处理---响应---->前端。这么一个流程，这个流程的好处就是当业务逻辑过多，或者业务需求在不断变更的时候，前端不需要过多当去改变业务逻辑，与后端低耦合。前端即显示，渲染。后端获取和存储数据。中间层处理数据结构，返回给前端可用可渲染的数据结构。
nodejs是起中间层的作用，即根据客户端不同请求来做相应的处理或渲染页面，处理时可以是把获取的数据做简单的处理交由底层java那边做真正的数据持久化或数据更新，也可以是从底层获取数据做简单的处理返回给客户端。
通常我们把Web领域分为客户端和服务端，也就是前端和后端，这里的后端就包含了网关，静态资源，接口，缓存，数据库等。而中间层呢，就是在后端这里再抽离一层出来，在业务上处理和客户端衔接更紧密的部分，比如页面渲染（SSR），数据聚合，接口转发等等。
以SSR来说，在服务端将页面渲染好，可以加快用户的首屏加载速度，避免请求时白屏，还有利于网站做SEO，他的好处是比较好理解的。


## 2 中间层可以做的事情

代理：在开发环境下，我们可以利用代理来，解决最常见的跨域问题；在线上环境下，我们可以利用代理，转发请求到多个服务端。
缓存：缓存其实是更靠近前端的需求，用户的动作触发数据的更新，node中间层可以直接处理一部分缓存需求。
限流：node中间层，可以针对接口或者路由做响应的限流。
日志：相比其他服务端语言，node中间层的日志记录，能更方便快捷的定位问题（是在浏览器端还是服务端）。
监控：擅长高并发的请求处理，做监控也是合适的选项。
鉴权：有一个中间层去鉴权，也是一种单一职责的实现。
路由：前端更需要掌握页面路由的权限和逻辑。
服务端渲染：node中间层的解决方案更灵活，比如SSR、模板直出、利用一些JS库做预渲染等等。

## node转发API(node中间层)的优势

可以在中间层把java|php的数据，处理成对前端更友好的格式
可以解决前端的跨域问题，因为服务器端的请求是不涉及跨域的，跨域是浏览器的同源策略导致的
可以将多个请求在通过中间层合并，减少前端的请求

## 如何做请求合并转发

使用express中间件multifetch可以将请求批量合并
使用express+http-proxy-middleware实现接口代理转发

## 不使用用第三方模块手动实现一个nodejs代理服务器，实现请求合并转发


### 1 实现思路

①搭建http服务器，使用Node的http模块的createServer方法
②接收客户端发送的请求，就是请求报文，请求报文中包括请求行、请求头、请求体
③将请求报文发送到目标服务器，使用http模块的request方法

### 2 实现步骤

第一步：http服务器搭建

````js
const http = require("http");
const server = http.createServer();
server.on('request',(req,res)=>{
    res.end("hello world")
})
server.listen(3000,()=>{
    console.log("running");
})
````

第二步：接收客户端发送到代理服务器的请求报文

````js
const http = require("http");
const server = http.createServer();
server.on('request',(req,res)=>{
    // 通过req的data事件和end事件接收客户端发送的数据
    // 并用Buffer.concat处理一下
    //
    let postbody = [];
    req.on("data", chunk => {
        postbody.push(chunk);
    })
    req.on('end', () => {
        let postbodyBuffer = Buffer.concat(postbody);
        res.end(postbodyBuffer)
    })
})
server.listen(3000,()=>{
    console.log("running");
})
````

这一步主要数据在客户端到服务器端进行传输时在nodejs中需要用到buffer来处理一下。处理过程就是将所有接收的数据片段chunk塞到一个数组中，然后将其合并到一起还原出源数据。合并方法需要用到Buffer.concat，这里不能使用加号，加号会隐式的将buffer转化为字符串，这种转化不安全。

第三步：使用http模块的request方法，将请求报文发送到目标服务器
第二步已经得到了客户端上传的数据，但是缺少请求头，所以在这一步根据客户端发送的请求需要构造请求头，然后发送


````js
const http = require("http");
const server = http.createServer();

server.on("request", (req, res) => {
    var { connection, host, ...originHeaders } = req.headers;
    var options = {
        "method": req.method,
        // 随表找了一个网站做测试，被代理网站修改这里
        "hostname": "www.nanjingmb.com",
        "port": "80",
        "path": req.url,
        "headers": { originHeaders }
    }
    //接收客户端发送的数据
    var p = new Promise((resolve,reject)=>{
        let postbody = [];
        req.on("data", chunk => {
            postbody.push(chunk);
        })
        req.on('end', () => {
            let postbodyBuffer = Buffer.concat(postbody);
            resolve(postbodyBuffer)
        })
    });
    //将数据转发，并接收目标服务器返回的数据，然后转发给客户端
    p.then((postbodyBuffer)=>{
        let responsebody=[]
        var request = http.request(options, (response) => {
            response.on('data', (chunk) => {
                responsebody.push(chunk)
            })
            response.on("end", () => {
                responsebodyBuffer = Buffer.concat(responsebody)
                res.end(responsebodyBuffer);
            })
        })
        // 使用request的write方法传递请求体
        request.write(postbodyBuffer)
        // 使用end方法将请求发出去
        request.end();
    })
});
server.listen(3000, () => {
    console.log("runnng");
})

````