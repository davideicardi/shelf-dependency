"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const Debug = require("debug");
const debug = Debug("shelf");
// Code based on https://github.com/goatslacker/get-parameter-names
function getDependencies(fn) {
    // TODO Eval to use more advanced methods like https://github.com/rphansen91/es-arguments
    // or https://www.npmjs.com/package/recast (parse code to AST)
    const COMMENTS = /((\/\/.*$)|(\/\*[\s\S]*?\*\/))/mg;
    const code = Function.prototype.toString.call(fn)
        .replace(COMMENTS, "");
    let functionCode;
    if (isEs6Class(code)) {
        const constructorPosition = code.search(/\bconstructor\b/);
        functionCode = constructorPosition >= 0
            ? code.substring(constructorPosition)
            : "";
    }
    else {
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
const DefaultRegisterOptions = {
    lifeStyle: LifeStyle.Singleton,
    tags: [],
    dependsOn: {}
};
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
    const wrapper = classFunction.bind.apply(classFunction, [classFunction, ...args]);
    return new wrapper();
}
function normalizeName(name) {
    return name.toLowerCase().replace(/[\.\-]/, "");
}
class Container {
    constructor() {
        this.components = new Map();
        this.facilities = new Array();
        this.components.set(CONTAINER_DEPENDENCY_NAME, [{
                instance: this,
                options: DefaultRegisterOptions,
                dependenciesNames: []
            }]);
    }
    resolveAll(name) {
        const cmps = this.getComponents(name);
        return cmps.map((c) => this.resolveComponent(c));
    }
    resolve(name) {
        const cmps = this.getComponents(name);
        if (cmps.length === 0) {
            throw new Error("Cannot resolve component '" + name + "'");
        }
        return this.resolveComponent(cmps[cmps.length - 1]);
    }
    resolveNew(name, dependencies) {
        const cmps = this.getComponents(name);
        if (cmps.length === 0) {
            throw new Error("Cannot resolve component '" + name + "'");
        }
        return this.resolveNewComponent(cmps[cmps.length - 1], dependencies);
    }
    register(name, component, options) {
        if (!name) {
            throw new Error("Invalid component name.");
        }
        const compOptions = Object.assign(Object.assign({}, DefaultRegisterOptions), (options || {}));
        name = normalizeName(name);
        if (name === CONTAINER_DEPENDENCY_NAME) {
            throw Error("Cannot register a component called 'container'");
        }
        let registeredCmp;
        if (typeof component === "function") { // function or es6 class
            registeredCmp = {
                options: compOptions,
                componentFunction: component,
                dependenciesNames: getDependencies(component)
            };
        }
        else if (typeof component === "object") {
            if (compOptions.lifeStyle === LifeStyle.Transient) {
                throw new Error("Cannot register instance components as Transient");
            }
            registeredCmp = {
                options: compOptions,
                instance: component,
                dependenciesNames: []
            };
        }
        else {
            throw Error("Invalid component type, expected 'function' or 'object'");
        }
        if (compOptions.dependsOn) {
            registeredCmp.staticDependencies = new Map();
            for (const key in compOptions.dependsOn) {
                if (compOptions.dependsOn.hasOwnProperty(key)) {
                    const value = compOptions.dependsOn[key];
                    registeredCmp.staticDependencies.set(key, value);
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
    registerProperties(obj, options) {
        for (const key in obj) {
            if (obj.hasOwnProperty(key)) {
                this.register(key, obj[key], options);
            }
        }
    }
    unregister(name, options) {
        if (name) {
            name = normalizeName(name);
        }
        if (!name && !options) {
            return;
        }
        if (name && !options) {
            this.components.delete(name);
        }
        else if (options) {
            for (const [k, cmps] of this.components) {
                if (name && name !== k) {
                    continue;
                }
                const filteredCmps = cmps.filter((c) => !matchUnregisterOptions(c, options));
                if (filteredCmps.length === 0) {
                    this.components.delete(k);
                }
                else if (filteredCmps.length < cmps.length) {
                    this.components.set(k, filteredCmps);
                }
            }
        }
    }
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
                            options: { lifeStyle: LifeStyle.Transient, tags: [], dependsOn: {} },
                            dependenciesNames: [],
                            fromFacility: true
                        }];
                }
            }
            return [];
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
exports.Container = Container;
function matchUnregisterOptions(component, options) {
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
//# sourceMappingURL=index.js.map