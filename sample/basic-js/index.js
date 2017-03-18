var ShelfDependency = require("./../../index"); // "shelf-dependency"
var container = new ShelfDependency.Container();

container.register("foo", require("./foo.js"));
container.register("bar", require("./bar.js"));
container.register("logger", console);

var foo = container.resolve("foo");
foo.helloFoo();
