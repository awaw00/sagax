SagaX
----

State management with mobx and redux-saga.

Try sagax at [SagaX playground](https://codesandbox.io/s/307rk6r6wq).

# Table of Contents

- [Setup](#setup)
- [Getting Started Guide](#getting-started-guide)
  - [Concepts](#concepts)
  - [Basic Usage](#basic-usage)
- [Document](#document)
  - [Core](#core)
    - [BaseStore](#basestore)
    - [SagaRunner](#sagarunner)
  - [Decorators](#decorators)
    - [api](#api)
    - [bind](#bind)
    - [typeDef](#typedef)
    - [asyncTypeDef](#asynctypedef)
    - [runSaga](#runsaga)
  - [Utils](#utils)
    - [getAsyncState](#getasyncstate)
  - [Interfaces & types](#interfaces-&-types)
    - [BaseStoreStaticConfig](#basestorestaticconfig)
    - [BaseStoreCofnig](#basestoreconfig)
    - [ActionType](#actiontype)
    - [AsyncState](#asyncstate)
    - [AsyncType](#asynctype)
    - [ApiConfig](#apiconfig)
- [Best Practice](#best-practice)
  - [项目结构](#项目结构)
  - [DO NOT: 给ActionType加命名空间](#do-not-给actiontype加命名空间)
  - [DO NOT: 通过Action去执行方法](#do-not-通过action去执行方法)

# Setup

`yarn install sagax mobx@^3.6.1 redux-saga@^0.16 axios@^0.18.0`

mobx、redux-saga、axios是sagax中的peerDependencies，请注意安装版本。

*redux-saga的1.0.0-beta版本有一些不支持sagax的变动，在sagax兼容之前请使用0.16版本。*

# Getting Started Guide

## Concepts

将应用状态划分到三类Store中：

- ServiceStore 服务Store
- LogicStore 逻辑Store
- UIStore 界面Store
- UtilStore 工具Store(Optional)

其中，ServiceStore用于定义接口调用方法、接口相关的ActionType和接口调用状态。

LogicStore用于管理应用的逻辑过程和中间状态，比如，控制应用加载时的初始化流程（如调用初始化数据接口等）、控制页面的渲染时机。

UIStore用于管理应用界面渲染所涉及的状态数据、响应用户界面事件。

当然，上面的划分方式并不是强制性的，在某些场景下（逻辑并不复杂的场景）把LogicStore与UIStore合二为一也许会更加合适。

**确保ServiceStore的独立性对中等及以上规模项目的可维护性和可扩展性来说，是非常重要的。**

## Basic Usage

定义服务Store：

```typescript
// /stores/serviceStores.ts
import { BaseStore, apiTypeDef, AsyncType, api, getAsyncState } from 'sagax';
import { observable } from 'mobx';

export class UserService extends BaseStore {
  @apiTypeDef GET_USER_INFO: AsyncType;
  @observable userInfo = getAsyncState();
  
  @api('GET_USER_INFO', {bindState: 'userInfo'})
  getUserInfo () {
    return this.http.get('/userInfo');
  }
}

export class OrderService extends BaseStore {
  @apiTypeDef GET_ORDER_LIST_OF_USER: AsyncType;
  @observable orderListOfUser = getAsyncState();
  
  @api('GET_ORDER_LIST_OF_USER', {bindState: 'orderListOfUser'})
  getOrderListOfUser (params: any) {
    return this.http.get('/order/listOfUser', {params});
  }
}
```

定义UIStore（这里因为逻辑比较简单，把逻辑也写到UIStore了）：

```typescript
// /stores/uiStores.ts
import { BaseStore, bind, runSaga, apiTypeDef, types, AsyncType, api } from 'sagax';
import { put, call, take, takeLatest, fork } from 'redux-saga/effects';
import { observable, computed } from 'mobx';

import { UserService, OrderService } from './serviceStores';

interface OrderUIConfig extends types.BaseStoreConfig {
  userService: UserService;
}

export class OrderUI extends BaseStore {
  userService: UserService;
  orderService: OrderService;
  
  @computed
  get loading () {
    return this.userService.userInfo.loading || this.orderService.orderListOfUser.loading;
  }
  
  @computed
  get orderList () {
    return this.orderService.orderListOfUser.data;
  }
  
  constructor (config: OrderUIConfig) {
    super(config);
    
    // 这里为什么从参数中获取userStore而不是重新new一个？
    // 因为用户信息这类数据，在大多数应用中都是唯一的（一个系统不会有两个登录用户）
    // 保持userStore的唯一性，可以避免无效和重复的接口调用、内存占用
    this.userService = config.userService;
    this.orderService = new OrderService();
  }
  
  @runSaga
  *sagaMain () {
    yield fork(this.initOrderList);
  }
  
  @bind
  *initOrderList () {
    const self: this = yield this;
    const {userInfo, GET_USER_INFO} = self.userService;
    const {GET_ORDER_LIST_OF_USER} = self.userService;
    
    if (userInfo.loading) {
      // 先检查用户信息是否在加载中，如果是，则等待加载成功
      yield take(GET_USER_INFO.END);
    } else if (!self.userService.userInfo.data) {
      // 再检查用户信息是否已存在，若不存在，则发起获取用户信息的请求，并等待请求成功
      yield call(self.userService.getUserInfo);
    }
    // 以用户id为参数，发起获取用户订单列表的请求
    yield put({type: GET_ORDER_LIST_OF_USER.START, payload: {userId: userInfo.id}});
  }
}
```

写一个React组件（为了简单没有使用mobx-react的Provider和inject等工具）：
```typescript
// /App.tsx
import React from 'react';
import { render } from 'react-dom';
import { observer } from 'mobx-react';

import { UserService } from 'stores/serviceStores';
import { OrderUI } from 'stores/uiStores';

import OrderList from 'components/OrderList'; // 实现忽略

const userUserService = new UserService();
const orderUI = new OrderUI({userService});

@observer
class App extends React.Component {
  render () {
    return (
      <div>
        {orderUIStore.loading
          ? 'loading...'
          : (
            <OrderList dataSource={orderUI.orderList}/>
          )
        }
      </div>
    );
  }
}

render(<App/>, document.getElementById('root'));

```

更多详细用法可查阅[测试代码](https://github.com/awaw00/sagax/tree/master/lib/test)

# Document

- [Core](#core)
  - [BaseStore](#basestore)
  - [SagaRunner](#sagarunner)
- [Decorators](#decorators)
  - [api](#api)
  - [bind](#bind)
  - [typeDef](#typedef)
  - [asyncTypeDef](#asynctypedef)
  - [runSaga](#runsaga)
- [Utils](#utils)
  - [getAsyncState](#getasyncstate)
- [Interfaces & types](#interfaces-&-types)
  - [BaseStoreStaticConfig](#basestorestaticconfig)
  - [BaseStoreCofnig](#basestoreconfig)
  - [ActionType](#actiontype)
  - [AsyncState](#asyncstate)
  - [AsyncType](#asynctype)
  - [ApiConfig](#apiconfig)
 
## Core

### BaseStore

```typescript
class BaseStore {
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
   * 初始化静态字段
   * @param {BaseStoreStaticConfig} baseStoreConfig
   */
  static init: (baseStoreConfig: BaseStoreStaticConfig = {}) => void;

  /**
   * 重置静态字段
   */
  static reset: () => void;

  constructor (baseStoreConfig: BaseStoreConfig = {});

  /**
   * 派发一个action
   * @param {Action} action
   * @returns {Action}
   */
  dispatch: (action: Action) => Action;

  /**
   * 执行Saga方法
   * @param {Saga} saga 要执行的saga方法
   * @param args        saga方法的参数列表
   * @returns {Task}    sagaTask
   */
  runSaga: (saga: Saga, ...args: any[]) => Task;

```

### SagaRunner

提供一个Saga运行环境。

**不同的SagaRunner实例之间运行的saga互相隔离，无法通信。**在初始化BaseStore实例的时候，可以传入一个新的SagaRunner实例，store中的saga便会运行在一个隔离的“沙箱”中。

```typescript

class SagaRunner<T extends Action = Action> {
  constructor (private sagaOptions: SagaOptions = {});

  /**
   * 派发一个action
   * @param {T} action
   * @returns {T}
   */
  dispatch: (action: T) => action;

  /**
   * 非SagaMiddleware连接模式下，select副作用会使用这个方法
   * @returns {{[p: string]: any}}
   */
  getState: () => {[p: string]: any};

  /**
   * 执行saga方法
   * @param {Saga}    saga方法
   * @param args      saga参数列表
   * @returns {Task}
   */
  runSaga: (saga: Saga, ...args: any[]) => Task;

  /**
   * 注册store
   * @param {string} key  store的key
   * @param store         store对象
   */
  registerStore: (key: string, store: any) => void;
  
  /**
   * 根据key注销store
   * @param {string} key
   */
  unRegisterStore: (key: string) => void;

  /**
   * 将sagaRunner与SagaMiddleware连接
   * 注意：连接后无法通过select副作用获取store
   * 注意：请跟在createSagaMiddleware之后使用此方法（晚了容易丢失action或造成action派发失败的问题）
   * @param {SagaMiddleware<any>} middleware
   */
  useSagaMiddleware: (middleware: SagaMiddleware<any>) => void;
}
```

## Decorators

### api

`api (asyncTypeName: string, config: ApiConfig = {}): MethodDecorator`

接口方法装饰器工厂方法。

当调用使用api装饰器装饰的方法时，会在调用接口前派发一个`this[asyncTypeName].START`的action。

调用成功后，派发一个`this[asyncTypeName].END`的action，并在payload中带上调用结果。

当调用失败时，会派发一个`this[asyncTypeName].ERROR`的action，并在payload中带上错误对象。

### bind

`bind: MethodDecorator`

绑定方法执行上下文为this的方法装饰器

### typeDef

`typeDef: PropertyDecorator`

ActionType定义属性装饰器。

使用该装饰器的字段会被自动赋值为`${ClassName}<${key}>/${ActionType}`。

### asyncTypeDef

`asyncTypeDef: PropertyDecorator`

AsyncType定义属性装饰器。

AsyncType是由三个ActionType组成的对象： START、END、ERROR，分别代表“接口请求开始”、“接口请求完成”、“接口请求失败”四种action。

### runSaga

`runSaga: MethodDecorator`

saga方法自动执行方法装饰器。

标记该装饰器的方法，会在实例初始化时使用this.runSaga方法执行该saga方法。

一般在saga入口方法中使用该装饰器。

## Utils

### getAsyncState

获取异步状态的初始值（用于初始化异步状态字段），返回[AsyncState](#asyncstate)

```typescript
function getAsyncState<T> (initialValue: T = null): AsyncState<T>;
```

## Interfaces & Types

### BaseStoreStaticConfig

BaseStore静态配置：

```typescript
export interface BaseStoreStaticConfig {
  /**
   * axios实例的配置参数对象
   */
  axiosConfig?: AxiosRequestConfig;
  /**
   * 默认sagaRunner的配置参数对象
   */
  sagaOptions?: SagaOptions;
}
```

### BaseStoreConfig

BaseStore配置：

```typescript

export interface BaseStoreConfig {
  /**
   * store的key
   * 当构建store的时候，若传入了key（BaseStoreConfig.key），会在sagaRunner以此key中注册该store
   * 被注册的store可以在select副作用获取到该store对象，一般在这个store是全局唯一的通用store时使用该配置
   * 如：yield select(stores => stores[key])
   *
   * 如果没有在构建store的时候传入key，将不会在sagaRunner中注册，并且会用一个随机字符串填充该key值充当action type的命名空间前缀的一部分
   */
  key?: string;
  /**
   * 设置一个另外的sagaRunner对象，这个store中的saga将会在这个sagaRunner中执行
   * 并且无法take到其它sagaRunner中的action
   */
  sagaRunner?: SagaRunner;
  /**
   * 接口返回结果转换方法，在api调用成功后，会通过本方法转换后再赋值给相应的的state
   * @default void
   * @param apiRes  普通接口调用的结果对象
   * @returns {any}
   */
  apiResToState?: (apiRes?: any) => any;
  /**
   * api调用过程中是否自动更新绑定的state
   * @default true
   */
  bindState?: boolean;
}
```

### ActionType

```typescript
/**
 * T: 约定触发该Action会带的payload属性的类型
 */
export type ActionType<T = any> = string;
```

### AsyncState

异步状态：

```typescript
export interface AsyncState<T = any> {
  loading: boolean;
  error: null | Error;
  data: null | T;
}
```

### AsyncType

异步类型：

```typescript

/**
 * R: 约定触发START时会带的payload属性类型
 * S: 约定触发END时会带的payload属性类型
 * F: 约定触发ERROR时会带的payload属性类型
 */
export interface AsyncType<R = any, S = any, F = any> {
  START: ActionType<R>;
  END: ActionType<S>;
  ERROR: ActionType<F>;
}

```

### ApiConfig

api装饰器配置

```typescript

export interface ApiConfig {
  /**
   * 异步action type名称
   */
  asyncTypeName?: string;
  /**
   * 默认参数对象
   * @default void
   */
  defaultParams?: any;
  /**
   * 接口状态绑定state的名称
   * @default void
   */
  bindState?: string;
  /**
   * 是否为标准的axios接口（接口方法是否返回AxiosPromise）
   * @default true
   */
  axiosApi?: boolean;
}
```

# Best Practice

- [项目结构](#项目结构)
- [DO NOT: 给ActionType加命名空间](#do-not-给actiontype加命名空间)
- [DO NOT: 通过Action去执行方法](#do-not-通过action去执行方法)

## 项目结构

个人推荐的项目结构（仅供参考）

```
.
├── src
│   ├── index.ts
│   ├── App.ts
│   ├── routes
│   │   ├── index.ts
│   │   ├── Home
│   │   │   ├── index.ts
│   │   │   ├── components
│   │   └── Product
│   │       ├── index.ts
│   │       ├── components
│   │       └── stores
│   │           ├── ProductLogic.ts
│   │           └── ProductUI.ts
│   └── stores
│       ├── index.ts
│       ├── logic
│       │   └── AppLogic.ts
│       └── service
│           ├── UserApi.ts
│           ├── ProductApi.ts
│           └── OrderApi.ts
└── package.json
```

与redux的全局store不同，sagax的store更灵活，可以有全局store也可以有局部store。

可以在`src/stores/index.ts`文件中初始化全局store：

```typescript
import AppLogic from './logic/AppLogic';
import UserApi from './service/UserApi';

export const user = new UserApi({key: 'user'});
export const appLogic = new AppLogic({key: 'appLogic', user});
...
```

然后在`src/routes/Product/index.ts`中使用全局store：
```typescript
import { user } from '../../stores';
import ProductUI from '../stores/ProductUI';

const productUI = new ProductUI({user});
...
```

## DO NOT: 给ActionType加命名空间

sagax在处理ActionType的时候（包括AsyncType），会自动加上命名空间避免重复。

具体命名空间的值可以参考测试代码：
```typescript
test('asyncType和typeDef自动赋值', () => {
  class TypeTest extends BaseStore {
    @typeDef TYPE_B: string;
    @asyncTypeDef TYPE_API_B: AsyncType;
  }

  const typeTest = new TypeTest({key: 'test'});

  expect(typeTest.TYPE_B).toBe('TypeTest<test>/TYPE_B');
  expect(typeTest.TYPE_API_B).toEqual({
    START: 'TypeTest<test>/TYPE_API_B/START',
    END: 'TypeTest<test>/TYPE_API_B/END',
    ERROR: 'TypeTest<test>/TYPE_API_B/ERROR'
  });

  const randomKeyTypeTest = new TypeTest();

  const key = randomKeyTypeTest.key;
  expect(key).toMatch(/^[a-zA-Z]{6}$/);
  expect(randomKeyTypeTest.TYPE_B).toBe(`TypeTest<${key}>/TYPE_B`);
  expect(randomKeyTypeTest.TYPE_API_B).toEqual({
    START: `TypeTest<${key}>/TYPE_API_B/START`,
    END: `TypeTest<${key}>/TYPE_API_B/END`,
    ERROR: `TypeTest<${key}>/TYPE_API_B/ERROR`
  });
});
```

## DO NOT: 通过Action去执行方法

在配合redux使用saga的时候，一般会通过派发一个Action的方式来执行saga方法，例如：

saga：
```typescript
function* getData ({payload}) {
  ...
}

yield takeLatest(types.GET_DATA, getData);
```

react component：
```typescript
@connect(
  state => ({}),
  dispatch => ({
    onGetData () {
      dispatch({
        type: types.GET_DATA,
        payload: {...}
      });
    }
  })
)
class Comp extends React.Component {
  render () {
    return (
      <button onClick={this.props.onGetData}>Click</button>
    );
  }
}
```

在sagax中，也可以像上面这样去实现，但是不推荐这么做，原因如下：

- 方法参数通过payload传递，将无法享受开发时的编辑器的智能提示和类型安全检查
- 通过Action来调用方法，容易让应用的Action变得混乱（有的Action既可用来主动调用方法，又可用来作为事件被动监听）

**最好的做法是，所有的Action都只作为被动的事件通知，是向模块外部暴露的钩子，以便外部使用者在某个事件触发时做特定的处理。**
