# 这可能是你见过的最全的vue父子组件通信方式总结及其实际中应用场景分析

## 前言

相信实际项目中用过vue的同学，一定对vue中父子组件之间的通信并不陌生，vue中采用良好的数据通讯方式，避免组件通信带来的困扰。今天笔者和大家一起分享**vue父子组件之间的通信方式，优缺点，及其实际工作中的应用场景**


首先我们带着这些问题去思考

1 vue中到底有多少种父子组件通信方式？

2 vue中那种父子组件最佳通信方式是什么？

3 vue中每个通信方式应用场景是什么？

## demo场景搭建

为了加深大家对vue父子通信的认识，我们简单模拟了父子组件通信的场景。

## 一 prop

### 基本用法


prop通信方式大家最常见的，也是最常用的父子组件通信类型，我们可以直接在标签里面给子组件绑定属性和方法，对于属性我们可以直接通过子组件声明的prop拿到，对于父元素的方法，我们可以通过 `this.$emit触发`。

我们先简单写一个prop父子组件通信的场景

**父组件**

````html
<template>
  <div class="father" >
     <input  v-model="mes"   /> <button @click="send"  >对子组件说</button>
     <div>子组件对我说：{{  sonMes  }}</div>
     <son :fatherMes="sendSonMes" @sonSay="sonSay"   />
  </div>
</template>
<script>
import son from './son'
export default {
   name:'father',
   components:{
       son /* 子组件 */
   },
   data(){
       return {
          mes:'',
          sendSonMes:'', /* 来自子组件的信息 */
          sonMes:''      /* 发送给子组件的信息  */
       } 
   },
   methods:{
      /* 传递给子组件 */
      send(){
          this.sendSonMes = this.mes
      },
      /* 接受子组件信息 */ 
      sonSay(value){
          this.sonMes = value
      },
   },
}
</script>

````
我们这里只需要将给子组件的数据`fatherMes`和提供给子组件的方法 `sonSay` 通过标签方式传递给子组件。

**子组件**

````html
<template>
    <div class="son" >
        <div> 父组件对我说：{{ fatherMes  }} </div>
        <input  v-model="mes"   /> <button @click="send"  >对父组件说</button>
    </div> 
</template>
<script>
export default {
   name:'son',
   props:{
      fatherMes:{
        type:String,
        default:''
      }
   },
   data(){
       return {
           mes:''
       }
   },
   methods:{
       send(){
           this.$emit('sonSay',this.mes)
       }
   },  
}
</script>>
````
子组件通过`props`来定义接受父组件传递过来的信息,我们就可以直接通过this获取到，对于父组件传递的事件，我们可以通过`this.$emit`来触发事件。

**区别react的props**

这里和`react`的`props`有点区别，`react`组件更新来源于`props`更新和自身`state`改变，当`props`改变，会默认更新组件。而在`Vue`中，如果我们对父组件传过来的新的`props`没有做**依赖收集(`template`模版收集，`computed`计算属性收集)**，组件是不会触动更新的。

**数据格式化**

如果我们想对`props`数据进行数据格式化，那么用`computed`接受`props`并格式化想要的数据类型。

````html
<div class="son" >
        <div> 父组件对我说：{{ computedFatherMes  }} </div>
         <input  v-model="mes"   /> <button @click="send"  >对父组件说</button>
</div> 
````

````js
export default {
   name:'son',
   props:{
      fatherMes:{
        type:String,
        default:''
      }
   },
   computed:{
       computedFatherMes(){
           return this.fatherMes + '😄😄'
       }
   },
  
}

````
效果：

**数据监听**

当我们根据props改变不想更新视图，或者不想立即更新视图，那么可以用watch来监听来自父组件的props的变化。

````js
watch:{
    fatherMes(newVaule){
        console.log(  newVaule) 
    }
},
````

### 优点

props传递数据优点是显而易见的，灵活简单，可以对props数据进行计算属性，数据监听等处理。父子组件通信灵活方便。这里可能单单仅限父子一层。

### 缺点

**1 props篡改**

