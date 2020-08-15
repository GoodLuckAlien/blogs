# react-hooks使用

## 1. 什么是react-hooks?

 > ** react-hooks是react16.8以后，react新增的钩子API，目的是增加代码的可复用性，逻辑性，弥补无状态组件没有生命周期，没有数据管理状态state的缺陷。笔者认为，react-hooks思想和初衷，也是把组件，颗粒化，单元化，形成独立的渲染环境，减少渲染次数，优化性能。

  useCallback      
  useContext✅
  useEffect✅
  useLayoutEffect ✅
  useMemo 
  useReducer✅
  useRef✅
  useState✅
  以上就是react-hooks主要的api,接下来我会和大家分享一下这些api的用法，以及使用他们的注意事项。

## 2.为什么要使用hooks

我们为什么要使用react-hooks呢，首先和传统的class声明的有状态有这显著的优点就是

1  <font size=4 >react-hooks可以让我们的代码的逻辑性更强，可以抽离公共的方法，公共组件。</font>


2 <font size=4 > react-hooks思想更趋近于函数式编程。用函数声明方式代替class声明方式，虽说class也是es6构造函数语法糖，但是react-hooks写起来更有函数即组件，无疑也提高代码的开发效率（无需像class声明组件那样写声明周期，写生命周期render函数等）</font>



3 <font size=4 > react-hooks可能把庞大的class组件，化整为零成很多小组件，useMemo等方法让组件或者变量制定一个适合自己的独立的渲染空间，一定程度上可以提高性能，减少渲染次数。这里值得一提的是，如果把负责 请求是数据 ➡️  视图更新的渲染组件，用react-hooks编写的话 ，配合immutable等优秀的开源库，会有更棒的效果(这里特别注意的是⚠️，如果乱用hooks，不但不会提升性能，反而会影响性能，带来各种各样的想不到的问题)。 </font>


## 3.如何使用hooks

接下来和大家探讨一下，react-hooks主要api,具体使用

### 1 useState 数据存储，派发更新

 useState出现，使得react无状态组件能够像有状态组件一样，可以拥有自己state,useState的参数可以是一个具体的值，也可以是一个函数用于判断复杂的逻辑，函数返回作为初始值，usestate 返回一个数组，数组第一项用于读取此时的state值 ，第二项为派发数据更新，组件渲染的函数，函数的参数即是需要更新的值。useState和useReduce 作为能够触发组件重新渲染的hooks,我们在使用useState的时候要特别注意的是，useState派发更新函数的执行，就会让整个function组件从头到尾执行一次，所以需要配合useMemo，usecallback等api配合使用，这就是我说的为什么滥用hooks会带来负作用的原因之一了。一下代码为usestate基本应用
 

 ````jsx
 const DemoState = (props) => {
    /* number为此时state读取值 ，setNumber为派发更新的函数 */
    let [number, setNumber] = useState(0) /* 0为初始值 */
    return (<div>
        <span>{ number }</span>
        <button onClick={ ()=> {
          setNumber(number+1)
          console.log(number) /* 这里的number是不能够即使改变的  */
        } } ></button>
    </div>)
}
 ````
上边简单的例子说明了useState ,但是当我们在调用更新函数之后，state的值是不能即时改变的，只有当下一次上下文执行的时候，state值才随之改变。

 ````jsx
 const a =1 
 const DemoState = (props) => {
    /*  useState 第一个参数如果是函数 则处理复杂的逻辑 ，返回值为初始值 */
    let [number, setNumber] = useState(()=>{
       // number
       return a===1 ? 1 : 2
    }) /* 1为初始值 */
    return (<div>
        <span>{ number }</span>
        <button onClick={ ()=>setNumber(number+1) } ></button>
    </div>)
}
 ````
### 2 useEffect 组件更新副作用钩子

如果你想在function组件中，当组件完成挂载，dom渲染完成，做一些操纵dom,请求数据，那么useEffect是一个不二选择，如果我们需要在组件初次渲染的时候请求数据，那么useEffect可以充当class组件中的 componentDidMount , **但是特别注意的是，如果不给useEffect执行加入限定条件，函数组件每一次更新都会触发effect ,那么也就说明每一次state更新，或是props的更新都会触发useEffect执行，此时的effect又充当了componentDidUpdate和componentwillreceiveprops，所以说合理的用于useEffect就要给effect加入限定执行的条件，也就是useEffect的第二个参数，这里说是限定条件，也可以说是上一次useeffect更新收集的某些记录数据变化的记忆，在新的一轮更新，useeffect会拿出之前的记忆值和当前值做对比，如果发生了变化就执行新的一轮useEffect的副作用函数，useEffect第二个参数是一个数组，用来收集多个限制条件 。**

