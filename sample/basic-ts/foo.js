"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
class Foo {
    constructor(bar, logger) {
        this.bar = bar;
        this.logger = logger;
    }
    helloFoo() {
        this.logger.log("hello from foo");
        this.bar.helloBar();
    }
}
exports.Foo = Foo;
//# sourceMappingURL=foo.js.map