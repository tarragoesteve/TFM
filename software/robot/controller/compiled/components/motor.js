"use strict";
var __extends = (this && this.__extends) || (function () {
    var extendStatics = function (d, b) {
        extendStatics = Object.setPrototypeOf ||
            ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
            function (d, b) { for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p]; };
        return extendStatics(d, b);
    };
    return function (d, b) {
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
var component_1 = require("../component");
var PID_1 = require("./utils/PID");
var Motor = /** @class */ (function (_super) {
    __extends(Motor, _super);
    function Motor(name, planner_uri, is_simulation, parameters) {
        var _this = _super.call(this, name, planner_uri, is_simulation, parameters) || this;
        //Initialize variables to 0
        _this.position = _this.speed = _this.acceleration = 0.0;
        _this.position_reference = _this.speed_reference = _this.acceleration_reference = 0.0;
        //Load PID Configuration;
        _this.PID = new PID_1.PID(parameters.k_p, parameters.k_i, parameters.k_d);
        _this.reference_parameter = parameters.reference_parameter;
        //Update the reference when we get a msg
        _this.socket.on('message', function (msg) {
            if (msg.position_reference) {
                _this.reference_parameter = 'position';
                _this.position_reference = msg.position_reference;
            }
            if (msg.speed_reference) {
                _this.reference_parameter = 'speed';
                _this.speed_reference = msg.speed_reference;
            }
            if (msg.acceleration_reference) {
                _this.reference_parameter = 'acceleration';
                _this.acceleration_reference = msg.acceleration_reference;
            }
        });
        return _this;
    }
    Motor.prototype.loop = function () {
        var _this = this;
        return new Promise(function (resolve, reject) {
            setInterval(function () {
                //Get current state of the motor
                //Send state to the planner
                _this.socket.emit('state', { "motor": _this.name, "position": _this.position,
                    "speed": _this.speed, "acceleration": _this.acceleration });
                //Compute output
                var error = _this.compute_error();
                var output = _this.PID.output(error);
                //Apply output to the motor
                if (_this.is_simulation) {
                    console.log(output);
                    _this.speed = _this.speed_reference * 0.9;
                }
            }, 100);
        });
    };
    Motor.prototype.compute_error = function () {
        if (this.reference_parameter == 'position') {
            return this.position_reference - this.position;
        }
        if (this.reference_parameter == 'speed') {
            return this.speed_reference - this.speed;
        }
        if (this.reference_parameter == 'acceleration') {
            return this.acceleration_reference - this.acceleration;
        }
        console.log("Error computing error");
        return 0;
    };
    return Motor;
}(component_1.Component));
exports.Motor = Motor;
