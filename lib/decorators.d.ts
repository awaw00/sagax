import { ApiCallWithConfig } from './types';
export declare function api(apiCallTypeName: string, config?: ApiCallWithConfig): MethodDecorator;
export declare function bind(target: any, key: string, descriptor: any): any;
export declare function typeDef(target: any, key: string): any;
export declare function apiTypeDef(target: any, key: string): any;
/**
 * 在初始化store完成后自动执行该saga方法
 * @param target
 * @param {string} key
 * @param descriptor
 * @returns {any}
 */
export declare function runSaga(target: any, key: string, descriptor: any): any;
