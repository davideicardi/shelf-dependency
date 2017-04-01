"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const ShelfDependency = require("./../../index"); // "shelf-dependency"
const bar_1 = require("./bar");
const foo_1 = require("./foo");
const container = new ShelfDependency.Container();
container.use(ShelfDependency.factoryFacility);
container.register("foo", foo_1.Foo);
container.register("bar", bar_1.Bar);
container.register("logger", console);
const foo = container.resolve("foo");
foo.helloFoo();
//# sourceMappingURL=index.js.map