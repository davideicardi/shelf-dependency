export declare function requireFacility(shelf: Container, name: string): any;
export declare function listFacility(shelf: Container, name: string): any[] | null;
export declare type Facility = (shelf: Container, name: string) => any;
export declare class Container {
    private components;
    private facilities;
    resolveAll(name: string): any[];
    resolve(name: string): any;
    register(name: string, component: any, staticDependencies?: any): void;
    unregister(name: string): void;
    use(facilityFunction: Facility): void;
    private getComponents(name);
    private resolveComponent(cmp);
}
