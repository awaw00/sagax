import SagaRunner from './SagaRunner';
import { AxiosSTARTConfig } from 'axios';
import { Monitor } from 'redux-saga';

export interface SagaOptions {
  monitor?: Monitor;
}

/**
 * T: 约定触发该Action需要带（主动）或者会带（被动）的payload属性的类型
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
  asyncTypeName?: string;
  defaultParams?: any;
  bindState?: string;
  axiosApi?: boolean;
}

export interface Action<T = any> {
  type: string;
  payload?: T;
}

export interface BaseStoreStaticConfig {
  axiosConfig?: AxiosSTARTConfig;
  sagaOptions?: SagaOptions;
}

export interface BaseStoreConfig {
  key?: string;
  sagaRunner?: SagaRunner;
  apiResToState?: (apiRes?: any) => any;
  bindState?: boolean;
}

export interface AsyncState<T = any> {
  loading: boolean;
  error: null | Error;
  data: null | T;
}
