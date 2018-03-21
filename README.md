Saga + MobX = SagaX
----

# 基本理念

将应用状态划分到三类Store中：

- DataStore  数据Store
- LogicStore 逻辑Store
- UIStore    界面Store

其中，DataStore用于定义接口调用方法、接口相关的ActionType和接口状态。

LogicStore用于管理应用的逻辑过程和中间状态，比如，控制应用加载时的初始化流程（加载本地缓存、调用初始化数据接口等）、控制页面的渲染时机。

UIStore用于管理应用界面渲染所涉及的状态、响应用户界面事件。

当然，上面的划分方式并不是强制性的，在某些场景下（逻辑并不复杂的场景）把LogicStore与UIStore合二为一也许会更加合适。

**但是保持DataStore的独立性对项目中后期的可维护性和可扩展性来说，是非常重要的。**

# 构成

- MobX：提供了Store与Store、Store与界面（React、DOM...）之间的响应式状态链接
- Saga：Saga在这里充当的是一个分布式事务调度核心

为什么选择MobX而不是“原配”Redux来管理应用状态？

函数式风格的Redux确实有它的亮眼之处，但是Redux管理的状态是全局化的中心状态，很难对已有的代码进行复用。
而MobX的OOP支持让代码复用变得简单，通过良好的代码组织，项目可以变得易扩展、易维护。

# Basic Usage

定义数据Store：

```typescript
// /stores/dataStores.ts
import { BaseStore, apiTypeDef, ApiType, api, getAsyncState } from 'sagax';
import { observable } from 'mobx';

export class UserStore extends BaseStore {
  @apiTypeDef GET_USER_INFO: ApiType;
  @observable userInfo = getAsyncState();
  
  @api('GET_USER_INFO', {bindState: 'userInfo'})
  getUserInfo () {
    return this.http.get('<API_ROOT>/userInfo');
  }
}

export class OrderStore extends BaseStore {
  @apiTypeDef GET_ORDER_LIST_OF_USER: ApiType;
  @observable orderListOfUser = getAsyncState();
  
  @api('GET_ORDER_LIST_OF_USER', {bindState: 'orderListOfUser'})
  getOrderListOfUser (params: any) {
    return this.http.get('<API_ROOT>/order/listOfUser', {params});
  }
}
```

定义UIStore（这里因为逻辑比较简单，把逻辑也写到UIStore了）：

```typescript
// /stores/uiStores.ts
import { BaseStore, bind, runSaga, apiTypeDef, types, ApiType, api } from 'sagax';
import { put, call, take, takeLatest, fork } from 'redux-saga/effects';
import { observable, computed } from 'mobx';

import { UserStore, OrderStore } from './dataStores';

interface OrderUIStoreConfig extends types.BaseStoreConfig {
  userStore: UserStore;
}

export class OrderUIStore extends BaseStore {
  userStore: UserStore;
  orderStore: OrderStore;
  
  @computed
  get loading () {
    return this.userStore.userInfo.loading || this.orderStore.orderListOfUser.loading;
  }
  
  @computed
  get orderList () {
    return this.orderStore.orderListOfUser.data;
  }
  
  constructor (config: OrderUIStoreConfig) {
    super(config);
    
    // 这里为什么从参数中获取userStore而不是重新new一个？
    // 因为用户信息这类数据，在大多数应用中都是唯一的（一个系统不会有两个登录用户）
    // 保持userStore的唯一性，可以避免无效和重复的接口调用、内存占用
    this.userStore = config.userStore;
    this.orderStore = new OrderStore();
  }
  
  @runSaga
  *sagaMain () {
    yield fork(this.initOrderList);
  }
  
  @bind
  *initOrderList () {
    const self: this = yield this;
    const {userInfo, GET_USER_INFO} = self.userStore;
    const {GET_ORDER_LIST_OF_USER} = self.orderStore;
    
    if (userInfo.loading) {
      // 先检查用户信息是否在加载中，如果是，则等待加载成功
      yield take(GET_USER_INFO.SUCCESS);
    } else if (!self.userStore.userInfo.data) {
      // 再检查用户信息是否已存在，若不存在，则发起获取用户信息的请求，并等待请求成功
      yield put({type: GET_USER_INFO.REQUEST});
      yield take(GET_USER_INFO.SUCCESS);
    }
    // 以用户id为参数，发起获取用户订单列表的请求
    yield put({type: GET_ORDER_LIST_OF_USER.REQUEST, payload: {userId: userInfo.id}});
  }
}
```

写一个React组件（为了简单没有使用mobx-react的Provider和inject等工具）：
```typescript
// /App.tsx
import React from 'react';
import { render } from 'react-dom';
import { observer } from 'mobx-react';

import { UserStore } from 'stores/dataStores';
import { OrderUIStore } from 'stores/uiStores';

import OrderList from 'components/OrderList'; // 实现忽略

const userStore = new UserStore();
const orderUIStore = new OrderUIStore({userStore});

@observer
class App extends React.Component {
  render () {
    return (
      <div>
        {orderUIStore.loading
          ? 'loading...'
          : (
            <OrderList dataSource={orderUIStore.orderList}/>
          )
        }
      </div>
    );
  }
}

render(<App/>, document.getElementById('root'));

```

# Document

