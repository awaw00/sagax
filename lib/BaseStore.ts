import invariant from './invariant';
import axios, { AxiosInstance, AxiosRequestConfig } from 'axios';
import { Action, ApiType, AsyncState, BaseStoreConfig, BaseStoreStaticConfig, ApiCallWithConfig } from './types';
import { Task, SagaIterator } from 'redux-saga';
import { all, fork, put, takeLatest, call } from 'redux-saga/effects';
import { isApiType, runInAction, getRandomText, getClassMembersDescriptor } from './utils';
import SagaRunner from './SagaRunner';

export default class BaseStore {
  static initialized: boolean = false;
  static sagaRunner: SagaRunner;
  static http: AxiosInstance;

  key: string;
  http: AxiosInstance;
  sagaRunner: SagaRunner;
  apiResponseTransformer: (apiRes?: any) => any;
  bindState: boolean;

  static init (baseStoreConfig: BaseStoreStaticConfig = {}) {
    BaseStore.http = axios.create(baseStoreConfig.axiosConfig || {});
    BaseStore.sagaRunner = new SagaRunner(baseStoreConfig.sagaOptions);
    BaseStore.initialized = true;
  }

  static reset () {
    BaseStore.http = void 0;
    BaseStore.sagaRunner = void 0;
    BaseStore.initialized = false;
  }

  constructor (baseStoreConfig: BaseStoreConfig = {}) {
    if (!BaseStore.initialized) {
      BaseStore.init();
    }

    baseStoreConfig = Object.assign({bindState: true}, baseStoreConfig);

    this.http = BaseStore.http;
    this.sagaRunner = baseStoreConfig.sagaRunner || BaseStore.sagaRunner;

    this.key = baseStoreConfig.key || getRandomText(6);
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

  dispatch (action: Action) {
    return this.sagaRunner.dispatch(action);
  }

  runSaga (saga: () => SagaIterator): Task {
    return this.sagaRunner.runSaga(saga);
  }

  protected getAsyncState<T> (initialValue: T = null): AsyncState<T> {
    return {
      error: null,
      loading: false,
      data: initialValue
    };
  }

  private processDecoratedMethods () {
    let prototype = Object.getPrototypeOf(this);
    const membersDescriptor = getClassMembersDescriptor(prototype);

    const runSagaFuncArr: any[] = [];
    membersDescriptor.forEach(i => {
      const {name, descriptor} = i;
      if (!descriptor || typeof descriptor.value !== 'function') {
        return;
      }
      const func = this[name];
      // 先把标记取出来，因为在bind之后，标记会丢失
      const {$bind, $apiCallWith, $runSaga} = func;

      if ($bind) {
        this[name] = this[name].bind(this);
      }

      if ($apiCallWith) {
        const {defaultParams} = $apiCallWith;
        if (defaultParams !== void 0) {
          this[name] = function (params: any) {
            params = Object.assign({}, defaultParams, params);
            return func(params);
          };
        }

        this.runCallWithSaga(name, $apiCallWith);
      }

      if ($runSaga) {
        runSagaFuncArr.push(this[name]);
      }
    });

    // 到最后再一次性执行runSaga，避免某些方法未绑定this
    if (runSagaFuncArr.length > 0) {
      this.runSaga(function* () {
        yield all(runSagaFuncArr.map(i => fork(i)));
      });
    }
  }

  private runCallWithSaga (funcName: string, apiCallWithConfig: ApiCallWithConfig) {
    let func = this[funcName];

    const {apiCallTypeName, bindState} = apiCallWithConfig;

    // try get instance type first
    let apiCallType: ApiType = this[apiCallTypeName] || this.constructor[apiCallTypeName];

    invariant(
      isApiType(apiCallType),
      'invalid apiCallType: %s',
      JSON.stringify(apiCallType)
    );

    invariant(
      !bindState || bindState in this,
      'cannot find state key "%s" in store or state hasn\'t initialized',
      bindState
    );

    const that = this;
    this.runSaga(function* () {
      yield takeLatest(apiCallType.REQUEST, function* ({payload}: Action) {
        const self: BaseStore = yield that;
        const hasBindState = bindState && (bindState in self) && self.bindState;

        if (hasBindState) {
          yield runInAction(() => {
            self[bindState].loading = true;
            self[bindState].error = null;
          });
        }

        try {
          let data = yield call(func, payload);

          if (self.apiResponseTransformer) {
            data = yield call(self.apiResponseTransformer, data);
          }

          if (hasBindState) {
            yield runInAction(() => {
              self[bindState].loading = false;
              self[bindState].data = data;
            });
          }

          yield put({type: apiCallType.SUCCESS, payload: data});
        } catch (err) {
          if (hasBindState) {
            yield runInAction(() => {
              self[bindState].loading = false;
              self[bindState].error = err;
            });
          }

          yield put({type: apiCallType.FAILURE, payload: err});
          console.error(err);
        }
      });
    });
  }
}