我们在子组件中使用父组件`props`的时候，如果涉及一些变量赋值，修改等操作，props被莫名其妙的修改了，连同父组件的数据也被篡改了，有的同学可能会很疑惑，父元素的`props`不是不能修改么，这里怎么改变了呢，**vue中props到底能不能改变？**,至于这个问题，不能直接给出答案，如果props是基础数据类型，当我们改变的时候，就会曝出错误。我们一起看一个例子。

**父组件**
````html
<template>
    <div>
        <div>父组件</div>
        <son :fData="sonProps"  />
    </div>
</template>
<script>
import son from './sTampering'
export default {
    name:'father',
    components:{
      son
    },
    data(){
      return {
          sonProps:''
      }
    },
}
</script>
````

**子组件**

````html
<template>
    <button >改变父组件props</button>
</template>

<script>
export default {
    name:'son',
    props:{
       fData:{
           required:true
       }
    },
    methods:{
        changFatherProps(){
           this.fData = 'hello ,father'
        }
    }
}
</script>
````

当我们直接点击button 会抛出以下警。

但是当我们传过来的是一个引用数据类型，并且修改数据下某一个属性的时候。

**父组件**
````js
data(){
    return {
        sonProps:{
            a:1,
            b:2
        }
    }
},
````

**子组件**

````js
changFatherProps(){
   this.fData.a = 'hello,world'
}
````
当点击按钮发现并没有报错。

于是我们打印父组件的sonprops数据：


我们发现父组件的`data`数据已经被子组件篡改。于是我们总结出一个结论，**子组件虽然不能直接对父组件prop进行重新赋值，但是当父组件是引用类型的时候，子组件可以修改父组件的props下面的属性。**这就是一个很尴尬的事情，如果我们设计的初衷就是父组件数据也同时被修改，这个结果是可以接受的，但是当我们不希望父组件那份数据源有任何变化的时候，这就是一个严重的逻辑bug。
所以这就是props通讯的风险项之一。

<!-- **为什么能够修改props下的属性**

这个要从vue2.0源码说起，在vue构建响应式的时候，对于props属性 -->


**2 跨层级通信，兄弟组件通讯困难**

对于父组件-子组件-子组件的子组件这中跨层级的通信，显然需要我们一层一层的prop绑定属性和方法，如果遇到更复杂的情况，实现起来比较困难。

对于兄弟组件之间的通讯，props需要通过父组件作为桥梁，实现子组件-> 父组件 -> 子组件通信模式，如果想要通过父组件做媒介，那么必定会造成父组件重新渲染，为了实现兄弟组件通信付出的代价比较大。


### 应用场景

props的应用场景很简单，就是正常不是嵌套很深的父子组件通信，和关系不是很复杂的兄弟组件组件通信。

## 二 this.$parent $this.children this.$ref

通过this下面的数据直接获取`vue`实例这种方法比较暴力，因为我们所谓的组件，最终都会是一个对象，存放组件的各种信息,组件和组件通过`this.$children`和`this.$parent`指针关联起来。因为在项目中只有一个`root`根组件,理论上，我们可以找到通过`this.$children` `this.$parent`来访问页面上的任何一个组件 ，但是实际上如何精确匹配到目标组件，确是一个无比棘手的问题。

### 基本用法

**父组件**

````html
<template>
  <div class="father" >
     <input  v-model="mes"   /> <button @click="send"  >对子组件说</button>
     <son2 v-if="false" />
     <div>子组件对我说：{{  sonMes  }}</div>
     <son />
  </div>
</template>
<script>
import son from './son'
import son2 from './son2'
export default {
   name:'father',
   components:{
       son ,/* 子组件 */
       son2
   },
   data(){
       return {
          mes:'',
          sendSonMes:'', /* 来自子组件的信息 */
          sonMes:''      /* 发送给子组件的信息  */
       } 
   },
   methods:{
      /* 传递给子组件 */
      send(){
          /* 因为son组件是第一个有效组件所以直接去下标为0的组件 */
          const currentChildren = this.$children[0]
          currentChildren.accept(this.mes)
      },
      /* 接收子组件的信息 */
      accept(value){
         this.sonMes = value
      }
      
   },
}
</script>
````

**子组件**

````html
<template>
    <div class="son" >
        <div> 父组件对我说：{{ fatherMes  }} </div>
        <input  v-model="mes"   /> <button @click="send"  >对父组件说</button>
    </div> 