- core
 - [BaseStore](#basestore)
 - [SagaRunner](#sagarunner)
- decorators
 - [api](#api)
 - [bind](#bind)
 - [typeDef](#typedef)
 - [apiTypeDef](#apitypedef)
 - [runSaga](#runsaga)
 
## BaseStore

Store的基类，集成SagaRunner与axios，并在实例化时对使用了api、bind、runSaga等装饰器的成员方法进行预处理。

### BaseStore.initialized

`static initialized: boolean`

BaseStore是否已进行初始化

### BaseStore.sagaRunner

`static sagaRunner: SagaRunner`

SagaRunner实例，BaseStore实例可通过this.sagaRunner访问该实例对象。默认所有BaseStore实例共享一个SagaRunner实例。

### static http: AxiosInstance

Axios实例，BaseStore实例可通过this.http访问该实例对象。所有BaseStore实例共享一个Axios实例。

### static init (baseStoreConfig: BaseStoreStaticConfig = {}): void

<table>
  <thead>
    <tr>
      <th>字段</th>
      <th>类型</th>
      <th>默认值</th>
      <th>说明</th>
    </tr>
  </thead>
  <tbody>
    <tr>
      <td>axiosConfig?</td>
      <td>AxiosRequestConfig</td>
      <td>void</td>
      <td>Axios实例化配置参数</td>
    </tr>
    <tr>
      <td>sagaOptions?</td>
      <td>SagaOptions</td>
      <td>void</td>
      <td>默认的sagaRunner实例化参数</td>
    </tr>
  </tbody>
</table>

初始化静态实例（SagaRunner实例与Axios实例）

### BaseStore.reset

`static reset (): void`

重置静态实例

### BaseStore.prototype.constructor

`constructor (baseStoreConfig: BaseStoreConfig = {})`

构造方法，在初始化BaseStore实例前，首先会检测并确保BaseStore静态实例已进行初始化

BaseStoreConfig:

<table>
  <thead>
    <tr>
      <th>字段</th>
      <th>类型</th>
      <th>默认值</th>
      <th>说明</th>
    </tr>
  </thead>
  <tbody>
    <tr>
      <td>key?</td>
      <td>string</td>
      <td>void</td>
      <td>store的key，key用于设置store中定义的actionType的命名空间（若未指定key，命名空间中key的值会用随机字符串代替）。此外，指定了key的store在saga中可以通过select来获取该store的实例。</td>
    </tr>
    <tr>
      <td>sagaRunner?</td>
      <td>SagaRunner</td>
      <td>void</td>
      <td>指定其它的SagaRunner实例</td>
    </tr>
    <tr>
      <td>apiResponseTransformer?</td>
      <td>(apiRes?: any) => any</td>
      <td>void</td>
      <td>当store中的api方法SUCCESS动作被触发前，会使用该转换方法对接口返回值进行转换处理</td>
    </tr>
  </tbody>
</table>

### BaseStore.prototype.dispatch

`dispatch (action: Action): Action`

派发一个Action，等同于this.sagaRunner.dispatch(action)

### BaseStore.prototype.runSaga

`runSaga (saga: Saga): Task`

执行一个Saga方法，等同于this.sagaRunner.runSaga(saga)。一般用来运行store的saga入口方法。

## SagaRunner

提供一个Saga运行环境。

**不同的SagaRunner实例之间运行的saga互相隔离，无法通信。**在初始化BaseStore实例的时候，可以传入一个新的SagaRunner实例，store中的saga便会运行在一个隔离的“沙箱”中。

## api

`api (apiCallTypeName: string, config: ApiCallWithConfig = {}): MethodDecorator`

接口方法装饰器工厂方法。

在初始化BaseStore实例的时候，会根据apiCallTypeName从实例中查找接口对应的ApiType（this[apiCallTypeName])，并自动执行一个监听ApiType的saga。

当`ApiType.REQUEST`的action被触发时，会以`action.payload`为参数执行api接口方法，获取接口返回值后，派发一个type为`ApiType.SUCCESS`、payload为接口方法返回值（若指定了apiResponseTransformer，则会使用该方法对返回值进行处理）的action。若接口方法调用出错，则会派发一个type为`ApiType.FAILURE`的action。

ApiCallWithConfig:

<table>
  <thead>
    <tr>
      <th>字段</th>
      <th>类型</th>
      <th>默认值</th>
      <th>说明</th>
    </tr>
  </thead>
  <tbody>
    <tr>
      <td>apiCallTypeName?</td>
      <td>string</td>
      <td>void</td>
      <td>值等同与装饰器的第一个参数，不需要在config中指定（指定也会被第一个参数覆盖）</td>
    </tr>
    <tr>
      <td>defaultParams?</td>
      <td>{}</td>
      <td>void</td>
      <td>接口方法的默认参数，如果有值，接口方法在调用时会使用`Object.assign({}, defaultParams, params)`对参数进行处理</td>
    </tr>
    <tr>
      <td>bindState?</td>
      <td>string</td>
      <td>void</td>
      <td>接口状态绑定的字段名称，如果有值，会在接口调用的各个阶段自动更新绑定字段的值</td>
    </tr>
  </tbody>
</table>

## bind

`bind: MethodDecorator`

绑定方法执行上下文为this的方法装饰器

## typeDef

`typeDef: PropertyDecorator`

ActionType定义属性装饰器。

可同时在静态字段与实例字段上使用。在静态字段使用时，会使用`${ClassName}/${ActionType}`作为该字段的值；在实例字段使用时，会使用`${ClassName}<${key}>/${ActionType}`作为该字段的值。

## apiTypeDef

`apiTypeDef: PropertyDecorator`

ApiType定义属性装饰器。

ApiType是由四个ActionType组成的对象： PRE_REQUEST、REQUEST、SUCCESS、FAILURE，分别代表“接口预请求”、“接口请求”、“接口请求成功”、“接口请求失败”四种action。

其中，PRE_REQUEST用于在接口真正请求发起前，准备请求的参数。

与typeDef相同，apiTypeDef也可以同时在静态字段与实例字段上使用。

## runSaga

`runSaga: MethodDecorator`

saga方法自动执行方法装饰器。

标记该装饰器的方法，会在实例初始化时使用this.runSaga方法执行该saga方法。

...