````jsx
/* 模拟数据交互 */
function getUserInfo(a){
    return new Promise((resolve)=>{
        setTimeout(()=>{ 
           resolve({
               name:a,
               age:16,
           }) 
        },500)
    })
}

const Demo = ({ a }) => {
    const [ userMessage , setUserMessage ] :any= useState({})
    const div= useRef()
    const [number, setNumber] = useState(0)
    /* 模拟事件监听处理函数 */
    const handleResize =()=>{}
    /* useEffect使用 ，这里如果不加限制 ，会是函数重复执行，陷入死循环*/
    useEffect(()=>{
        /* 请求数据 */
       getUserInfo(a).then(res=>{
           setUserMessage(res)
       })
       /* 操作dom  */
       console.log(div.current) /* div */
       /* 事件监听等 */
        window.addEventListener('resize', handleResize)
    /* 只有当props->a和state->number改变的时候 ,useEffect副作用函数重新执行 ，如果此时数组为空[]，证明函数只有在初始化的时候执行一次相当于componentDidMount */
    },[ a ,number ])
    return (<div ref={div} >
        <span>{ userMessage.name }</span>
        <span>{ userMessage.age }</span>
        <div onClick={ ()=> setNumber(1) } >{ number }</div>
    </div>)
}

````
如果我们需要在组件销毁的阶段，做一些取消dom监听，清除定时器等操作，那么我们可以在useEffect函数第一个参数，结尾返回一个函数，用于清除这些副作用。相当与componentWillUnmount。

````jsx
const Demo = ({ a }) => {
    /* 模拟事件监听处理函数 */
    const handleResize =()=>{}
    useEffect(()=>{
       /* 定时器 延时器等 */
       const timer = setInterval(()=>console.log(666),1000)
       /* 事件监听 */
       window.addEventListener('resize', handleResize)
       /* 此函数用于清除副作用 */
       return function(){
           clearInterval(timer) 
           window.removeEventListener('resize', handleResize)
       }
    },[ a ])
    return (<div  >
    </div>)
}

````

#### 异步 async effect ?

提醒大家的是 useEffect是不能直接用 async await 语法糖的

````js
/* 错误用法 ，effect不支持直接 async await 装饰的 */
 useEffect(async ()=>{
        /* 请求数据 */
      const res = await getUserInfo(payload)
    },[ a ,number ])

````
如果我们想要用 async effect 可以对effect进行一层包装

````js
const asyncEffect = (callback, deps)=>{
   useEffect(()=>{
       callback()
   },deps)
}
asyncEffect(async()=>{},)
````

###3 useLayoutEffect 渲染更新之前的 useEffect

useEffect 执行顺序 组件更新挂载完成 -> 浏览器dom 绘制完成 -> 执行useEffect回调 。

useLayoutEffect 执行顺序 组件更新挂载完成 ->  执行useLayoutEffect回调-> 浏览器dom 绘制完成  
所以说useLayoutEffect 代码可能会阻塞浏览器的绘制  如果我们在useEffect 重新请求数据，渲染视图过程中，肯定会造成画面闪动的效果,而如果用useLayoutEffect ，回调函数的代码就会阻塞浏览器绘制，所以可定会引起画面卡顿等效果，那么具体要用 useLayoutEffect 还是 useEffect ，要看实际项目的情况，大部分的情况 useEffect 都可以满足的。

````jsx
const DemoUseLayoutEffect = () => {
    const target = useRef()
    useLayoutEffect(() => {
        /*我们需要在dom绘制之前，移动dom到制定位置*/
        const { x ,y } = getPositon() /* 获取要移动的 x,y坐标 */
        animate(target.current,{ x,y })
    }, []);
    return (
        <div >
            <span ref={ target } className="animate"></span>
        </div>
    )
}
````

### 4 useRef 获取元素 ,缓存数据。

和传统的class组件ref一样，react-hooks 也提供获取元素方法 useRef,它有一个参数可以作为缓存数据的初始值，返回值可以被dom元素ref标记，可以获取被标记的元素节点.

