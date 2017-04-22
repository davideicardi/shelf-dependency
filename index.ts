import * as Debug from "debug";
const debug = Debug("shelf");

// https://github.com/goatslacker/get-parameter-names
export function getDependencies(fn: Function): string[] { // tslint:disable-line:ban-types
	const COMMENTS = /((\/\/.*$)|(\/\*[\s\S]*?\*\/))/mg;
	const code = Function.prototype.toString.call(fn)
		.replace(COMMENTS, "");

	let parameters: string;
	if (isEs6Class(code)) {
		const constructorStart = "constructor(";
		const constructorPosition = code.indexOf(constructorStart);
		if (constructorPosition >= 0) {
			parameters = code.slice(constructorPosition + constructorStart.length, code.indexOf(")"));
		} else {
			parameters = "";
		}
	} else {
		parameters = code.slice(code.indexOf("(") + 1, code.indexOf(")"));
	}

	const result = parameters
		.match(/([^\s,]+)/g);

	return result === null
		? []
		: result;
}

function isEs6Class(funcToString: string) {
	return /^class\s/.test(funcToString);
}

const CONTAINER_DEPENDENCY_NAME = "container";

export enum LifeStyle {
	Singleton = 0,
	Transient = 1
}

export interface RegisterOptions {
	lifeStyle?: LifeStyle;
}

export function requireFacility(shelf: Container, name: string) {
	try {
		return require(name);
	} catch (e) {
		return null;
	}
}

export function listFacility(shelf: Container, name: string) {
	if (name.endsWith("List")) {
		return shelf.resolveAll(name.substring(0, name.length - 4));
	}

	return null;
}

export type Factory<T> = (dependencies?: any) => T;
export function factoryFacility(shelf: Container, name: string) {
	if (name.endsWith("Factory")) {
		const cmpToResolve = name.substring(0, name.length - 7);
		return (dependencies?: any) => {
			return shelf.resolveNew(cmpToResolve, dependencies);
		};
	}

	return null;
}

function createInstance(classFunction: Function, args: any[]) { // tslint:disable-line:ban-types
		const params = [classFunction].concat(args);

		const wrapper = classFunction.bind.apply(classFunction, params);

		return new wrapper();
}

function normalizeName(name: string) {
	return name.toLowerCase().replace(/[\.\-]/, "");
}

export type Facility = (shelf: Container, name: string) => any;

class ComponentInfo {
	options: RegisterOptions;
	dependenciesNames: string[];
	staticDependencies?: Map<string, any>;
	instance?: any;
	componentFunction?: Function; // tslint:disable-line:ban-types
}

export class Container {
	private components = new Map<string, ComponentInfo[]>();
	private facilities = new Array<Facility>();

	constructor() {
		this.components.set(CONTAINER_DEPENDENCY_NAME, [{
			instance: this,
			options: {lifeStyle: LifeStyle.Singleton},
			dependenciesNames: []
		}]);
	}

	resolveAll(name: string): any[] {
		const cmps = this.getComponents(name);

		return cmps.map((c) => this.resolveComponent(c));
	}

	resolve(name: string): any {
		const cmps = this.getComponents(name);
		if (cmps.length === 0) {
			throw new Error("Cannot resolve component '" + name + "'");
		}

		return this.resolveComponent(cmps[cmps.length - 1]);
	}

	resolveNew(name: string, dependencies?: any): any {
		const cmps = this.getComponents(name);
		if (cmps.length === 0) {
			throw new Error("Cannot resolve component '" + name + "'");
		}

		return this.resolveNewComponent(cmps[cmps.length - 1], dependencies);
	}

	register(name: string, component: any, staticDependencies?: any, options?: RegisterOptions): void {
		if (!name) {
			throw new Error("Invalid component name.");
		}

		options = options || { lifeStyle: LifeStyle.Singleton };

		name = normalizeName(name);
		if (name === CONTAINER_DEPENDENCY_NAME) {
			throw Error("Cannot register a component called 'container'");
		}

		let registeredCmp: ComponentInfo;
		if (typeof component === "function") { // function or es6 class
			registeredCmp = {
					options,
					componentFunction: component,
					dependenciesNames: getDependencies(component)
				};
		}	else if (typeof component === "object") {
			if (options.lifeStyle === LifeStyle.Transient) {
				throw new Error("Cannot register instance components as Transient");
			}

			registeredCmp = {
					options,
					instance: component,
					dependenciesNames: []
				};
		} else {
			throw Error("Invalid component type, expected 'function' or 'object'");
		}

		if (staticDependencies) {
			registeredCmp.staticDependencies = new Map<string, any>();
			for (const key in staticDependencies) {
				if (staticDependencies.hasOwnProperty(key)) {
					const value = staticDependencies[key];
					registeredCmp.staticDependencies.set(key, String(value));
				}
			}
		}

		let cps = this.components.get(name);
		if (!cps) {
			cps = new Array<ComponentInfo>();
			this.components.set(name, cps);
		}

		debug(`Registering ${name} with ${registeredCmp.dependenciesNames}...`);

		cps.push(registeredCmp);
	}

	registerProperties(obj: any): void {
		for (const key in obj) {
			if (obj.hasOwnProperty(key)) {
				this.register(key, obj[key]);
			}
		}
	}

	unregister(name: string): void {
		if (!name) {
			throw Error("Invalid component name.");
		}
		name = name.toLowerCase();

		this.components.delete(name);
	};

	use(facilityFunction: Facility): void {
		this.facilities.push(facilityFunction);
	}

	private getComponents(name: string): ComponentInfo[] {
		if (!name) {
			throw new Error("Invalid component name.");
		}
		const normalName = normalizeName(name);

		const cmps = this.components.get(normalName);
		if (!cmps) {
			for (const facility of this.facilities) {
				const result = facility(this, name);
				if (result) {
					return [{
						instance: result,
						options: {lifeStyle: LifeStyle.Transient},
						dependenciesNames: []
					}];
				}
			}

			return [];
		}

		return cmps;
	}

	private resolveComponent(cmp: ComponentInfo) {
		let instance = cmp.instance;
		if (!instance) {
			instance = this.resolveNewComponent(cmp);

			if (cmp.options.lifeStyle === LifeStyle.Singleton) {
				cmp.instance = instance;
			}
		}

		return instance;
	}

	private resolveNewComponent(cmp: ComponentInfo, dependencies?: any) {
		const dependenciesMap = new Map<string, any>();
		if (dependencies) {
			for (const key in dependencies) {
				if (dependencies.hasOwnProperty(key)) {
					const value = dependencies[key];
					dependenciesMap.set(key, value);
				}
			}
		}

		const dependenciesArgs = cmp.dependenciesNames
			.map((name) => {
				if (dependenciesMap.has(name)) {
					return dependenciesMap.get(name);
				}

				if (cmp.staticDependencies && cmp.staticDependencies.has(name)) {
					return cmp.staticDependencies.get(name);
				}

				return this.resolve(name);
			});

		if (!cmp.componentFunction) {
			throw new Error("Invalid component function");
		}

		return createInstance(cmp.componentFunction, dependenciesArgs);
	}
}
