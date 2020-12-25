### 点击劫持
什么是点击劫持？如何防范点击劫持？
点击劫持是一种视觉欺骗的攻击手段。攻击者将需要攻击的网站通过 iframe 嵌套的方式嵌入自己的网页中，并将 iframe 设置为透明，在页面中透出一个按钮诱导用户点击。

对于这种攻击方式，推荐防御的方法有两种。
X-FRAME-OPTIONS
==X-FRAME-OPTIONS== 是一个 HTTP 响应头，在现代浏览器有一个很好的支持。这个 HTTP 响应头 就是为了防御用 ==iframe== 嵌套的点击劫持攻击。
该响应头有三个值可选，分别是

==DENY==，表示页面不允许通过 iframe 的方式展示
==SAMEORIGIN==，表示页面可以在相同域名下通过 iframe 的方式展示
==ALLOW-FROM==，表示页面可以在指定来源的 iframe 中展示

JS 防御
对于某些远古浏览器来说，并不能支持上面的这种方式，那我们只有通过 JS 的方式来防御点击劫持了。

````js
<head>
  <style id="click-jack">
    html {
      display: none !important;
    }
  </style>
</head>
<body>
  <script>
    if (self == top) {
      var style = document.getElementById('click-jack')
      document.body.removeChild(style)
    } else {
      top.location = self.location
    }
  </script>
</body>
````
复制代码以上代码的作用就是当通过 ==iframe== 的方式加载页面时，攻击者的网页直接不显示所有内容了。
### 中间人攻击

什么是中间人攻击？如何防范中间人攻击
中间人攻击是攻击方同时与服务端和客户端建立起了连接，并让对方认为连接是安全的，但是实际上整个通信过程都被攻击者控制了。攻击者不仅能获得双方的通信信息，还能修改通信信息。
通常来说不建议使用公共的 Wi-Fi，因为很可能就会发生中间人攻击的情况。如果你在通信的过程中涉及到了某些敏感信息，就完全暴露给攻击方了。
当然防御中间人攻击其实并不难，只需要增加一个安全通道来传输信息。HTTPS 就可以用来防御中间人攻击，但是并不是说使用了 HTTPS 就可以高枕无忧了，因为如果你没有完全关闭 HTTP 访问的话，攻击方可以通过某些方式将 HTTPS 降级为 HTTP 从而实现中间人攻击。
