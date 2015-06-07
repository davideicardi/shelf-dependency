// My poor man DI

//https://github.com/goatslacker/get-parameter-names
var COMMENTS = /((\/\/.*$)|(\/\*[\s\S]*?\*\/))/mg;
function getParameterNames(fn) {
  var code = fn.toString().replace(COMMENTS, '');
  var result = code.slice(code.indexOf('(') + 1, code.indexOf(')'))
    .match(/([^\s,]+)/g);

  return result === null
    ? []
    : result;
}

function requireFacility(name){
  return require(name);
}

function createInstance(classFunction, args) {
    var params = [classFunction].concat(args);

    var wrapper = classFunction.bind.apply(classFunction, params);

    return new wrapper();
}

function normalizeName(name){
  return name.toLowerCase().replace(/[\.\-]/, "");
}

function ShelfDependency(){
  this._components = {};
  this._facilities = [];
}

ShelfDependency.prototype._getComponents = function(name){
  if (!name){
    throw "Invalid component name.";
  }
  name = normalizeName(name);
  if (name === "shelf"){
    return [{instance: this}];
  }

  var cmps = this._components[name];
  if (!cmps){

    for (var i = 0; i < this._facilities.length; i++){
      var result = this._facilities[i](name);
      if (result){
        return [{instance: result}];
      }
    }

    throw "Dependency '" + name + "' not found";
  }

  return cmps;
};

ShelfDependency.prototype._resolveComponent = function(cmp){
  if (!cmp.instance){
    var me = this;
    var dependencies = cmp.parameterNames
      .map(function(name){
        if (cmp.staticDependencies && cmp.staticDependencies[name]){
          return cmp.staticDependencies[name];
        }
        return me.resolve(name);
      });

    cmp.instance = createInstance(cmp.componentClass, dependencies);
  }

  return cmp.instance;
};

ShelfDependency.prototype.resolveAll = function(name){
  var cmps = this._getComponents(name);

  return cmps.map(this._resolveComponent);
};

ShelfDependency.prototype.resolve = function(name){
  var cmps = this._getComponents(name);

  return this._resolveComponent(cmps[cmps.length - 1]);
};

ShelfDependency.prototype.register = function(name, component, staticDependencies){
  if (!name){
    throw "Invalid component name.";
  }
  name = normalizeName(name);
  if (name === "shelf"){
    throw "Cannot register a component called 'shelf'";
  }

  var registeredCmp;
  if (typeof component === "function"){
    registeredCmp = {
        componentClass: component,
        parameterNames: getParameterNames(component)
      };
  }
  else if (typeof component === "object"){
    registeredCmp = {
        instance: component
      };
  }
  else {
    throw "Invalid component type, expected 'function' or 'object'";
  }

  registeredCmp.staticDependencies = staticDependencies;

  if (!this._components[name]){
    this._components[name] = [];
  }
  this._components[name].push(registeredCmp);
};

ShelfDependency.prototype.unregister = function(name){
  if (!name){
    throw "Invalid component name.";
  }
  name = name.toLowerCase();

  this._components[name] = null;
};

ShelfDependency.prototype.use = function(facilityFunction){
  this._facilities.push(facilityFunction);
};

module.exports = ShelfDependency;
module.exports.requireFacility = requireFacility;
