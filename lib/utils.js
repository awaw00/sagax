"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var effects_1 = require("redux-saga/effects");
var mobx_1 = require("mobx");
function getApiCallType(baseType, namespace, key) {
    var slicer = '/';
    if (namespace) {
        namespace += (key ? "<" + key + ">" : '') + slicer;
    }
    else {
        namespace = '';
    }
    return {
        PRE_REQUEST: "" + namespace + baseType + slicer + "PRE_REQUEST",
        REQUEST: "" + namespace + baseType + slicer + "REQUEST",
        SUCCESS: "" + namespace + baseType + slicer + "SUCCESS",
        FAILURE: "" + namespace + baseType + slicer + "FAILURE",
    };
}
exports.getApiCallType = getApiCallType;
function isApiType(type) {
    return type && type.PRE_REQUEST && type.REQUEST && type.SUCCESS && type.FAILURE;
}
exports.isApiType = isApiType;
var randomTextDict = [];
for (var i = 65; i <= 122; i++) {
    if (i === 91) {
        i = 97;
    }
    randomTextDict.push(String.fromCharCode(i));
}
function getRandomChar() {
    return randomTextDict[Math.round(Math.random() * (randomTextDict.length - 1))];
}
exports.getRandomChar = getRandomChar;
function getRandomText(length) {
    var textArr = [];
    for (var i = 0; i < length; i++) {
        textArr.push(getRandomChar());
    }
    return textArr.join('');
}
exports.getRandomText = getRandomText;
function runInAction(runFunc) {
    return effects_1.call(mobx_1.runInAction, runFunc);
}
exports.runInAction = runInAction;
function getClassMembersDescriptor(prototype) {
    var res = [];
    while (true) {
        var arr = Object.getOwnPropertyNames(prototype);
        res = res.concat(arr.map(function (i) { return ({
            name: i,
            descriptor: Object.getOwnPropertyDescriptor(prototype, i)
        }); }));
        prototype = Object.getPrototypeOf(prototype);
        if (!prototype || prototype === Object) {
            break;
        }
    }
    return res.filter(function (i) {
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
exports.getClassMembersDescriptor = getClassMembersDescriptor;
//# sourceMappingURL=utils.js.map