</template>
<script>
export default {
   name:'son',
   data(){
       return {
           mes:'',
           fatherMes:''
       }
   },
   methods:{
       /* 接受父组件内容 */
       accept(value){
         this.fatherMes = value
       },
       /* 向父组件发送信息 */
       send(){
           this.$parent.accept(this.mes)
       },
   },
}
</script>

````

我们可以清楚看到，和`props`通信相比，`this.$parent`，`this.$children`显的更加简洁，无需再给子组件绑定事件和属性，只需要在父组件和子组件声明发送和接受数据的方法。就可以实现组件间的通信，看起来很是便捷，但是实际操作中会有很大的弊端，而且`vue`本身也不提倡这种通信方式。而且这种通信方式也有很多风险性，我们稍后会给予解释。


### 优点

**简单，方便**
`this.$children`,`this.$parent` `this.$refs` 这种通信方式，更加的简单直接获取vue实例，对vue实例下的数据和方法直接获取或者引用。

### 缺点


#### 1 $this.children不可控性大,有一定风险

如上的例子，我们稍微对父组件加以改动，就会直接报错。

**之前的**
````html
 <son2 v-if="false" />
````

**改成**

````html
<son2 v-if="true" />
````
就会报如下错误，错误的原因很简单，我们用 `$children` 的下标获取，但是兄弟组件`son2` `v-if  = true` 之后，我们通过通过`this.$children[0]` 获取的就是`son2`组件,son2没有绑定方法，所以得出结论，对于`v-if`动态控制组件显示隐藏的不建议用`this.$children`用法，取而代之的我们可以用`ref`获取对应子组件的实例。

如上改成

````html
<son ref="son" />
````

然后获取:

````js
const currentChildren = this.$refs.son
````
根本解决了问题。

#### 2 不利于组件化

直接获取组件实例这种方式，在一定程度上妨碍了组件化开发，组件化开发的过程中，那些方法提供给外部，那些方法是内部使用，在没有提前商量的情况下，父子组件状态不透明的情况下，一切都是**未知的**，所以不同开发人员在获取组件下的方法时候，存在风险，提供的组件方法，属性是否有一些内部耦合。组件开发思路初衷，也不是由组件外部来对内部作出一定改变，而往往是内部的改变，通知外部绑定的方法事件。反过来如果是子组件内部，主动向父组件传递一些信息，也不能确定父组件是否存在。

#### 3 兄弟组件深层次嵌套组件通讯困难

和props方式一下，如果是兄弟直接组件的通信，需要通过父组件作为中间通讯的桥梁，而深层次的组件通讯，虽然不需要像props通讯那样逐层绑定，但是有一点，需要逐渐向上层或下层获取目标实例，如何能精准获取这是一个非常头疼的问题，而且没当深入一层，风险性和不确定性会逐级扩大。

### 应用场景

直接通过实例获取的通信方式适合**已知的**，**固定化**的页面结构,这种通讯方式，要求父子组件高度透明化，知己知彼，很明确父子组件有那些方法属性，都是用来干什么。所以说这种方式更适合**页面**组件，而不适合一些**第三方组件库**，或者是**公共组件**。

## 三 provide inject

如果说`vue`中 `provide` 和 `inject`，我会首先联想到`react`的`context`上下文,两个作用在一定程度上可以说非常相似,在父组件上通过`provide`将方法，属性，或者是自身实例暴露出去，子孙组件，插槽组件,甚至是子孙组件的插槽组件，通过`inject`把父辈`provide`引进来。提供给自己使用，很经典的应用 `provide`和 `inject`的案例就是 `element-ui`中 `el-form`和 `el-form-item`

**我们先不妨带着问题想象一个场景**

````html
<el-form  label-width="80px" :model="formData">
  <el-form-item label="姓名">
    <el-input v-model="formData.name"></el-input>
  </el-form-item>
  <el-form-item label="年龄">
    <el-input v-model="formData.age"></el-input>
  </el-form-item>
</el-form>
````
我们可以看到 `el-form` 和 `el-form-item`不需要建立任何通信操作，那么`el-form`和`el-form-item` 是如何联系起来，并且共享状态的呢？然我们带着疑问继续往下看。

