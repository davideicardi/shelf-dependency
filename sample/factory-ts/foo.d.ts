import { Bar } from "./bar";
export declare class Foo {
    readonly barFactory: (args: {
        index: number;
    }) => Bar;
    readonly logger: Console;
    constructor(barFactory: (args: {
        index: number;
    }) => Bar, logger: Console);
    helloFoo(): void;
}
