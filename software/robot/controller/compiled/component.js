"use strict";
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (Object.hasOwnProperty.call(mod, k)) result[k] = mod[k];
    result["default"] = mod;
    return result;
};
Object.defineProperty(exports, "__esModule", { value: true });
var socketio = __importStar(require("socket.io-client"));
var Component = /** @class */ (function () {
    function Component(name, planner_uri, is_simulation, parameters) {
        this.name = name;
        this.planner_uri = planner_uri;
        this.is_simulation = is_simulation;
        this.socket = socketio.connect(planner_uri);
        this.parameters = parameters;
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
