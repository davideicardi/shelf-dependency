export class Bar {
	constructor(readonly logger: Console, readonly index: number) {
	}

	helloBar() {
		this.logger.log("hello from bar", this.index);
	}
}
