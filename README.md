# shelf-dependency

[![npm version](https://badge.fury.io/js/shelf-dependency.svg)](http://badge.fury.io/js/shelf-dependency)

**shelf-dependency** is a [Inversion Of Control](http://en.wikipedia.org/wiki/Inversion_of_control) container for Node.js applications.
It allows dependency injection pattern (see [Dependency Injection](http://en.wikipedia.org/wiki/Dependency_injection)) inside Javascript constructor functions.

Main goals of **shelf-dependency** are:
- easy and unobstrusive dependencies declaration
- support for standard `require`
- easy unit testing for components
- convention over configuration
- extensibility

## Usage

Install shelf-dependency from npm:

    npm install shelf-dependency --save

Now imagine that you have the following application structure:

```
- index.js
- foo.js
- bar.js
```

**index** is the main entry point of your application. **Foo** is a component (a class) that we want to instantiate inside **index**. **Foo** has a dependency to **bar** and to a **logger**.  
**Bar** is another component and has a dependency to a logger.

A component is a standard node.js module (can be a private module or a public module) that exports a Javascript style class constructor. Here for example **bar.js** file that export **Bar** class:

**bar.js**
```
function Bar(logger){
  this._logger = logger;
}
Bar.prototype.helloBar = function(){
  this._logger.log("hello from bar");
}
module.exports = Bar;
```

As you can see there isn't any special code or annotation. All you have to do is to export a function that will be called automatically with all the dependencies resolved, in the above case the **logger** instance.

**Foo** component is very similar except that it has a dependency to logger and bar:

**foo.js**
```
function Foo(bar, logger){
  this._logger = logger;
  this._bar = bar;
}
Foo.prototype.helloFoo = function(){
  this._logger.log("hello from foo");
  this._bar.helloBar();
}
module.exports = Foo;
```

When **Foo** will be created an instance of class **Bar** will be passed.
And now take a look at our application entry point, **index.js**, where we wire up all the components together:

**index.js**
```
var ShelfDependency = require("shelf-dependency");
var shelf = new ShelfDependency();

shelf.register("foo", require("./foo.js"));
shelf.register("bar", require("./bar.js"));
shelf.register("logger", console);

var foo = shelf.resolve("foo");
foo.helloFoo();
```

Basically we create the **ShelfDependency** container and register all the components (**Bar**, **Foo** and an object for the **logger**). 
Finally we resolve our root class **Foo**.

That's it!

For more info, advanced usage and features read on.

## Components

A component can be a class or an already instantiated object.  
If you don't know how to create a Javascript class take a look at [Mixu's Node book](http://book.mixu.net/node/ch6.html) for a quick introduction.  
Components are considered always [singleton](http://en.wikipedia.org/wiki/Singleton_pattern), only one instance of a component will be created and every dependency on that component will receive the same instance.  
Components names are case insensitive ('car' is equal to 'CAR') and every dots and dashes are removed ('socket.io' is resolved as 'socketio').

For class component you don't never have to instantiate directly the class (ie. calling 'new' on the constructor function). **shelf-dependency** will take care of creating it. This will allow to resolve all the constructor parameters with other registered components.

Here a sample Car component:

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

Component can also be static javascript object instance, the difference is that in this case is your responsability to create the object.

## Registering a component

A component can be registered by calling `ShelfDependency.register` instance method.

```
var shelf = new ShelfDependency();
shelf.register("car", Car);
```

If your components are declared inside private or public modules you can use the standard node.js require function:

```
shelf.register("car", require("./car.js"));
```

The name used when registering a component will be the same used when resolving it. Just remember that names are case insensitive and dots and dashes are removed by default. Also consider that usually component's dependencies are automatically resolved using function parameter names, so I suggest to don't use characters that are not allowed for parameters Javascript names.

You can register multiple components with the same name. In this case when resolving a single component (method `resolve`) the last one win, but you can get all the registered components by a given name using `resolveAll` method.

You can also register objects:

```
shelf.register("car", { name: "Ferrari" });
```

## Resolving a component

You can resolve a component by calling `ShelfDependency.resolve` instance method explicitly or implicitly when declaring a constructor parameter (dependency).
Usually the `resolve` method is only called inside the application entry point, where you need to create the roots components.
Then each root component will have zero or more dependencies to other components that will call the resolve method automatically when instantiated.

Here we resolve the Car component explicitly:
```
var car = shelf.resolve("car");
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
shelf.register("duck", Duck, { name: "Donald" } );
```

Any dependency passed explicitly in this way has the precedence over standard
components. I usually suggest to use this solution for configuration objects or
other special dependencies.

## Unregister a component

You can unregister a component by calling:

```
shelf.unregister("car");
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
shelf.register("car", Ferrari);
shelf.register("car", Porsche);
var cars = shelf.resolveAll("car");
```

`resolveAll` gets an array of all the registered components, in the same order
of the register calls.

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

shelf.use(myFacility);
```

There are some built-in facilities available:
- requireFacility
- listFacility

## requireFacility

`requireFacility` is used to automatically call Node.js require method when
a component is not found.  
This can be very useful to easy setup your project without requiring to
manually register all the components.

```
function MySampleClass(http){
  this.http = http;
}

shelf.use(ShelfDependency.requireFacility);
shelf.register("MySampleClass", MySampleClass);

var cmp = shelf.resolve("MySampleClass");

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

shelf.use(ShelfDependency.listFacility);
shelf.register("logger", MyLogger1);
shelf.register("logger", MyLogger2);
shelf.register("MySampleClass", MySampleClass);

var cmp = shelf.resolve("MySampleClass");

assert.instanceOf(cmp, MySampleClass);
assert.equal(cmp._loggerList.length, 2);
assert.instanceOf(cmp._loggerList[0], MyLogger1);
assert.instanceOf(cmp._loggerList[1], MyLogger2);
```

## License (MIT)

Copyright (c) 2015 Davide Icardi

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
