function Foo(bar, logger){
  this._logger = logger;
  this._bar = bar;
}
Foo.prototype.helloFoo = function(){
  this._logger.log("hello from foo");
  this._bar.helloBar();
}
module.exports = Foo;