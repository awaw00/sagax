import SagaRunner from '../SagaRunner';
import { createStore, applyMiddleware } from 'redux';
import createSagaMiddleware from 'redux-saga';
import { put, take, call } from 'redux-saga/effects';

describe('SagaRunner', () => {
  function reducer (state: string = '', action: any) {
    return state;
  }

  test(
    '连接redux store',
    () => {
      const sagaMiddleware = createSagaMiddleware();

      const sagaRunner = new SagaRunner();
      sagaRunner.useSagaMiddleware(sagaMiddleware);

      const store = createStore(reducer, applyMiddleware(sagaMiddleware));

      const runnerTask = sagaRunner.runSaga(function* () {
        yield take('ACTION1');
        yield put({type: 'ACTION2'});
      });

      const middlewareTask = sagaMiddleware.run(function* () {
        yield put({type: 'ACTION1'});
        yield take('ACTION2');
      });

      return Promise.all([runnerTask.done, middlewareTask.done]);
    },
    100
  );
});
