import * as Debug from "debug";
const debug = Debug("shelf");

// https://github.com/goatslacker/get-parameter-names
export function getDependencies(fn: Function): string[] {
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

export function factoryFacility(shelf: Container, name: string) {
	if (name.endsWith("Factory")) {
		const cmpToResolve = name.substring(0, name.length - 7);
		return (dependencies?: any) => {
			return shelf.resolveNew(cmpToResolve, dependencies);
		};
	}

	return null;
}

function createInstance(classFunction: Function, args: any[]) {
		const params = [classFunction].concat(args);

		const wrapper = classFunction.bind.apply(classFunction, params);

		return new wrapper();
}

function normalizeName(name: string) {
	return name.toLowerCase().replace(/[\.\-]/, "");
}

export type Facility = (shelf: Container, name: string) => any;

class Component {
	instance?: any;
	parameterNames?: string[];
	staticDependencies?: Map<string, any>;
	componentClass?: Function;
}

export class Container {
	private components = new Map<string, Component[]>();
	private facilities = new Array<Facility>();

	resolveAll(name: string) {
		const cmps = this.getComponents(name);

		return cmps.map((c) => this.resolveComponent(c));
	}

	resolve(name: string) {
		const cmps = this.getComponents(name);

		return this.resolveComponent(cmps[cmps.length - 1]);
	}

	resolveNew(name: string, dependencies?: any) {
		const cmps = this.getComponents(name);

		return this.resolveNewComponent(cmps[cmps.length - 1], dependencies);
	}

	registerProperties(obj: any) {
		for (const key in obj) {
			if (obj.hasOwnProperty(key)) {
				this.register(key, obj[key]);
			}
		}
	}

	register(name: string, component: any, staticDependencies?: any) {
		if (!name) {
			throw new Error("Invalid component name.");
		}

		name = normalizeName(name);
		if (name === CONTAINER_DEPENDENCY_NAME) {
			throw Error("Cannot register a component called 'container'");
		}

		let registeredCmp: Component;
		if (typeof component === "function") { // function or es6 class
			registeredCmp = {
					componentClass: component,
					parameterNames: getDependencies(component)
				};
		}	else if (typeof component === "object") {
			registeredCmp = {
					instance: component
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
			cps = new Array<Component>();
			this.components.set(name, cps);
		}

		debug(`Registering ${name} with ${registeredCmp.parameterNames}...`);

		cps.push(registeredCmp);
	}

	unregister(name: string) {
		if (!name) {
			throw Error("Invalid component name.");
		}
		name = name.toLowerCase();

		this.components.delete(name);
	};

	use(facilityFunction: Facility) {
		this.facilities.push(facilityFunction);
	}

	private getComponents(name: string): Component[] {
		if (!name) {
			throw new Error("Invalid component name.");
		}
		const normalName = normalizeName(name);
		if (normalName === CONTAINER_DEPENDENCY_NAME) {
			return [{instance: this}];
		}

		const cmps = this.components.get(normalName);
		if (!cmps) {
			for (const facility of this.facilities) {
				const result = facility(this, name);
				if (result) {
					return [{instance: result}];
				}
			}

			throw new Error("Cannot resolve component '" + name + "'");
		}

		return cmps;
	}

	private resolveComponent(cmp: Component) {
		if (!cmp.instance) {
			cmp.instance = this.resolveNewComponent(cmp);
		}

		return cmp.instance;
	}

	private resolveNewComponent(cmp: Component, customDependencies?: any) {
		if (!cmp.parameterNames) {
			throw new Error("Invalid component");
		}

		const customDependenciesMap = new Map<string, any>();
		if (customDependencies) {
			for (const key in customDependencies) {
				if (customDependencies.hasOwnProperty(key)) {
					const value = customDependencies[key];
					customDependenciesMap.set(key, String(value));
				}
			}
		}

		const dependencies = cmp.parameterNames
			.map((name) => {
				if (customDependenciesMap.has(name)) {
					return customDependenciesMap.get(name);
				}

				if (cmp.staticDependencies && cmp.staticDependencies.has(name)) {
					return cmp.staticDependencies.get(name);
				}

				return this.resolve(name);
			});

		if (!cmp.componentClass) {
			throw new Error("Invalid component");
		}

		return createInstance(cmp.componentClass, dependencies);
	}
}