````jsx
const DemoUseRef = ()=>{
    const dom= useRef(null)
    const handerSubmit = ()=>{
        /*  <div >表单组件</div>  dom 节点 */
        console.log(dom.current)
    }
    return <div>
        {/* ref 标记当前dom节点 */}
        <div ref={dom} >表单组件</div>
        <button onClick={()=>handerSubmit()} >提交</button> 
    </div>
}
````

#### 高阶用法 缓存数据
**当然useRef还有一个很重要的作用就是缓存数据，我们知道usestate ,useReducer 是可以保存当前的数据源的，但是如果它们更新数据源的函数执行必定会带来整个组件从新执行到渲染，如果在函数组件内部声明变量，则下一次更新也会重置，如果我们想要悄悄的保存数据，而又不想触发函数的更新，那么useRef是一个很棒的选择。**

 > ** const currenRef = useRef(InitialData)
  获取  currenRef.current
  改变  currenRef.current = newValue  

useRef可以第一个参数可以用来初始化保存数据，这些数据可以在current属性上获取到 ，当然我们也可以通过对current赋值新的数据源。

**下面我们通过react-redux源码来看看useRef的巧妙运用**
（react-redux 在react-hooks发布后，用react-hooks重新了其中的Provide,connectAdvanced）核心模块，可以见得 react-hooks在限制数据更新，高阶组件上有这一定的优势，其源码大量运用useMemo来做数据判定

````jsx
      /* 这里用到的useRef没有一个是绑定在dom元素上的，都是做数据缓存用的 */
      /* react-redux 用userRef 来缓存 merge之后的 props */
      const lastChildProps = useRef()
      //  lastWrapperProps 用 useRef 来存放组件真正的 props信息
      const lastWrapperProps = useRef(wrapperProps)
      //是否储存props是否处于正在更新状态
      const renderIsScheduled = useRef(false)
````
这是react-redux中用useRef 对数据做的缓存，那么怎么做更新的呢 ，我们接下来看

````js

//获取包装的props 
function captureWrapperProps(
  lastWrapperProps,
  lastChildProps,
  renderIsScheduled,
  wrapperProps,
  actualChildProps,
  childPropsFromStoreUpdate,
  notifyNestedSubs
) {
   //我们要捕获包装props和子props，以便稍后进行比较
  lastWrapperProps.current = wrapperProps  //子props 
  lastChildProps.current = actualChildProps //经过  merge props 之后形成的 prop
  renderIsScheduled.current = false

}
````
通过上面我们可以看到 ，react-redux 用重新赋值的方法，改变缓存的数据源，避免不必要的数据更新，
**如果选用useState储存数据，必然促使组件重新渲染** 所以采用了useRef解决了这个问题，至于react-redux源码怎么实现的，我们这里暂且不考虑。

### 5 useContext 自由获取context
  
我们可以使用useContext ，来获取父级组件传递过来的context值，这个当前值就是最近的父级组件 Provider 设置的value值，useContext参数一般是由 createContext 方式引入 ,也可以父级上下文context传递 ( 参数为context )。useContext 可以代替 context.Consumer 来获取Provider中保存的value值

````jsx
import { Context1 } from './a'
import { Context } from './a'
/* 用useContext方式 */
const DemoContext = ()=> {
    const value:any = useContext(Context)
    const Valu1:any = useContext(Context1)
    /* my name is alien */
return <div> my name is { value.name }</div>
}

/* 用Context.Consumer 方式 */
const DemoContext1 = ()=>{
    return <Context.Consumer>
         {/*  my name is alien  */}
        { (value)=> <div> my name is { value.name }</div> }
    </Context.Consumer>
}

export default ()=>{
    return <div>
        <Context.Provider value={{ name:'alien' , age:18 }} >
            <DemoContext />
            <DemoContext1 />
        </Context.Provider>
    </div>
}
````

### 6 useReducer 无状态组件中的redux

useReducer 是react-hooks提供的能够在无状态组件中运行的类似redux的功能api，至于它到底能不能代替redux react-redux ,我个人的看法是不能的 ，redux 能够复杂的逻辑中展现优势 ，而且 redux的中间件模式思想也是非常优秀了，我们可以通过中间件的方式来增强dispatch redux-thunk redux-sage redux-action redux-promise都是比较不错的中间件，可以把同步reducer编程异步的reducer。useReducer 接受的第一个参数是一个函数，我们可以认为它就是一个reducer ,reducer的参数就是常规reducer里面的state和action,返回改变后的state, useReducer第二个参数为state的初始值 返回一个数组，数组的第一项就是更新之后state的值 ，第二个参数是派发更新的dispatch函数 。**dispatch 的触发会触发组件的更新，这里能够促使组件从新的渲染的一个是useState派发更新函数，另一个就 useReducer中的dispatch**

