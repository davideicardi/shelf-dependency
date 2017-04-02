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
var LifeStyle;
(function (LifeStyle) {
    LifeStyle[LifeStyle["Singleton"] = 0] = "Singleton";
    LifeStyle[LifeStyle["Transient"] = 1] = "Transient";
})(LifeStyle = exports.LifeStyle || (exports.LifeStyle = {}));
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
class ComponentInfo {
}
class Container {
    constructor() {
        this.components = new Map();
        this.facilities = new Array();
        this.components.set(CONTAINER_DEPENDENCY_NAME, [{
                instance: this,
                options: { lifeStyle: LifeStyle.Singleton },
                dependenciesNames: []
            }]);
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
    register(name, component, staticDependencies, options) {
        if (!name) {
            throw new Error("Invalid component name.");
        }
        options = options || { lifeStyle: LifeStyle.Singleton };
        name = normalizeName(name);
        if (name === CONTAINER_DEPENDENCY_NAME) {
            throw Error("Cannot register a component called 'container'");
        }
        let registeredCmp;
        if (typeof component === "function") {
            registeredCmp = {
                options,
                componentFunction: component,
                dependenciesNames: getDependencies(component)
            };
        }
        else if (typeof component === "object") {
            if (options.lifeStyle === LifeStyle.Transient) {
                throw new Error("Cannot register instance components as Transient");
            }
            registeredCmp = {
                options,
                instance: component,
                dependenciesNames: []
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
        debug(`Registering ${name} with ${registeredCmp.dependenciesNames}...`);
        cps.push(registeredCmp);
    }
    registerProperties(obj) {
        for (const key in obj) {
            if (obj.hasOwnProperty(key)) {
                this.register(key, obj[key]);
            }
        }
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
        const cmps = this.components.get(normalName);
        if (!cmps) {
            for (const facility of this.facilities) {
                const result = facility(this, name);
                if (result) {
                    return [{
                            instance: result,
                            options: { lifeStyle: LifeStyle.Transient },
                            dependenciesNames: []
                        }];
                }
            }
            throw new Error("Cannot resolve component '" + name + "'");
        }
        return cmps;
    }
    resolveComponent(cmp) {
        let instance = cmp.instance;
        if (!instance) {
            instance = this.resolveNewComponent(cmp);
            if (cmp.options.lifeStyle === LifeStyle.Singleton) {
                cmp.instance = instance;
            }
        }
        return instance;
    }
    resolveNewComponent(cmp, dependencies) {
        const dependenciesMap = new Map();
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
exports.Container = Container;
//# sourceMappingURL=index.js.map