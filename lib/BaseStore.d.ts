import { AxiosInstance } from 'axios';
import { Action, ApiResState, BaseStoreConfig, BaseStoreStaticConfig } from './types';
import { Task } from 'redux-saga';
import SagaRunner from './SagaRunner';
export default class BaseStore {
    static initialized: boolean;
    static sagaRunner: SagaRunner;
    static http: AxiosInstance;
    key: string;
    http: AxiosInstance;
    sagaRunner: SagaRunner;
    apiResponseTransformer: (apiRes?: any) => any;
    bindState: boolean;
    static init(baseStoreConfig?: BaseStoreStaticConfig): void;
    static reset(): void;
    constructor(baseStoreConfig?: BaseStoreConfig);
    dispatch(action: Action): Action<any>;
    runSaga(saga: (...args: any[]) => Iterator<any>): Task;
    protected getApiResState<T>(initialValue?: T): ApiResState<T>;
    private processDecoratedMethods();
    private runCallWithSaga(funcName, apiCallWithConfig);
}