````jsx
const DemoUseReducer = ()=>{
    /* number为更新后的state值,  dispatchNumbner 为当前的派发函数 */
   const [ number , dispatchNumbner ] = useReducer((state,action)=>{
       const { payload , name  } = action
       /* return的值为新的state */
       switch(name){
           case 'add':
               return state + 1
           case 'sub':
               return state - 1 
           case 'reset':
             return payload       
       }
       return state
   },0)
   return <div>
      当前值：{ number }
      { /* 派发更新 */ }
      <button onClick={()=>dispatchNumbner({ name:'add' })} >增加</button>
      <button onClick={()=>dispatchNumbner({ name:'sub' })} >减少</button>
      <button onClick={()=>dispatchNumbner({ name:'reset' ,payload:666 })} >赋值</button>
      { /* 把dispatch 和 state 传递给子组件  */ }
      <MyChildren  dispatch={ dispatchNumbner } State={{ number }} />
   </div>
}
````

当然实际业务逻辑可能更复杂的，需要我们在reducer里面做更复杂的逻辑操作。

### 7 useMemo 小而香性能优化

useMemo我认为是React设计最为精妙的hooks之一，优点就是能形成独立的渲染空间，能够使组件，变量按照约定好规则更新。渲染条件依赖于第二个参数deps。 我们知道无状态组件的更新是从头到尾的更新，如果你想要从新渲染一部分视图，而不是整个组件，那么用useMemo是最佳方案，避免了不需要的更新，和不必要的上下文的执行，在介绍useMemo之前，我们先来说一说, memo, 我们知道class声明的组件可以用componentShouldUpdate来限制更新次数，那么memo就是无状态组件的ShouldUpdate ， 而我们今天要讲的useMemo就是更为细小的ShouldUpdate单元，

先来看看memo ,memo的作用结合了pureComponent纯组件和 componentShouldUpdate功能，会对传进来的props进行一次对比，然后根据第二个函数返回值来进一步判断哪些props需要更新。
````jsx
/* memo包裹的组件，就给该组件加了限制更新的条件，是否更新取决于memo第二个参数返回的boolean值， */
const DemoMemo = connect(state =>
    ({ goodList: state.goodList })
)(memo(({ goodList, dispatch, }) => {
    useEffect(() => {
        dispatch({
            name: 'goodList',
        })
    }, [])
    return <Select placeholder={'请选择'} style={{ width: 200, marginRight: 10 }} onChange={(value) => setSeivceId(value)} >
        {
            goodList.map((item, index) => <Option key={index + 'asd' + item.itemId} value={item.itemId} > {item.itemName} </Option>)
        }
    </Select>
    /* 判断之前的goodList 和新的goodList 是否相等，如果相等，
    则不更新此组件 这样就可以制定属于自己的渲染约定 ，让组件只有满足预定的下才重新渲染 */
}, (pre, next) => is(pre.goodList, next.goodList)))
````
useMemo的应用理念和memo差不多，都是判定是否满足当前的限定条件来决定是否执行useMemo的callback函数，而useMemo的第二个参数是一个deps数组，数组里的参数变化决定了useMemo是否更新回调函数，useMemo返回值就是经过判定更新的结果。它可以应用在元素上，应用在组件上，也可以应用在上下文当中。如果又一个循环的list元素，那么useMemo会是一个不二选择，接下来我们一起探寻一下useMemo的优点

````js
/* 用 useMemo包裹的list可以限定当且仅当list改变的时候才更新此list，这样就可以避免selectList重新循环 */
 {useMemo(() => (
      <div>{
          selectList.map((i, v) => (
              <span
                  className={style.listSpan}
                  key={v} >
                  {i.patentName} 
              </span>
          ))}
      </div>
), [selectList])}
````
**1 useMemo可以减少不必要的循环，减少不必要的渲染**

````js
 useMemo(() => (
    <Modal
        width={'70%'}
        visible={listshow}
        footer={[
            <Button key="back" >取消</Button>,
            <Button
                key="submit"
                type="primary"
             >
                确定
            </Button>
        ]}
    > 
     { /* 减少了PatentTable组件的渲染 */ }
        <PatentTable
            getList={getList}
            selectList={selectList}
            cacheSelectList={cacheSelectList}
            setCacheSelectList={setCacheSelectList} />
    </Modal>
 ), [listshow, cacheSelectList])
