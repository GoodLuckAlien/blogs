①②③④⑤⑥⑦⑧⑨⑩⑪⑫⑬⑭⑮⑯⑰⑱⑲⑳
# 开发嵌入京东app h5| Hybrid | 微信小程序 ｜ 实践踩坑总结十六条

# 一 前言

笔者在业务工作中遇到很多。。。。。

## 思维导图

# 开发M端h5踩坑总结

以下是京东嵌入h5，h5落地页，遇到的问题。我用一个思维导图表示出来。

## 1 ios：:postion:fixed 定位抖动跳屏问题

### 背景

在开发京东app,`Hybrid h5`业务页面的时候，遇到一个非常棘手的问题，因为这个页面类似京东app商品详情页面的动画效果。 动画效果如下所示。安卓手机正常，但是ios手机出现，滑块抖动问题，图片会出现闪动的效果。这个问题困扰了很久，网上搜索了大量的解决方案，都没有实际解决问题，自己也尝试了几种方法，也没有成功，当时很奔溃😭😭😭，最后还是灵光一现，想到了一个巧妙的解决方案😂。


整个流程就是，当视图容器向上滑动的时候，商品卡片容器需要缓慢移动，首先需要将商品卡片需要脱离标准流，设置定位`position:fixed` 固定定位。然后控制`top`值来控制滑块的缓慢移动。但是在容器向上滑动的过程中，滑块会出现`抖动`，`闪动`的效果。

🤔分析这个原因，应该是`ios`对`position`表现不友好的原因，这种类似的原因在小程序里也很常见。

### 解决方案

#### 网上搜索和自己探索的失败解决方案

① 给顶级元素设置`height:100%` ( **并没有奏效** ) 。

② 增加 `transform: translate(0)` 属性 （ **并没有奏效** ）

③ 改变布局由`fixed` 定位,改成`absolute`定位，滚动条基于自身。（ **能够从根本上解决偶尔跳屏的问题，但是随之而来的就是`ios` 滚动条问题，基于`document`才能有效触发，遂放弃此方案**）

④ 不改变布局的情况下，由`fixed` 定位,改成`absolute`定位，滚动条基于`document`,定位值完全取决于数据驱动。（**能够从根本上解决偶尔跳屏的问题，但是随之而来的就是要不断改变自身的top值 ，导致更新会慢的情况 ，用户体验不好，流畅度欠佳，遂放弃此方案** ）

⑤ `-webkit-overflow-scroll:touch`解决滑动无惯性（ **并没有奏效** ）

⑥ `background-attachment:fixed`（  **并没有奏效** ）

#### 解决方案

试了好久，终于想到了一个解决方法。**继续使用 `fixed` 定位，因为我们这里需要通过定位，抖动不是单纯`fixed`定位的原因。和频繁改变`top`值也有很大关系。放弃改变`top`值 ，运用`transform: translateY`来使视图上下移动。**

````html
<view class="scroll_box" style={{ transform:`translateY(${ top }px)` }}    >
   <!-- 很多东西 -->
</view>
````

````css
.scroll_box{
    position:fixed;
}
````

## 2 android问题：border-radius：50% 圆角被拉伸问题

### 背景 

当我们期望用 `border-radius：50%；` 来绘制圆点的时候。如果圆比较大可能不是很明显，但是如果圆比较小的时候，会出现明显的不圆，圆被拉伸的情况。

大致效果如下所示。

🤔分析原因， 在移动端通常会适配不同的手机，所以使用`rem`布局，，`rem` 在换算为`px`时，会是一个带小数点的值，安卓对小于`1px`的做了处理（不同浏览器对小于`1px`的处理方式不同，有的采用四舍五入，有的大于某个值展示`1px`否则就舍去），从而导致圆角不圆；在`ios`下就没有这个问题。

### 解决方案

我们先把已知视图宽高变成2倍 ,然后用 `transform: scale(.5)` 让视图缩小50% ,就可以在 `android`得到很圆的效果。亲测这个方法非常奏效，形成的圆非常的圆。

我们举个例子🌰：

````html
<div class="round" ></div>
````

没有做兼容之前的样式，

````css
.round{
    border-radius:50%;
    width:10px;
    heigth:10px;
}
````

改成

````css
.round{
    border-radius:50%;
    width:20px;
    heigth:20px;
    transform: scale(.5);
}
````
这里用的`taro-h5`, `px` 会被自动转化成`rem`。

### 问题演变

