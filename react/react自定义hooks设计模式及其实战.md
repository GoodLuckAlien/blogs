
# 玩转react-hooks,自定义hooks设计及其实战。

## 一 前言

自从react16.8，react-hooks诞生以来，在工作中一直使用hooks，一年多的时间里，接触的react项目，渐渐使用function无状态组件代替了classs声明的有状态组件，期间也总结了一些心得。尤其对于近期三个月的项目里，一点点用自定义hooks来处理公司项目中重复逻辑，总体感觉还不错。今天给大家讲讲我在工作中对react-hooks心得，和一些自定义hooks的设计思想，把在工作中的经验分享给大家。

## 二 自定义hooks设计

### 1 又回到那个问题？什么是hooks? 什么是自定义hooks

**react-hooks**
react-hooks是react16.8以后，react新增的钩子API，目的是增加代码的可复用性，逻辑性，弥补无状态组件没有生命周期，没有数据管理状态state的缺陷。笔者认为，react-hooks思想和初衷，也是把组件，颗粒化，单元化，形成独立的渲染环境，减少渲染次数，优化性能。

还不明白react-hooks的伙伴可以看的另外一篇文章：j
[react-hooks如何使用？](https://juejin.im/post/6864438643727433741)

**自定义hooks**
自定义hooks是在react-hooks基础上的一个拓展，可以根据业务需要制定满足业务需要的hooks，更注重的是逻辑单元。通过业务场景不同，我们到底需要react-hooks做什么，怎么样把一段逻辑封装起来，做到复用，这是自定义hooks产生的初衷。

### 2 如何设计一个自定义hooks？

#### 逻辑 + 组件

![在这里插入图片描述](https://img-blog.csdnimg.cn/20201028142014342.jpg?x-oss-process=image/watermark,type_ZmFuZ3poZW5naGVpdGk,shadow_10,text_aHR0cHM6Ly9ibG9nLmNzZG4ubmV0L3psX0FsaWVu,size_16,color_FFFFFF,t_70#pic_center)


hooks 专注的就是**逻辑复用**， 是我们的项目，不仅仅停留在组件复用的层面上。hooks让我们可以将一段通用的逻辑存封起来。将我们需要它的时候，开箱即用即可。

#### 自定义hooks-驱动条件


![在这里插入图片描述](https://img-blog.csdnimg.cn/20201028142044381.jpg?x-oss-process=image/watermark,type_ZmFuZ3poZW5naGVpdGk,shadow_10,text_aHR0cHM6Ly9ibG9nLmNzZG4ubmV0L3psX0FsaWVu,size_16,color_FFFFFF,t_70#pic_center)

hooks本质上是一个函数。函数的执行，决定与无状态组件组件自身的执行上下文。每次函数的执行(本质上就是组件的更新)就会执行自定义hooks的执行，由此可见组件本身执行和hooks的执行如出一辙。

那么prop的修改,useState,useReducer使用是无状态组件更新条件，那么就是驱动hooks执行的条件。
我们用一幅图来表示如上关系。

#### 自定义hooks-通用模式

我们设计的自定义react-hooks应该是长的这样的。

![在这里插入图片描述](https://img-blog.csdnimg.cn/20201028142003806.jpg?x-oss-process=image/watermark,type_ZmFuZ3poZW5naGVpdGk,shadow_10,text_aHR0cHM6Ly9ibG9nLmNzZG4ubmV0L3psX0FsaWVu,size_16,color_FFFFFF,t_70#pic_center)

````js
const [ xxx , ... ] = useXXX(参数A,参数B...)
````
在我们在编写自定义hooks的时候，要**特别～特别～特别**关注的是**传进去什么**，**返回什么**。
返回的东西是我们真正需要的。更像一个工厂，把原材料加工，最后返回我们。正如下图所示


#### 自定义hooks-条件限定

如果自定义hooks没有设计好，比如返回一个改变state的函数，但是没有加条件限定限定，就有可能造成不必要的上下文的执行，更有甚的是组件的循环渲染执行。

比如:我们写一个非常简单hooks来**格式化数组将小写转成大写**。

````js

import React , { useState } from 'react'
/* 自定义hooks 用于格式化数组将小写转成大写 */
function useFormatList(list){
   return list.map(item=>{
       console.log(1111)
       return item.toUpperCase()
   })
}
/* 父组件传过来的list = [ 'aaa' , 'bbb' , 'ccc'  ] */
function index({ list }){
   const [ number ,setNumber ] = useState(0)
   const newList = useFormatList(list)
   return <div>
       <div className="list" >
          { newList.map(item=><div key={item} >{ item }</div>) }
        </div>
        <div className="number" >
            <div>{ number }</div>
            <button onClick={()=> setNumber(number + 1) } >add</button>
        </div>
   </div>
}
export default index
````
![在这里插入图片描述](https://img-blog.csdnimg.cn/20201028142153797.gif#pic_center)

如上述问题，我们格式化父组件传递过来的list数组，并将小写变成大写，但是当我们点击add。 理想状态下数组不需要重新format，但是实际format跟着执行。无疑增加了性能开销。

**所以我们在设置自定义hooks的时候，一定要把条件限定-性能开销加进去。**

于是乎我们这样处理一下。

````js
function useFormatList(list) {
    return useMemo(() => list.map(item => {
        console.log(1111)
        return item.toUpperCase()
    }), [])
}
````

![在这里插入图片描述](https://img-blog.csdnimg.cn/20201028141947220.gif#pic_center)
**华丽丽的解决了如上的问题。**

所以一个好用的自定义hooks,一定要配合 useMemo ,useCallback等api一起使用。


## 三 自定义hooks实战


### 准备工作：搭建demo样式项目

为了将实际的业务情景和自定义<code style="color: rgb(71, 101, 130);">hooks</code>连接在一起，我这里用 <code style="color: rgb(71, 101, 130);">taro-h5</code> 构建了一个移动端<code style="color: rgb(71, 101, 130);">react</code>项目。用于描述实际工作中用到自定义<code style="color: rgb(71, 101, 130);">hooks</code>的场景。

demo项目地址 : [自定义hooks,demo项目](https://github.com/AlienZhaolin/customHooks)

后续会更新更多自定义hooks，或者感兴趣的同学可以关注一下这个项目，或者也可以一起维护这个项目。

**项目结构**


<code style="color: rgb(71, 101, 130);">page</code>文件夹里包括自定义hooks展示<code style="color: rgb(71, 101, 130);">demo</code>页面，<code style="color: rgb(71, 101, 130);">hooks</code>文件夹里面是自定义hooks内容。

**页面展示效果**
 


每个<code style="color: rgb(71, 101, 130);">listItem</code>记录每一个完成自定义hooks展示效果，陆续还有其他的<code style="color: rgb(71, 101, 130);">hooks</code>。我们接下来看看hooks具体实现。

### 实战一：控制滚动条-吸顶效果，渐变效果-<code style="color: rgb(71, 101, 130);">useScroll</code>

背景：公司的一个h5项目，在滚动条滚动的过程中，需要控制 渐变 + 高度 + 吸顶效果。

#### 1实现效果


1 首先红色色块有吸顶效果。
2 粉色色块，是固定上边但是有少量偏移，加上逐渐变透明效果。

#### 2 自定义<code style="color: rgb(71, 101, 130);">useScroll</code>设计思路

需要实现功能：

1 监听滚动条滚动。
2 计算吸顶临界值，渐变值，透明度。
3 改变<code style="color: rgb(71, 101, 130);">state</code>渲染视图。

好吧，接下来让我们用一个<code style="color: rgb(71, 101, 130);">hooks</code>来实现上述工作。

**页面**
````jsx
import React from 'react'
import { View, Swiper, SwiperItem } from '@tarojs/components'
import useScroll from '../../hooks/useScroll'
import './index.less'
export default function Index() { 
    const [scrollOptions,domRef] = useScroll()
    /* scrollOptions 保存控制透明度 ，top值 ，吸顶开关等变量 */
    const { opacity, top, suctionTop } = scrollOptions
    return <View style={{ position: 'static', height: '2000px' }} >
        <View className='white' />
        <View  id='box' style={{ opacity, transform: `translateY(${top}px)` }} >
            <Swiper
              className='swiper'
            >
                <SwiperItem className='SwiperItem' >
                    <View className='imgae' />
                </SwiperItem>
            </Swiper>
        </View>
        <View className={suctionTop ? 'box_card suctionTop' : 'box_card'}>
            <View
              style={{
                    background: 'red',
                    boxShadow: '0px 15px 10px -16px #F02F0F'
                }}
              className='reultCard'
            >
            </View>
        </View>
    </View>
}
````
我们通过一个<code style="color: rgb(71, 101, 130);">scrollOptions</code>  来保存透明度 ，<code style="color: rgb(71, 101, 130);">top</code>值 ，吸顶开关等变量，然后通过返回一个<code style="color: rgb(71, 101, 130);">ref</code>作为<code style="color: rgb(71, 101, 130);">dom</code>元素的采集器。
解下来就是hooks如果实现的。

**<code style="color: rgb(71, 101, 130);">useScroll</code>**
````js
export default function useScroll() {
 const dom = useRef(null)
  const [scrollOptions, setScrollOptions] = useState({
    top: 0,
    suctionTop: false,
    opacity: 1
  })

  useEffect(() => {
    const box = (dom.current)
    const offsetHeight = box.offsetHeight
    const radio = box.offsetHeight / 500 * 20
    const handerScroll = () => {
      const scrollY = window.scrollY
      /* 控制透明度 */
      const computerOpacty = 1 - scrollY / 160
      /* 控制吸顶效果 */
      const offsetTop = offsetHeight - scrollY - offsetHeight / 500 * 84
      const top = 0 - scrollY / 5
      setScrollOptions({
        opacity: computerOpacty <= 0 ? 0 : computerOpacty,
        top,
        suctionTop: offsetTop < radio
      })
    }
    document.addEventListener('scroll', handerScroll)
    return function () {
      document.removeEventListener('scroll', handerScroll)
    }
  }, [])
  return [scrollOptions, dom]
}
````
具体设计思路


1 我们用一个 <code style="color: rgb(71, 101, 130);">useRef</code>来获取需要元素
2 用 <code style="color: rgb(71, 101, 130);">useEffect</code> 来初始化绑定/解绑事件
3 用 <code style="color: rgb(71, 101, 130);">useState </code>来保存要改变的状态，通知组件渲染。

中间的计算过程我们可以先不计，最终达到预期效果。

**有关性能优化**

这里说一下一个无关hooks本身的性能优化点，我们在改变<code style="color: rgb(71, 101, 130);">top</code>值的时候 ，尽量用改变<code style="color: rgb(71, 101, 130);">transform</code> Y值代替直接改变top值，原因如下

1 <code style="color: rgb(71, 101, 130);">transform</code> 是可以让GPU加速的<code style="color: rgb(71, 101, 130);">CSS3</code>属性，在性能方便优于直接改变<code style="color: rgb(71, 101, 130);">top</code>值。
2 在<code style="color: rgb(71, 101, 130);">ios</code>端，固定定位频繁改变<code style="color: rgb(71, 101, 130);">top</code>值，会出现闪屏兼容性。


### 实战二：控制表单状态-<code style="color: rgb(71, 101, 130);">useFormChange</code>

背景：但我们遇到例如 列表的表头搜索，表单提交等场景，需要逐一改变每个<code style="color: rgb(71, 101, 130);">formItem</code>的<code style="color: rgb(71, 101, 130);">value</code>值，需要逐一绑定事件是比较麻烦的一件事，于是在平时的开发中，我们来用一个hooks来统一管理表单的状态。

#### 1 实现效果

**demo效果如下**

**设置值**

**重置值**


#### 2 自定义<code style="color: rgb(71, 101, 130);">useFormChange</code>设计思路

需要实现功能

1 控制每一个表单的值。
2 具有表单提交，获取整个表单数据功能。
3 点击重置，重置表单功能。

**页面**

````jsx
import useFormChange from '../../hooks/useFormChange'
import './index.less'
const selector = ['嘿嘿', '哈哈', '嘻嘻']
function index() {
    const [formData, setFormItem, reset] = useFormChange()
    const {
        name,
        options,
        select
    } = formData
    return <View className='formbox' >
        <View className='des' >文本框</View>
        <AtInput  name='value1' title='名称'  type='text' placeholder='请输入名称'  value={name} onChange={(value) => setFormItem('name', value)}
        />
        <View className='des' >单选</View>
        <AtRadio
          options={[
                { label: '单选项一', value: 'option1' },
                { label: '单选项二', value: 'option2' },
            ]}
          value={options}
          onClick={(value) => setFormItem('options', value)}
        />
        <View className='des' >下拉框</View>
        <Picker mode='selector' range={selector} onChange={(e) => setFormItem('select',selector[e.detail.value])} >
            <AtList>
                <AtListItem
                  title='当前选择'
                  extraText={select}
                />
            </AtList>
        </Picker>
        <View className='btns' >
            <AtButton type='primary' onClick={() => console.log(formData)} >提交</AtButton>
            <AtButton className='reset' onClick={reset} >重置</AtButton>
        </View>
    </View>
}
````
**<code style="color: rgb(71, 101, 130);">useFormChange</code>**

````jsx
  /* 表单/表头搜素hooks */
  function useFormChange() {
    const formData = useRef({})
    const [, forceUpdate] = useState(null)
    const handerForm = useMemo(()=>{
      /* 改变表单单元项 */
      const setFormItem = (keys, value) => {      
        const form = formData.current
        form[keys] = value
        forceUpdate(value)
      }
      /* 重置表单 */
      const resetForm = () => {
        const current = formData.current
        for (let name in current) {
          current[name] = ''
        }
        forceUpdate('')
      }
      return [ setFormItem ,resetForm ]
    },[])
  
    return [ formData.current ,...handerForm ]
  }
````

具体流程分析：
1 我们用<code style="color: rgb(71, 101, 130);">useRef</code>来缓存整个表单的数据。
2 用<code style="color: rgb(71, 101, 130);">useState</code>单独做更新，不需要读取useState状态。
3 声明重置表单方法<code style="color: rgb(71, 101, 130);">resetForm</code> , 设置表单单元项<code style="color: rgb(71, 101, 130);">change</code>方法，

这里值得一提的问题是 **为什么用<code style="color: rgb(71, 101, 130);">useRef</code>来缓存<code style="color: rgb(71, 101, 130);">formData</code>数据，而不是直接用<code style="color: rgb(71, 101, 130);">useState</code>**。

原因一
我们都知道当用<code style="color: rgb(71, 101, 130);">useMemo,useCallback</code>等<code style="color: rgb(71, 101, 130);">API</code>的时候，如果引用了<code style="color: rgb(71, 101, 130);">useState</code>，就要把useState值作为deps传入，否侧由于<code style="color: rgb(71, 101, 130);">useMemo,useCallback</code>缓存了<code style="color: rgb(71, 101, 130);">useState</code>旧的值，无法得到新得值，但是<code style="color: rgb(71, 101, 130);">useRef</code>不同，可以直接读取/改变<code style="color: rgb(71, 101, 130);">useRef</code>里面缓存的数据。

原因二
**同步<code style="color: rgb(71, 101, 130);">useState</code>**
<code style="color: rgb(71, 101, 130);">useState</code>在一次使用<code style="color: rgb(71, 101, 130);">useState</code>改变<code style="color: rgb(71, 101, 130);">state</code>值之后，我们是无法获取最新的<code style="color: rgb(71, 101, 130);">state</code>,如下demo

````jsx
function index(){
    const [ number , setNumber ] = useState(0)
    const changeState = ()=>{
        setNumber(number+1)
        console.log(number) //组件更新  -> 打印number为0 -> 并没有获取到最新的值
    }
   return <View>
       <Button onClick={changeState} >点击改变state</Button>
   </View>
}
````
我们可以用 <code style="color: rgb(71, 101, 130);">useRef </code> 和  <code style="color: rgb(71, 101, 130);">useState</code>达到同步效果

````jsx
function index(){
    const number = useRef(0)
    const [  , forceUpdate ] = useState(0)
    const changeState = ()=>{
        number.current++
        forceUpdate(number.current)
        console.log(number.current) //打印值为1，组件更新，值改变
    }
   return <View>
       <Button onClick={changeState} >点击改变state</Button>
   </View>
}
````

**性能优化**
用<code style="color: rgb(71, 101, 130);">useMemo</code>来优化<code style="color: rgb(71, 101, 130);">setFormItem ,resetForm</code>方法，避免重复声明，带来的性能开销。


### 实战三：控制表格/列表-useTableRequset

背景：当我们需要控制带分页，带查询条件的表格/列表的情况下。

#### 1 实现效果

1 统一管理表格的数据，包括列表，页码，总页码数等信息
2 实现切换页码，更新数据。

#### 2 自定义<code style="color: rgb(71, 101, 130);">useTableRequset</code>设计思路

1 我们需要<code style="color: rgb(71, 101, 130);">state</code>来保存列表数据，总页码数，当前页面等信息。
2 需要暴露一个方法用于，改变分页数据，从新请求数据。

解析来我们看一下具体的实现方案。

**页面**
````jsx
function getList(payload){
  const query = formateQuery(payload)
  return fetch('http://127.0.0.1:7001/page/tag/list?'+ query ).then(res => res.json())
}
export default function index(){
    /* 控制表格查询条件 */
    const [ query , setQuery ] = useState({})
    const [tableData, handerChange] = useTableRequest(query,getList)
    const { page ,pageSize,totalCount ,list } = tableData
    return <View className='index' >
        <View className='table' >
            <View className='table_head' >
                <View className='col' >技术名称</View>
                <View className='col' >icon</View>
                <View className='col' >创建时间</View>
            </View>
            <View className='table_body' >
               {
                   list.map(item=><View className='table_row' key={item.id}  >
                        <View className='col' >{ item.name }</View>
                        <View className='col' > <Image className='col col_image'  src={Icons[item.icon].default} /></View>
                        <View className='col' >{ item.createdAt.slice(0,10) }</View>
                   </View>)
               }
            </View>
        </View>
        <AtPagination 
          total={Number(totalCount)} 
          icon
          pageSize={Number(pageSize)}
          onPageChange={(mes)=>handerChange({ page:mes.current })}
          current={Number(page)}
        ></AtPagination>
    </View>
}
````

**<code style="color: rgb(71, 101, 130);">useTableRequset</code>**

````jsx
 /* table 数据更新 hooks */
export default function useTableRequset(query, api) {
    /* 是否是第一次请求 */
    const fisrtRequest = useRef(false)
    /* 保存分页信息 */
    const [pageOptions, setPageOptions] = useState({
      page: 1,
      pageSize: 3
    })
    /* 保存表格数据 */
    const [tableData, setTableData] = useState({
      list: [],
      totalCount: 0,
      pageSize: 3,
      page:1,
    })
    /* 请求数据 ,数据处理逻辑根后端协调着来 */
    const getList = useMemo(() => {
      return async payload => {
        if (!api) return
        const data = await api(payload || {...query, ...pageOptions})
        if (data.code == 0) {
          setTableData(data.data)
          fisrtRequest.current = true
        } 
      }
    }, [])
    /* 改变分页，重新请求数据 */
    useEffect(() => {
      fisrtRequest.current && getList({
        ...query,
        ...pageOptions
      })
    }, [pageOptions])
    /* 改变查询条件。重新请求数据 */
    useEffect(() => {
      getList({
        ...query,
        ...pageOptions,
        page: 1
      })
    }, [query])
    /* 处理分页逻辑 */
    const handerChange = useMemo(() => (options) => setPageOptions({...options }), [])
  
    return [tableData, handerChange, getList]
  }
````
具体设计思路：

因为是<code style="color: rgb(71, 101, 130);">demo</code>项目，我们用本地服务器做了一个数据查询的接口，为的是模拟数据请求。

1 用一个<code style="color: rgb(71, 101, 130);">useRef</code>来缓存是否是第一次请求数据。
2 用<code style="color: rgb(71, 101, 130);">useState</code> 保存返回的数据和分页信息。
3 用两个<code style="color: rgb(71, 101, 130);">useEffect</code>分别处理，对于列表查询条件的更改，或者是分页状态更改，启动副作用钩子，重新请求数据，这里为了区别两种状态更改效果，实际也可以用一个<code style="color: rgb(71, 101, 130);">effect</code>来处理。
4 暴露两个方法，分别是请求数据和处理分页逻辑。

**性能优化**
1 我们用一个<code style="color: rgb(71, 101, 130);">useRef</code>来缓存是否是第一次渲染，目的是为了，初始化的时候，两个<code style="color: rgb(71, 101, 130);">useEffect</code>钩子都会执行，为了避免重复请求数据。
2 对于请求数据和处理分页逻辑，避免重复声明，我们用<code style="color: rgb(71, 101, 130);">useMemo</code>加以优化。

**需要注意的是，这里把请求数据后处理逻辑连同自定义hooks封装在一起，在实际项目中，要看和后端约定的数据返回格式来制定属于自己的hooks。**

### 实战四：控制拖拽效果-<code style="color: rgb(71, 101, 130);">useDrapDrop</code>

背景：用<code style="color: rgb(71, 101, 130);">transform</code>和<code style="color: rgb(71, 101, 130);">hooks</code>实现了拖拽效果，无需设置定位。

#### 1 实现效果
独立<code style="color: rgb(71, 101, 130);">hooks</code>绑定独立的<code style="color: rgb(71, 101, 130);">dom</code>元素，使之能实现自由拖拽效果。


#### 2 <code style="color: rgb(71, 101, 130);">useDrapDrop</code>具体实现思路
需要实现的功能：
1 通过自定义<code style="color: rgb(71, 101, 130);">hooks</code>计算出来的 x ,y 值，通过将<code style="color: rgb(71, 101, 130);">transform</code>的<code style="color: rgb(71, 101, 130);">translate</code>属性设置当前计算出来的<code style="color: rgb(71, 101, 130);">x,y</code>实现拖拽效果。
2 自定义<code style="color: rgb(71, 101, 130);">hooks</code>能抓取当前<code style="color: rgb(71, 101, 130);">dom</code>元素容器。

**页面**

````jsx
export default function index (){
   const [ style1 , dropRef ]= useDrapDrop()
   const [style2,dropRef2] = useDrapDrop()
   return <View className='index'>
      <View 
        className='drop1' 
        ref={dropRef}
        style={{transform:`translate(${style1.x}px, ${style1.y}px)`}} 
      >drop1</View>
      <View 
        className='drop2'   
        ref={dropRef2}
        style={{transform:`translate(${style2.x}px, ${style2.y}px)`}} 
      >drop2</View>
      <View 
        className='drop3'
      >drop3</View>
   </View>
}
````
**注意点：**
我们没有用,<code style="color: rgb(71, 101, 130);">left</code>,和<code style="color: rgb(71, 101, 130);">top</code>来改变定位，<code style="color: rgb(71, 101, 130);">css3</code>的<code style="color: rgb(71, 101, 130);">transform</code>能够避免浏览器的重排和回流，性能优化上要强于直接改变定位的top,left值。
由于我们模拟环境考虑到是h5移动端，所以用 <code style="color: rgb(71, 101, 130);">webview</code>的 <code style="color: rgb(71, 101, 130);">touchstart , touchmove ,ontouchend</code> 事件来进行模拟。

**核心代码-<code style="color: rgb(71, 101, 130);">useDrapDrop</code>**

````jsx
/* 移动端 -> 拖拽自定义效果(不使用定位) */
function useDrapDrop() {
  /* 保存上次移动位置 */  
  const lastOffset = useRef({
      x:0, /* 当前x 值 */
      y:0, /* 当前y 值 */
      X:0, /* 上一次保存X值 */
      Y:0, /* 上一次保存Y值 */
  })  
  /* 获取当前的元素实例 */
  const currentDom = useRef(null)
  /* 更新位置 */
  const [, foceUpdate] = useState({})
  /* 监听开始/移动事件 */
  const [ ontouchstart ,ontouchmove ,ontouchend ] = useMemo(()=>{
      /* 保存left right信息 */
      const currentOffset = {} 
      /* 开始滑动 */
      const touchstart = function (e) {   
        const targetTouche = e.targetTouches[0]
        currentOffset.X = targetTouche.clientX
        currentOffset.Y = targetTouche.clientY
      }
      /* 滑动中 */
      const touchmove = function (e){
        const targetT = e.targetTouches[0]
        let x =lastOffset.current.X  + targetT.clientX - currentOffset.X
        let y =lastOffset.current.Y  + targetT.clientY - currentOffset.Y 	
        lastOffset.current.x = x
        lastOffset.current.y = y
        foceUpdate({
           x,y
        })
      }
      /* 监听滑动停止事件 */
      const touchend =  () => {
        lastOffset.current.X = lastOffset.current.x
        lastOffset.current.Y = lastOffset.current.y
      }
      return [ touchstart , touchmove ,touchend]
  },[])
  useLayoutEffect(()=>{
    const dom = currentDom.current
    dom.ontouchstart = ontouchstart
    dom.ontouchmove = ontouchmove
    dom.ontouchend = ontouchend
  },[])
  return [ { x:lastOffset.current.x,y:lastOffset.current.y } , currentDom]
}
````

具体设计思路：

1 对于拖拽效果，我们需要实时获取<code style="color: rgb(71, 101, 130);">dom</code>元素的位置信息，所以我们需要一个<code style="color: rgb(71, 101, 130);">useRef</code>来抓取dom元素。 
2 由于我们用的是<code style="color: rgb(71, 101, 130);">transfrom</code>改变位置，所以需要保存一下当前位置和上一次<code style="color: rgb(71, 101, 130);">transform</code>的位置，所以我们用一个useRef来缓存位置。
3 我们通过<code style="color: rgb(71, 101, 130);">useRef</code>改变<code style="color: rgb(71, 101, 130);">x,y</code>值,但是需要渲染新的位置，所以我们用一个<code style="color: rgb(71, 101, 130);">useState</code>来专门产生组件更新。
4 初始化的时候我们需要给当前的元素绑定事件,因为在初始化的时候我们可能精确需要元素的位置信息，所以我们用<code style="color: rgb(71, 101, 130);">useLayoutEffect</code>钩子来绑定<code style="color: rgb(71, 101, 130);">touchstart , touchmove ,ontouchend</code>等事件。



## 总结
以上就是我在react自定义hooks上的总结，和一些实际的应用场景，我们项目中，80%的表单列表场景，都可以用上述hooks来解决。
**纸上得来终觉浅,绝知此事要躬行**,真正玩好,玩转hooks,是一个日积月累的过程,怎么去设计一个符合业务场景的hooks，需要我们不断的实战，不断的总结。
最后大家觉得还不错的话，就 点赞 + 关注 一波，持续分享技术文章。
公众号：前端Sharing




<code style="color: rgb(71, 101, 130);">react-hooks</code>