### 基本用法

#### 普通方式
我们用父组件 -> 子组件 -> 孙组件 的案例 

**父组件**

````html
<template>
  <div class="father" >
     <div>子组件对我说：{{  sonMes  }}</div>
     <div>孙组件对我说：{{  grandSonMes  }}</div>
     <son />
  </div>
</template>
<script>
import son from './son'
export default {
   name:'father',
   components:{
       son /* 子组件 */
   },
   provide(){
       return {
           /* 将自己暴露给子孙组件 ,这里声明的名称要于子组件引进的名称保持一致 */
           father:this
       }
   },
   data(){
       return {
          grandSonMes:'', /* 来自子组件的信息 */
          sonMes:''      /* 发送给子组件的信息  */
       } 
   },
   methods:{
      /* 接受孙组件信息 */
      grandSonSay(value){
          this.grandSonMes = value
      },
      /* 接受子组件信息 */ 
      sonSay(value){
          this.sonMes = value
      },
   },
}
</script>

````
这里我们通过`provide`把本身暴露除去。**⚠️⚠️⚠️这里声明的名称要与子组件引进的名称保持一致**

**子组件**
 
````html
<template>
    <div class="son" >
        <input  v-model="mes"   /> <button @click="send"  >对父组件说</button>
        <grandSon />
    </div> 
</template>

<script>
import  grandSon from './grandSon'
export default {
    /* 子组件 */
   name:'son',
   components:{
       grandSon /* 孙组件 */
   },
   data(){
       return {
           mes:''
       }
   },
   /* 引入父组件 */
   inject:['father'],
   methods:{
       send(){
           this.father.sonSay(this.mes)
       }
   },
    
}
</script>
````
子组件通过`inject`把父组件实例引进来，然后可以直接通过`this.father`可以直接获取到父组件，并调用下面的`sonSay`方法。

**孙组件**

````html
<template>
   <div class="grandSon" >
        <input  v-model="mes"  /> <button @click="send"  >对爷爷组件说</button>
    </div> 
</template>

<script>
export default {
    /* 孙组件 */
   name:'grandSon',
   /* 引入爷爷组件 */
   inject:['father'],
   data(){
       return {
           mes:''
       }
   },
   methods:{
       send(){
           this.father.grandSonSay( this.mes )
       }
   }
}
</script>
````
孙组件没有如何操作，引入的方法和子组件一致。

**效果**



#### 插槽方式

`provide , inject` 同样可以应用在插槽上，我们给父子组件稍微变动一下。

**父组件**

````html
<template>
  <div class="father" >
     <div>子组件对我说：{{  sonMes  }}</div>
     <div>孙组件对我说：{{  grandSonMes  }}</div>
     <son >
         <grandSon/>
     </son>
  </div>
</template>
<script>
import son from './slotSon'

import grandSon from './grandSon' 
export default {
   name:'father',
   components:{
       son, /* 子组件 */
       grandSon /* 孙组件 */
   },
   provide(){
       return {
           /* 将自己暴露给子孙组件 */
           father:this
       }
   },
   data(){
       return {
          grandSonMes:'', /* 来自子组件的信息 */
          sonMes:''      /* 发送给子组件的信息  */
       } 
   },
   methods:{
      /* 接受孙组件信息 */
      grandSonSay(value){
          this.grandSonMes = value
      },
      /* 接受子组件信息 */ 
      sonSay(value){
          this.sonMes = value
      },
   },
}
</script>
````

**子组件**

````html
<template>
    <div class="son" >
        <input  v-model="mes"   /> <button @click="send"  >对父组件说</button>
        <slot />
    </div> 
</template>
````

达到了同样的通信效果。实际这种插槽模式,所在都在父组件注册的组件，最后孙组件也会绑定到子组件的children下面。和上述的情况差不多。

#### provied其他用法

**provide不仅能把整个父组件全部暴露出去，也能根据需要只暴露一部分（一些父组件的属性或者是父组件的方法），上述的例子中，在子孙组件中，只用到了父组件的方法，所以我们可以只提供两个通信方法。但是这里注意的是，如果我们向外提供了方法,如果方法里面有操作this行为，需要绑定this**


