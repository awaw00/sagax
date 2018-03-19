"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var utils_1 = require("./utils");
function api(apiCallTypeName, config) {
    if (config === void 0) { config = {}; }
    return function (target, key, descriptor) {
        config.apiCallTypeName = apiCallTypeName;
        descriptor.value.$apiCallWith = config;
        descriptor.value.$bind = true;
        return descriptor;
    };
}
exports.api = api;
function bind(target, key, descriptor) {
    descriptor.value.$bind = true;
    return descriptor;
}
exports.bind = bind;
function typeDef(target, key) {
    if (typeof target === 'function') {
        // static type
        var namespace = target.name;
        target[key] = namespace + "/" + key;
        return target;
    }
    else {
        // instance type
        return {
            get: function () {
                var cacheKey = '__' + key;
                if (!this[cacheKey]) {
                    var namespace = this.constructor.name;
                    this[cacheKey] = namespace + "<" + this.key + ">/" + key;
                }
                return this[cacheKey];
            }
        };
    }
}
exports.typeDef = typeDef;
function apiTypeDef(target, key) {
    if (typeof target === 'function') {
        // static api type
        var namespace = target.name;
        target[key] = utils_1.getApiCallType(key, namespace);
        return target;
    }
    else {
        // instance api type
        return {
            get: function () {
                var cacheKey = '__' + key;
                if (!this[cacheKey]) {
                    var namespace = this.constructor.name;
                    this[cacheKey] = utils_1.getApiCallType(key, namespace, this.key);
                }
                return this[cacheKey];
            }
        };
    }
}
exports.apiTypeDef = apiTypeDef;
/**
 * 在初始化store完成后自动执行该saga方法
 * @param target
 * @param {string} key
 * @param descriptor
 * @returns {any}
 */
function runSaga(target, key, descriptor) {
    descriptor.value.$runSaga = true;
    descriptor.value.$bind = true;
    return descriptor;
}
exports.runSaga = runSaga;
//# sourceMappingURL=decorators.js.map