"use strict";
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g;
    return g = { next: verb(0), "throw": verb(1), "return": verb(2) }, typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (_) try {
            if (f = 1, y && (t = y[op[0] & 2 ? "return" : op[0] ? "throw" : "next"]) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [0, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
Object.defineProperty(exports, "__esModule", { value: true });
var invariant_1 = require("./invariant");
var axios_1 = require("axios");
var effects_1 = require("redux-saga/effects");
var utils_1 = require("./utils");
var SagaRunner_1 = require("./SagaRunner");
var BaseStore = /** @class */ (function () {
    function BaseStore(baseStoreConfig) {
        if (baseStoreConfig === void 0) { baseStoreConfig = {}; }
        if (!BaseStore.initialized) {
            BaseStore.init();
        }
        baseStoreConfig = Object.assign({ bindState: true }, baseStoreConfig);
        this.http = BaseStore.http;
        this.sagaRunner = baseStoreConfig.sagaRunner || BaseStore.sagaRunner;
        this.key = baseStoreConfig.key || utils_1.getRandomText(6);
        if (baseStoreConfig.key) {
            this.sagaRunner.registerStore(baseStoreConfig.key, this);
        }
        if (baseStoreConfig.apiResponseTransformer) {
            this.apiResponseTransformer = baseStoreConfig.apiResponseTransformer;
        }
        this.bindState = baseStoreConfig.bindState;
        this.dispatch = this.dispatch.bind(this);
        this.runSaga = this.runSaga.bind(this);
        this.runCallWithSaga = this.runCallWithSaga.bind(this);
        this.processDecoratedMethods();
    }
    BaseStore.init = function (baseStoreConfig) {
        if (baseStoreConfig === void 0) { baseStoreConfig = {}; }
        BaseStore.http = axios_1.default.create(baseStoreConfig.axiosConfig || {});
        BaseStore.sagaRunner = new SagaRunner_1.default(baseStoreConfig.sagaOptions);
        BaseStore.initialized = true;
    };
    BaseStore.reset = function () {
        BaseStore.http = void 0;
        BaseStore.sagaRunner = void 0;
        BaseStore.initialized = false;
    };
    BaseStore.prototype.dispatch = function (action) {
        return this.sagaRunner.dispatch(action);
    };
    BaseStore.prototype.runSaga = function (saga) {
        return this.sagaRunner.runSaga(saga);
    };
    BaseStore.prototype.getApiResState = function (initialValue) {
        if (initialValue === void 0) { initialValue = null; }
        return {
            error: null,
            loading: false,
            data: initialValue
        };
    };
    BaseStore.prototype.processDecoratedMethods = function () {
        var _this = this;
        var prototype = Object.getPrototypeOf(this);
        var membersDescriptor = utils_1.getClassMembersDescriptor(prototype);
        var runSagaFuncArr = [];
        membersDescriptor.forEach(function (i) {
            var name = i.name, descriptor = i.descriptor;
            if (!descriptor || typeof descriptor.value !== 'function') {
                return;
            }
            var func = _this[name];
            // 先把标记取出来，因为在bind之后，标记会丢失
            var $bind = func.$bind, $apiCallWith = func.$apiCallWith, $runSaga = func.$runSaga;
            if ($bind) {
                _this[name] = _this[name].bind(_this);
            }
            if ($apiCallWith) {
                var defaultParams_1 = $apiCallWith.defaultParams;
                if (defaultParams_1 !== void 0) {
                    _this[name] = function (params) {
                        params = Object.assign({}, defaultParams_1, params);
                        return func(params);
                    };
                }
                _this.runCallWithSaga(name, $apiCallWith);
            }
            if ($runSaga) {
                runSagaFuncArr.push(_this[name]);
            }
        });
        // 到最后再一次性执行runSaga，避免某些方法未绑定this
        if (runSagaFuncArr.length > 0) {
            this.runSaga(function () {
                return __generator(this, function (_a) {
                    switch (_a.label) {
                        case 0: return [4 /*yield*/, effects_1.all(runSagaFuncArr.map(function (i) { return effects_1.fork(i); }))];
                        case 1:
                            _a.sent();
                            return [2 /*return*/];
                    }
                });
            });
        }
    };
    BaseStore.prototype.runCallWithSaga = function (funcName, apiCallWithConfig) {
        var func = this[funcName];
        var apiCallTypeName = apiCallWithConfig.apiCallTypeName, bindState = apiCallWithConfig.bindState;
        // try get instance type first
        var apiCallType = this[apiCallTypeName] || this.constructor[apiCallTypeName];
        invariant_1.default(utils_1.isApiType(apiCallType), 'invalid apiCallType: %s', JSON.stringify(apiCallType));
        invariant_1.default(!bindState || bindState in this, 'cannot find state key "%s" in store or state hasn\'t initialized', bindState);
        var that = this;
        this.runSaga(function () {
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, effects_1.takeLatest(apiCallType.REQUEST, function (_a) {
                            var payload = _a.payload;
                            var self, hasBindState, data_1, err_1;
                            return __generator(this, function (_b) {
                                switch (_b.label) {
                                    case 0: return [4 /*yield*/, that];
                                    case 1:
                                        self = _b.sent();
                                        hasBindState = bindState && (bindState in self) && self.bindState;
                                        if (!hasBindState) return [3 /*break*/, 3];
                                        return [4 /*yield*/, utils_1.runInAction(function () {
                                                self[bindState].loading = true;
                                                self[bindState].error = null;
                                            })];
                                    case 2:
                                        _b.sent();
                                        _b.label = 3;
                                    case 3:
                                        _b.trys.push([3, 10, , 14]);
                                        return [4 /*yield*/, effects_1.call(func, payload)];
                                    case 4:
                                        data_1 = _b.sent();
                                        if (!self.apiResponseTransformer) return [3 /*break*/, 6];
                                        return [4 /*yield*/, effects_1.call(self.apiResponseTransformer, data_1)];
                                    case 5:
                                        data_1 = _b.sent();
                                        _b.label = 6;
                                    case 6:
                                        if (!hasBindState) return [3 /*break*/, 8];
                                        return [4 /*yield*/, utils_1.runInAction(function () {
                                                self[bindState].loading = false;
                                                self[bindState].data = data_1;
                                            })];
                                    case 7:
                                        _b.sent();
                                        _b.label = 8;
                                    case 8: return [4 /*yield*/, effects_1.put({ type: apiCallType.SUCCESS, payload: data_1 })];
                                    case 9:
                                        _b.sent();
                                        return [3 /*break*/, 14];
                                    case 10:
                                        err_1 = _b.sent();
                                        if (!hasBindState) return [3 /*break*/, 12];
                                        return [4 /*yield*/, utils_1.runInAction(function () {
                                                self[bindState].loading = false;
                                                self[bindState].error = err_1;
                                            })];
                                    case 11:
                                        _b.sent();
                                        _b.label = 12;
                                    case 12: return [4 /*yield*/, effects_1.put({ type: apiCallType.FAILURE, payload: err_1 })];
                                    case 13:
                                        _b.sent();
                                        console.error(err_1);
                                        return [3 /*break*/, 14];
                                    case 14: return [2 /*return*/];
                                }
                            });
                        })];
                    case 1:
                        _a.sent();
                        return [2 /*return*/];
                }
            });
        });
    };
    BaseStore.initialized = false;
    return BaseStore;
}());
exports.default = BaseStore;
//# sourceMappingURL=BaseStore.js.map