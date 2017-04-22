# shelf-dependency

[![npm version](https://badge.fury.io/js/shelf-dependency.svg)](http://badge.fury.io/js/shelf-dependency)

**shelf-dependency** is an [Dependency Injection](http://en.wikipedia.org/wiki/Dependency_injection) container for Node.js applications.
It allows Dependency Injection and [Inversion Of Control](http://en.wikipedia.org/wiki/Inversion_of_control) inside Javascript/Typescript classes (or constructor functions).

Main goals of **shelf-dependency** are:

- easy and unobstrusive dependencies declaration
- no decorators or special requirements
- es6 class or constructor function (legacy class declaration)
- Typescript support
- support for standard `require`
- easy unit testing for components
- convention over configuration
- resolve a list of components
- resolve factory methods

This project is inspired by [Castle Windsor](https://github.com/castleproject/Windsor).

## Installation

Install shelf-dependency from npm:

    npm install shelf-dependency --save

## Basic usage

**shelf-dependency** can be used to automatically inject dependencies in your javascript component.
A component is a javascript class (or function) and can contains one or more dependencies to other components as constructor arguments:

    class Bar {
      constructor(readonly logger) {
      }

      helloBar() {
        this.logger.log("hello from bar");
      }
    }

Declare **shelf-dependency** container that will contains all yourcomponents:

    const ShelfDependency = require("shelf-dependency");
    const container = new ShelfDependency.Container();

Register all components:

    container.register("bar", Bar);
    container.register("logger", console);

Resolve and use `Bar` component:

    const foo = container.resolve("bar");
    bar.helloBar();


See also:

- [Usage javascript](https://github.com/davideicardi/shelf-dependency/wiki/Usage-(javascript))
- [Usage typescript](https://github.com/davideicardi/shelf-dependency/wiki/Usage-(typescript))

## Components

A component can be a class or an already instantiated object. Typescript or ES6 classes are supported:

Before ecmascript 6 classes should be created using the legacy function constructor syntax. If you don't know how to create a Javascript class take a look at [Mixu's Node book](http://book.mixu.net/node/ch6.html) for a quick introduction.  
Components are usually considered [singleton](http://en.wikipedia.org/wiki/Singleton_pattern), only one instance of a component will be created and every dependency on that component will receive the same instance. For transient components or to create more than one instance of a component see `factoryFacility` below. 

Components names are case insensitive ('car' is equal to 'CAR') and every dots and dashes are removed ('socket.io' is resolved as 'socketio').

For class component you don't never have to instantiate directly the class (ie. calling 'new' on the constructor function). **shelf-dependency** will take care of creating it. This will allow to resolve all the constructor parameters with other registered components.

Here a sample Car component using Typescript:

```
export class Car {
  constructor(readonly engine, readonly logger) {
  }
  go() {
    this.engine.start();
    this.logger.log("car is started!");
  }
}
```

Here a sample Car component using plain ES5 Javascript:

```
function Car(engine, logger){
  this._engine = engine;
  this._logger = logger;
}
Car.prototype.go = function(){
  this._engine.start();
  this._logger.log("car is started!");
}
module.exports = Car;
```

In the above case **shelf-dependency** when instantiating Car class will pass on the constructor an instance of the engine and logger components. engine and logger parameters are called dependencies.

Component can also be object instance, the difference is that in this case is your responsability to create the object.

## Container class

The `Container` class is where every components must be register and where you resolve your root component.
The `container` class has the following interface:

```
export class Container {
  register(name: string, component: any, staticDependencies?: any, options?: RegisterOptions): void;
  registerProperties(obj: any): void;
  resolve(name: string): any;
  resolveNew(name: string, dependencies?: any): any;
  resolveAll(name: string): any[];
  unregister(name: string): void;
  use(facilityFunction: Facility): void;
}
```

## Registering a component

A component can be registered by calling `Container.register` instance method.

```
var container = new ShelfDependency().Container;
container.register("car", Car);
```

If your components are declared inside private or public modules you can use the standard node.js require function:

```
container.register("car", require("./car.js"));
```

The name used when registering a component will be the same used when resolving it. Just remember that names are case insensitive and dots and dashes are removed by default. Also consider that usually component's dependencies are automatically resolved using function parameter names, so I suggest to don't use characters that are not allowed for parameters Javascript names.

You can register multiple components with the same name. In this case when resolving a single component (method `resolve`) the last one win, but you can get all the registered components by a given name using `resolveAll` method.

You can also register objects:

```
container.register("car", { name: "Ferrari" });
```

You can register **transient** components (each time is resolved a new instance is created) using 

```
container.register("foo", Foo, {}, { lifeStyle: ShelfDependency.LifeStyle.Transient });
```

## Resolving a component

You can resolve a component by calling `Container.resolve` instance method explicitly or implicitly when declaring a constructor parameter (dependency).
Usually the `resolve` method is only called inside the application entry point, where you need to create the roots components.
Then each root component will have zero or more dependencies to other components that will call the resolve method automatically when instantiated.

Here we resolve the Car component explicitly:
```
var car = container.resolve("car");
```

When calling resolve method for classes the function constructor is called, so the above code is equivalent to:
```
var car = new Car();
```

If the constructor contains one or more parameters (dependencies), each parameters is resolved using the parameter name. The process is recursive.  
If one component cannot be resolved an exception is throw.

## Registering a component with a static dependency

Sometime you need to pass options or other properties to component that aren't
components. In this case you can explicitly pass a static dependency.

For example let's say that you have a Duck component that takes the name of the
duck.

```
function Duck(name){
  this.name = name;
}
```

You can register the Duck component using this code:

```
container.register("duck", Duck, { name: "Donald" } );
```

Any dependency passed explicitly in this way has the precedence over standard
components. I usually suggest to use this solution for configuration objects or
other special dependencies.

## Unregister a component

You can unregister a component by calling:

```
container.unregister("car");
```

This instruction deletes any reference to the specified component but doesn't
have any effect on already resolved instances.

## Resolve a list of components

When multiple components are registered with the same name, you can get the list
of component by calling `resolveAll`:

```
function Ferrari(){
}
function Porsche(){
}
container.register("car", Ferrari);
container.register("car", Porsche);
var cars = container.resolveAll("car");
```

`resolveAll` gets an array of all the registered components, in the same order
of the register calls. If no components are found an empty array is returned.

If you have a component that need to receive a list of other components of the
same kind you can use the `listFacility`. See below.

## Facilities

Facility are used to extend the default behavior of **shelf-dependency**.
A facility can be registered using the `use` method. The facility function is
called when a component cannot be resolved using the default mechanism.

Here an example:

```
function myFacility(shelf, name){
  // Write your custom facility code
  // return the resolved component or
  // null if the facility cannot resolve it.
}

container.use(myFacility);
```

There are some built-in facilities available:
- requireFacility
- listFacility
- factoryFacility

## requireFacility

`requireFacility` is used to automatically call Node.js require method when
a component is not found.  
This can be very useful to easy setup your project without requiring to
manually register all the components.

```
function MySampleClass(http){
  this.http = http;
}

container.use(ShelfDependency.requireFacility);
container.register("MySampleClass", MySampleClass);

var cmp = container.resolve("MySampleClass");

assert.instanceOf(cmp, MySampleClass);
assert.equal(cmp.http, require("http"));
```

## listFacility

`listFacility` is used to automatically resolve components that end with 'List'
by calling `resolveAll` method instead of the standard `resolve`. This can
be useful to get a list of components instead of only one for a given name.

```
function MyLogger1(){}
function MyLogger2(){}

function MySampleClass(loggerList){
  this._loggerList = loggerList;
}

container.use(ShelfDependency.listFacility);
container.register("logger", MyLogger1);
container.register("logger", MyLogger2);
container.register("MySampleClass", MySampleClass);

var cmp = container.resolve("MySampleClass");

assert.instanceOf(cmp, MySampleClass);
assert.equal(cmp._loggerList.length, 2);
assert.instanceOf(cmp._loggerList[0], MyLogger1);
assert.instanceOf(cmp._loggerList[1], MyLogger2);
```

## factoryFacility

`factoryFacility` is used to create factory function that can be used to create 
new instances of a specific component. The factory dependency must end with 'Factory'.
Factory method takes an optional object with additional dependencies.
This facility can be useful to create multiple instance of a given component and to specify different dependencies for each instance.

```
function MyLogger(source){
  this.source = source;
}

function MySampleClass(loggerFactory){
  this._logger = loggerFactory({source: "mySource"});
}

container.use(ShelfDependency.factoryFacility);
container.register("logger", MyLogger);
container.register("MySampleClass", MySampleClass);

var cmp = container.resolve("MySampleClass");

assert.instanceOf(cmp, MySampleClass);
assert.instanceOf(cmp._logger, MyLogger);
assert.equal(cmp._logger.source, "mySource");
```

## Other DI modules

http://www.mariocasciaro.me/dependency-injection-in-node-js-and-other-architectural-patterns

## License (MIT)

Copyright (c) 2017 Davide Icardi

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
