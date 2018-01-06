import * as Debug from "debug";
const debug = Debug("shelf");

// Code based on https://github.com/goatslacker/get-parameter-names
export function getDependencies(fn: Function): string[] { // tslint:disable-line:ban-types
	// TODO Eval to use more advanced methods like https://github.com/rphansen91/es-arguments
	// or https://www.npmjs.com/package/recast (parse code to AST)

	const COMMENTS = /((\/\/.*$)|(\/\*[\s\S]*?\*\/))/mg;
	const code = Function.prototype.toString.call(fn)
		.replace(COMMENTS, "") as string;

	let functionCode: string;
	if (isEs6Class(code)) {
		const constructorPosition = code.search(/\bconstructor\b/);
		functionCode = constructorPosition >= 0
		? code.substring(constructorPosition)
		: "";
	} else {
		functionCode = code;
	}

	const parametersCode = functionCode.slice(functionCode.indexOf("(") + 1, functionCode.indexOf(")"));

	const result = parametersCode
		.replace(/\s/, "")
		.split(",")
		.filter((p) => p && p.length > 0)
		.map((p) => p.split("=")[0].trim()) // handle default values
		.filter((p) => p && p.length > 0);

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
	lifeStyle: LifeStyle;
	tags: string[];
	dependsOn: {[index: string]: any};
}

export interface UnregisterOptions {
	tags: string[];
}

const DefaultRegisterOptions: RegisterOptions = {
	lifeStyle: LifeStyle.Singleton,
	tags: [],
	dependsOn: {}
};

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
	fromFacility?: boolean;
}

export class Container {
	private components = new Map<string, ComponentInfo[]>();
	private facilities = new Array<Facility>();

	constructor() {
		this.components.set(CONTAINER_DEPENDENCY_NAME, [{
			instance: this,
			options: DefaultRegisterOptions,
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

	register(name: string, component: any, options?: Partial<RegisterOptions>): void {
		if (!name) {
			throw new Error("Invalid component name.");
		}

		const compOptions: RegisterOptions = {...DefaultRegisterOptions, ...(options || {})};

		name = normalizeName(name);
		if (name === CONTAINER_DEPENDENCY_NAME) {
			throw Error("Cannot register a component called 'container'");
		}

		let registeredCmp: ComponentInfo;
		if (typeof component === "function") { // function or es6 class
			registeredCmp = {
					options: compOptions,
					componentFunction: component,
					dependenciesNames: getDependencies(component)
				};
		}	else if (typeof component === "object") {
			if (compOptions.lifeStyle === LifeStyle.Transient) {
				throw new Error("Cannot register instance components as Transient");
			}

			registeredCmp = {
					options: compOptions,
					instance: component,
					dependenciesNames: []
				};
		} else {
			throw Error("Invalid component type, expected 'function' or 'object'");
		}

		if (compOptions.dependsOn) {
			registeredCmp.staticDependencies = new Map<string, any>();
			for (const key in compOptions.dependsOn) {
				if (compOptions.dependsOn.hasOwnProperty(key)) {
					const value = compOptions.dependsOn[key];
					registeredCmp.staticDependencies.set(key, value);
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

	registerProperties(obj: any, options?: Partial<RegisterOptions>): void {
		for (const key in obj) {
			if (obj.hasOwnProperty(key)) {
				this.register(key, obj[key], options);
			}
		}
	}

	unregister(name?: string, options?: Partial<UnregisterOptions>): void {
		if (name) {
			name = normalizeName(name);
		}

		if (!name && !options) {
			return;
		}

		if (name && !options) {
			this.components.delete(name);
		} else if (options) {
			for (const [k, cmps] of this.components) {
				if (name && name !== k) {
					continue;
				}

				const filteredCmps = cmps.filter((c) => !matchUnregisterOptions(c, options));
				if (filteredCmps.length === 0) {
					this.components.delete(k);
				} else if (filteredCmps.length < cmps.length) {
					this.components.set(k, filteredCmps);
				}
			}
		}
	}

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
						options: {lifeStyle: LifeStyle.Transient, tags: [], dependsOn: {}},
						dependenciesNames: [],
						fromFacility: true
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

		// instance are used for singleton, so here I should not use this,
		// but facilities create "fake" singleton...
		if (cmp.fromFacility && cmp.instance) {
			return cmp.instance;
		}

		if (!cmp.componentFunction) {
			throw new Error("Invalid component, function not provided, cannot resolve new instance");
		}

		return createInstance(cmp.componentFunction, dependenciesArgs);
	}
}

function matchUnregisterOptions(component: ComponentInfo, options: Partial<UnregisterOptions>): boolean {
	if (!options.tags || !options.tags.length) {
		return false;
	}

	for (const t of options.tags) {
		if (component.options.tags.indexOf(t) < 0) {
			return false;
		}
	}

	return true;
}
