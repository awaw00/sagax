import { Action } from './types';
import { runSaga, Task, END, RunSagaOptions, SagaMiddleware, SagaIterator } from 'redux-saga';
import { SagaOptions } from './types';

type Callback<T> = (cb: (T | END)) => void;
export type Saga = (...args: any[]) => Iterator<any>;

class SagaRunner<T extends Action = Action> {
  
  private subscribes: Callback<T>[] = [];
  private stores: {[name: string]: any} = {};
  private sagaMiddleware: SagaMiddleware<any>;
  private bindRunSaga: (saga: Saga, ...args: any[]) => Task;

  constructor (private sagaOptions: SagaOptions = {}) {
    this.subscribe = this.subscribe.bind(this);
    this.dispatch = this.dispatch.bind(this);

    const runSagaOptions: RunSagaOptions<T, any> = {
      subscribe: this.subscribe,
      dispatch: this.dispatch,
      getState: this.getState
    };

    if (this.sagaOptions.monitor) {
      runSagaOptions.sagaMonitor = this.sagaOptions.monitor;
    }
    this.bindRunSaga = this.rawRunSaga.bind(this, runSagaOptions);
    this.runSaga = this.runSaga.bind(this);
  }

  /**
   * 派发一个action
   * @param {T} action
   * @returns {T}
   */
  dispatch (action: T) {
    const arr = this.subscribes.slice();
    for (let i = 0, len =  arr.length; i < len; i++) {
      arr[i](action);
    }

    if (process.env.NODE_ENV === 'development' || process.env.SAGA_LOG) {
      console.groupCollapsed(`Action: ${action.type}`);
      console.log(action.payload);
      console.groupEnd();
    }

    return action;
  }

  /**
   * 非SagaMiddleware连接模式下，select副作用会使用这个方法
   * @returns {{[p: string]: any}}
   */
  getState () {
    return this.stores;
  }

  /**
   * 执行saga方法
   * @param {Saga} saga
   * @param args
   * @returns {any}
   */
  runSaga (saga: Saga, ...args: any[]) {
    return this.bindRunSaga.apply(this, [saga, ...args]);
  }

  /**
   * 注册store
   * @param {string} key  store的key
   * @param store         store对象
   */
  registerStore (key: string, store: any) {
    if (this.stores[key]) {
      throw new Error('已存在key: ' + key);
    }
    this.stores[key] = store;
  }

  /**
   * 根据key注销store
   * @param {string} key
   */
  unRegisterStore (key: string) {
    if (this.stores[key]) {
      delete this.stores[key];
    }
  }

  /**
   * 将sagaRunner与SagaMiddleware连接
   * 注意：连接后无法通过select副作用获取store
   * @param {SagaMiddleware<any>} middleware
   */
  useSagaMiddleware (middleware: SagaMiddleware<any>) {
    this.sagaMiddleware = middleware;
  }

  private subscribe (callback: Callback<T>) {
    this.subscribes.push(callback);
    return () => {
      const index = this.subscribes.indexOf(callback);
      if (index >= 0) {
        this.subscribes.splice(index, 1);
      }
    };
  }

  private rawRunSaga (options: RunSagaOptions<T, any>, saga: () => Iterator<any>, ...args: any[]): Task {
    if (this.sagaMiddleware) {
      return this.sagaMiddleware.run.apply(null, [saga, ...args]);
    }

    return runSaga.apply(this, [options, saga, ...args]);
  }
}

export default SagaRunner;
