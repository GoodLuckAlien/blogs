
### 配置装饰器Decorator

比如React中配置装饰器模式或者使用mobx中，配置@observable，@action等装饰器。
````json
 "plugins":[
    [
        "@babel/plugin-proposal-decorators",
        {
            "legacy": true,
            "loose": true
        }
    ],
     "@babel/plugin-proposal-class-properties",
 ]
 
````