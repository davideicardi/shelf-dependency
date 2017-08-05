"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const chai_1 = require("chai");
const ShelfDependency = require("./../index");
describe("Container", function () {
    let container;
    beforeEach(function () {
        container = new ShelfDependency.Container();
    });
    it("resolve an unknown component throw an exception", function () {
        const fn = function () { container.resolve("notExisting"); };
        chai_1.assert.throw(fn, "Cannot resolve component 'notExisting'");
    });
    it("resolveAll passing an unknown component return an empty array", function () {
        const result = container.resolveAll("notExisting");
        chai_1.assert.equal(result.length, 0);
    });
    it("registering a component with a reserved keyworkds throw an exception", function () {
        let fn = function () { container.register("container", {}); };
        chai_1.assert.throw(fn);
        fn = function () { container.register("CONTAINER", {}); };
        chai_1.assert.throw(fn);
    });
    describe("registering a component using a function constructor", function () {
        function MyClass1() {
        }
        beforeEach(function () {
            container.register("myClass1", MyClass1);
        });
        it("can be resolved and constructor is invoked", function () {
            const cmp = container.resolve("myClass1");
            chai_1.assert.instanceOf(cmp, MyClass1);
        });
        it("singleton: multiple resolve return the same instance", function () {
            const cmp1 = container.resolve("myClass1");
            const cmp2 = container.resolve("myClass1");
            chai_1.assert.equal(cmp1, cmp2);
        });
    });
    describe("registering a component using a class declaration", function () {
        class MyEs6Class1 {
            constructor() {
            }
        }
        beforeEach(function () {
            container.register("myEs6Class1", MyEs6Class1);
        });
        it("can be resolved and constructor is invoked", function () {
            const cmp = container.resolve("myEs6Class1");
            chai_1.assert.instanceOf(cmp, MyEs6Class1);
        });
    });
    describe("registering a component using a class declaration with dependencies", function () {
        class MyEs6Class1 {
            constructor(a, b) {
                this.a = a;
                this.b = b;
            }
        }
        beforeEach(function () {
            container.register("myEs6Class1", MyEs6Class1);
            container.register("a", { v: "a" });
            container.register("b", { v: "b" });
        });
        it("can be resolved and constructor is invoked", function () {
            const cmp = container.resolve("myEs6Class1");
            chai_1.assert.instanceOf(cmp, MyEs6Class1);
            chai_1.assert.equal(cmp.a.v, "a");
            chai_1.assert.equal(cmp.b.v, "b");
        });
    });
    describe("when registering or resolving a component special characters are removed from compoonent name", function () {
        function SocketIO() {
        }
        function SqlServer() {
        }
        beforeEach(function () {
            container.register("Socket.IO", SocketIO);
            container.register("sql-server", SqlServer);
        });
        it("component name can contains dots", function () {
            const cmp = container.resolve("socket.IO");
            chai_1.assert.instanceOf(cmp, SocketIO);
        });
        it("component can be resolved without dots", function () {
            const cmp = container.resolve("socketIO");
            chai_1.assert.instanceOf(cmp, SocketIO);
        });
        it("component name can contains dashes", function () {
            const cmp = container.resolve("sql-server");
            chai_1.assert.instanceOf(cmp, SqlServer);
        });
        it("component can be resolved without dashes", function () {
            const cmp = container.resolve("sqlserver");
            chai_1.assert.instanceOf(cmp, SqlServer);
        });
    });
    describe("component name is case insensitive", function () {
        function MyClass1() {
        }
        beforeEach(function () {
            container.register("myClass1", MyClass1);
        });
        it("can be resolved using any case combination", function () {
            const c1 = container.resolve("myClass1");
            const c2 = container.resolve("myclass1");
            const c3 = container.resolve("MYCLASS1");
            chai_1.assert.instanceOf(c1, MyClass1);
            chai_1.assert.instanceOf(c2, MyClass1);
            chai_1.assert.instanceOf(c3, MyClass1);
            chai_1.assert.equal(c1, c2);
            chai_1.assert.equal(c2, c3);
        });
        it("can be resolved using resolveAll with any case combination", function () {
            const c1 = container.resolveAll("myClass1")[0];
            const c2 = container.resolveAll("myclass1")[0];
            const c3 = container.resolveAll("MYCLASS1")[0];
            chai_1.assert.instanceOf(c1, MyClass1);
            chai_1.assert.instanceOf(c2, MyClass1);
            chai_1.assert.instanceOf(c3, MyClass1);
            chai_1.assert.equal(c1, c2);
            chai_1.assert.equal(c2, c3);
        });
        it("can be unregistere using any case combination", function () {
            container.unregister("MYCLASS1");
            const fn = function () { container.resolve("myClass1"); };
            chai_1.assert.throw(fn);
        });
        it("dependencies are case insensitive", function () {
            // I have added a dependency to MYCLASS1 with a case different
            //  from the one registered
            const MyClass2 = function (MYCLASS1) {
                this.MYCLASS1 = MYCLASS1;
            };
            container.register("myClass2", MyClass2);
            const c = container.resolve("myClass2");
            chai_1.assert.instanceOf(c, MyClass2);
            chai_1.assert.instanceOf(c.MYCLASS1, MyClass1);
        });
    });
    describe("registering multiple components with the same name", function () {
        function Ferrari() {
        }
        function Porsche() {
        }
        beforeEach(function () {
            container.register("car", Ferrari);
            container.register("car", Porsche);
        });
        it("last component is returned", function () {
            const cmp = container.resolve("car");
            chai_1.assert.instanceOf(cmp, Porsche);
        });
        it("all registered components can be resolved", function () {
            const cmps = container.resolveAll("car");
            chai_1.assert.equal(cmps.length, 2);
            chai_1.assert.instanceOf(cmps[0], Ferrari);
            chai_1.assert.instanceOf(cmps[1], Porsche);
        });
    });
    describe("registering components with tags", function () {
        function Ferrari() {
        }
        function Porsche() {
        }
        function Bianchi() {
        }
        beforeEach(function () {
            container.register("car", Ferrari, { tags: ["Ferrari", "italy"] });
            container.register("car", Porsche, { tags: ["Porsche", "germany"] });
            container.register("bicycle", Bianchi, { tags: ["Bianchi", "italy"] });
        });
        it("resolve by name (default)", function () {
            let cmps = container.resolveAll("car");
            chai_1.assert.equal(cmps.length, 2);
            chai_1.assert.instanceOf(cmps[0], Ferrari);
            chai_1.assert.instanceOf(cmps[1], Porsche);
            cmps = container.resolveAll("bicycle");
            chai_1.assert.equal(cmps.length, 1);
            chai_1.assert.instanceOf(cmps[0], Bianchi);
        });
        it("unregistering components by tags", function () {
            container.unregister(undefined, { tags: ["germany"] });
            let cmps = container.resolveAll("car");
            chai_1.assert.equal(cmps.length, 1);
            chai_1.assert.instanceOf(cmps[0], Ferrari);
            cmps = container.resolveAll("bicycle");
            chai_1.assert.equal(cmps.length, 1);
            chai_1.assert.instanceOf(cmps[0], Bianchi);
            container.unregister(undefined, { tags: ["italy"] });
            cmps = container.resolveAll("car");
            chai_1.assert.equal(cmps.length, 0);
            cmps = container.resolveAll("bicycle");
            chai_1.assert.equal(cmps.length, 0);
        });
        it("unregistering components by empty tags has no effect", function () {
            container.unregister(undefined, { tags: [] });
            let cmps = container.resolveAll("car");
            chai_1.assert.equal(cmps.length, 2);
            chai_1.assert.instanceOf(cmps[0], Ferrari);
            chai_1.assert.instanceOf(cmps[1], Porsche);
            cmps = container.resolveAll("bicycle");
            chai_1.assert.equal(cmps.length, 1);
            chai_1.assert.instanceOf(cmps[0], Bianchi);
        });
    });
    describe("unregister a component", function () {
        function MyClass1() {
        }
        beforeEach(function () {
            container.register("myClass1", MyClass1);
        });
        it("can be unregistered", function () {
            // check if is registered
            const cmp = container.resolve("myClass1");
            chai_1.assert.instanceOf(cmp, MyClass1);
            // now unregister it
            container.unregister("myClass1");
            const fn = function () { container.resolve("myClass1"); };
            chai_1.assert.throw(fn);
        });
    });
    describe("register a component using an object istance", function () {
        const myInstance1 = {};
        beforeEach(function () {
            container.register("myClass1", myInstance1);
        });
        it("can be resolved with the specified instance", function () {
            const cmp = container.resolve("myClass1");
            chai_1.assert.equal(cmp, myInstance1);
        });
    });
    describe("register all components using an object properties", function () {
        const myInstance1 = {};
        beforeEach(function () {
            container.registerProperties({ myClass1: myInstance1 });
        });
        it("can be resolved", function () {
            const cmp = container.resolve("myClass1");
            chai_1.assert.equal(cmp, myInstance1);
        });
    });
    describe("register a component having a dependency to another component", function () {
        function Engine() {
        }
        function SteeringWheel() {
        }
        function Car(engine, steeringWheel) {
            this.engine = engine;
            this.steeringWheel = steeringWheel;
        }
        beforeEach(function () {
            container.register("car", Car);
            container.register("steeringWheel", SteeringWheel);
            container.register("engine", Engine);
        });
        it("can be resolved", function () {
            const cmp = container.resolve("car");
            chai_1.assert.instanceOf(cmp, Car);
            chai_1.assert.instanceOf(cmp.engine, Engine);
        });
    });
    describe("register a component having a dependency to container-dependency itself", function () {
        function MyFactory1(container) {
            this.container = container;
        }
        beforeEach(function () {
            container.register("MyFactory1", MyFactory1);
        });
        it("can be resolved", function () {
            const cmp = container.resolve("MyFactory1");
            chai_1.assert.instanceOf(cmp, MyFactory1);
            chai_1.assert.instanceOf(cmp.container, ShelfDependency.Container);
            chai_1.assert.equal(cmp.container, container);
        });
    });
    describe("register a transient component", function () {
        function Foo() {
        }
        beforeEach(function () {
            container.register("foo", Foo, { lifeStyle: ShelfDependency.LifeStyle.Transient });
        });
        it("can be resolved and returns always a different instance", function () {
            const cmp1 = container.resolve("foo");
            const cmp2 = container.resolve("foo");
            chai_1.assert.instanceOf(cmp1, Foo);
            chai_1.assert.instanceOf(cmp2, Foo);
            // transient components returns always a new instance
            chai_1.assert.notEqual(cmp1, cmp2);
        });
    });
    describe("register with static dependency", function () {
        function Duck(name) {
            this.name = name;
        }
        beforeEach(function () {
            container.register("duck", Duck, { dependsOn: { name: "Donald" } });
        });
        it("can be resolved with the static dependency", function () {
            const cmp = container.resolve("duck");
            chai_1.assert.instanceOf(cmp, Duck);
            chai_1.assert.equal(cmp.name, "Donald");
        });
    });
    describe("resolve components using require (requireFacility)", function () {
        function MySampleClass(http) {
            this.http = http;
        }
        beforeEach(function () {
            container.use(ShelfDependency.requireFacility);
            container.register("MySampleClass", MySampleClass);
        });
        it("resolving", function () {
            const cmp = container.resolve("MySampleClass");
            chai_1.assert.instanceOf(cmp, MySampleClass);
            chai_1.assert.equal(cmp.http, require("http"));
        });
        it("an explicitly registered component wins over a require", function () {
            const myHttp = {};
            container.register("http", myHttp);
            const cmp = container.resolve("MySampleClass");
            chai_1.assert.instanceOf(cmp, MySampleClass);
            chai_1.assert.equal(cmp.http, myHttp);
        });
        it("resolve an unknown component throw an exception", function () {
            const fn = function () { container.resolve("notExisting"); };
            chai_1.assert.throw(fn, "Cannot resolve component 'notExisting'");
        });
    });
    describe("resolve a list of components (listFacility)", function () {
        function MyLogger1() { }
        function MyLogger2() { }
        function MySampleClass(loggerList) {
            this._loggerList = loggerList;
        }
        beforeEach(function () {
            container.use(ShelfDependency.listFacility);
            container.register("logger", MyLogger1);
            container.register("logger", MyLogger2);
            container.register("MySampleClass", MySampleClass);
        });
        it("resolving", function () {
            const cmp = container.resolve("MySampleClass");
            chai_1.assert.instanceOf(cmp, MySampleClass);
            chai_1.assert.equal(cmp._loggerList.length, 2);
            chai_1.assert.instanceOf(cmp._loggerList[0], MyLogger1);
            chai_1.assert.instanceOf(cmp._loggerList[1], MyLogger2);
        });
    });
    describe("resolve a factory function (factoryFacility)", function () {
        beforeEach(function () {
            container.use(ShelfDependency.factoryFacility);
        });
        function MyLogger() { }
        function MySampleClass(loggerFactory) {
            this.logger1 = loggerFactory();
            this.logger2 = loggerFactory();
        }
        it("resolving the factory", function () {
            container.register("logger", MyLogger);
            container.register("MySampleClass", MySampleClass);
            const cmp = container.resolve("mySampleClass");
            chai_1.assert.instanceOf(cmp, MySampleClass);
            chai_1.assert.instanceOf(cmp.logger1, MyLogger);
            chai_1.assert.instanceOf(cmp.logger2, MyLogger);
            // a factory returns always a new instance
            chai_1.assert.notEqual(cmp.logger1, cmp.logger2);
        });
        function MyComponent(param1, anotherParam) {
            this.param1 = param1;
            this.anotherParam = anotherParam;
        }
        it("calling the factory with custom dependencies", function () {
            container.register("MyComponent", MyComponent);
            const factory = container.resolve("myComponentFactory");
            const cmp1 = factory({ param1: 1, anotherParam: "test1" });
            const cmp2 = factory({ param1: 2, anotherParam: "test2" });
            chai_1.assert.instanceOf(cmp1, MyComponent);
            chai_1.assert.instanceOf(cmp2, MyComponent);
            // a factory returns always a new instance
            chai_1.assert.notEqual(cmp1, cmp2);
            chai_1.assert.equal(cmp1.param1, 1);
            chai_1.assert.equal(cmp2.param1, 2);
            chai_1.assert.equal(cmp1.anotherParam, "test1");
            chai_1.assert.equal(cmp2.anotherParam, "test2");
        });
        it("factory custom dependencies are case sensitive", function () {
            container.register("MyComponent", MyComponent);
            const factory = container.resolve("myComponentFactory");
            function f() { factory({ PARAM1: 1, AnotherParam: "test1" }); }
            chai_1.assert.throw(f);
        });
    });
    describe("resolve a typescript typed factory function (factoryFacility)", function () {
        beforeEach(function () {
            container.use(ShelfDependency.factoryFacility);
        });
        class MyLogger {
        }
        class MySampleClass {
            constructor(loggerFactory) {
                this.logger1 = loggerFactory();
                this.logger2 = loggerFactory();
            }
        }
        it("resolving the factory", function () {
            container.register("logger", MyLogger);
            container.register("MySampleClass", MySampleClass);
            const cmp = container.resolve("mySampleClass");
            chai_1.assert.instanceOf(cmp, MySampleClass);
            chai_1.assert.instanceOf(cmp.logger1, MyLogger);
            chai_1.assert.instanceOf(cmp.logger2, MyLogger);
            // a factory returns always a new instance
            chai_1.assert.notEqual(cmp.logger1, cmp.logger2);
        });
    });
});
//# sourceMappingURL=Container.test.js.map