````

**2 useMemo可以减少子组件的渲染次数**

````jsx
const DemoUseMemo=()=>{
  /* 用useMemo 包裹之后的log函数可以避免了每次组件更新再重新声明 ，可以限制上下文的执行 */
    const newLog = useMemo(()=>{
        const log =()=>{
            console.log(6666)
        }
        return log
    },[])
    return <div onClick={()=>newLog()} ></div>
}
````
**3 useMemo让函数在某个依赖项改变的时候才运行，这可以避免很多不必要的开销（这里要注意⚠️⚠️⚠️的是如果被useMemo包裹起来的上下文,形成一个独立的闭包，会缓存之前的state值,如果没有加相关的更新条件，是获取不到更新之后的state的值的，如下边👇⬇️）**

````jsx
const DemoUseMemo=()=>{
    const [ number ,setNumber ] = useState(0)
    const newLog = useMemo(()=>{
        const log =()=>{
            /* 点击span之后 打印出来的number 不是实时更新的number值 */
            console.log(number)
        }
        return log
      /* [] 没有 number */  
    },[])
    return <div>
        <div onClick={()=>newLog()} >打印</div>
        <span onClick={ ()=> setNumber( number + 1 )  } >增加</span>
    </div>
}

````

**useMemo很不错，react-redux 用react-hooks重写后运用了大量的useMemo情景，我为大家分析两处**


useMemo 同过 store  didStoreComeFromProps  contextValue 属性制定是否需要重置更新订阅者subscription ，这里我就不为大家讲解react-redux了，有兴趣的同学可以看看react-redux源码，看看是怎么用useMemo的
````js

const [subscription, notifyNestedSubs] = useMemo(() => {
  if (!shouldHandleStateChanges) return NO_SUBSCRIPTION_ARRAY

  const subscription = new Subscription(
    store,
    didStoreComeFromProps ? null : contextValue.subscription // old 
  )
  
  const notifyNestedSubs = subscription.notifyNestedSubs.bind(
    subscription
  )

  return [subscription, notifyNestedSubs]
}, [store, didStoreComeFromProps, contextValue])
````

react-redux通过 判断 redux store的改变来获取与之对应的state
````jsß
 const previousState = useMemo(() => store.getState(), [store])
````

讲到这里，**如果我们应用useMemo根据依赖项合理的颗粒化我们的组件，能起到很棒的优化组件的作用。**

### 8 useCallback useMemo版本的回调函数

useMemo和useCallback接收的参数都是一样，都是在其依赖项发生变化后才执行，都是返回缓存的值，区别在于useMemo返回的是函数运行的结果，useCallback返回的是函数，这个回调函数是经过处理后的也就是说父组件传递一个函数给子组件的时候，由于是无状态组件每一次都会重新生成新的props函数，这样就使得每一次传递给子组件的函数都发生了变化，这时候就会触发子组件的更新，这些更新是没有必要的，此时我们就可以通过usecallback来处理此函数，然后作为props传递给子组件

````js
/* 用react.memo */
const DemoChildren = React.memo((props)=>{
   /* 只有初始化的时候打印了 子组件更新 */
    console.log('子组件更新')
   useEffect(()=>{
       props.getInfo('子组件')
   },[])
   return <div>子组件</div>
})

const DemoUseCallback=({ id })=>{
    const [number, setNumber] = useState(1)
    /* 此时usecallback的第一参数 (sonName)=>{ console.log(sonName) }
     经过处理赋值给 getInfo */
    const getInfo  = useCallback((sonName)=>{
          console.log(sonName)
    },[id])
    return <div>
        {/* 点击按钮触发父组件更新 ，但是子组件没有更新 */}
        <button onClick={ ()=>setNumber(number+1) } >增加</button>
        <DemoChildren getInfo={getInfo} />
    </div>
}

````

**这里应该提醒的是，useCallback ，必须配合 react.memo pureComponent ，否则不但不会提升性能，还有可能降低性能**

##4总结

react-hooks的诞生，也不是说它能够完全代替class声明的组件，对于业务比较复杂的组件，class组件还是首选，只不过我们可以把class组件内部拆解成funciton组件，根据业务需求，哪些负责逻辑交互，哪些需要动态渲染，然后配合usememo等api，让性能提升起来。react-hooks使用也有一些限制条件，比如说不能放在流程控制语句中，执行上下文也有一定的要求。总体来说，react-hooks还是很不错的，值得大家去学习和探索。