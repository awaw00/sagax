"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var redux_saga_1 = require("redux-saga");
var SagaRunner = /** @class */ (function () {
    function SagaRunner(sagaOptions) {
        if (sagaOptions === void 0) { sagaOptions = {}; }
        this.sagaOptions = sagaOptions;
        this.subscribes = [];
        this.stores = {};
        this.subscribe = this.subscribe.bind(this);
        this.dispatch = this.dispatch.bind(this);
        this.runSaga = this.runSaga.bind(this);
    }
    SagaRunner.prototype.dispatch = function (action) {
        var arr = this.subscribes.slice();
        for (var i = 0, len = arr.length; i < len; i++) {
            arr[i](action);
        }
        if (process.env.NODE_ENV === 'development' || process.env.SAGA_LOG) {
            console.groupCollapsed("Action: " + action.type);
            console.log(action.payload);
            console.groupEnd();
        }
        return action;
    };
    SagaRunner.prototype.runSaga = function (saga) {
        var _this = this;
        var runSagaOptions = {
            subscribe: this.subscribe,
            dispatch: this.dispatch,
            getState: function () { return _this.stores; }
        };
        if (this.sagaOptions.monitor) {
            runSagaOptions.sagaMonitor = this.sagaOptions.monitor;
        }
        return redux_saga_1.runSaga(runSagaOptions, saga);
    };
    SagaRunner.prototype.registerStore = function (key, store) {
        if (this.stores[key]) {
            throw new Error('已存在key: ' + key);
        }
        this.stores[key] = store;
    };
    SagaRunner.prototype.unRegisterStore = function (key) {
        if (this.stores[key]) {
            delete this.stores[key];
        }
    };
    SagaRunner.prototype.subscribe = function (callback) {
        var _this = this;
        this.subscribes.push(callback);
        return function () {
            var index = _this.subscribes.indexOf(callback);
            if (index >= 0) {
                _this.subscribes.splice(index, 1);
            }
        };
    };
    return SagaRunner;
}());
exports.default = SagaRunner;
//# sourceMappingURL=SagaRunner.js.map