有的时候我们在给元素设置高度非常小的时候也会出现这个问题。

````html
<view class='box'  /> 
````

````css
.box{
    width:100px;
    height:1px;
}
````
因为我们高度设置为`height:1px`,当`taro`给转换成`rem`的时候，也会出现四舍五入的情况，结果将`1px`弄没了，变成了`0px`，于是乎就造成了`1px`元素无法显示的`bug`，解决方案和上述的原理一样。将高度变成原来的2倍，再通过`transform: scaleY(.5);` y方向变为原来的二分之一。

````css
.box{
    width:100px;
    height:2px;
    transform: scaleY(.5);
}
````

## 3 iOS问题 ：最后子元素ios底部设置margin-bottom无效

### 背景

这个问题在`ios`环境下，还是很容易发生的。当视图容器的最后一个元素设置 `margin-bottom` ,期望距离整个容器视图有一个距离的时候，发现在安卓手机正常，但是在`ios`下，会出现`margin-bottom`无效的情况。


### 解决方案

这个的解决方案也非常非常的简单，将`margin-bottom`改成`padding-bottom`就能根本的解决问题。

例子🌰：

````html
<div class="box" ></div>
````

````css
.box{
   margin-bottom: 148px;
}
````

改成

````css
.box{
   padding-bottom: 148px;
}
````




## 4 ios 屏幕上拉下滑出现空白

### 背景

手指按住屏幕下拉，屏幕顶部会多出一块空白区域。手指按住屏幕上拉，底部多出一块空白区域。空白区域的颜色，在不同`app`平台打开，颜色会有差别，嵌入京东app h5中的空白背景色为白色，但是在微信中为灰色。

🤔分析原因:
在 `iOS` 中，手指按住屏幕上下拖动，会触发 `touchmove` 事件。这个事件触发的对象是整个 `webview` 容器，容器自然会被拖动，剩下的部分会成空白。

效果如下：

**嵌入京东app中**

**微信内置浏览器中**


### 解决方案

#### 1 障眼法,很管用

比如对于京东app这种白色背景,如果我们`background`也是白色的，完全可以用整个顶端容器，定位填充整个容器来解决这个问题。这样视图不会跟随上拉下滑而移动。如果空白颜色和背景颜色一致，视觉上就会抵消滑动效果。根本上解决出现空白的问题。

一言不合上代码😜。

````html
<div id="root" >
   <!-- 此处省略很多内容  -->
</div>
````

````css
#root{
    position: fixed;
    left:0;
    top:0;
    bottom: 0;
    right: 0;
}
````

#### 2 监听事件，禁止上滑下滑

这种方法比较靠谱，俗话说`解铃还须系铃人`,这个问题根本原因是 `touchmove` 引起的，那么从根本上解决问题，还是要从`touchmove`这个事件入手。我们需要监听移动端`document` 的 `touchmove`然后通过 `preventDefault` 方法，阻止同一触点上所有默认行为，比如滚动事件。这里要注意的是什么时候，不让滑动，什么时候让滑动。

````html
<div  ref="root"  ></div>
````

````js
const box = this.$refs.root
box.addEventListener('touchmove',function(e){
    /* 让视图容器正常滚动 */
    e._isScroller = true
})
 /* 禁止上滑，下滑 */
document.body.addEventListener('touchmove', function (e) {
    if (e._isScroller) return
    /*  阻止默认事件 */
    e.preventDefault()
}, {
    passive: false
})
````




## 5 移动端问题： input 的 placeholder 垂直方向不居中问题

### 背景
在开发移动端的时候，会遇到 `input` 的 `placeholder` 垂直方向不居中的情况。

### 解决方案

`input`的`placeholder`会出现文本位置偏上的情况:PC端设置`line-height`等于`height`能够对齐,而移动端仍然是偏上,解决方案时是设置`css line-height:normal`;

html:
````html
<input class="input"  />
````
样式：
````css
.input{
   line-height:normal;
}
````


## 6 IOS 滑动问题 -webkit-overflow-scrolling : touch 卡住不动问题

### 背景

在`ios`页面向上向下滑动的过程中，会出现卡顿，不流畅的现象,具体问题如下:

1 在`safari`上，使用了`-webkit-overflow-scrolling:touch`之后，页面偶尔会卡住不动。(中招)
2 在`safari`上，点击其他区域，再在滚动区域滑动，滚动条无法滚动的(中招)。

在解决这个问题之前，我们先理解`-webkit-overflow-scrolling`的两个属性