**父组件**

````js
   provide(){
       return {
           /* 将通信方法暴露给子孙组件(注意绑定this) */
           grandSonSay:this.grandSonSay.bind(this),
           sonSay:this.sonSay.bind(this)
       }
   },   
   methods:{
      /* 接受孙组件信息 */
      grandSonSay(value){
          this.grandSonMes = value
      },
      /* 接受子组件信息 */ 
      sonSay(value){
          this.sonMes = value
      },
   },

````


**子组件**

````js
/* 引入父组件方法 */
   inject:['sonSay'],
   methods:{
       send(){
           this.sonSay(this.mes)
       }
   },
````


### 优点

#### 1 组件通信不受到子组件层级的影响
`provide inject`用法 和 `react.context`非常相似， `provide`相当于`Context.Provider` ,`inject` 相当于 `Context.Consumer`,让父组件通信不受到组件深层次子孙组件的影响。

#### 2 适用于插槽，嵌套插槽

`provide inject` 让插槽嵌套的父子组件通信变得简单，这就是刚开始我们说的，为什么 `el-form` 和 `el-form-item`能够协调管理表单的状态一样。在`element`源码中 `el-form` 就是将`this`本身`provide`出去的。


### 缺点

#### 1 不适合兄弟通讯

`provide-inject` 协调作用就是获取父级组件们提供的状态，方法，属性等，流向一直都是由父到子，`provide`提供内容不可能被兄弟组件获取到的，所以兄弟组件的通信不肯能靠这种方式来完成。

#### 2 父级组件无法主动通信

`provide-inject`更像父亲挣钱给儿子花一样，儿子可以从父亲这里拿到提供的条件，但是父亲却无法向儿子索取任何东西。正如这个比方，父组件对子组件的状态一无所知。也不能主动向子组件发起通信。

### 应用场景

`provide-inject`这种通信方式，更适合深层次的复杂的父子代通信，子孙组件可以共享父组件的状态，还有一点就是适合`el-form` `el-form-item`这种插槽类型的情景。



## 四 vuex

`vuex`算是`vue`中处理复杂的组件通信的最佳方案，毕竟是`vue`和`vuex`一个娘胎里出来的。而且`vuex`底层也是用`vue`实现的。相信不少同学对`vuex`并不陌生。接下来我们开始介绍vuex。


### 基础用法

**vuex文件**

````js
import Vuex from 'vuex'
import Vue from 'vue'

Vue.use(Vuex)

export default new Vuex.Store({
    state:{
        fatherMes:'',
        sonMes:'',
        fatherMesAsync:''
    },
    mutations:{
       sayFaher(state,value){
           state.fatherMes = value
       },
       saySon(state,value){
           state.sonMes = value
       },
       sayAsyncFather(state,value){
           state.fatherMesAsync = value
       }
    },
    actions:{
       asyncSayFather({ commit },payload){
           return new Promise((resolve)=>{
               setTimeout(()=>{
                   resolve(payload)
               },2000)
           }).then(res=>{
               commit('sayAsyncFather',res)
           })
       }
    }
})
````

在`store`文件中，我们声明三个`mutations` 分别是向父组件通信`saySon`，父组件向子组件通信，同步方法`sayFaher`和异步方法`sayAsyncFather` ,actions中模拟了一个三秒后执行的异步任务`asyncSayFather`。

**main.js**

````js
import store from './components/vuex/store'

new Vue({
  render: h => h(App),
  store
}).$mount('#app')
````
`main.js`注入store

**父组件**

````html
<template>
  <div class="father" >
     <input  v-model="mes"   /> <button @click="send"  >同步：对子组件说</button><br/>
      <input  v-model="asyncMes"   /> <button @click="asyncSend" >异步：对子组件说</button><br/>
     <div>子组件对我说：{{  sonMes  }}</div>
     <son />
  </div>
