"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
// tslint:disable-next-line:no-implicit-dependencies
const chai_1 = require("chai");
const index_1 = require("./../index");
describe("Dependencies functions", function () {
    describe("no dependencies", function () {
        it("get dependencies of an empty function", function () {
            function testFunc() {
            }
            const dependencies = index_1.getDependencies(testFunc);
            chai_1.assert.equal(dependencies.length, 0);
        });
        it("get dependencies of an arrow empty function", function () {
            const testFunc = () => {
            };
            const dependencies = index_1.getDependencies(testFunc);
            chai_1.assert.equal(dependencies.length, 0);
        });
        it("get dependencies of an anonymous empty function", function () {
            const dependencies = index_1.getDependencies(function () {
            });
            chai_1.assert.equal(dependencies.length, 0);
        });
    });
    it("get dependencies of a function", function () {
        function testFunc(a, b) {
        }
        const dependencies = index_1.getDependencies(testFunc);
        chai_1.assert.equal(dependencies.length, 2);
        chai_1.assert.equal(dependencies[0], "a");
        chai_1.assert.equal(dependencies[1], "b");
    });
    it("get dependencies of an arrow empty function", function () {
        const testFunc = (a, b) => {
        };
        const dependencies = index_1.getDependencies(testFunc);
        chai_1.assert.equal(dependencies.length, 2);
        chai_1.assert.equal(dependencies[0], "a");
        chai_1.assert.equal(dependencies[1], "b");
    });
    it("get dependencies of an anonymous function", function () {
        const dependencies = index_1.getDependencies(function (a, b) {
        });
        chai_1.assert.equal(dependencies.length, 2);
        chai_1.assert.equal(dependencies[0], "a");
        chai_1.assert.equal(dependencies[1], "b");
    });
});
describe("Dependencies es6 class", function () {
    describe("no dependencies", function () {
        it("get dependencies of an empty class", function () {
            class TestClass {
            }
            const dependencies = index_1.getDependencies(TestClass);
            chai_1.assert.equal(dependencies.length, 0);
        });
    });
    it("get dependencies of a class", function () {
        class TestClass {
            constructor(a, b) {
            }
        }
        const dependencies = index_1.getDependencies(TestClass);
        chai_1.assert.equal(dependencies.length, 2);
        chai_1.assert.equal(dependencies[0], "a");
        chai_1.assert.equal(dependencies[1], "b");
    });
    it("get dependencies of a class with spaces inside constructor", function () {
        class TestClass {
            // tslint:disable-next-line:space-before-function-paren
            constructor(a, b) {
            }
        }
        const dependencies = index_1.getDependencies(TestClass);
        chai_1.assert.equal(dependencies.length, 2);
        chai_1.assert.equal(dependencies[0], "a");
        chai_1.assert.equal(dependencies[1], "b");
    });
    it("get dependencies of a class with default parameters", function () {
        class TestClass {
            constructor(a, b = 4) {
            }
        }
        const dependencies = index_1.getDependencies(TestClass);
        chai_1.assert.equal(dependencies.length, 2);
        chai_1.assert.equal(dependencies[0], "a");
        chai_1.assert.equal(dependencies[1], "b");
    });
});
//# sourceMappingURL=Dependencies.test.js.map