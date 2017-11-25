// tslint:disable-next-line:no-implicit-dependencies
import {assert} from "chai";
import {getDependencies} from "./../index";

describe("Dependencies functions", function() {

	describe("no dependencies", function() {
		it("get dependencies of an empty function", function() {
			function testFunc() {
			}

			const dependencies = getDependencies(testFunc);
			assert.equal(dependencies.length, 0);
		});

		it("get dependencies of an arrow empty function", function() {
			const testFunc = () => {
			};

			const dependencies = getDependencies(testFunc);
			assert.equal(dependencies.length, 0);
		});

		it("get dependencies of an anonymous empty function", function() {
			const dependencies = getDependencies(function() {
			});
			assert.equal(dependencies.length, 0);
		});
	});

	it("get dependencies of a function", function() {
		function testFunc(a: any, b: any) {
		}

		const dependencies = getDependencies(testFunc);
		assert.equal(dependencies.length, 2);
		assert.equal(dependencies[0], "a");
		assert.equal(dependencies[1], "b");
	});

	it("get dependencies of an arrow empty function", function() {
		const testFunc = (a: any, b: any) => {
		};

		const dependencies = getDependencies(testFunc);
		assert.equal(dependencies.length, 2);
		assert.equal(dependencies[0], "a");
		assert.equal(dependencies[1], "b");
	});

	it("get dependencies of an anonymous function", function() {
		const dependencies = getDependencies(function(a: any, b: any) {
		});
		assert.equal(dependencies.length, 2);
		assert.equal(dependencies[0], "a");
		assert.equal(dependencies[1], "b");
	});

});

describe("Dependencies es6 class", function() {

	describe("no dependencies", function() {
		it("get dependencies of an empty class", function() {
			class TestClass {
			}

			const dependencies = getDependencies(TestClass);
			assert.equal(dependencies.length, 0);
		});
	});

	it("get dependencies of a class", function() {
		class TestClass {
			constructor(a: any, b: any) {
			}
		}

		const dependencies = getDependencies(TestClass);
		assert.equal(dependencies.length, 2);
		assert.equal(dependencies[0], "a");
		assert.equal(dependencies[1], "b");
	});

	it("get dependencies of a class with spaces inside constructor", function() {
		class TestClass {
			constructor(a: any, b: any) {
			}
		}

		const dependencies = getDependencies(TestClass);
		assert.equal(dependencies.length, 2);
		assert.equal(dependencies[0], "a");
		assert.equal(dependencies[1], "b");
	});

});
