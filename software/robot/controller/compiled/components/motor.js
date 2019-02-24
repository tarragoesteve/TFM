"use strict";
var __extends = (this && this.__extends) || (function () {
    var extendStatics = function (d, b) {
        extendStatics = Object.setPrototypeOf ||
            ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
            function (d, b) { for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p]; };
        return extendStatics(d, b);
    }
    return function (d, b) {
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
var component_1 = require("../component");
var Motor = /** @class */ (function (_super) {
    __extends(Motor, _super);
    function Motor(name, planner_uri, is_simulation, parameters) {
        var _this = _super.call(this, name, planner_uri, is_simulation, parameters) || this;
        _this.position = _this.speed = _this.acceleration = 0.0;
        return _this;
    }
    Motor.prototype.loop = function () {
        var _this = this;
        return new Promise(function (resolve, reject) {
            setTimeout(function () {
                _this.socket.emit('message', _this.name);
                console.log(_this.name);
                return _this.loop();
            }, 2000);
        });
    };
    return Motor;
}(component_1.Component));
exports.Motor = Motor;
