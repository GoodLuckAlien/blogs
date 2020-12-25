## 前端 web components

### web Components

Web Components是一种组件化的方式，它允许您创建可重用的定制元素（它们的功能封装在您的代码之外）并且在您的web应用中使用它们。Web Components的一个重要特性是封装，通过Web Components创建的组件，可以有效地将其自身的html结构、css样式及行为隐藏起来，并从页面中的其他代码分离出来，也就是每个组件都是独立的，不会互相干扰。下面是一个Web Components的简单应用：

````html
<custom-button text="自定义按钮"></custom-button>
````

### 自定义标签

w3c制定自定义标签：两种方式 
1 Autonomous custom elements
2 Customized built-in elements

#### Autonomous custom elements

独立的元素，这种元素不会继承现有内建的HTML标签。你可以通过<custom-button></custom-button>或document.createElement('custom-button')来进行使用。

````js
class CustomButton extends HTMLElement{
  constructor() {
    super()
    
    // 创建一个shadow root
    const shadow = this.attachShadow({mode: 'open'})
    
    // 创建一个button
    const button = document.createElement('button')
    button.setAttribute('class', 'custom-button')
    
    const text = this.getAttribute('text')
    button.textContent = text
    
    // 创建样式
    const style = document.createElement('style')
    style.textContent = `
      .custom-button{
        border: none;
        cursor: pointer;
        background: hsla(130, 70%, 50%, 1);
        color: #ffffff;
        line-height: 30px;
        border-radius: 5px;
      }
    `
    
    // 将创建的元素添加到shadow dom中
    shadow.appendChild(style)
    shadow.appendChild(button)
  }
}

// 注册自定义的标签
customElements.define('custom-button', CustomButton)
````

#### Customized built-in elements
该类型元素是用过继承html中内建的元素进行自定义。例：

````js
class CustomButton2 extends HTMLButtonElement{
  constructor () {
    super()
    this.style = `
    border: none;
        cursor: pointer;
        background: hsla(130, 70%, 50%, 1);
        color: #ffffff;
        line-height: 30px;
        border-radius: 5px;
    `
  }
}
customElements.define('custom-button2', CustomButton2, {extends: 'button'})
````
注意这里继承的不再是HTMLElement，而是HTMLButtonElement，当前你也可以继承HTMLSpanElement，HTMLInputElement等，注册时需要添加第三个参数，该参数指明我们需要继承的元素。在使用时，通过<button is="custom-button2">ddd</button>或document.createElement('button', {is: 'custom-button2'})。

