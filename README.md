# shelf-dependency

**shelf-dependency** is a [Inversion Of Control](http://en.wikipedia.org/wiki/Inversion_of_control) container for Node.js applications.
It allows dependency injection (see [Dependency Injection](http://en.wikipedia.org/wiki/Dependency_injection)) inside  Javascript constructor functions.

The main goals of **shelf-dependency** are:
- don't require any special conventions for modules
- easy to setup
- easy to unit test
- convention over configuration

## Usage

Install shelf-dependency from npm:

    npm install shelf-dependency --save

Now imagine that you the following application structure:

```
- index.js
- foo.js
- bar.js
```

index.js is the main entry point of our application. foo.js is a component (sometime called service) that we want to instantiate inside the main. foo has a dependency to bar and to a logger.  
bar is another component and has a dependency to a logger.

A component is a standard node.js module (can be a private module or a public module) that exports a Javascript style class constructor. Here for example the bar.js file that export the Bar class:

bar.js
```
function Bar(logger){
  this._logger = logger;
}
Bar.prototype.helloBar = function(){
  this._logger.log("hello from bar");
}
module.exports = Bar;
```

As you can see there isn't any special code or annotation. All you have to do is to export a function that will be called automatically with all the dependencies resolved, in the above case the logger instance.

The foo component is very similar except that it has a dependency to logger and bar:

foo.js
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

When foo will be created an instance of class Bar will be passed.

And now take a look at our application entry point, index.js, where we wire up all the components together:

index.js
```
var ShelfDependency = require("shelf-dependency");
var shelf = new ShelfDependency();

shelf.register("foo", require("./foo.js"));
shelf.register("bar", require("./bar.js"));
shelf.register("logger", console);

var foo = shelf.resolve("foo");
foo.helloFoo();
```

Here some explanations:
- `var ShelfDependency = require("shelf-dependency");` declare the ShelfDependency class.
- `var shelf = new ShelfDependency();` instantiate the container.
- `shelf.register("foo", require("./foo.js"));` register the foo component.
- `shelf.register("bar", require("./bar.js"));` register the bar component.
- `shelf.register("logger", console);` register the logger component. In this case we simply pass an object, not a constructor function.
- `var foo = shelf.resolve("foo");` create our sample component
- `foo.helloFoo();` call a sample method

That's it!

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

The name used when registering a component will be the same used when resolving it. Just remember that names are case insensitive and dots and dashes are removed by default. Also consider that usually component's dependencies are automatically resolved using function parameter names, so I suggest to don't use characters that are not allowed for parameters javascript names.

You can register multiple components with the same name. In this case when resolving a single component (method `resolve`) the last one win, but you can get all the registered components by a given name using `resolveAll` method.

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

TODO

## Resolve a list of components

TODO

## Facilities

TODO

## requireFacility

TODO

## listFacility

TODO

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
