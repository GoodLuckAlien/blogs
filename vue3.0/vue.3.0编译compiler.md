①②③④⑤⑥⑦⑧⑨⑩⑪⑫⑬⑭⑮⑯⑰⑱⑲⑳
# vue 3.0 编译流程

## 1 入口
第一步在最开始引入vue的时候就执行了

vue index.t文件，里面第一函数

````js
/* 此时将registerRuntimeCompiler -> 赋值给 组件初始化时候的compiler  */
registerRuntimeCompiler(compileToFunction)
````
registerRuntimeCompiler 何时调用
在引入vue文件时候已经调用了registerRuntimeCompiler

目的 ： 将 compileToFunction 方法赋值给compile

**compile何时调用**

在patch component组件的时候已经调用了compile

**compileToFunction**

① 如果存在缓存 ， 返回缓存之后的cached 

② 判断template是否是ID选择器

③ 执行**compile(编译流程开始)**方法生成code '


**compile方法**

compile方法 -> baseCompile

````js
export function compile(
  template: string,
  options: CompilerOptions = {}
): CodegenResult {
  return baseCompile(template, {
    ...parserOptions,
    ...options,
    nodeTransforms: [...DOMNodeTransforms, ...(options.nodeTransforms || [])],
    directiveTransforms: {
      ...DOMDirectiveTransforms,
      ...(options.directiveTransforms || {})
    },
    transformHoist: __BROWSER__ ? null : stringifyStatic
  })
}

````

## 2 解析参数
  
### 1   parserOptions
①②③④⑤⑥⑦
  ① isNativeTag -> 原生html标签 或者 svg标签
  ② isPreTag -> 判断
  ③ isBuiltInComponent
  ④ getNamespace
  ⑤ getTextMode

### 2 options 传过来的options  

### 3 nodeTransforms  
[ transformStyle ] -> 解析style

① transformStyle
````js
//将静态样式属性的内联CSS字符串解析为对象。
//这是一个NodeTransform，因为它在静态“style”属性上工作，并且
//将其转换为动态等效项：
//style=“color:red”->：style='{“color”：“red”}
//然后由“transformElement”处理并包含在生成的
//props
export const transformStyle: NodeTransform = (node, context) => {
  if (node.type === NodeTypes.ELEMENT) {
    node.props.forEach((p, i) => {
      if (p.type === NodeTypes.ATTRIBUTE && p.name === 'style' && p.value) {
        // replace p with an expression node
        node.props[i] = {
          type: NodeTypes.DIRECTIVE,
          name: `bind`,
          arg: createSimpleExpression(`style`, true, p.loc),
          exp: parseInlineCSS(p.value.content, p.loc),
          modifiers: [],
          loc: p.loc
        }
      }
    })
  }
}
````

### 4 directiveTransforms 
**DOMDirectiveTransforms**

**根据不同的类型，创建不同的语法树对象**

① cloak: noopDirectiveTransform

② html: transformVHtml  **v-html**
````js
export const transformVHtml: DirectiveTransform = (dir, node, context) => {
  const { exp, loc } = dir
  if (!exp) {
    context.onError(
      createDOMCompilerError(DOMErrorCodes.X_V_HTML_NO_EXPRESSION, loc)
    )
  }
  if (node.children.length) {
    /* 如果vnode具有children发出警告 */
    context.onError(
      createDOMCompilerError(DOMErrorCodes.X_V_HTML_WITH_CHILDREN, loc)
    )
    node.children.length = 0
  }
  return {
    props: [
      createObjectProperty(
        createSimpleExpression(`innerHTML`, true, loc),
        exp || createSimpleExpression('', true)
      )
    ]
  }
}
````
**ast 语法树**
**createObjectProperty**

````js
export function createObjectProperty(
  key: Property['key'] | string,
  value: Property['value']
): Property {
  return {
    type: NodeTypes.JS_PROPERTY,  /* props */
    loc: locStub,
    key: isString(key) ? createSimpleExpression(key, true) : key,
    value
  }
}
````

