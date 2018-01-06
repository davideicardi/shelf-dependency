const assert = require("chai").assert;
const getDependencies = require("./../index").getDependencies;

describe("Dependencies JS functions", function() {

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
		function testFunc(a, b) {
		}

		const dependencies = getDependencies(testFunc);
		assert.equal(dependencies.length, 2);
		assert.equal(dependencies[0], "a");
		assert.equal(dependencies[1], "b");
	});

	it("get dependencies of an arrow empty function", function() {
		const testFunc = (a, b) => {
		};

		const dependencies = getDependencies(testFunc);
		assert.equal(dependencies.length, 2);
		assert.equal(dependencies[0], "a");
		assert.equal(dependencies[1], "b");
	});

	it("get dependencies of an anonymous function", function() {
		const dependencies = getDependencies(function(a, b) {
		});
		assert.equal(dependencies.length, 2);
		assert.equal(dependencies[0], "a");
		assert.equal(dependencies[1], "b");
	});

});

describe("Dependencies es6 class", function() {

	describe("no dependencies", function() {
		it("get dependencies of an empty class", function() {
			class TestClassEmpty {
			}

			const dependencies = getDependencies(TestClassEmpty);
			assert.equal(dependencies.length, 0);
		});
	});

	it("get dependencies of a class", function() {
		class TestClassDep {
			constructor(a, b) {
			}
		}

		const dependencies = getDependencies(TestClassDep);
		assert.equal(dependencies.length, 2);
		assert.equal(dependencies[0], "a");
		assert.equal(dependencies[1], "b");
	});

	it("get dependencies of a class with spaces inside constructor", function() {
		class TestClassSpace {
			constructor (a , b) {
			}
		}

		const dependencies = getDependencies(TestClassSpace);
		assert.equal(dependencies.length, 2);
		assert.equal(dependencies[0], "a");
		assert.equal(dependencies[1], "b");
	});

	it("get dependencies of a class with default parameters", function() {
		class TestClassDef {
			constructor(a, b = 4) {
			}
		}

		const dependencies = getDependencies(TestClassDef);
		assert.equal(dependencies.length, 2);
		assert.equal(dependencies[0], "a");
		assert.equal(dependencies[1], "b");
	});
});
