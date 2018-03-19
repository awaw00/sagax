import { Action } from './types';
import { Task } from 'redux-saga';
import { SagaOptions } from './types';
declare class SagaRunner<T extends Action = Action> {
    private sagaOptions;
    private subscribes;
    private stores;
    constructor(sagaOptions?: SagaOptions);
    dispatch(action: T): T;
    runSaga(saga: (...args: any[]) => Iterator<any>): Task;
    registerStore(key: string, store: any): void;
    unRegisterStore(key: string): void;
    private subscribe(callback);
}
export default SagaRunner;
