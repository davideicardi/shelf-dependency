export declare function getDependencies(fn: Function): string[];
export declare enum LifeStyle {
    Singleton = 0,
    Transient = 1,
}
export interface RegisterOptions {
    lifeStyle: LifeStyle;
    tags: string[];
    dependsOn: any;
}
export interface UnregisterOptions {
    tags: string[];
}
export declare function requireFacility(shelf: Container, name: string): any;
export declare function listFacility(shelf: Container, name: string): any[] | null;
export declare type Factory<T> = (dependencies?: any) => T;
export declare function factoryFacility(shelf: Container, name: string): ((dependencies?: any) => any) | null;
export declare type Facility = (shelf: Container, name: string) => any;
export declare class Container {
    private components;
    private facilities;
    constructor();
    resolveAll(name: string): any[];
    resolve(name: string): any;
    resolveNew(name: string, dependencies?: any): any;
    register(name: string, component: any, options?: Partial<RegisterOptions>): void;
    registerProperties(obj: any): void;
    unregister(name?: string, options?: Partial<UnregisterOptions>): void;
    use(facilityFunction: Facility): void;
    private getComponents(name);
    private resolveComponent(cmp);
    private resolveNewComponent(cmp, dependencies?);
}
