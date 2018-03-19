import { Action } from './types';
import { runSaga, Task, END, RunSagaOptions } from 'redux-saga';
import { SagaOptions } from './types';

type Callback<T> = (cb: (T | END)) => void;

class SagaRunner<T extends Action = Action> {
  
  private subscribes: Callback<T>[] = [];
  private stores: {[name: string]: any} = {};

  constructor (private sagaOptions: SagaOptions = {}) {
    this.subscribe = this.subscribe.bind(this);
    this.dispatch = this.dispatch.bind(this);
    this.runSaga = this.runSaga.bind(this);
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

  runSaga (saga: (...args: any[]) => Iterator<any>): Task {
    const runSagaOptions: RunSagaOptions<T, any> = {
      subscribe: this.subscribe,
      dispatch: this.dispatch,
      getState: () => this.stores
    };

    if (this.sagaOptions.monitor) {
      runSagaOptions.sagaMonitor = this.sagaOptions.monitor;
    }
    return runSaga<T, any>(
      runSagaOptions,
      saga
    );
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

  private subscribe (callback: Callback<T>) {
    this.subscribes.push(callback);
    return () => {
      const index = this.subscribes.indexOf(callback);
      if (index >= 0) {
        this.subscribes.splice(index, 1);
      }
    };
  }
}

export default SagaRunner;
