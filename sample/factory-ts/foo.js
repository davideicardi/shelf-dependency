"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
class Foo {
    constructor(barFactory, logger) {
        this.barFactory = barFactory;
        this.logger = logger;
    }
    helloFoo() {
        this.logger.log("hello from foo");
        this.barFactory({ index: 1 }).helloBar();
        this.barFactory({ index: 2 }).helloBar();
    }
}
exports.Foo = Foo;
//# sourceMappingURL=foo.js.map