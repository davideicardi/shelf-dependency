"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const Debug = require("debug");
const debug = Debug("shelf");
// https://github.com/goatslacker/get-parameter-names
function getDependencies(fn) {
    const COMMENTS = /((\/\/.*$)|(\/\*[\s\S]*?\*\/))/mg;
    const code = Function.prototype.toString.call(fn)
        .replace(COMMENTS, "");
    let parameters;
    if (isEs6Class(code)) {
        const constructorStart = "constructor(";
        const constructorPosition = code.indexOf(constructorStart);
        if (constructorPosition >= 0) {
            parameters = code.slice(constructorPosition + constructorStart.length, code.indexOf(")"));
        }
        else {
            parameters = "";
        }
    }
    else {
        parameters = code.slice(code.indexOf("(") + 1, code.indexOf(")"));
    }
    const result = parameters
        .match(/([^\s,]+)/g);
    return result === null
        ? []
        : result;
}
exports.getDependencies = getDependencies;
function isEs6Class(funcToString) {
    return /^class\s/.test(funcToString);
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
    if (name.endsWith("List")) {
        return shelf.resolveAll(name.substring(0, name.length - 4));
    }
    return null;
}
exports.listFacility = listFacility;
function factoryFacility(shelf, name) {
    if (name.endsWith("Factory")) {
        const cmpToResolve = name.substring(0, name.length - 7);
        return (dependencies) => {
            return shelf.resolveNew(cmpToResolve, dependencies);
        };
    }
    return null;
}
exports.factoryFacility = factoryFacility;
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
        return cmps.map((c) => this.resolveComponent(c));
    }
    resolve(name) {
        const cmps = this.getComponents(name);
        return this.resolveComponent(cmps[cmps.length - 1]);
    }
    resolveNew(name, dependencies) {
        const cmps = this.getComponents(name);
        return this.resolveNewComponent(cmps[cmps.length - 1], dependencies);
    }
    registerProperties(obj) {
        for (const key in obj) {
            if (obj.hasOwnProperty(key)) {
                this.register(key, obj[key]);
            }
        }
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
                parameterNames: getDependencies(component)
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
        debug(`Registering ${name} with ${registeredCmp.parameterNames}...`);
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
            cmp.instance = this.resolveNewComponent(cmp);
        }
        return cmp.instance;
    }
    resolveNewComponent(cmp, customDependencies) {
        if (!cmp.parameterNames) {
            throw new Error("Invalid component");
        }
        const customDependenciesMap = new Map();
        if (customDependencies) {
            for (const key in customDependencies) {
                if (customDependencies.hasOwnProperty(key)) {
                    const value = customDependencies[key];
                    customDependenciesMap.set(key, value);
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
exports.Container = Container;
//# sourceMappingURL=index.js.map