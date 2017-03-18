"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const ShelfDependency = require("./../../index"); // "shelf-dependency"
const bar_1 = require("./bar");
const foo_1 = require("./foo");
const container = new ShelfDependency.Container();
container.register("foo", bar_1.Bar);
container.register("bar", foo_1.Foo);
container.register("logger", console);
const foo = container.resolve("foo");
foo.helloFoo();
//# sourceMappingURL=index.js.map