**locStub**
````js
export const locStub: SourceLocation = {
  source: '',
  start: { line: 1, column: 1, offset: 0 },
  end: { line: 1, column: 1, offset: 0 }
}
````

**createSimpleExpression**
````js
export function createSimpleExpression(
  content: SimpleExpressionNode['content'],
  isStatic: SimpleExpressionNode['isStatic'],
  loc: SourceLocation = locStub,
  isConstant: boolean = false
): SimpleExpressionNode {
  return {
    type: NodeTypes.SIMPLE_EXPRESSION,
    loc,
    isConstant,
    content,
    isStatic
  }
}

````


③ text: transformVText **v-text**

````js
return {
    props: [
      createObjectProperty(
        createSimpleExpression(`textContent`, true, loc),
        exp || createSimpleExpression('', true)
      )
    ]
  }
````

④model: transformModel **v-model**

````js
/* 解析v-model */
export const transformModel: DirectiveTransform = (dir, node, context) => {
  const baseResult = baseTransform(dir, node, context)
  // base transform has errors OR component v-model (only need props)
  if (!baseResult.props.length || node.tagType === ElementTypes.COMPONENT) {
    return baseResult
  }

  if (dir.arg) {
    context.onError(
      createDOMCompilerError(
        DOMErrorCodes.X_V_MODEL_ARG_ON_ELEMENT,
        dir.arg.loc
      )
    )
  }

  function checkDuplicatedValue() {
    const value = findProp(node, 'value')
    if (value) {
      context.onError(
        createDOMCompilerError(
          DOMErrorCodes.X_V_MODEL_UNNECESSARY_VALUE,
          value.loc
        )
      )
    }
  }

  const { tag } = node
  if (tag === 'input' || tag === 'textarea' || tag === 'select') {
    let directiveToUse = V_MODEL_TEXT
    let isInvalidType = false
    if (tag === 'input') {
      const type = findProp(node, `type`)
      if (type) {
        if (type.type === NodeTypes.DIRECTIVE) {
          // :type="foo"
          directiveToUse = V_MODEL_DYNAMIC
        } else if (type.value) {
          switch (type.value.content) {
            case 'radio':
              directiveToUse = V_MODEL_RADIO
              break
            case 'checkbox':
              directiveToUse = V_MODEL_CHECKBOX
              break
            case 'file':
              isInvalidType = true
              context.onError(
                createDOMCompilerError(
                  DOMErrorCodes.X_V_MODEL_ON_FILE_INPUT_ELEMENT,
                  dir.loc
                )
              )
              break
            default:
              // text type
              __DEV__ && checkDuplicatedValue()
              break
          }
        }
      } else if (hasDynamicKeyVBind(node)) {
        // element has bindings with dynamic keys, which can possibly contain
        // "type".
        directiveToUse = V_MODEL_DYNAMIC
      } else {
        // text type
        __DEV__ && checkDuplicatedValue()
      }
    } else if (tag === 'select') {
      directiveToUse = V_MODEL_SELECT
    } else if (tag === 'textarea') {
      __DEV__ && checkDuplicatedValue()
    }
    // inject runtime directive
    // by returning the helper symbol via needRuntime
    // the import will replaced a resolveDirective call.
    if (!isInvalidType) {
      baseResult.needRuntime = context.helper(directiveToUse)
    }
  } else {
    context.onError(
      createDOMCompilerError(
        DOMErrorCodes.X_V_MODEL_ON_INVALID_ELEMENT,
        dir.loc
      )
    )
  }

  // native vmodel doesn't need the `modelValue` props since they are also
  // passed to the runtime as `binding.value`. removing it reduces code size.
  baseResult.props = baseResult.props.filter(p => {
    if (
      p.key.type === NodeTypes.SIMPLE_EXPRESSION &&
      p.key.content === 'modelValue'
    ) {
      return false
    }
    return true
  })

  return baseResult
}

````

⑤on: transformOn   **v-on**

⑥show: transformShow   **v-show**