**1 `auto`: 使用普通滚动, 当手指从触摸屏上移开，滚动会立即停止。**
**2 `touch`: 使用具有回弹效果的滚动,当手指从触摸屏上移开，内容会继续保持一段时间的滚动效果。继续滚动的速度和持续的时间和滚动手势的强烈程度成正比。同时也会创建一个新的堆栈上下文。**

### 解决方案

````html
<div id="app" style="-webkit-overflow-scrolling: touch; ">
    <div style="min-height:101%"></div> 
</div>
````
或

````html
<div id="app" style="-webkit-overflow-scrolling: touch; ">  
    <div style="height:calc(100%+1px)"></div> 
</div>

````
方法就是在`webkit-overflow-scrolling:touch`属性的下一层子元素上，
将`height`加1%或1px。从而主动触发`scrollbar`。


## 7 移动端适配：页面放大缩小

### 背景

如果没有使用`taro`等跨平台框架构建的h5,当在M端展示h5的时候，双击或者双指张开手指页面元素，页面会放大或缩小。

针对这个情况，实际不算一个`bug`，因为`html`本身就支持缩放。在`pc`端的时候，我们可以控制鼠标滚轮控制页面缩放，但是在移动端这个行为也存在。但是对于嵌入的 M端 h5页面，我们不需要这个功能。

### 解决方案

我们可以通过 `meta` 元标签标准中有个 中 `viewport` 属性，用来控制页面的缩放，一般用于移动端。

我们先看看`taro-h5`是怎么适配的.

````html
  <meta content="width=device-width,initial-scale=1,user-scalable=no" name="viewport">
````

核心`user-scalable=no` ,没错，就是通过这个属性来阻止缩放行为的。



## 8 taro跨平台开发H5: swiper组件横向滚动平铺问题 

### 背景

在用`taro-vue`构建 `h5`应用的时候，对于`banner`轮播图部分，出现一个诡异的问题，就是水平方向轮播的时候，期望图片是正常的轮播效果，但是初始化的时候，图片垂直方向平铺。

大致效果如下图所示：

### 解决方案

**大致代码如下：**

````html
<swiper  class="swiper-wrap"  >
  <swiper-item
        v-for="(v,idx) in renderList"
        :key="idx"
        class="swiper-item"
    >
        <view class="swiper-wrap-item">
            <image
            mode="widthFix"
            :src="v.path"
            class="swiper-image"
            />
        </view>
    </swiper-item>
</swiper>

````

这个棘手的问题在于不是每次都复现，由于这个页面是商品详情页，问题会根据某一个商品出现。因为 `renderList` 是通过后台获取的图片列表，所以判断问题是由**渲染`swiper` ->  请求数据赋值`renderList` -> 再到`swiper-item`渲染图片列表的过程中**，某一个环节出了问题。遂改变了渲染方案， 所以采用 **获取数据 -> 渲染swiper ->渲染swiperItem**的方案。

**改进后的代码如下：**

````html
<swiper  class="swiper-wrap"  v-if="renderList.length > 0"  >
  <swiper-item
        v-for="(v,idx) in renderList"
        :key="idx"
        class="swiper-item"
    >
        <view class="swiper-wrap-item">
            <image
            mode="widthFix"
            :src="v.path"
            class="swiper-image"
            />
        </view>
    </swiper-item>
</swiper>
````

当 `renderList`获取到数据之后，在依次渲染`swiper`，`swiper-item`。根本解决了这个问题

# 微信小程序

以下在开发小程序的过程中遇到的兼容问题。

## 1 android问题：打开webview被微信拦截问题

### 背景

在微信小程序里开发`webview h5`的时候，在配置了合法域名，域名备案的情况下，出现了 `ios` 上正常打开，但是在 `android` 手机上出现了被拦截的情况。而且这些情况都是因为打开`webview`的 `url`中存在汉字的情况。

效果图片


### 分析原因，解决方案

实际原因很简单，安卓手机对于 `http / https` url如果存在汉字，需要用`encodeURI`对汉字进行编码处理就可以了。

````html
 <web-view :src="webViewUrl" @message="handerMessage" />
````

````js
 this.webViewUrl  = commonUrl + '/pages/goods/index?name=' + encodeURI('外星人')
````
如果是接口请求，就这么写

````js
wx.request({
   url: commonUrl + '/pages/goods/index?name=' + encodeURI('外星人'),
   method: "GET",
})
````

完美解决了问题。

