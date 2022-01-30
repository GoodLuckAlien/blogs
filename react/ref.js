/* eslint-disable react/no-multi-comp */
import React, { useState } from 'react'
/**
 * Ref 学习——基础
 * 1 ref 对象和 ref 对象创建
 * 2 ref 标签获取方式（三种） （1）ref对象  （2）函数 （3）字符串
 * 3 useRef 用法使用
 * 4 useImpertiveHanle 用法和使用
 * 5 forwardRef 用法和使用
 */

/*
 * TODO: demo1 用 ref 实现父子组件的通信
 * 输入 input 点击按钮 ，实现 父 <-> 子 双向通信
*/


/* 子组件 */
class Son extends React.PureComponent{
    state={
        fatherMes:''
    }
    render(){
        const { fatherMes } = this.state
        return <div className="sonbox" >
            <div className="title" >子组件</div>
            <p>父组件对我说：{fatherMes}</p>
            <div className="label" >对父组件说</div> <input  className="input"/>
            <button className="searchbtn">to father</button>
        </div>
    }
}
/* 父组件 */
export  function Father(){
    return <div className="box" >
        <div className="title" >父组件</div>
        <p>子组件对我说：  </p>
        <div className="label" >对子组件说</div> <input className="input"/>
        <button className="searchbtn">to son</button>
        <Son />
    </div>
}




/* TODO: demo2：获取函数子组件状态  */
function Son2(){
    const [ number , setNumber ] = useState(0)
   return <div>
       {number}
       <span>htt</span>
       <button onClick={setNumber(number + 1)} >点击</button>
   </div>
}

export function Father2(){
    const handleClick = ()=>{
        /* 点击按钮，如何获取 Son2 组件中的 number 状态 */
    }
    return <div>
        <Son2 />
        <button onClick={handleClick} ></button>
    </div>
}


/* TODO: demo3：跨层级传递 ref */
/* GrandFather 如何获取到 Son3 中 <div >这个是想要获取的元素</div> 这个元素节点   */
function Son3(){
    return <div>
        子组件
        <div >这个是想要获取的元素</div>
    </div>
}

function Father3(){
    return <div>
        父组件
       <Son3 />
    </div>
}

export function GrandFather(){
    return <div>
        爷爷组件
        <Father3 />
    </div>
}