/* global describe it beforeEach afterEach */

var assert = require("chai").assert;

describe("Container", function(){

  var ShelfDependency;
  var container;

  beforeEach(function(){
    ShelfDependency = require("./../index.js");
    container = new ShelfDependency.Container();
  });

  afterEach(function(){
    container = null;
  });

  it("resolve an unknown component throw an exception", function(){
    var fn = function() {container.resolve("notExisting");};

    assert.throw(fn, "Cannot resolve component 'notExisting'");
  });

  it("resolveAll passing an unknown component return an empty array", function(){
    const result = container.resolveAll("notExisting");

    assert.equal(result.length, 0);
  });

  it("registering a component with a reserved keyworkds throw an exception", function(){
    var fn = function() {container.register("container", {});};
    assert.throw(fn);

    var fn = function() {container.register("CONTAINER", {});};
    assert.throw(fn);
  });

  describe("registering a component using a function constructor", function(){

    function MyClass1(){
    }

    beforeEach(function(){
      container.register("myClass1", MyClass1);
    });

    it("can be resolved and constructor is invoked", function(){
      var cmp = container.resolve("myClass1");

      assert.instanceOf(cmp, MyClass1);
    });

    it("singleton: multiple resolve return the same instance", function(){
      var cmp1 = container.resolve("myClass1");
      var cmp2 = container.resolve("myClass1");

      assert.equal(cmp1, cmp2);
    });
  });

  describe("registering a component using a class declaration", function(){

    class MyEs6Class1 {
      constructor(){
      }
    }

    beforeEach(function(){
      container.register("myEs6Class1", MyEs6Class1);
    });

    it("can be resolved and constructor is invoked", function(){
      var cmp = container.resolve("myEs6Class1");

      assert.instanceOf(cmp, MyEs6Class1);
    });
  });

  describe("registering a component using a class declaration with dependencies", function(){
    class MyEs6Class1 {
      constructor(a, b){
        this.a = a;
        this.b = b;
      }
    }

    beforeEach(function(){
      container.register("myEs6Class1", MyEs6Class1);
      container.register("a", {v:"a"});
      container.register("b", {v:"b"});
    });

    it("can be resolved and constructor is invoked", function(){
      var cmp = container.resolve("myEs6Class1");

      assert.instanceOf(cmp, MyEs6Class1);
      assert.equal(cmp.a.v, "a");
      assert.equal(cmp.b.v, "b");
    });
  });

  describe("when registering or resolving a component special characters are removed from compoonent name", function(){
    function SocketIO(){
    }
    function SqlServer(){
    }

    beforeEach(function(){
      container.register("Socket.IO", SocketIO);
      container.register("sql-server", SqlServer);
    });

    it("component name can contains dots", function(){
      var cmp = container.resolve("socket.IO");

      assert.instanceOf(cmp, SocketIO);
    });

    it("component can be resolved without dots", function(){
      var cmp = container.resolve("socketIO");

      assert.instanceOf(cmp, SocketIO);
    });

    it("component name can contains dashes", function(){
      var cmp = container.resolve("sql-server");

      assert.instanceOf(cmp, SqlServer);
    });

    it("component can be resolved without dashes", function(){
      var cmp = container.resolve("sqlserver");

      assert.instanceOf(cmp, SqlServer);
    });
  });

  describe("component name is case insensitive", function(){

    function MyClass1(){
    }

    beforeEach(function(){
      container.register("myClass1", MyClass1);
    });

    it("can be resolved using any case combination", function(){
      var c1 = container.resolve("myClass1");
      var c2 = container.resolve("myclass1");
      var c3 = container.resolve("MYCLASS1");
      assert.instanceOf(c1, MyClass1);
      assert.instanceOf(c2, MyClass1);
      assert.instanceOf(c3, MyClass1);
      assert.equal(c1, c2);
      assert.equal(c2, c3);
    });

    it("can be resolved using resolveAll with any case combination", function(){
      var c1 = container.resolveAll("myClass1")[0];
      var c2 = container.resolveAll("myclass1")[0];
      var c3 = container.resolveAll("MYCLASS1")[0];
      assert.instanceOf(c1, MyClass1);
      assert.instanceOf(c2, MyClass1);
      assert.instanceOf(c3, MyClass1);
      assert.equal(c1, c2);
      assert.equal(c2, c3);
    });

    it("can be unregistere using any case combination", function(){
      container.unregister("MYCLASS1");

      var fn = function() {container.resolve("myClass1");};
      assert.throw(fn);
    });

    it("dependencies are case insensitive", function(){
      // I have added a dependency to MYCLASS1 with a case different
      //  from the one registered
      var MyClass2 = function(MYCLASS1){
        this.MYCLASS1 = MYCLASS1;
      }
      container.register("myClass2", MyClass2);

      var c = container.resolve("myClass2");
      assert.instanceOf(c, MyClass2);
      assert.instanceOf(c.MYCLASS1, MyClass1);
    });
  });

  describe("registering multiple components with the same name", function(){
    function Ferrari(){
    }
    function Porsche(){
    }

    beforeEach(function(){
      container.register("car", Ferrari);
      container.register("car", Porsche);
    });

    it("last component is returned", function(){
      var cmp = container.resolve("car");
      assert.instanceOf(cmp, Porsche);
    });

    it("all registered components can be resolved", function(){
      var cmps = container.resolveAll("car");
      assert.equal(cmps.length, 2);
      assert.instanceOf(cmps[0], Ferrari);
      assert.instanceOf(cmps[1], Porsche);
    });
  });

  describe("registering components with tags", function(){
    function Ferrari(){
    }
    function Porsche(){
    }
    function Bianchi(){
    }

    beforeEach(function(){
      container.register("car", Ferrari, undefined, { tags: ["Ferrari", "italy"] });
      container.register("car", Porsche, undefined, { tags: ["Porsche", "germany"] });
      container.register("bicycle", Bianchi, undefined, { tags: ["Bianchi", "italy"] });
    });

    it("resolve by name (default)", function(){
      let cmps = container.resolveAll("car");
      assert.equal(cmps.length, 2);
      assert.instanceOf(cmps[0], Ferrari);
      assert.instanceOf(cmps[1], Porsche);
      cmps = container.resolveAll("bicycle");
      assert.equal(cmps.length, 1);
      assert.instanceOf(cmps[0], Bianchi);
    });

    it("unregistering components by tags", function(){
      container.unregister(undefined, { tags: ["germany"]});

      let cmps = container.resolveAll("car");
      assert.equal(cmps.length, 1);
      assert.instanceOf(cmps[0], Ferrari);
      cmps = container.resolveAll("bicycle");
      assert.equal(cmps.length, 1);
      assert.instanceOf(cmps[0], Bianchi);

      container.unregister(undefined, { tags: ["italy"]});
      cmps = container.resolveAll("car");
      assert.equal(cmps.length, 0);
      cmps = container.resolveAll("bicycle");
      assert.equal(cmps.length, 0);
    });

    it("unregistering components by empty tags has no effect", function(){
      container.unregister(undefined, { tags: []});

      let cmps = container.resolveAll("car");
      assert.equal(cmps.length, 2);
      assert.instanceOf(cmps[0], Ferrari);
      assert.instanceOf(cmps[1], Porsche);
      cmps = container.resolveAll("bicycle");
      assert.equal(cmps.length, 1);
      assert.instanceOf(cmps[0], Bianchi);
    });
  });

  describe("unregister a component", function(){
    function MyClass1(){
    }

    beforeEach(function(){
      container.register("myClass1", MyClass1);
    });

    it("can be unregistered", function(){
      // check if is registered
      var cmp = container.resolve("myClass1");
      assert.instanceOf(cmp, MyClass1);

      // now unregister it
      container.unregister("myClass1");

      var fn = function() {container.resolve("myClass1");};
      assert.throw(fn);
    });
  });

  describe("register a component using an object istance", function(){

    var myInstance1 = {};

    beforeEach(function(){
      container.register("myClass1", myInstance1);
    });

    it("can be resolved with the specified instance", function(){
      var cmp = container.resolve("myClass1");

      assert.equal(cmp, myInstance1);
    });
  });

  describe("register all components using an object properties", function(){

    var myInstance1 = {};

    beforeEach(function(){
      container.registerProperties( { myClass1: myInstance1 });
    });

    it("can be resolved", function(){
      var cmp = container.resolve("myClass1");

      assert.equal(cmp, myInstance1);
    });
  });

  describe("register a component having a dependency to another component", function(){

    function Engine() {
    }

    function SteeringWheel(){
    }

    function Car(engine, steeringWheel){
      this.engine = engine;
      this.steeringWheel = steeringWheel;
    }

    beforeEach(function(){
      container.register("car", Car);
      container.register("steeringWheel", SteeringWheel);
      container.register("engine", Engine);
    });

    it("can be resolved", function(){
      var cmp = container.resolve("car");

      assert.instanceOf(cmp, Car);
      assert.instanceOf(cmp.engine, Engine);
    });
  });

  describe("register a component having a dependency to container-dependency itself", function(){
    function MyFactory1(container){
      this.container = container;
    }

    beforeEach(function(){
      container.register("MyFactory1", MyFactory1);
    });

    it("can be resolved", function(){
      var cmp = container.resolve("MyFactory1");

      assert.instanceOf(cmp, MyFactory1);
      assert.instanceOf(cmp.container, ShelfDependency.Container);
      assert.equal(cmp.container, container);
    });
  });

  describe("register a transient component", function(){

    function Foo(){
    }

    beforeEach(function(){
      container.register("foo", Foo, {}, { lifeStyle: ShelfDependency.LifeStyle.Transient } );
    });

    it("can be resolved and returns always a different instance", function(){
      var cmp1 = container.resolve("foo");
      var cmp2 = container.resolve("foo");

      assert.instanceOf(cmp1, Foo);
      assert.instanceOf(cmp2, Foo);
      // transient components returns always a new instance
      assert.notEqual(cmp1, cmp2);
    });
  });

  describe("register with static dependency", function(){

    function Duck(name){
      this.name = name;
    }

    beforeEach(function(){
      container.register("duck", Duck, { name: "Donald" } );
    });

    it("can be resolved with the static dependency", function(){
      var cmp = container.resolve("duck");

      assert.instanceOf(cmp, Duck);
      assert.equal(cmp.name, "Donald");
    });
  });

  describe("resolve components using require (requireFacility)", function(){

    function MySampleClass(http){
      this.http = http;
    }

    beforeEach(function(){
      container.use(ShelfDependency.requireFacility);
      container.register("MySampleClass", MySampleClass);
    });

    it("resolving", function(){
      var cmp = container.resolve("MySampleClass");

      assert.instanceOf(cmp, MySampleClass);
      assert.equal(cmp.http, require("http"));
    });

    it("an explicitly registered component wins over a require", function(){
      var myHttp = {};
      container.register("http", myHttp)

      var cmp = container.resolve("MySampleClass");

      assert.instanceOf(cmp, MySampleClass);
      assert.equal(cmp.http, myHttp);
    });

    it("resolve an unknown component throw an exception", function(){
      var fn = function() {container.resolve("notExisting");};
      assert.throw(fn, "Cannot resolve component 'notExisting'");
    });
  });

  describe("resolve a list of components (listFacility)", function(){

    function MyLogger1(){}
    function MyLogger2(){}

    function MySampleClass(loggerList){
      this._loggerList = loggerList;
    }

    beforeEach(function(){
      container.use(ShelfDependency.listFacility);
      container.register("logger", MyLogger1);
      container.register("logger", MyLogger2);
      container.register("MySampleClass", MySampleClass);
    });

    it("resolving", function(){
      var cmp = container.resolve("MySampleClass");

      assert.instanceOf(cmp, MySampleClass);
      assert.equal(cmp._loggerList.length, 2);
      assert.instanceOf(cmp._loggerList[0], MyLogger1);
      assert.instanceOf(cmp._loggerList[1], MyLogger2);
    });
  });

  describe("resolve a factory function (factoryFacility)", function(){

    beforeEach(function(){
      container.use(ShelfDependency.factoryFacility);
    });

    function MyLogger(){}

    function MySampleClass(loggerFactory){
      this.logger1 = loggerFactory();
      this.logger2 = loggerFactory();
    }

    it("resolving the factory", function(){
      container.register("logger", MyLogger);
      container.register("MySampleClass", MySampleClass);

      var cmp = container.resolve("mySampleClass");

      assert.instanceOf(cmp, MySampleClass);
      assert.instanceOf(cmp.logger1, MyLogger);
      assert.instanceOf(cmp.logger2, MyLogger);

      // a factory returns always a new instance
      assert.notEqual(cmp.logger1, cmp.logger2);
    });

    function MyComponent(param1, anotherParam) {
      this.param1 = param1;
      this.anotherParam = anotherParam;
    }

    it("calling the factory with custom dependencies", function(){
      container.register("MyComponent", MyComponent);

      var factory = container.resolve("myComponentFactory");

      const cmp1 = factory({ param1: 1, anotherParam: "test1" });
      const cmp2 = factory({ param1: 2, anotherParam: "test2" });

      assert.instanceOf(cmp1, MyComponent);
      assert.instanceOf(cmp2, MyComponent);

      // a factory returns always a new instance
      assert.notEqual(cmp1, cmp2);
      assert.equal(cmp1.param1, 1);
      assert.equal(cmp2.param1, 2);
      assert.equal(cmp1.anotherParam, "test1");
      assert.equal(cmp2.anotherParam, "test2");
    });

    it("factory custom dependencies are case sensitive", function(){
      container.register("MyComponent", MyComponent);

      var factory = container.resolve("myComponentFactory");

      function f() { factory({ PARAM1: 1, AnotherParam: "test1" }); }

      assert.throw(f);
    });
  });

});
