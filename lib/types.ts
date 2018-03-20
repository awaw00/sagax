import SagaRunner from './SagaRunner';
import { AxiosRequestConfig } from 'axios';
import { Monitor } from 'redux-saga';

export interface ReduxStore<S = any> {
  dispatch (action: any): any;
  getState (): S;
}

export interface SagaOptions {
  monitor?: Monitor;
  linkReduxStore?: ReduxStore;
}

/**
 * T: 约定触发该Action需要带（主动）或者会带（被动）的payload属性的类型
 */
export type ActionType<T = any> = string;

/**
 * R: 约定触发REQUEST时需要带的payload属性类型
 * S: 约定触发SUCCESS时会带的payload属性类型
 * P: 约定触发PRE_REQUEST时需要带的payload类型
 * F: 约定触发FAILURE时会带的payload属性类型
 */
export interface ApiType<R = any, S = any, P = any, F = any> {
  PRE_REQUEST?: ActionType<P>;
  REQUEST: ActionType<R>;
  SUCCESS: ActionType<S>;
  FAILURE: ActionType<F>;
}

export interface ApiCallWithConfig {
  apiCallTypeName?: string;
  defaultParams?: any;
  bindState?: string;
}

export interface Action<T = any> {
  type: string;
  payload?: T;
}

export interface BaseStoreStaticConfig {
  axiosConfig?: AxiosRequestConfig;
  sagaOptions?: SagaOptions;
}

export interface BaseStoreConfig {
  key?: string;
  sagaRunner?: SagaRunner;
  apiResponseTransformer?: (apiRes?: any) => any;
  bindState?: boolean;
}

export interface ApiResState<T = any> {
  loading: boolean;
  error: null | Error;
  data: null | T;
}
