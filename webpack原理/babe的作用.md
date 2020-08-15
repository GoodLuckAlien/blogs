
babel.parse ->分析文件，将文件依赖关系，转化成抽象语法树

babel/traverse -> 根据所得到语法树收集文件之间的关系

@babel/core -> 将语法树转成对应的代码。可以设置对应转译es6语法之类的