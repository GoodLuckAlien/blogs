import React from 'react'
import './app.scss'
import { BrowserRouter as Router, Switch, Route, Redirect } from 'react-router-dom'

import Detail from '../src/page/detail'
import List from '../src/page/list'
import Index from '../src/page/home/index'

// const menusList = [
//   {
//     name: '首页',
//     path: '/index'
//   },
//   {
//     name: '列表',
//     path: '/list'
//   },
//   {
//     name: '详情',
//     path: '/detail'
//   },
// ]

const list = [ 'aaa' , 'bbb' , 'ccc'  ]

const index = () => {
  return <div >
    <div >
     
      <Router  >
        <Switch>
          <Route path={'/index'} component={Index} ></Route>
          <Route path={'/list'} component={List} ></Route>
          <Route path={'/detail'} render={ ()=><Detail list={list}  /> } ></Route>
          {/*  路由不匹配，重定向到/index  */}
          <Redirect from='/*' to='/index' />
        </Switch>
      </Router>
    </div>
  </div>
}

export default index