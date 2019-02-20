"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
var hardware_config_json_1 = __importDefault(require("./hardware_config.json"));
var components = [];
for (var _i = 0, _a = hardware_config_json_1.default.components; _i < _a.length; _i++) {
    var component = _a[_i];
    console.log(component.name);
}
