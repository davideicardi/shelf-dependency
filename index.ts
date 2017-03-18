// My poor man DI

// https://github.com/goatslacker/get-parameter-names
function getParameterNames(fn: Function) {
	const COMMENTS = /((\/\/.*$)|(\/\*[\s\S]*?\*\/))/mg;
	const code = fn.toString().replace(COMMENTS, "");
	const result = code.slice(code.indexOf("(") + 1, code.indexOf(")"))
		.match(/([^\s,]+)/g);

	return result === null
		? []
		: result;
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
	if (name.indexOf("List", name.length - 4) >= 0) {
		return shelf.resolveAll(name.substring(0, name.length - 4));
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

		return cmps.map(this.resolveComponent);
	}

	resolve(name: string) {
		const cmps = this.getComponents(name);

		return this.resolveComponent(cmps[cmps.length - 1]);
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
		if (typeof component === "function") {
			registeredCmp = {
					componentClass: component,
					parameterNames: getParameterNames(component)
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
			if (!cmp.parameterNames) {
				throw new Error("Invalid component");
			}

			const dependencies = cmp.parameterNames
				.map((name) => {
					if (cmp.staticDependencies && cmp.staticDependencies.has(name)) {
						return cmp.staticDependencies.get(name);
					}

					return this.resolve(name);
				});

			if (!cmp.componentClass) {
				throw new Error("Invalid component");
			}

			cmp.instance = createInstance(cmp.componentClass, dependencies);
		}

		return cmp.instance;
	}
}
