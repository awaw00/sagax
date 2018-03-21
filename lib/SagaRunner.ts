import { Action } from './types';
import { runSaga, Task, END, RunSagaOptions, SagaMiddleware, SagaIterator } from 'redux-saga';
import { SagaOptions } from './types';

type Callback<T> = (cb: (T | END)) => void;
export type Saga = () => Iterator<any>;

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
  }

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

  getState () {
    return this.stores;
  }

  runSaga (saga: Saga, ...args: any[]) {
    return this.bindRunSaga.apply(this, [saga, ...args]);
  }

  registerStore (key: string, store: any) {
    if (this.stores[key]) {
      throw new Error('已存在key: ' + key);
    }
    this.stores[key] = store;
  }

  unRegisterStore (key: string) {
    if (this.stores[key]) {
      delete this.stores[key];
    }
  }

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

  private rawRunSaga (options: RunSagaOptions<T, any>, saga: () => Iterator<any>): Task {
    if (this.sagaMiddleware) {
      return this.sagaMiddleware.run(saga);
    }

    return runSaga<T, any>(
      options,
      saga
    );
  }
}

export default SagaRunner;