### webview 被微信拦截，详细解决方案。

关于微信小程序中`webview`被拦截。我总结了一个详细的方案，供大家参考，也是开发中踩坑实录。

如果在微信小程序开发`webview`中 ， 被微信拦截，你需要这样逐一排查。



#### ① 首先检查域名是否备案

首先检查域名是否备案，如果域名没有备案，是无法正常打开`webview`的，如果当前域名是`二级域名`，那就看主域名有没有备案，耳机域名无需独立备案。

#### ② 配置业务域名

配置业务域名流程很简单，首先登陆小程序后台 -> 开发，开发管理 - > 开发设置。


然后选择业务域名 -> 点击修改 -> 添加业务域名。

注意上边这部分，需要按这上面的操作添加。添加成功后，会自动添加到，合法域名列表中。

#### ③ 如果 ① 和 ② 完成后，仍然被拦截

如果走完上边的两步，仍然被拦截。在2020年之前的域名，一般不会被拦截，但是微信对新申请的域名比较严格，需要先点击申诉试试，如果申诉还不行的话，需要联系微信团队相关人员解决问题，因为我们公司有与微信团队联系的部门，所以无须我们联系。


#### ④ 如果只有安卓手机被拦截

如果只有安卓手机被拦截的情况，请按照上面的方法，编码带汉字的`url`。


## 2 iOS问题： 微信小程序1rpx border ios真机显示不全问题

### 背景

微信小程序在iphone低版本手机(iphone6 ,6p),如果多个视图容器排列(水平和竖直方向都会存在)，可能会出现个别边框显示不全的问题。

效果如下图所示：

````html
<view class="father" >
    <view class="item" >商品1</view>
    <view class="item" >商品2</view>
    <view class="item" >商品3</view>
    <view class="item" >商品4</view>
</view>
````

````css
.father{
    width: 696rpx;
    height: 60rpx; 
    font-size: 28rpx;
    color: #01b5b5;
    margin: 0 auto;  
   }
   .item{
    height: 60rpx;
    line-height: 60rpx;
    border: 1rpx solid #01b5b5;
    float: left;
    border-radius: 10rpx;
    padding: 0 20rpx;
    margin-right: 16rpx;
    margin-bottom: 16rpx;
}
````
 
### 解决方案

经过测试得来一组数据 ,注意步骤1中加粗的文本.label-con类中width:696rpx,将标签的父容器宽度设置为下面的值都会出现这个692 693 696 697 700 701 704 705 708 709。我们把这组数字除以2。

`692/2=346`,`693/2=346.5`,`696/2=348`,`697/2=348.5`,`700/2=350`,`701/2=350.5`,`704/2=352`,`705/2=352.5`,`708/2=354`,`709/2=354.5`

**分析结果:**当标签的父容器宽度(单位rpx)÷2的值为偶数或偶数.5的时候会出现该bug,那么我们可以推到出用200.5*2=401,302*2=604等等都会重现这个bug。那么解决方案油然而生。

#### 第一种： 设置高度/宽度到安全的值

第一种方式是设置标签父容器的宽度到无bug值，即(奇数或奇数.5)*2,例如281*2rpx,281.5*2rpx可以解决;

#### 第二种：放一个1rpx的元素占位。(亲测有效)

````html
<view class="father" >
    <view class="hold" />
    <view class="item" >商品1</view>
    <view class="item" >商品2</view>
    <view class="item" >商品3</view>
    <view class="item" >商品4</view>
</view>
````

````css
.hold{
    width: 1rpx;
    height: 100%;
    float: left;
}
````
效果如下，完美的解决了这个问题。


## 3 小程序问题: scroll-view 不滑动问题


### 背景

相信很多同学在开发微信小程序的时候都会遇到`scroll-view`不滑动的情况，造成`scroll-view`不滑动的原因有会多，横向和竖向不滑动的原因也不同，接下来我会分别从横向和竖向分别介绍造成滑动的原因。

横向：

竖向：

### 解决方案

#### 1 竖直方向

对于竖直方向的滑动，造成原因如下:

① `scroll-view` 的 ` scroll-y` 是否为 `true`

````html
<scroll-view :scroll-y="true" >
  <!-- 此处省略很多东西 -->
</scroll-view>

````

② `scroll-view` 必须设置**具体的高度**，如果没有设置高度，或者直接继承父元素高度`100%`,那么 `scroll-view`竖直方向将无效。

**如何正确获取`scroll-view`高度**

情况一：

情况二：

