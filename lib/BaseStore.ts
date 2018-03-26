import invariant from './invariant';
import axios, { AxiosInstance, AxiosRequestConfig, AxiosResponse } from 'axios';
import { Action, AsyncType, AsyncState, BaseStoreConfig, BaseStoreStaticConfig, ApiConfig } from './types';
import { Task, SagaIterator } from 'redux-saga';
import { all, fork, put, takeLatest, call } from 'redux-saga/effects';
import { isAsyncType, runInAction, getRandomText, getClassMembersDescriptor } from './utils';
import SagaRunner, { Saga } from './SagaRunner';

export default class BaseStore {
  /**
   * 静态对象是否已进行初始化
   * @type {boolean}
   */
  static initialized: boolean = false;
  /**
   * 默认的sagaRunner对象，在init静态方法中创建
   */
  static sagaRunner: SagaRunner;
  /**
   * 默认的axios对象，在init静态方法中创建
   */
  static http: AxiosInstance;

  /**
   * 见BaseStoreConfig.key
   */
  key: string;
  /**
   * 同BaseStore.http
   */
  http: AxiosInstance;
  /**
   * baseStoreConfig.sagaRunner 或 BaseStore.sagaRunner
   */
  sagaRunner: SagaRunner;
  /**
   * 见BaseStoreConfig.bindState
   */
  private bindState: boolean;

  /**
   * 见BaseStoreConfig.apiResToState
   */
  private apiResToState: (apiRes?: any) => any;

  /**
   * 初始化静态字段
   * @param {BaseStoreStaticConfig} baseStoreConfig
   */
  static init (baseStoreConfig: BaseStoreStaticConfig = {}) {
    BaseStore.http = axios.create(baseStoreConfig.axiosConfig || {});
    BaseStore.sagaRunner = new SagaRunner(baseStoreConfig.sagaOptions);
    BaseStore.initialized = true;
  }

  /**
   * 重置静态字段
   */
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

  /**
   * 派发一个action
   * @param {Action} action
   * @returns {Action}
   */
  dispatch (action: Action) {
    return this.sagaRunner.dispatch(action);
  }

  /**
   * 执行Saga方法
   * @param {Saga} saga 要执行的saga方法
   * @param args        saga方法的参数列表
   * @returns {Task}    sagaTask
   */
  runSaga (saga: Saga, ...args: any[]): Task {
    return this.sagaRunner.runSaga.apply(this, [saga, ...args]);
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

    if (runSagaFuncArr.length > 0) {
      // 使用setTimeout避免子类的构造函数没执行完就开始执行saga入口方法
      setTimeout(() => {
        this.runSaga(function* () {
          yield all(runSagaFuncArr.map(i => fork(i)));
        });
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
