import { fork, call, CallEffect } from 'redux-saga/effects';
import { runInAction as mobXRunInAction } from 'mobx';
import { AsyncType, AsyncState } from './types';

export function getAsyncState<T> (initialValue: T = null): AsyncState<T> {
  return {
    error: null,
    loading: false,
    data: initialValue
  };
}

export function getAsyncType (baseType: string, namespace?: string, key?: string): AsyncType {
  const slicer = '/';

  if (namespace) {
    namespace += (key ? `<${key}>` : '') + slicer;
  } else {
    namespace = '';
  }

  return {
    REQUEST: `${namespace}${baseType}${slicer}REQUEST`,
    SUCCESS: `${namespace}${baseType}${slicer}SUCCESS`,
    FAILURE: `${namespace}${baseType}${slicer}FAILURE`,
  };
}

export function isAsyncType (type: any): type is AsyncType {
  return type && type.REQUEST && type.SUCCESS && type.FAILURE;
}

let randomTextDict: string[] = [];
for (let i = 65; i <= 122; i++) {
  if (i === 91) {
    i = 97;
  }

  randomTextDict.push(String.fromCharCode(i));
}

export function getRandomChar () {
  return randomTextDict[Math.round(Math.random() * (randomTextDict.length - 1))];
}
export function getRandomText (length: number) {
  let textArr: string[] = [];
  for (let i = 0; i < length; i++) {
    textArr.push(getRandomChar());
  }

  return textArr.join('');
}

export function runInAction (runFunc: () => any): CallEffect {
  return call<any>(mobXRunInAction, runFunc);
}

export function getClassMembersDescriptor (prototype: any) {
  let res: {name: string, descriptor: any}[] = [];
  while (true) {
    const arr = Object.getOwnPropertyNames(prototype);
    res = res.concat(arr.map(i => ({
      name: i,
      descriptor: Object.getOwnPropertyDescriptor(prototype, i)
    })));
    prototype = Object.getPrototypeOf(prototype);
    if (!prototype || prototype === Object) {
      break;
    }
  }

  return res.filter(i => {
    return [
      'constructor',
      'hasOwnProperty',
      'isPrototypeOf',
      'propertyIsEnumerable',
      'toString',
      'valueOf',
      'toLocaleString'
    ].indexOf(i.name) < 0 && !/^__.*__$/.test(i.name);
  });
}