③ 检查 scroll-view 是否设置了 `overflow-y: auto;` 等滑动属性。

````html
<scroll-view :scroll-y="true" class="scroll_box"  >
  <!-- 此处省略很多东西 -->
</scroll-view>
````

````css
.scroll_box{
    height:500px;
    overflow-y: auto;
}
````



#### 2 水平方向

对于水平方向的滑动，造成原因如下:

① `scroll-view` 的 ` scroll-x` 是否为 `true`

````html
<scroll-view :scroll-x="true" >
  <!-- 此处省略很多东西 -->
</scroll-view>
````

② 不要设置 `display:flex;` 等情况 ,让子元素设置 `display:inline-block`

````html
<scroll-view :scroll-x="true" class="scroll_box"  >
   <view  class="item"  >  <!-- 此处省略很多东西 --> </view>
   <view  class="item"  >  <!-- 此处省略很多东西 --> </view>
   <view  class="item"  >  <!-- 此处省略很多东西 --> </view>
   <!-- .... -->
</scroll-view>
````

````css
.scroll_box{
    /* display:flex; 不要这么做 */
    white-space: nowrap;
}
.item{
   display:inline-block； /* 这么做 */
}
````

③ `scroll-view` 设置样式 `white-space: nowrap;` 

````html
<scroll-view :scroll-x="true"  style="white-space: nowrap;" ></scroll-view>
````

## 4 低版本android手机：原生组件层级问题

### 背景

这个是很久之前做的一个类似地图的项目，在地图组件上，有一个`view`,在高版本手机上，正常显示，但是在低版本安卓手机上，会出现`view`只有文字能看见，背景完全被原生组件覆盖，设置层级也没有效果。

### 解决方案

后来差了微信文档，才明白原生组件和原生组件的限制。

小程序中的部分组件是由客户端创建的原生组件，这些组件有：

**camera**
**canvas**
**input（仅在focus时表现为原生组件）**
**live-player**
**live-pusher**
**map**
**textarea**
**video**

#### 原生组件的使用限制
 
由于原生组件脱离在 WebView 渲染流程外，因此在使用时有以下限制：

①原生组件的层级是最高的，所以页面中的其他组件无论设置 z-index 为多少，都无法盖在原生组件上。后插入的原生组件可以覆盖之前的原生组件。

②原生组件还无法在 picker-view 中使用。基础库 2.4.4 以下版本，原生组件不支持在 scroll-view、swiper、movable-view 中使用。

③部分CSS样式无法应用于原生组件，例如：无法对原生组件设置 CSS 动画，无法定义原生组件为 position: fixed，不能在父级节点使用 overflow: hidden 来裁剪原生组件的显示区域。

④原生组件的事件监听不能使用 bind:eventname 的写法，只支持 bindeventname。原生组件也不支持 catch 和 capture 的事件绑定方式。原生组件会遮挡 vConsole 弹出的调试面板。 在工具上，原生组件是用web组件模拟的，因此很多情况并不能很好的还原真机的表现，建议开发者在使用到原生组件时尽量在真机上进行调试。*


#### 替代方案

**`cover-view` 与 `cover-image`**
为了解决原生组件层级最高的限制。小程序专门提供了 `cover-view` 和 `cover-image` 组件，可以覆盖在部分原生组件上面。这两个组件也是原生组件，但是使用限制与其他原生组件有所不同。



## 5 ios问题:  微信scroll-view内部定位问题 

### 背景

`ios`环境下，`scroll-view`标签里面如果有，`position:absolute`的元素。当`scroll-view`滑动的过程中，定位的元素会出现抖动的情况。

🤔分析原因，还是 `scroll-view` 和 `ios`兼容性的原因造成的。

### 解决方案

针对这个抖动问题，解决方案也是很简单，我们把定位的元素从`scroll-view`拿出来。就能根本解决这个问题。

````html
<view class="box" >
    <scroll-view class="scroll_box"  :scroll-y="true" >
        <view class="current" >我是定位元素</view>
    </scroll-view>
</view>
````

````css
.box{
  
}
.scroll_box{
    height:500px;
    overflow-y: auto;
    position:relative;
}
.current{
   position:absolute;
   left:0;
   top:0;
}
````
改成

````html
<view class="box" >
    <scroll-view class="scroll_box"  :scroll-y="true" >
    </scroll-view>
    <view class="current" >我是定位元素</view>
</view>
````

