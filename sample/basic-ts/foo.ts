import {Bar} from "./bar";

export class Foo {
	constructor(readonly bar: Bar, readonly logger: Console) {
	}

	helloFoo() {
		this.logger.log("hello from foo");
		this.bar.helloBar();
	}
}
