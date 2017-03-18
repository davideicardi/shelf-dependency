import * as ShelfDependency from "./../../index"; // "shelf-dependency"
import {Bar} from "./bar";
import {Foo} from "./foo";

const container = new ShelfDependency.Container();

container.register("foo", Bar);
container.register("bar", Foo);
container.register("logger", console);

const foo = container.resolve("foo");
foo.helloFoo();
