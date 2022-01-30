# webpack 热更新

一种是页面刷新，不保留页面状态，就是简单粗暴，直接window.location.reload()。
另一种是基于WDS (Webpack-dev-server)的模块热替换，只需要局部刷新页面上发生变化的模块，同时可以保留当前的页面状态，比如复选框的选中状态、输入框的输入等。

# webpack-dev-server 建立链接

