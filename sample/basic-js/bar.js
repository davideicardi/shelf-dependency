function Bar(logger){
  this._logger = logger;
}
Bar.prototype.helloBar = function(){
  this._logger.log("hello from bar");
}
module.exports = Bar;