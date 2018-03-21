import {
  BaseStore, api, bind, getAsyncType, getAsyncState, AsyncState, typeDef, asyncTypeDef, runSaga, AsyncType
} from '../../index';
import { delay } from 'redux-saga';
import { put, take, fork, call, race, all } from 'redux-saga/effects';
import { observable, toJS } from 'mobx';

describe('BaseStore', () => {

  beforeEach(() => {
    // console.log = jest.fn(() => void 0);
    console.error = jest.fn(() => void 0);
    console.warn = jest.fn(() => void 0);
    console.info  = jest.fn(() => void 0);

    BaseStore.reset();
  });

  test('BaseStore初始化', () => {
    const store = new BaseStore();
    expect(BaseStore.initialized).toBe(true);
    expect(store.sagaRunner).toBe(BaseStore.sagaRunner);
  });

  test('方法绑定上下文', () => {
    class BindTest extends BaseStore {
      @asyncTypeDef API_TYPE: AsyncType;

      @bind
      func () {
        return this;
      }

      @api('API_TYPE')
      apiFunc () {
        return Promise.resolve(this);
      }

      @bind
      *generatorFunc () {
        yield this;
      }
    }

    const bindTest = new BindTest();
    const func = bindTest.func;
    const apiFunc = bindTest.apiFunc;

    expect(func()).toEqual(bindTest);

    const generatorFunc = bindTest.generatorFunc;
    const gen = generatorFunc();

    expect(gen.next().value).toEqual(bindTest);

    return apiFunc().then(res => expect(res).toEqual(bindTest));
  });

  test('asyncType和typeDef自动赋值', () => {
    class TypeTest extends BaseStore {
      @typeDef TYPE_B: string;
      @asyncTypeDef TYPE_API_B: AsyncType;
    }

    const typeTest = new TypeTest({key: 'test'});

    expect(typeTest.TYPE_B).toBe('TypeTest<test>/TYPE_B');
    expect(typeTest.TYPE_API_B).toEqual({
      REQUEST: 'TypeTest<test>/TYPE_API_B/REQUEST',
      SUCCESS: 'TypeTest<test>/TYPE_API_B/SUCCESS',
      FAILURE: 'TypeTest<test>/TYPE_API_B/FAILURE'
    });

    const randomKeyTypeTest = new TypeTest();

    const key = randomKeyTypeTest.key;
    expect(key).toMatch(/^[a-zA-Z]{6}$/);
    expect(randomKeyTypeTest.TYPE_B).toBe(`TypeTest<${key}>/TYPE_B`);
    expect(randomKeyTypeTest.TYPE_API_B).toEqual({
      REQUEST: `TypeTest<${key}>/TYPE_API_B/REQUEST`,
      SUCCESS: `TypeTest<${key}>/TYPE_API_B/SUCCESS`,
      FAILURE: `TypeTest<${key}>/TYPE_API_B/FAILURE`
    });
  });

  test('api默认参数', () => {
    class ApiTest extends BaseStore {
      @asyncTypeDef API_TEST: AsyncType;

      @api('API_TEST', {defaultParams: {page: 0, size: 999}})
      apiTest (params?: any) {
        return Promise.resolve(params);
      }
    }

    const store = new ApiTest();

    return Promise.all([
      store.apiTest().then(data => {
        expect(data).toEqual({page: 0, size: 999});
      }),
      store.apiTest({page: 1}).then(data => {
        expect(data).toEqual({page: 1, size: 999});
      }),
      store.apiTest({other: true}).then(data => {
        expect(data).toEqual({page: 0, size: 999, other: true});
      }),
    ]);
  });

  test('api绑定接收字段', () => {
    const initialData = 'initial';
    const data = 'received data';

    class BindKeyTest extends BaseStore {
      @asyncTypeDef NOT_A_API: AsyncType;
      @asyncTypeDef API: AsyncType;

      @observable data = getAsyncState<string>(initialData);
      @observable apiData = getAsyncState();

      @api('NOT_A_API', {bindState: 'data', axiosApi: false})
      getData () {
        return new Promise((resolve) => {
          setTimeout(
            () => {
              resolve(data);
            },
            10
          );
        });
      }

      @api('API', {bindState: 'apiData'})
      getApiData () {
        return new Promise((resolve) => {
          setTimeout(
            () => {
              resolve({
                data: 'apiData'
              });
            },
            10
          );
        });
      }
    }

    const store = new BindKeyTest();

    expect(store.data).toEqual({
      error: null,
      data: initialData,
      loading: false
    });

    return Promise.all([
      store.runSaga(function* () {
        yield take(store.NOT_A_API.REQUEST);
        expect(store.data.loading).toBe(true);

        yield take(store.NOT_A_API.SUCCESS);
        expect(store.data.data).toBe(data);
        expect(store.data.loading).toBe(false);

      }).done,
      store.runSaga(function* () {
        yield take(store.API.REQUEST);
        expect(store.apiData.loading).toBe(true);

        yield take(store.API.SUCCESS);
        expect(store.apiData.data).toBe('apiData');
        expect(store.apiData.loading).toBe(false);
      }),
      store.getData(),
      store.getApiData()
    ]);
  });

  test('asyncType自动监听', () => {
    class ApiCallWithTest extends BaseStore {
      @asyncTypeDef API_WILL_SUCCESS: AsyncType;
      @asyncTypeDef API_WILL_FAILURE: AsyncType;

      @api('API_WILL_SUCCESS', {axiosApi: false})
      successApi (params: any) {
        return Promise.resolve(params);
      }

      @api('API_WILL_FAILURE', {axiosApi: false})
      failureApi (params: any) {
        return Promise.reject('failure');
      }
    }

    const apiCallWithTest = new ApiCallWithTest();

    return apiCallWithTest.runSaga(function * () {
      const params = {id: 123};

      const {timeout, res} = yield race({
        timeout: call(delay, 1000),
        res: all([
          take(apiCallWithTest.API_WILL_SUCCESS.SUCCESS),
          take(apiCallWithTest.API_WILL_FAILURE.FAILURE),
          fork(apiCallWithTest.successApi, params),
          fork(apiCallWithTest.failureApi, params)
        ])
      });

      expect(timeout).toBe(undefined);
      expect(res[0].payload).toEqual(params);
      expect(res[1].payload).toBe('failure');

    }).done;
  });

  test(
    'runSaga装饰器',
    () => {
      class RunSagaTest extends BaseStore {
        @typeDef TAKE: string;
        @typeDef RESOLVE: string;

        @runSaga
        *sagaMain () {
          yield take(this.TAKE);
          yield put({type: this.RESOLVE});
        }
      }

      const store = new RunSagaTest();

      return store.runSaga(function* () {
        yield put({type: store.TAKE});
        yield take(store.RESOLVE);
      }).done;
    },
    100
  );

  test(
    '继承',
    () => {
      class Parent extends BaseStore {
        @typeDef PARENT_TYPE: string;
        @typeDef CALLED_NOTICE: string;

        @runSaga
        *sagaMain () {
          yield call(this.func);
        }

        @bind
        *func () {
          const self: this = yield this;
          yield call(delay, 10);
          yield put({type: self.CALLED_NOTICE});
        }
      }

      class Child extends Parent {
      }

      const child = new Child();
      return child.runSaga(function* () {
        yield take(child.CALLED_NOTICE);
      }).done;
    },
    100
  );

  test('可开关的bindState', () => {
    class BindTest extends BaseStore {
      @asyncTypeDef API_TYPE: AsyncType;
      @observable apiRes = getAsyncState();

      @api('API_TYPE', {bindState: 'apiRes', axiosApi: false})
      apiFunc () {
        return new Promise(resolve => {
          setTimeout(
            () => {
              resolve('res');
            },
            10
          );
        });
      }
    }

    const bindTest = new BindTest();
    const noBindTest = new BindTest({bindState: false});

    const bindApiRes = toJS(bindTest.apiRes);
    const noBindApiRes = toJS(noBindTest.apiRes);

    return bindTest.runSaga(function* () {
      yield all(
        [
          take(bindTest.API_TYPE.SUCCESS),
          take(noBindTest.API_TYPE.SUCCESS),
          fork(bindTest.apiFunc),
          fork(noBindTest.apiFunc)
        ]
      );
      expect(bindApiRes).not.toEqual(toJS(bindTest.apiRes));
      expect(noBindApiRes).toEqual(toJS(noBindTest.apiRes));
    }).done;
  });
});
