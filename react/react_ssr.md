# React ssr 整理

## 同构

一套React代码在服务器上运行一遍，到达浏览器又运行一遍。服务端渲染完成页面结构，浏览器端渲染完成事件绑定。

### 路由同构

**服务端同构**

````js
// server/index.js
import express from 'express';
import {render} from './utils';

const app = express();
app.use(express.static('public'));
//注意这里要换成*来匹配
app.get('*', function (req, res) {
   res.send(render(req));
})
 
app.listen(3001, () => {
  console.log('listen:3001')
})
````

````js
// server/utils.js
import Routes from '../Routes'
import { renderToString } from 'react-dom/server';
//重要是要用到StaticRouter
import { StaticRouter } from 'react-router-dom'; 
import React from 'react'

export const render = (req) => {
  //构建服务端的路由
  const content = renderToString(
    <StaticRouter location={req.path} >
      {Routes}
    </StaticRouter>
  );
  return `
    <html>
      <head>
        <title>ssr</title>
      </head>
      <body>
        <div id="root">${content}</div>
        <script src="/index.js"></script>
      </body>
    </html>
  `
}
````

**客户端同时构建**

````js
import React from 'react';
import ReactDom from 'react-dom';
import { BrowserRouter } from 'react-router-dom'
import Routes from '../Routes'

const App = () => {
  return (
    <BrowserRouter>
      {Routes}
    </BrowserRouter>
  )
}
ReactDom.hydrate(<App />, document.getElementById('root'))
````


## 初始化数据处理

问题整理：

* 为什么要用服务端渲染 ssr ?
* 和 csr 相比 ssr 优势在哪里？
* React ssr 如何处理路由问题？
* 解决 css 问题。

### 数据注水

````js

//node server  参考代码
http.createServer((req, res) => {
    
        const url = req.url;
        if(url.indexOf('.')>-1) { res.end(''); return false;}

        res.writeHead(200, {
            'Content-Type': 'text/html'
        });

        console.log(url);
        //查找组件
        const branch =  matchRoutes(routes,url);
        //得到组件
        const Component = branch[0].route.component;
        //数据预取
        const data = Component.getInitialProps(branch[0].match.params);
        //组件渲染为 html
        const html = renderToString(<Component data={data}/>);
        //数据注水
        const propsData = `<textarea style="display:none" id="krs-server-render-data-BOX">${JSON.stringify(data)}</textarea>`;

        // 通过 ejs 模板引擎将数据注入到页面
        ejs.renderFile('./index.html', {
            htmlContent: html,  
            propsData
        },  // 渲染的数据key: 对应到了ejs中的index
            (err, data) => {
                if (err) {
                    console.log(err);
                } else {
                    console.log(data);
                    res.end(data);
                }
            })

 }).listen(8080);
 
 //node ejs html
 
 <!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <meta http-equiv="X-UA-Compatible" content="ie=edge">
</head>
<body>
    <div id="rootEle">
        <%- htmlContent %> //组件 html内容
    </div>
    
    <%- propsData %> //组件 init  state ，现在是个字符串
</body>
</html>
</body>
````
隐式插入文本域，内部带有数据

### 数据脱水：

````js

// 定义 context 生产者 组件

import React,{createContext} from 'react';
import RootContext from './route-context';

export default class Index extends React.Component {
    constructor(props,context) {
        super(props);
    }

    render() {
        return <RootContext.Provider value={this.props.initialData||{}}>
            {this.props.children}
        </RootContext.Provider>
    }
}

//入口  app.js
import React from 'react';
import ReactDOM from 'react-dom';
import { BrowserRouter } from 'react-router-dom';
import Routes from '../';
import Provider from './provider';


//渲染入口  接收脱水数据
function renderUI(initialData) {
    ReactDOM.hydrate(<BrowserRouter><Provider initialData={initialData}>
        <Routes />
    </Provider>
    </BrowserRouter>, document.getElementById('rootEle'), (e) => {
    });
}

//函数执行入口
function entryIndex() {
    let APP_INIT_DATA = {};
    let state = true;

    //取得数据
    let stateText = document.getElementById('krs-server-render-data-BOX');

    if (stateText) {
        APP_INIT_DATA = JSON.parse(stateText.value || '{}');
    }


    if (APP_INIT_DATA) {//客户端渲染
        
        renderUI(APP_INIT_DATA);
    }
}

//入口执行
entryIndex();

````

## css处理