</template>
<script>
import son from './son'
export default {
   /* 父组件 */
   name:'father',
   components:{
       son ,/* 子组件 */
   },
   data(){
       return {
          mes:'',
          asyncMes:''
       } 
   },
   computed:{
       sonMes(){
           return this.$store.state.sonMes
       }
   },
   mounted(){
       console.log(this.$store)
   },
   methods:{
      /* 触发mutations，传递数据给子组件 */
      send(){
        this.$store.commit('sayFaher',this.mes)
      },
      /* 触发actions，传递数据给子组件 */
      asyncSend(){
         this.$store.dispatch('asyncSayFather',this.asyncMes) 
      }
   },
}
</script>
````
父组件分别触发同步异步方法，把信息发送给子组件。用`computed`来接受`vuex`中的`state`。

**子组件**

````html
<template>
    <div class="son" >
        <div> 父组件对我说：{{ fatherMes  }} </div>
        <div> 父组件对我说(异步)：{{ fatherMesAsync  }} </div>
        <input  v-model="mes"   /> <button @click="send"  >对父组件说</button>
    </div> 
</template>
<script>
export default {
   name:'son',
   data(){
       return {
           mes:'',
       }
   },
   computed:{
       /* 接受父组件同步消息 */
       fatherMes(){
           return this.$store.state.fatherMes
       },
       /* 接受父组件异步消息 */
       fatherMesAsync(){
           return this.$store.state.fatherMesAsync
       }
   },
   methods:{
       /* 向父组件发送信息 */
       send(){
           this.$store.commit('saySon',this.mes)
       },
   },
    
}
</script>
````

子组件的方法和父组件保持一直。

### 优点

#### 1 根本解决复杂组件的通信问题

vuex在一定程度上根本解决了vue复杂的组件通信情况,我们不再关心两个毫无干系的两个组件的通信问题。

#### 2 支持异步组件通信

`vuex`中`actions`允许我们做一些异步操作，然后通过`commit`可以把数据传入对应的`mutation`,至于`actions`为什么可以执行异步，是因为里面底层通过`Promise.resolve`能够获取异步任务完成的状态。

### 缺点

#### 1 流程稍微复杂，对于简单的通

### 应用场景

实际开发场景中，不会存在`demo`项目这样简单的通信，`vuex`的出现，就是解决这些比较复杂的组件通信场景。对于中大型项目，`vuex`是很不错的状态管理，数据通信方案。

## 五 事件总线一 EventBus

`EventBus`事件总线, `EventBus` 所有事件统一调度，有一个统一管理事件中心，一个组件绑定事件，另一个组件触发事件，所有的组件通信不再收到父子组件的限制，那个页面需要数据，就绑定事件，然后由数据提供者触发对应的事件来提供数据，这种通讯场景不仅仅应用在`vue`,而且也应用在`react`。

`EventBus` 核心思想是事件的绑定和触发，这一点和vue中 `this.$emit` 和 `this.$on`一样，这个也是整个`EventBus`核心思想。接下来我们来重点解析这个流程。

### 基本用法

**EventBus**

````js
export default class EventBus {
    es = {}
     /* 绑定事件 */ 
    on(eventName, cb) {
        if (!this.es[eventName]) {
            this.es[eventName] = []
        }
        this.es[eventName].push({
            cb
        })
    }
    /* 触发事件 */
    emit(eventName, ...params) {
        const listeners = this.es[eventName] || []
        let l = listeners.length

        for (let i = 0; i < l; i++) {
            const { cb } = listeners[i]
            cb.apply(this, params)
        }
    }
}

export default new EventBus()
````
这个就是一个简单的事件总线，有`on`,`emit`两个方法。

**父组件**

````html
<template>
  <div class="father" >
     <input  v-model="mes"   /> <button @click="send"  >对子组件说</button>
     <div>子组件对我说：{{  sonMes  }}</div>
     <son />
     <brotherSon />
  </div>
</template>
<script>
import son from './son'
import brotherSon from './brother'
import EventBus from './eventBus'
export default {
   name:'father',
   components:{
       son ,/* 子组件 */
       brotherSon, /* 子组件 */
   },
   data(){
       return {
          mes:'',
          sonMes:''/* 发送给子组件的信息  */
       } 
   },
   mounted(){
      /* 绑定事件 */
      EventBus.on('sonSay',this.sonSay)
   },
   methods:{
      /* 传递给子组件 */
      send(){
          EventBus.emit('fatherSay',this.mes)
      },
      /* 接受子组件信息 */ 
      sonSay(value){
          this.sonMes = value
      },
   },
}
</script>
````
我们在初始化的时候通过`EventBus`的`on`方法绑定`sonSay`方法供给给子组件使用。向子组件传递信息的时候，通过`emit`触发子组件的绑定方法，实现了父子通信。
接下来我们看一下子组件。

