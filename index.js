// My poor man DI
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
// https://github.com/goatslacker/get-parameter-names
function getParameterNames(fn) {
    const COMMENTS = /((\/\/.*$)|(\/\*[\s\S]*?\*\/))/mg;
    const code = fn.toString().replace(COMMENTS, "");
    const result = code.slice(code.indexOf("(") + 1, code.indexOf(")"))
        .match(/([^\s,]+)/g);
    return result === null
        ? []
        : result;
}
const CONTAINER_DEPENDENCY_NAME = "container";
function requireFacility(shelf, name) {
    try {
        return require(name);
    }
    catch (e) {
        return null;
    }
}
exports.requireFacility = requireFacility;
function listFacility(shelf, name) {
    if (name.indexOf("List", name.length - 4) >= 0) {
        return shelf.resolveAll(name.substring(0, name.length - 4));
    }
    return null;
}
exports.listFacility = listFacility;
function createInstance(classFunction, args) {
    const params = [classFunction].concat(args);
    const wrapper = classFunction.bind.apply(classFunction, params);
    return new wrapper();
}
function normalizeName(name) {
    return name.toLowerCase().replace(/[\.\-]/, "");
}
class Component {
}
class Container {
    constructor() {
        this.components = new Map();
        this.facilities = new Array();
    }
    resolveAll(name) {
        const cmps = this.getComponents(name);
        return cmps.map(this.resolveComponent);
    }
    resolve(name) {
        const cmps = this.getComponents(name);
        return this.resolveComponent(cmps[cmps.length - 1]);
    }
    register(name, component, staticDependencies) {
        if (!name) {
            throw new Error("Invalid component name.");
        }
        name = normalizeName(name);
        if (name === CONTAINER_DEPENDENCY_NAME) {
            throw Error("Cannot register a component called 'container'");
        }
        let registeredCmp;
        if (typeof component === "function") {
            registeredCmp = {
                componentClass: component,
                parameterNames: getParameterNames(component)
            };
        }
        else if (typeof component === "object") {
            registeredCmp = {
                instance: component
            };
        }
        else {
            throw Error("Invalid component type, expected 'function' or 'object'");
        }
        if (staticDependencies) {
            registeredCmp.staticDependencies = new Map();
            for (const key in staticDependencies) {
                if (staticDependencies.hasOwnProperty(key)) {
                    const value = staticDependencies[key];
                    registeredCmp.staticDependencies.set(key, String(value));
                }
            }
        }
        let cps = this.components.get(name);
        if (!cps) {
            cps = new Array();
            this.components.set(name, cps);
        }
        cps.push(registeredCmp);
    }
    unregister(name) {
        if (!name) {
            throw Error("Invalid component name.");
        }
        name = name.toLowerCase();
        this.components.delete(name);
    }
    ;
    use(facilityFunction) {
        this.facilities.push(facilityFunction);
    }
    getComponents(name) {
        if (!name) {
            throw new Error("Invalid component name.");
        }
        const normalName = normalizeName(name);
        if (normalName === CONTAINER_DEPENDENCY_NAME) {
            return [{ instance: this }];
        }
        const cmps = this.components.get(normalName);
        if (!cmps) {
            for (const facility of this.facilities) {
                const result = facility(this, name);
                if (result) {
                    return [{ instance: result }];
                }
            }
            throw new Error("Cannot resolve component '" + name + "'");
        }
        return cmps;
    }
    resolveComponent(cmp) {
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
exports.Container = Container;
//# sourceMappingURL=index.js.map