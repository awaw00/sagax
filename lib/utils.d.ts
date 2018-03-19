import { CallEffect } from 'redux-saga/effects';
import { ApiType } from './types';
export declare function getApiCallType(baseType: string, namespace?: string, key?: string): ApiType;
export declare function isApiType(type: any): type is ApiType;
export declare function getRandomChar(): string;
export declare function getRandomText(length: number): string;
export declare function runInAction(runFunc: () => any): CallEffect;
export declare function getClassMembersDescriptor(prototype: any): {
    name: string;
    descriptor: any;
}[];