````css
.box{
    position:relative;
}
.scroll_box{
    height:500px;
    overflow-y: auto;
}
.current{
   position:absolute;
   left:0;
   top:0;
}
````

## 6 微信小程序跳转微信小程序，第二次跳转无效

### 背景

在开发小程序的时候，有一个**小程序跳转另外一个小程序的场景**，第一次的时候没有任何问题，但是当从跳转的目标小程序，返回到当前小程序之后，第二次跳转的时候，发现跳转功能失效了，无法再次跳转。我们的跳转逻辑是写在一个小程序过渡页面的生命周期中的。具体流程图如下所示：


### 解决方案

先看看跳转小程序方法
````js
wx.navigateToMiniProgram({
    appId:'appId',
    path:'路径',
    extraData:'需要传递给小程序的数据',
    success(){}, // 成功回调
    fail(){}, //失败回调
    complete(){} //无论成功/失败，都会执行完成方法。
})
````

🤔这到底是为什么呢，这个问题困绕我很久，查阅了相关资料，微信文档都没找到相关的解决方案。但是微信文档有这么一句话，需要用户触发跳转，从 2.3.0 版本开始，若用户未点击小程序页面任意位置，则开发者将无法调用此接口自动跳转至其他小程序
最后发现是第二次跳转的过程中，由于不是用户**主动行为(点击事件等人为主动的行为)**，而是又过渡页面的生命周期执行的跳转小程序，所以微信被判定无效的跳转，就会直接走跳转失败的逻辑,`webview`里面的点击跳转事件不算是用户的主动行为😂😂。

所以我们在过渡页进行一判断，如果是第二次跳转，先弹出弹窗，让用户主动点击，触发用户主动行为。然后再跳转小程序。


## 7 taro小程序 scroll-view 下滑，突然置顶问题

### 背景

在用`taro-vue`搭建小程序的时候，在`scroll-view`向下滑动的时候，会出现一个诡异情况，就是`scroll-view`会因为一个兄弟元素的显示隐藏，而突然置顶。

结构是这样的。

````html
<view>
    <scroll-view :scroll-y="true" >
       <!-- 此处省略很多 -->
    </scroll-view>
    <view  class="current" v-show="currentShow" > </view>
</view>
````

当`scroll-view`滑动的时候，想用变量`currentShow`控制`scroll-view`显示隐藏，但是 `currentShow`一旦改变，就会引起 `scroll-view` 突然置顶。

### 解决方案

`scroll-view`的问题还真是多呀，这个问题曾困扰笔者很久,` taro3.0 taro-vue`毕竟不够成熟，会有很多想象不到的问题，如果想用`taro`,我这里推荐`taro2.0`比较成熟。

废话不多说，这里介绍两个解决方案。
1  将当前元素节点放在 `scroll-view`元素内部。

````html
<view>
    <scroll-view :scroll-y="true" >
       <!-- 此处省略很多 -->
        <view  class="current" v-show="currentShow" > </view>
    </scroll-view> 
</view>
````

2 将`v-if `改变成 `v-show`

````html
<view>
    <scroll-view :scroll-y="true" >
       <!-- 此处省略很多 -->
    </scroll-view>
    <view  class="current" v-if="currentShow" > </view>
</view>
````

## 8 小程序cavans问题，生成二维码问题。

### 问题汇总

#### canvas 遇到的坑

**① 关于canvas 宽高以及缩放比问题，绘制的元素变形，画布的高度真得等于cavans标签设置的宽高么？**

**② canvas怎么绘制叠在一起的两张图片，并控制层级？**

**③ 如何用canvas绘制，多行文本？**

**④ 如何根据设计稿，精确还原海报各个元素位置问题。**

**⑤ canvas怎么绘制base64的图片？**

**⑥ 如何绘制网络的图片,两种canvas画布api，绘制图片有什么区别完成？**


#### 生成二维码遇到的坑


**① 如何正确选型生成二维码工具？**

**② 生成的二维码，识别不出来怎么办？**

**③ 如何绘制二维码上的logo？**


### 解决方案

这些问题都会在笔者的另一篇文章中找到答案，**文章的传送门是：**

[建议收藏」小程序canvas绘制海报全流程](https://juejin.cn/post/6930404573043490830)

# 总结


## 参考资料

[微信小程序1rpx border ios真机显示不全问题分析及解决方案](https://blog.csdn.net/c5211314963/article/details/80323443)

[微信官方文档](https://developers.weixin.qq.com/miniprogram/dev/component/native-component.html)

