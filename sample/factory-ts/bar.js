"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
class Bar {
    constructor(logger, index) {
        this.logger = logger;
        this.index = index;
    }
    helloBar() {
        this.logger.log("hello from bar", this.index);
    }
}
exports.Bar = Bar;
//# sourceMappingURL=bar.js.map