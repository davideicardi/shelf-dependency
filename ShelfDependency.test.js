/* global describe it beforeEach afterEach */

var assert = require("chai").assert;

describe("ShelfDependency.js", function(){

  var ShelfDependency;
  var shelf;

  beforeEach(function(){
    ShelfDependency = require("./ShelfDependency.js");
    shelf = new ShelfDependency();
  });

  afterEach(function(){
    shelf = null;
  });

  it("resolve an unknown component throw an exception", function(){
    var fn = function() {shelf.resolve("notExisting");};

    assert.throw(fn, "Cannot resolve component 'notExisting'");
  });

  it("registering a component with a reserved keyworkds throw an exception", function(){
    var fn = function() {shelf.register("shelf", {});};
    assert.throw(fn);

    var fn = function() {shelf.register("SHELF", {});};
    assert.throw(fn);
  });

  describe("registering a component using a constructor", function(){

    function MyClass1(){
    }

    beforeEach(function(){
      shelf.register("myClass1", MyClass1);
    });

    it("can be resolved and constructor is invoked", function(){
      var cmp = shelf.resolve("myClass1");

      assert.instanceOf(cmp, MyClass1);
    });

    it("singleton: multiple resolve return the same instance", function(){
      var cmp1 = shelf.resolve("myClass1");
      var cmp2 = shelf.resolve("myClass1");

      assert.equal(cmp1, cmp2);
    });
  });

  describe("when registering or resolving a component special characters are removed from compoonent name", function(){
    function SocketIO(){
    }
    function SqlServer(){
    }

    beforeEach(function(){
      shelf.register("Socket.IO", SocketIO);
      shelf.register("sql-server", SqlServer);
    });

    it("component name can contains dots", function(){
      var cmp = shelf.resolve("socket.IO");

      assert.instanceOf(cmp, SocketIO);
    });

    it("component can be resolved without dots", function(){
      var cmp = shelf.resolve("socketIO");

      assert.instanceOf(cmp, SocketIO);
    });

    it("component name can contains dashes", function(){
      var cmp = shelf.resolve("sql-server");

      assert.instanceOf(cmp, SqlServer);
    });

    it("component can be resolved without dashes", function(){
      var cmp = shelf.resolve("sqlserver");

      assert.instanceOf(cmp, SqlServer);
    });
  });

  describe("component name is case insensitive", function(){

    function MyClass1(){
    }

    beforeEach(function(){
      shelf.register("myClass1", MyClass1);
    });

    it("can be resolved using any case combination", function(){
      var c1 = shelf.resolve("myClass1");
      var c2 = shelf.resolve("myclass1");
      var c3 = shelf.resolve("MYCLASS1");
      assert.instanceOf(c1, MyClass1);
      assert.instanceOf(c2, MyClass1);
      assert.instanceOf(c3, MyClass1);
      assert.equal(c1, c2);
      assert.equal(c2, c3);
    });

    it("can be resolved using resolveAll with any case combination", function(){
      var c1 = shelf.resolveAll("myClass1")[0];
      var c2 = shelf.resolveAll("myclass1")[0];
      var c3 = shelf.resolveAll("MYCLASS1")[0];
      assert.instanceOf(c1, MyClass1);
      assert.instanceOf(c2, MyClass1);
      assert.instanceOf(c3, MyClass1);
      assert.equal(c1, c2);
      assert.equal(c2, c3);
    });

    it("can be unregistere using any case combination", function(){
      shelf.unregister("MYCLASS1");

      var fn = function() {shelf.resolve("myClass1");};
      assert.throw(fn);
    });

    it("dependencies are case insensitive", function(){
      // I have added a dependency to MYCLASS1 with a case different
      //  from the one registered
      var MyClass2 = function(MYCLASS1){
        this.MYCLASS1 = MYCLASS1;
      }
      shelf.register("myClass2", MyClass2);

      var c = shelf.resolve("myClass2");
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
      shelf.register("car", Ferrari);
      shelf.register("car", Porsche);
    });

    it("last component is returned", function(){
      var cmp = shelf.resolve("car");
      assert.instanceOf(cmp, Porsche);
    });

    it("all registered components can be resolved", function(){
      var cmps = shelf.resolveAll("car");
      assert.equal(cmps.length, 2);
      assert.instanceOf(cmps[0], Ferrari);
      assert.instanceOf(cmps[1], Porsche);
    });
  });

  describe("unregister a component", function(){
    function MyClass1(){
    }

    beforeEach(function(){
      shelf.register("myClass1", MyClass1);
    });

    it("can be unregistered", function(){
      // check if is registered
      var cmp = shelf.resolve("myClass1");
      assert.instanceOf(cmp, MyClass1);

      // now unregister it
      shelf.unregister("myClass1");

      var fn = function() {shelf.resolve("myClass1");};
      assert.throw(fn);
    });
  });

  describe("register a component using an object istance", function(){

    var myInstance1 = {};

    beforeEach(function(){
      shelf.register("myClass1", myInstance1);
    });

    it("can be resolved with the specified instance", function(){
      var cmp = shelf.resolve("myClass1");

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
      shelf.register("car", Car);
      shelf.register("steeringWheel", SteeringWheel);
      shelf.register("engine", Engine);
    });

    it("can be resolved", function(){
      var cmp = shelf.resolve("car");

      assert.instanceOf(cmp, Car);
      assert.instanceOf(cmp.engine, Engine);
    });
  });

  describe("register a component having a dependency to shelf-dependency itself", function(){
    function MyFactory1(shelf){
      this.shelf = shelf;
    }

    beforeEach(function(){
      shelf.register("MyFactory1", MyFactory1);
    });

    it("can be resolved", function(){
      var cmp = shelf.resolve("MyFactory1");

      assert.instanceOf(cmp, MyFactory1);
      assert.instanceOf(cmp.shelf, ShelfDependency);
      assert.equal(cmp.shelf, shelf);
    });
  });

  describe("register with static dependency", function(){

    function Duck(name){
      this.name = name;
    }

    beforeEach(function(){
      shelf.register("duck", Duck, { name: "Donald" } );
    });

    it("can be resolved with the static dependency", function(){
      var cmp = shelf.resolve("duck");

      assert.instanceOf(cmp, Duck);
      assert.equal(cmp.name, "Donald");
    });
  });

  describe("resolve components using require (requireFacility)", function(){

    function MySampleClass(http){
      this.http = http;
    }

    beforeEach(function(){
      shelf.use(ShelfDependency.requireFacility);
      shelf.register("MySampleClass", MySampleClass);
    });

    it("resolving a dependencies with a require module", function(){
      var cmp = shelf.resolve("MySampleClass");

      assert.instanceOf(cmp, MySampleClass);
      assert.equal(cmp.http, require("http"));
    });

    it("an explicitly registered component wins over a require", function(){
      var myHttp = {};
      shelf.register("http", myHttp)

      var cmp = shelf.resolve("MySampleClass");

      assert.instanceOf(cmp, MySampleClass);
      assert.equal(cmp.http, myHttp);
    });

    it("resolve an unknown component throw an exception", function(){
      var fn = function() {shelf.resolve("notExisting");};
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
      shelf.use(ShelfDependency.listFacility);
      shelf.register("logger", MyLogger1);
      shelf.register("logger", MyLogger2);
      shelf.register("MySampleClass", MySampleClass);
    });

    it("resolving a dependencies with a require module", function(){
      var cmp = shelf.resolve("MySampleClass");

      assert.instanceOf(cmp, MySampleClass);
      assert.equal(cmp._loggerList.length, 2);
      assert.instanceOf(cmp._loggerList[0], MyLogger1);
      assert.instanceOf(cmp._loggerList[1], MyLogger2);
    });
  });

});