**子组件**

````html
<template>
    <div class="son" >
        <div> 父组件对我说：{{ fatherMes  }} </div>
        <input  v-model="mes"   /> <button @click="send"  >对父组件说</button>
        <div>
            <input  v-model="brotherMes"   /> <button @click="sendBrother"  >对兄弟组件说</button>
        </div>
    </div> 
</template>
<script>
import EventBus from './eventBus' 
export default {
   name:'son',
   data(){
       return {
           mes:'',
           brotherMes:'',
           fatherMes:''
       }
   },
   mounted(){
       /* 绑定事件 */
       EventBus.on('fatherSay',this.fatherSay)
   },
   methods:{
       /* 向父组件传递信息 */
       send(){
          EventBus.emit('sonSay',this.mes)
       },
       /* 向兄弟组件传递信息 */
       sendBrother(){
          EventBus.emit('brotherSay',this.brotherMes)
       },
       /* 父组件对我说 */
       fatherSay(value){
          this.fatherMes = value
       }
   },
    
}
</script>
````
和父组件的逻辑差不多，把需要接受数据的方法，通过`EventBus`绑定，通过触发eventBus方法，来向外部传递信息。我们还模拟了兄弟之间通信的场景。我们建立一个兄弟组件。

````html
<template>
  <div class="son" > 兄弟组件对我说: {{ brotherMes  }} </div>
</template>

<script>

import EventBus from './eventBus'
export default {
   /* */
   name:'brother',
   data(){
       return {
          brotherMes:''
       }
   },
   mounted(){
       /* 绑定事件给兄弟组件 */
       EventBus.on('brotherSay',this.brotherSay)
   },
   methods:{
       brotherSay(value){
           this.brotherMes = value 
       }
   }

}
</script>

````

我们可以看到，兄弟组件处理逻辑和父子之间没什么区别。

**效果**



### 优点

#### 1 简单灵活，父子兄弟通信不受限制。

eventBus的通信方式，相比之前的几种比较简单，而且不受到组件层级的影响，可以实现任意两个组件的通信。需要数据就通过`on`绑定，传递数据就`emit`触发。

#### 2 通信方式不受框架影响

eventBus的通信方式，不只是vue可以用，react,小程序都可以使用这种通信方式，而且笔者感觉这种通信方式更适合小程序通信，至于为什么稍后会一一道来。

### 缺点

#### 1 维护困难，容易引起连锁问题

如果我们采用事件总线这种通信模式，因为所有事件是高度集中，统一管理的，中间如果有一个环节出现错误，就会造成牵一发动全身的灾难.而且后期维护也是十分困难的。

#### 2 需要谨小慎微的命令规范

现实的应用场景，要比demo场景复杂的多，实际场景会有无数对父子组件，无数对兄弟组件，我们不肯能每个事件都叫相同名字，所以eventBus绑定事件的命名要有严格的规范，不能起重复名字，也不能用错名字。

#### 3 不利于组件化开发

eventBus通信方式是无法进行有效的组件化开发的，假设一个场景，一个页面上有多个公共组件，我们只要向其中的一个传递数据，但是每个公共组件都绑定了数据接受的方法。我们怎么样做到把数据传递给需要的组件呢？

### 应用场景

实现总线这种方式更适合，微信小程序，和基于vue构建的小程序，至于为什么呢，因为我们都知道小程序采用双线程模型（渲染层+逻辑层）（如下图所示），渲染层作用就是小程序wxml渲染到我们的视线中，而逻辑层就是我们写的代码逻辑，在性能上，我们要知道在渲染层浪费的性能要远大于逻辑层的代码执行性能开销，如果我们在小程序里采用通过props等传递方式，属性是绑定在小程序标签里面的，所以势必要重新渲染视图层。如果页面结构复杂，可能会造成卡顿等情况，所以我们通过eventBus可以绕过渲染层，直接有逻辑层讲数据进行推送，节约了性能的开销。

