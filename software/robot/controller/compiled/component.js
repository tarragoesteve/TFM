"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var Component = /** @class */ (function () {
    function Component(name) {
        this.name = name;
    }
    Component.prototype.loop = function () {
        var _this = this;
        return new Promise(function (resolve) {
            setTimeout(function () {
                console.log(_this.name);
                _this.loop();
            }, 2000);
        });
    };
    return Component;
}());
exports.Component = Component;
