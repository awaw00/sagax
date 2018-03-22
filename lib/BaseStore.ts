import invariant from './invariant';
import axios, { AxiosInstance, AxiosRequestConfig, AxiosResponse } from 'axios';
import { Action, AsyncType, AsyncState, BaseStoreConfig, BaseStoreStaticConfig, ApiConfig } from './types';
import { Task, SagaIterator } from 'redux-saga';
import { all, fork, put, takeLatest, call } from 'redux-saga/effects';
import { isAsyncType, runInAction, getRandomText, getClassMembersDescriptor } from './utils';
import SagaRunner from './SagaRunner';

export default class BaseStore {
  static initialized: boolean = false;
  static sagaRunner: SagaRunner;
  static http: AxiosInstance;

  key: string;
  http: AxiosInstance;
  sagaRunner: SagaRunner;
  apiResToState: (apiRes?: any) => any;
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

    if (baseStoreConfig.apiResToState) {
      this.apiResToState = baseStoreConfig.apiResToState;
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

  runSaga (saga: () => Iterator<any>): Task {
    return this.sagaRunner.runSaga(saga);
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
      const {$bind, $apiConfig, $runSaga} = func;

      if ($bind) {
        this[name] = this[name].bind(this);
      }

      if ($apiConfig) {
        const {defaultParams} = $apiConfig;
        if (defaultParams !== void 0) {
          this[name] = function (params: any) {
            params = Object.assign({}, defaultParams, params);
            return func(params);
          };
        }

        this.runCallWithSaga(name, $apiConfig);
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

  private runCallWithSaga (funcName: string, apiConfig: ApiConfig) {
    let func = this[funcName];

    const {asyncTypeName, bindState, axiosApi, defaultParams} = apiConfig;

    let asyncType: AsyncType = this[asyncTypeName];

    invariant(
      isAsyncType(asyncType),
      'invalid asyncType: %s',
      JSON.stringify(asyncType)
    );

    invariant(
      !bindState || bindState in this,
      'cannot find state key "%s" in store or state hasn\'t initialized',
      bindState
    );

    const that = this;

    const hasBindState = bindState && (bindState in this) && this.bindState;

    this[funcName] = (params: any) => {
      params = Object.assign({}, defaultParams, params);
      return this.runSaga(function* () {
        if (hasBindState) {
          yield runInAction(() => {
            that[bindState].loading = true;
            that[bindState].error = null;
          });
        }
        yield put({type: asyncType.START, payload: params});

        let data: any = null;
        try {
          data = yield call(func, params);

          if (that.apiResToState && axiosApi) {
            (<AxiosResponse> data).data = yield call(that.apiResToState, data.data);
          }

          if (hasBindState) {
            yield runInAction(() => {
              that[bindState].loading = false;
              if (axiosApi) {
                that[bindState].data = (<AxiosResponse> data).data;
              } else {
                that[bindState].data = data;
              }
            });
          }

          yield put({type: asyncType.END, payload: data});
        } catch (err) {
          if (hasBindState) {
            yield runInAction(() => {
              that[bindState].loading = false;
              that[bindState].error = err;
            });
          }

          yield put({type: asyncType.ERROR, payload: err});
          console.error(err);
        }

        return data;
      }).done;
    };
  }
}