## 六 事件总线二 new Vue

`new Vue` 这种通信方式和`eventBus`大致差不多，有一点不同的是，以`vue`实例作为`eventBus`中心，除了我们可以用`$on`,`$emit`之外，我们还可以用vue下的`data`,`watch`等方法，而且我们建立多个多个`vue`，作为不同模块的数据通信桥梁，相比上边那个`EventBus`方法，`new Vue`这种方法更高效,更适合`vue`项目场景。我们接着往下看。

### 基本使用

**VueBus**

````js
import Vue from 'vue'

export default new Vue()
````

**父组件**

````html
<template>
  <div class="father" >
     <input  v-model="mes"   /> <button @click="send"  >对子组件说</button>
     <div>子组件对我说：{{  sonMes  }}</div>
     <son />
  </div>
</template>
<script>
import son from './son'
import VueBus from './vueBus'
export default {
   /* 父组件 */ 
   name:'father',
   components:{
       son ,/* 子组件 */
   },
   data(){
       return {
          mes:'',
          sonMes:'' /* 发送给子组件的信息  */
       } 
   },
   created(){
       /* 绑定属性 */
       VueBus._data.mes = 'hello,world'
   },
   mounted(){
      /* 绑定事件 */
      VueBus.$on('sonSay',this.sonSay)
   },
   methods:{
      /* 传递给子组件 */
      send(){
         VueBus.$emit('fatherSay',this.mes)
      },
      /* 接受子组件信息 */ 
      sonSay(value){
          this.sonMes = value
      },
   },
}
</script>
````

我们通过 `$on`绑定了接受数据的方法，初始化的时候向 vue_data下面绑定了数据。

**子组件**

````html
<template>
    <div class="son" >
        <div> 父组件对我说：{{ fatherMes  }} </div>
        <input  v-model="mes"   /> <button @click="send"  >对父组件说</button><br/>
        <button @click="getFatherMes" >获取数据</button>
    </div> 
</template>

<script>
import VueBus from './vueBus' 
export default {
   name:'son',
   data(){
       return {
           mes:'',
           brotherMes:'',
           fatherMes:''
       }
   },
   mounted(){
       /* 绑定事件 */
       VueBus.$on('fatherSay',this.fatherSay)
   },
   methods:{
       /* 向父组件传递信息 */
       send(){
          VueBus.$emit('sonSay',this.mes)
       },
       /* 父组件对我说 */
       fatherSay(value){
          this.fatherMes = value
       },
       /* 获取父组件存入vue中的数据 */
       getFatherMes(){
           console.log( VueBus._data.mes )
       }
   },

    
}
</script>
````
和eventBus事件总线一样,我们还可以直接通过`_data`数据直接获取到父组件传递的内容。

**效果**

### 优点

#### 1 简单灵活，任意组件之间通信。

和上边eventBus通信方式一样，这种通信方式很灵活，可以轻松在任意组件间实现通信。

#### 2 除了通信还可以使用 watch , computed等方法

如果我们通过vue作为通信媒介，那么只用其中的`$emit`和`$on`真的是有点大材小用了，既然实例了一个vue，我们可以轻松的使用vue的 `$watch` `computed`等功能。

### 缺点

基本上EventBus的缺点，都在vue这种通信方式中都有存在。

### 应用场景

在项目中不考虑用**vuex的中小型项目中**，可以考虑采用`vue`事件总线这种通信方式，在使用的这种方式的时候，我们一定要注意命名空间，不要重复绑定事件名称。分清楚业务模块，避免后续维护困难。

## 写在后面



笔者在工作之余一直在看`vue2.0`和`vue3.0`源码，对3.0源码出了几篇文章，陆续会持续更新，感兴趣的同学可以直接点击阅读

[vue3.0 响应式原理(超详细)](https://juejin.cn/post/6858899262596448270)

[全面解析 vue3.0 diff算法](https://juejin.cn/post/6861960532048642061)

[vue3.0 watch 和 computed源码解析(举例图解)](https://juejin.cn/post/6869196067116679182)


