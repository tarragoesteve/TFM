"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
//TODO PID class
var PID = /** @class */ (function () {
    function PID(kp, ki, kd) {
        this.kp = kp;
        this.ki = ki;
        this.kd = kd;
        this.first_error = true;
        this.previous_error = this.accumulated_error = 0.0;
        this.previous_error_time = Date.now();
    }
    PID.prototype.output = function (error) {
        this.first_error = false;
        if (this.first_error) {
            this.previous_error = error;
            this.previous_error_time = Date.now();
            return this.kp * error;
        }
        else {
            var output = this.kp * error +
                this.ki * this.accumulated_error +
                this.kd * (error - this.previous_error) / (Date.now() - this.previous_error_time);
            this.previous_error = error;
            this.previous_error_time = Date.now();
            return this.output;
        }
    };
    return PID;
}());
exports.PID = PID;
