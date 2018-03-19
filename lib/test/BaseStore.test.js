"use strict";
var __extends = (this && this.__extends) || (function () {
    var extendStatics = Object.setPrototypeOf ||
        ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
        function (d, b) { for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p]; };
    return function (d, b) {
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
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
var index_1 = require("../../index");
var redux_saga_1 = require("redux-saga");
var effects_1 = require("redux-saga/effects");
var mobx_1 = require("mobx");
describe('BaseStore', function () {
    beforeEach(function () {
        // console.log = jest.fn(() => void 0);
        console.error = jest.fn(function () { return void 0; });
        console.warn = jest.fn(function () { return void 0; });
        console.info = jest.fn(function () { return void 0; });
        index_1.BaseStore.reset();
    });
    test('BaseStore初始化', function () {
        var store = new index_1.BaseStore();
        expect(index_1.BaseStore.initialized).toBe(true);
        expect(store.sagaRunner).toBe(index_1.BaseStore.sagaRunner);
    });
    test('方法绑定上下文', function () {
        var BindTest = /** @class */ (function (_super) {
            __extends(BindTest, _super);
            function BindTest() {
                return _super !== null && _super.apply(this, arguments) || this;
            }
            BindTest.prototype.func = function () {
                return this;
            };
            BindTest.prototype.funcApiCallWith = function () {
                return this;
            };
            BindTest.prototype.generatorFunc = function () {
                return __generator(this, function (_a) {
                    switch (_a.label) {
                        case 0: return [4 /*yield*/, this];
                        case 1:
                            _a.sent();
                            return [2 /*return*/];
                    }
                });
            };
            __decorate([
                index_1.bind,
                __metadata("design:type", Function),
                __metadata("design:paramtypes", []),
                __metadata("design:returntype", void 0)
            ], BindTest.prototype, "func", null);
            __decorate([
                index_1.api('API_TYPE'),
                __metadata("design:type", Function),
                __metadata("design:paramtypes", []),
                __metadata("design:returntype", void 0)
            ], BindTest.prototype, "funcApiCallWith", null);
            __decorate([
                index_1.bind,
                __metadata("design:type", Function),
                __metadata("design:paramtypes", []),
                __metadata("design:returntype", void 0)
            ], BindTest.prototype, "generatorFunc", null);
            __decorate([
                index_1.apiTypeDef,
                __metadata("design:type", Object)
            ], BindTest, "API_TYPE", void 0);
            return BindTest;
        }(index_1.BaseStore));
        var bindTest = new BindTest();
        var func = bindTest.func;
        var funcApiCallWith = bindTest.funcApiCallWith;
        expect(func()).toEqual(bindTest);
        expect(funcApiCallWith()).toEqual(bindTest);
        var generatorFunc = bindTest.generatorFunc;
        var gen = generatorFunc();
        expect(gen.next().value).toEqual(bindTest);
    });
    test('apiType和typeDef自动赋值', function () {
        var TypeTest = /** @class */ (function (_super) {
            __extends(TypeTest, _super);
            function TypeTest() {
                return _super !== null && _super.apply(this, arguments) || this;
            }
            __decorate([
                index_1.typeDef,
                __metadata("design:type", String)
            ], TypeTest.prototype, "TYPE_B", void 0);
            __decorate([
                index_1.apiTypeDef,
                __metadata("design:type", Object)
            ], TypeTest.prototype, "TYPE_API_B", void 0);
            __decorate([
                index_1.typeDef,
                __metadata("design:type", String)
            ], TypeTest, "TYPE_A", void 0);
            __decorate([
                index_1.apiTypeDef,
                __metadata("design:type", Object)
            ], TypeTest, "TYPE_API_A", void 0);
            return TypeTest;
        }(index_1.BaseStore));
        expect(TypeTest.TYPE_A).toBe('TypeTest/TYPE_A');
        expect(TypeTest.TYPE_API_A).toEqual({
            PRE_REQUEST: 'TypeTest/TYPE_API_A/PRE_REQUEST',
            REQUEST: 'TypeTest/TYPE_API_A/REQUEST',
            SUCCESS: 'TypeTest/TYPE_API_A/SUCCESS',
            FAILURE: 'TypeTest/TYPE_API_A/FAILURE'
        });
        var typeTest = new TypeTest({ key: 'test' });
        expect(typeTest.TYPE_B).toBe('TypeTest<test>/TYPE_B');
        expect(typeTest.TYPE_API_B).toEqual({
            PRE_REQUEST: 'TypeTest<test>/TYPE_API_B/PRE_REQUEST',
            REQUEST: 'TypeTest<test>/TYPE_API_B/REQUEST',
            SUCCESS: 'TypeTest<test>/TYPE_API_B/SUCCESS',
            FAILURE: 'TypeTest<test>/TYPE_API_B/FAILURE'
        });
        var randomKeyTypeTest = new TypeTest();
        var key = randomKeyTypeTest.key;
        expect(key).toMatch(/^[a-zA-Z]{6}$/);
        expect(randomKeyTypeTest.TYPE_B).toBe("TypeTest<" + key + ">/TYPE_B");
        expect(randomKeyTypeTest.TYPE_API_B).toEqual({
            PRE_REQUEST: "TypeTest<" + key + ">/TYPE_API_B/PRE_REQUEST",
            REQUEST: "TypeTest<" + key + ">/TYPE_API_B/REQUEST",
            SUCCESS: "TypeTest<" + key + ">/TYPE_API_B/SUCCESS",
            FAILURE: "TypeTest<" + key + ">/TYPE_API_B/FAILURE"
        });
    });
    test('apiCallWith默认参数', function () {
        var ApiCallWithTest = /** @class */ (function (_super) {
            __extends(ApiCallWithTest, _super);
            function ApiCallWithTest() {
                return _super !== null && _super.apply(this, arguments) || this;
            }
            ApiCallWithTest.prototype.apiTest = function (params) {
                return params;
            };
            __decorate([
                index_1.apiTypeDef,
                __metadata("design:type", Object)
            ], ApiCallWithTest.prototype, "API_TEST", void 0);
            __decorate([
                index_1.api('API_TEST', { defaultParams: { page: 0, size: 999 } }),
                __metadata("design:type", Function),
                __metadata("design:paramtypes", [Object]),
                __metadata("design:returntype", void 0)
            ], ApiCallWithTest.prototype, "apiTest", null);
            return ApiCallWithTest;
        }(index_1.BaseStore));
        var store = new ApiCallWithTest();
        expect(store.apiTest()).toEqual({ page: 0, size: 999 });
        expect(store.apiTest({ page: 1 })).toEqual({ page: 1, size: 999 });
        expect(store.apiTest({ other: true })).toEqual({ page: 0, size: 999, other: true });
    });
    test('apiCallWith绑定接收字段', function () {
        var initialData = 'initial';
        var data = 'received data';
        var BindKeyTest = /** @class */ (function (_super) {
            __extends(BindKeyTest, _super);
            function BindKeyTest() {
                var _this = _super !== null && _super.apply(this, arguments) || this;
                _this.data = _this.getApiResState(initialData);
                return _this;
            }
            BindKeyTest.prototype.getData = function () {
                return new Promise(function (resolve) {
                    setTimeout(function () {
                        resolve(data);
                    }, 10);
                });
            };
            __decorate([
                index_1.apiTypeDef,
                __metadata("design:type", Object)
            ], BindKeyTest.prototype, "API_TEST", void 0);
            __decorate([
                mobx_1.observable,
                __metadata("design:type", Object)
            ], BindKeyTest.prototype, "data", void 0);
            __decorate([
                index_1.api('API_TEST', { bindState: 'data' }),
                __metadata("design:type", Function),
                __metadata("design:paramtypes", []),
                __metadata("design:returntype", void 0)
            ], BindKeyTest.prototype, "getData", null);
            return BindKeyTest;
        }(index_1.BaseStore));
        var store = new BindKeyTest();
        expect(store.data).toEqual({
            error: null,
            data: initialData,
            loading: false
        });
        return store.runSaga(function () {
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, effects_1.put({ type: store.API_TEST.REQUEST })];
                    case 1:
                        _a.sent();
                        expect(store.data.loading).toBe(true);
                        return [4 /*yield*/, effects_1.take(store.API_TEST.SUCCESS)];
                    case 2:
                        _a.sent();
                        expect(store.data.data).toBe(data);
                        expect(store.data.loading).toBe(false);
                        return [2 /*return*/];
                }
            });
        }).done;
    });
    test('apiType自动监听', function () {
        var ApiCallWithTest = /** @class */ (function (_super) {
            __extends(ApiCallWithTest, _super);
            function ApiCallWithTest() {
                return _super !== null && _super.apply(this, arguments) || this;
            }
            ApiCallWithTest.prototype.successApi = function (params) {
                return Promise.resolve(params);
            };
            ApiCallWithTest.prototype.failureApi = function (params) {
                return Promise.reject('failure');
            };
            ApiCallWithTest.prototype.priorityTestApi = function (params) {
                return Promise.resolve(params);
            };
            __decorate([
                index_1.apiTypeDef,
                __metadata("design:type", Object)
            ], ApiCallWithTest.prototype, "API_PRIORITY_TEST", void 0);
            __decorate([
                index_1.api('API_WILL_SUCCESS'),
                __metadata("design:type", Function),
                __metadata("design:paramtypes", [Object]),
                __metadata("design:returntype", void 0)
            ], ApiCallWithTest.prototype, "successApi", null);
            __decorate([
                index_1.api('API_WILL_FAILURE'),
                __metadata("design:type", Function),
                __metadata("design:paramtypes", [Object]),
                __metadata("design:returntype", void 0)
            ], ApiCallWithTest.prototype, "failureApi", null);
            __decorate([
                index_1.api('API_PRIORITY_TEST'),
                __metadata("design:type", Function),
                __metadata("design:paramtypes", [Object]),
                __metadata("design:returntype", void 0)
            ], ApiCallWithTest.prototype, "priorityTestApi", null);
            __decorate([
                index_1.apiTypeDef,
                __metadata("design:type", Object)
            ], ApiCallWithTest, "API_WILL_SUCCESS", void 0);
            __decorate([
                index_1.apiTypeDef,
                __metadata("design:type", Object)
            ], ApiCallWithTest, "API_WILL_FAILURE", void 0);
            __decorate([
                index_1.apiTypeDef,
                __metadata("design:type", Object)
            ], ApiCallWithTest, "API_PRIORITY_TEST", void 0);
            return ApiCallWithTest;
        }(index_1.BaseStore));
        var apiCallWithTest = new ApiCallWithTest();
        return apiCallWithTest.runSaga(function () {
            var params, _a, timeout, res;
            return __generator(this, function (_b) {
                switch (_b.label) {
                    case 0:
                        params = { id: 123 };
                        return [4 /*yield*/, effects_1.race({
                                timeout: effects_1.call(redux_saga_1.delay, 1000),
                                res: effects_1.all([
                                    effects_1.take(ApiCallWithTest.API_WILL_SUCCESS.SUCCESS),
                                    effects_1.take(ApiCallWithTest.API_WILL_FAILURE.FAILURE),
                                    effects_1.take(apiCallWithTest.API_PRIORITY_TEST.SUCCESS),
                                    effects_1.put({ type: ApiCallWithTest.API_WILL_SUCCESS.REQUEST, payload: params }),
                                    effects_1.put({ type: ApiCallWithTest.API_WILL_FAILURE.REQUEST, payload: params }),
                                    effects_1.put({ type: apiCallWithTest.API_PRIORITY_TEST.REQUEST, payload: params })
                                ])
                            })];
                    case 1:
                        _a = _b.sent(), timeout = _a.timeout, res = _a.res;
                        expect(timeout).toBe(undefined);
                        expect(res[0].payload).toEqual(params);
                        expect(res[1].payload).toBe('failure');
                        expect(res[2].payload).toEqual(params);
                        return [2 /*return*/];
                }
            });
        }).done;
    });
    test('runSaga装饰器', function () {
        var RunSagaTest = /** @class */ (function (_super) {
            __extends(RunSagaTest, _super);
            function RunSagaTest() {
                return _super !== null && _super.apply(this, arguments) || this;
            }
            RunSagaTest.prototype.sagaMain = function () {
                return __generator(this, function (_a) {
                    switch (_a.label) {
                        case 0: return [4 /*yield*/, effects_1.take(this.TAKE)];
                        case 1:
                            _a.sent();
                            return [4 /*yield*/, effects_1.put({ type: this.RESOLVE })];
                        case 2:
                            _a.sent();
                            return [2 /*return*/];
                    }
                });
            };
            __decorate([
                index_1.typeDef,
                __metadata("design:type", String)
            ], RunSagaTest.prototype, "TAKE", void 0);
            __decorate([
                index_1.typeDef,
                __metadata("design:type", String)
            ], RunSagaTest.prototype, "RESOLVE", void 0);
            __decorate([
                index_1.runSaga,
                __metadata("design:type", Function),
                __metadata("design:paramtypes", []),
                __metadata("design:returntype", void 0)
            ], RunSagaTest.prototype, "sagaMain", null);
            return RunSagaTest;
        }(index_1.BaseStore));
        var store = new RunSagaTest();
        return store.runSaga(function () {
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, effects_1.put({ type: store.TAKE })];
                    case 1:
                        _a.sent();
                        return [4 /*yield*/, effects_1.take(store.RESOLVE)];
                    case 2:
                        _a.sent();
                        return [2 /*return*/];
                }
            });
        }).done;
    }, 100);
    test('继承', function () {
        var Parent = /** @class */ (function (_super) {
            __extends(Parent, _super);
            function Parent() {
                return _super !== null && _super.apply(this, arguments) || this;
            }
            Parent.prototype.sagaMain = function () {
                return __generator(this, function (_a) {
                    switch (_a.label) {
                        case 0: return [4 /*yield*/, effects_1.call(this.func)];
                        case 1:
                            _a.sent();
                            return [2 /*return*/];
                    }
                });
            };
            Parent.prototype.func = function () {
                var self;
                return __generator(this, function (_a) {
                    switch (_a.label) {
                        case 0: return [4 /*yield*/, this];
                        case 1:
                            self = _a.sent();
                            return [4 /*yield*/, effects_1.call(redux_saga_1.delay, 10)];
                        case 2:
                            _a.sent();
                            return [4 /*yield*/, effects_1.put({ type: self.CALLED_NOTICE })];
                        case 3:
                            _a.sent();
                            return [2 /*return*/];
                    }
                });
            };
            __decorate([
                index_1.typeDef,
                __metadata("design:type", String)
            ], Parent.prototype, "PARENT_TYPE", void 0);
            __decorate([
                index_1.typeDef,
                __metadata("design:type", String)
            ], Parent.prototype, "CALLED_NOTICE", void 0);
            __decorate([
                index_1.runSaga,
                __metadata("design:type", Function),
                __metadata("design:paramtypes", []),
                __metadata("design:returntype", void 0)
            ], Parent.prototype, "sagaMain", null);
            __decorate([
                index_1.bind,
                __metadata("design:type", Function),
                __metadata("design:paramtypes", []),
                __metadata("design:returntype", void 0)
            ], Parent.prototype, "func", null);
            return Parent;
        }(index_1.BaseStore));
        var Child = /** @class */ (function (_super) {
            __extends(Child, _super);
            function Child() {
                return _super !== null && _super.apply(this, arguments) || this;
            }
            return Child;
        }(Parent));
        var child = new Child();
        return child.runSaga(function () {
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, effects_1.take(child.CALLED_NOTICE)];
                    case 1:
                        _a.sent();
                        return [2 /*return*/];
                }
            });
        }).done;
    }, 100);
    test('可开关的bindState', function () {
        var BindTest = /** @class */ (function (_super) {
            __extends(BindTest, _super);
            function BindTest() {
                var _this = _super !== null && _super.apply(this, arguments) || this;
                _this.apiRes = _this.getApiResState();
                return _this;
            }
            BindTest.prototype.apiFunc = function () {
                return new Promise(function (resolve) {
                    setTimeout(function () {
                        resolve('res');
                    }, 10);
                });
            };
            __decorate([
                index_1.apiTypeDef,
                __metadata("design:type", Object)
            ], BindTest.prototype, "API_TYPE", void 0);
            __decorate([
                mobx_1.observable,
                __metadata("design:type", Object)
            ], BindTest.prototype, "apiRes", void 0);
            __decorate([
                index_1.api('API_TYPE', { bindState: 'apiRes' }),
                __metadata("design:type", Function),
                __metadata("design:paramtypes", []),
                __metadata("design:returntype", void 0)
            ], BindTest.prototype, "apiFunc", null);
            return BindTest;
        }(index_1.BaseStore));
        var bindTest = new BindTest();
        var noBindTest = new BindTest({ bindState: false });
        var bindApiRes = mobx_1.toJS(bindTest.apiRes);
        var noBindApiRes = mobx_1.toJS(noBindTest.apiRes);
        return bindTest.runSaga(function () {
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, effects_1.put({ type: bindTest.API_TYPE.REQUEST })];
                    case 1:
                        _a.sent();
                        return [4 /*yield*/, effects_1.put({ type: noBindTest.API_TYPE.REQUEST })];
                    case 2:
                        _a.sent();
                        return [4 /*yield*/, effects_1.all([
                                effects_1.take(bindTest.API_TYPE.SUCCESS),
                                effects_1.take(noBindTest.API_TYPE.SUCCESS)
                            ])];
                    case 3:
                        _a.sent();
                        expect(bindApiRes).not.toEqual(mobx_1.toJS(bindTest.apiRes));
                        expect(noBindApiRes).toEqual(mobx_1.toJS(noBindTest.apiRes));
                        return [2 /*return*/];
                }
            });
        }).done;
    });
});
//# sourceMappingURL=BaseStore.test.js.map