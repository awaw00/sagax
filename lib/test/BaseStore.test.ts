import { BaseStore, api, bind, getApiCallType, ApiResState, typeDef, apiTypeDef, runSaga, ApiType } from '../../index';
import { delay } from 'redux-saga';
import { put, take, call, race, all } from 'redux-saga/effects';
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
      @apiTypeDef static readonly API_TYPE: ApiType;

      @bind
      func () {
        return this;
      }

      @api('API_TYPE')
      funcApiCallWith () {
        return this;
      }

      @bind
      *generatorFunc () {
        yield this;
      }
    }

    const bindTest = new BindTest();
    const func = bindTest.func;
    const funcApiCallWith = bindTest.funcApiCallWith;

    expect(func()).toEqual(bindTest);
    expect(funcApiCallWith()).toEqual(bindTest);

    const generatorFunc = bindTest.generatorFunc;
    const gen = generatorFunc();

    expect(gen.next().value).toEqual(bindTest);
  });

  test('apiType和typeDef自动赋值', () => {
    class TypeTest extends BaseStore {
      @typeDef static readonly TYPE_A: string;
      @apiTypeDef static readonly TYPE_API_A: ApiType;
      @typeDef readonly TYPE_B: string;
      @apiTypeDef readonly TYPE_API_B: ApiType;
    }

    expect(TypeTest.TYPE_A).toBe('TypeTest/TYPE_A');
    expect(TypeTest.TYPE_API_A).toEqual({
      PRE_REQUEST: 'TypeTest/TYPE_API_A/PRE_REQUEST',
      REQUEST: 'TypeTest/TYPE_API_A/REQUEST',
      SUCCESS: 'TypeTest/TYPE_API_A/SUCCESS',
      FAILURE: 'TypeTest/TYPE_API_A/FAILURE'
    });

    const typeTest = new TypeTest({key: 'test'});

    expect(typeTest.TYPE_B).toBe('TypeTest<test>/TYPE_B');
    expect(typeTest.TYPE_API_B).toEqual({
      PRE_REQUEST: 'TypeTest<test>/TYPE_API_B/PRE_REQUEST',
      REQUEST: 'TypeTest<test>/TYPE_API_B/REQUEST',
      SUCCESS: 'TypeTest<test>/TYPE_API_B/SUCCESS',
      FAILURE: 'TypeTest<test>/TYPE_API_B/FAILURE'
    });

    const randomKeyTypeTest = new TypeTest();

    const key = randomKeyTypeTest.key;
    expect(key).toMatch(/^[a-zA-Z]{6}$/);
    expect(randomKeyTypeTest.TYPE_B).toBe(`TypeTest<${key}>/TYPE_B`);
    expect(randomKeyTypeTest.TYPE_API_B).toEqual({
      PRE_REQUEST: `TypeTest<${key}>/TYPE_API_B/PRE_REQUEST`,
      REQUEST: `TypeTest<${key}>/TYPE_API_B/REQUEST`,
      SUCCESS: `TypeTest<${key}>/TYPE_API_B/SUCCESS`,
      FAILURE: `TypeTest<${key}>/TYPE_API_B/FAILURE`
    });
  });

  test('apiCallWith默认参数', () => {
    class ApiCallWithTest extends BaseStore {
      @apiTypeDef API_TEST: ApiType;

      @api('API_TEST', {defaultParams: {page: 0, size: 999}})
      apiTest (params?: any) {
        return params;
      }
    }

    const store = new ApiCallWithTest();

    expect(store.apiTest()).toEqual({page: 0, size: 999});
    expect(store.apiTest({page: 1})).toEqual({page: 1, size: 999});
    expect(store.apiTest({other: true})).toEqual({page: 0, size: 999, other: true});
  });

  test('apiCallWith绑定接收字段', () => {
    const initialData = 'initial';
    const data = 'received data';

    class BindKeyTest extends BaseStore {
      @apiTypeDef API_TEST: ApiType;

      @observable data = this.getApiResState<string>(initialData);

      @api('API_TEST', {bindState: 'data'})
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
    }

    const store = new BindKeyTest();

    expect(store.data).toEqual({
      error: null,
      data: initialData,
      loading: false
    });

    return store.runSaga(function* () {
      yield put({type: store.API_TEST.REQUEST});
      expect(store.data.loading).toBe(true);

      yield take(store.API_TEST.SUCCESS);
      expect(store.data.data).toBe(data);
      expect(store.data.loading).toBe(false);

    }).done;
  });

  test('apiType自动监听', () => {
    class ApiCallWithTest extends BaseStore {
      @apiTypeDef static readonly API_WILL_SUCCESS: ApiType;
      @apiTypeDef static readonly API_WILL_FAILURE: ApiType;

      @apiTypeDef static readonly API_PRIORITY_TEST: ApiType;
      @apiTypeDef readonly API_PRIORITY_TEST: ApiType;

      @api('API_WILL_SUCCESS')
      successApi (params: any) {
        return Promise.resolve(params);
      }

      @api('API_WILL_FAILURE')
      failureApi (params: any) {
        return Promise.reject('failure');
      }

      @api('API_PRIORITY_TEST')
      priorityTestApi (params: any) {
        return Promise.resolve(params);
      }
    }

    const apiCallWithTest = new ApiCallWithTest();

    return apiCallWithTest.runSaga(function * () {
      const params = {id: 123};

      const {timeout, res} = yield race({
        timeout: call(delay, 1000),
        res: all([
          take(ApiCallWithTest.API_WILL_SUCCESS.SUCCESS),
          take(ApiCallWithTest.API_WILL_FAILURE.FAILURE),
          take(apiCallWithTest.API_PRIORITY_TEST.SUCCESS),
          put({type: ApiCallWithTest.API_WILL_SUCCESS.REQUEST, payload: params}),
          put({type: ApiCallWithTest.API_WILL_FAILURE.REQUEST, payload: params}),
          put({type: apiCallWithTest.API_PRIORITY_TEST.REQUEST, payload: params})
        ])
      });

      expect(timeout).toBe(undefined);
      expect(res[0].payload).toEqual(params);
      expect(res[1].payload).toBe('failure');
      expect(res[2].payload).toEqual(params);

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
      @apiTypeDef API_TYPE: ApiType;
      @observable apiRes = this.getApiResState();

      @api('API_TYPE', {bindState: 'apiRes'})
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
      yield put({type: bindTest.API_TYPE.REQUEST});
      yield put({type: noBindTest.API_TYPE.REQUEST});

      yield all(
        [
          take(bindTest.API_TYPE.SUCCESS),
          take(noBindTest.API_TYPE.SUCCESS)
        ]
      );
      expect(bindApiRes).not.toEqual(toJS(bindTest.apiRes));
      expect(noBindApiRes).toEqual(toJS(noBindTest.apiRes));
    }).done;
  });
});
