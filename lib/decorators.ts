import { ApiConfig, AsyncType } from './types';
import { getAsyncType } from './utils';

export function api (asyncTypeName: string, config: ApiConfig = {}): MethodDecorator {
  return function (target: any, key: string, descriptor: any) {
    config.asyncTypeName = asyncTypeName;
    if (typeof config.axiosApi !== 'undefined') {
      config.axiosApi = Boolean(config.axiosApi);
    } else {
      config.axiosApi = true;
    }
    descriptor.value.$apiConfig = config;
    descriptor.value.$bind = true;
    return descriptor;
  };
}

export function bind (target: any, key: string, descriptor: any) {
  descriptor.value.$bind = true;
  return descriptor;
}

export function typeDef (target: any, key: string): any {
  if (typeof target === 'function') {
    // static type
    // const namespace = target.name;
    // target[key] = `${namespace}/${key}`;
    console.warn('typeDef is not compatible with static field.');
    return target;
  } else {
    // instance type
    return {
      get () {
        const cacheKey = '__' + key;
        if (!this[cacheKey]) {
          const namespace = this.constructor.name;
          this[cacheKey] = `${namespace}<${this.key}>/${key}`;
        }
        return this[cacheKey];
      }
    };
  }
}

export function asyncTypeDef (target: any, key: string): any {
  if (typeof target === 'function') {
    // const namespace = target.name;
    // target[key] = getAsyncType(key, namespace);
    console.warn('asyncTypeDef is not compatible with static field.');
    return target;
  } else {
    return {
      get () {
        const cacheKey = '__' + key;
        if (!this[cacheKey]) {
          const namespace = this.constructor.name;
          this[cacheKey] = getAsyncType(key, namespace, this.key);
        }
        return this[cacheKey];
      }
    };
  }
}

/**
 * 在初始化store完成后自动执行该saga方法
 * @param target
 * @param {string} key
 * @param descriptor
 * @returns {any}
 */
export function runSaga (target: any, key: string, descriptor: any): any {
  descriptor.value.$runSaga = true;
  descriptor.value.$bind = true;
  return descriptor;
}
