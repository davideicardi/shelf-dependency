import {Bar} from "./bar";

export class Foo {
	constructor(readonly barFactory: (args: {index: number}) => Bar, readonly logger: Console) {
	}

	helloFoo() {
		this.logger.log("hello from foo");

		this.barFactory({index: 1}).helloBar();
		this.barFactory({index: 2}).helloBar();
	}
}
