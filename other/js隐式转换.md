

**例子**

````js
const a = {
  i: 1,
  toString: function () {
    return a.i++;
  }
}
if (a == 1 && a == 2 && a == 3) {
  console.log('hello world!');
}

````

### 三种隐式转换类型

涉及隐式转换最多的两个运算符 + 和 ==。

隐式转换中主要涉及到三种转换：
1、将值转为原始值，ToPrimitive()。
2、将值转为数字，ToNumber()。
3、将值转为字符串，ToString()

通过**ToPrimitive**将值转换为原始值

ToPrimitive(input, PreferredType?)

**1 如果PreferredType被标记为Number，则会进行下面的操作流程来转换输入的值。**

1、如果输入的值已经是一个原始值，则直接返回它
2、否则，如果输入的值是一个对象，则调用该对象的valueOf()方法，
   如果valueOf()方法的返回值是一个原始值，则返回这个原始值。
3、否则，调用这个对象的toString()方法，如果toString()方法返回的是一个原始值，则返回这个原始值。
4、否则，抛出TypeError异常。


**2 如果PreferredType被标记为String，则会进行下面的操作流程来转换输入的值。**

1 如果输入的值已经是一个原始值，则直接返回它
2、否则，调用这个对象的toString()方法，如果toString()方法返回的是一个原始值，则返回这个原始值。
3、否则，如果输入的值是一个对象，则调用该对象的valueOf()方法，
   如果valueOf()方法的返回值是一个原始值，则返回这个原始值。
4、否则，抛出TypeError异常。

1、该对象为Date类型，则PreferredType被设置为String
2、否则，PreferredType被设置为Number

### valueOf方法和toString方法解析

**valueOf**

1、Number、Boolean、String这三种构造函数生成的基础值的对象形式，通过valueOf转换后会变成相应的原始值。如：
````js
var num = new Number('123');
num.valueOf(); // 123

var str = new String('12df');
str.valueOf(); // '12df'

var bool = new Boolean('fd');
bool.valueOf(); // true
````

复制代码2、Date这种特殊的对象，其原型Date.prototype上内置的valueOf函数将日期转换为日期的毫秒的形式的数值。
````js
var a = new Date();
a.valueOf(); // 1515143895500
````

复制代码3、除此之外返回的都为this，即对象本身：(有问题欢迎告知)

````js
var a = new Array();
a.valueOf() === a; // true

var b = new Object({});
b.valueOf() === b; // true
````

**toString**

Number、Boolean、String、Array、Date、RegExp、Function这几种构造函数生成的对象，通过toString转换后会变成相应的字符串的形式，因为这些构造函数上封装了自己的toString方法。如

````js
Number.prototype.hasOwnProperty('toString'); // true
Boolean.prototype.hasOwnProperty('toString'); // true
String.prototype.hasOwnProperty('toString'); // true
Array.prototype.hasOwnProperty('toString'); // true
Date.prototype.hasOwnProperty('toString'); // true
RegExp.prototype.hasOwnProperty('toString'); // true
Function.prototype.hasOwnProperty('toString'); // true

var num = new Number('123sd');
num.toString(); // 'NaN'

var str = new String('12df');
str.toString(); // '12df'

var bool = new Boolean('fd');
bool.toString(); // 'true'

var arr = new Array(1,2);
arr.toString(); // '1,2'

var d = new Date();
d.toString(); // "Wed Oct 11 2017 08:00:00 GMT+0800 (中国标准时间)"

var func = function () {}
func.toString(); // "function () {}"

````
除这些对象及其实例化对象之外，其他对象返回的都是该对象的类型，(有问题欢迎告知)，都是继承的Object.prototype.toString方法。

````js
var obj = new Object({});
obj.toString(); // "[object Object]"

Math.toString(); // "[object Math]"
````

从上面valueOf和toString两个函数对对象的转换可以看出为什么对于ToPrimitive(input, PreferredType?)，PreferredType没有设定的时候，除了Date类型，PreferredType被设置为String，其它的会设置成Number。

### 通过ToNumber将值转换成数字

参数               结果

undefined         NaN

null              0

布尔值             true转化成1， false转换成0

数字              无需转换

字符窜            有字符串解析为数字，例如：‘324’转换为324，‘qwer’转换为NaN

对象(obj)         先进行 ToPrimitive(obj, Number)转换得到原始值，在进行ToNumber转换为数字


### 通过ToString将值转换成字符串


### 例子

({} + {}) = ?
两个对象的值进行+运算符，肯定要先进行隐式转换为原始类型才能进行计算。
1、进行ToPrimitive转换，由于没有指定PreferredType类型，{}会使默认值为Number，进行ToPrimitive(input, Number)运算。
2、所以会执行valueOf方法，({}).valueOf(),返回的还是{}对象，不是原始值。
3、继续执行toString方法，({}).toString(),返回"[object Object]"，是原始值。
故得到最终的结果，"[object Object]" + "[object Object]" = "[object Object][object Object]"


2 * {} = ?
1、首先*运算符只能对number类型进行运算，故第一步就是对{}进行ToNumber类型转换。
2、由于{}是对象类型，故先进行原始类型转换，ToPrimitive(input, Number)运算。
3、所以会执行valueOf方法，({}).valueOf(),返回的还是{}对象，不是原始值。
4、继续执行toString方法，({}).toString(),返回"[object Object]"，是原始值。
5、转换为原始值后再进行ToNumber运算，"[object Object]"就转换为NaN。
故最终的结果为 2 * NaN = NaN


类型相同时，没有类型转换，主要注意NaN不与任何值相等，包括它自己，即NaN !== NaN。
类型不相同时，

**1、x,y 为null、undefined两者中一个   // 返回true**

**2、x、y为Number和String类型时，则转换为Number类型比较。**

**3、有Boolean类型时，Boolean转化为Number类型比较。**

**4、一个Object类型，一个String或Number类型，将Object类型进行原始转换后，按上面流程进行原始值比较。**


**例子1**
````js
  valueOf: function () {
     return 1;
  },
  toString: function () {
     return '123'
  }
}
// true == a // true;
// 首先，x与y类型不同，x为boolean类型，则进行ToNumber转换为1,为number类型。
// 接着，x为number，y为object类型，对y进行原始转换，ToPrimitive(a, ?),没有指定转换类型，默认number类型。
// 而后，ToPrimitive(a, Number)首先调用valueOf方法，返回1，得到原始类型1。
// 最后 1 == 1， 返回true。

````

**例子2**


````js

[] == !{}
//
// 1、! 运算符优先级高于==，故先进行！运算。
// 2、!{}运算结果为false，结果变成 [] == false比较。
// 3、根据上面第7条，等式右边y = ToNumber(false) = 0。结果变成 [] == 0。
// 4、按照上面第9条，比较变成ToPrimitive([]) == 0。
//     按照上面规则进行原始值转换，[]会先调用valueOf函数，返回this。
//    不是原始值，继续调用toString方法，x = [].toString() = ''。
//    故结果为 '' == 0比较。
// 5、根据上面第5条，等式左边x = ToNumber('') = 0。
//    所以结果变为： 0 == 0，返回true，比较结束。


````