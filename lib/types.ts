import SagaRunner from './SagaRunner';
import { AxiosRequestConfig } from 'axios';
import { Monitor } from 'redux-saga';

export interface SagaOptions {
  monitor?: Monitor;
}

/**
 * T: 约定触发该Action会带的payload属性的类型
 */
export type ActionType<T = any> = string;

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

export interface Action<T = any> {
  type: string;
  payload?: T;
}

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

export interface AsyncState<T = any> {
  loading: boolean;
  error: null | Error;
  data: null | T;
}
