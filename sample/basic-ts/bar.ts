export class Bar {
	constructor(readonly logger: Console) {
	}

	helloBar() {
		this.logger.log("hello from bar");
	}
}
