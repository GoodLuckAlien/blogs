//是arguments 中 c 的值，function a(a, b, c = 3) 这里的c，因为 a 函数加了默认值，所以就按 ES 的方式解析，函数中的参数就不会变了

function side(arr) {
  arr[0] = arr[2];
}
function a(a, b, c = 3) {
  c = 10;
  console.log(arguments);
  side(arguments);  // 这里 a，c的值不管怎么改变都是不会改变的
  return a + b + c;
}
a(1, 1, 1);  //12
//但是，如果是

function side(arr) {
  arr[0] = arr[2];
}
function a(a, b, c) {
  c = 10;
  console.log(arguments);
  side(arguments);  // 这里 a，c的值不管怎么改变都是不会改变的
  console.log(a,b,c)
  return a + b + c;
}
a(1, 1, 1);  // 21