"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
require("../models/instanceData");
require("../models/reservedInstanceData");
var ReservedInstanceCalculator = (function () {
    function ReservedInstanceCalculator() {
    }
    ReservedInstanceCalculator.prototype.getInstanceNotReserved = function (reservedInstanceList, runningInstanceList) {
        var instancesNotReserved = [];
        for (var _i = 0, runningInstanceList_1 = runningInstanceList; _i < runningInstanceList_1.length; _i++) {
            var runningInstance = runningInstanceList_1[_i];
            var isInstanceReserved = false;
            for (var _a = 0, reservedInstanceList_1 = reservedInstanceList; _a < reservedInstanceList_1.length; _a++) {
                var reservedInstance = reservedInstanceList_1[_a];
                if (reservedInstance.InstanceType === runningInstance.InstanceType &&
                    reservedInstance.AvailabilityZone === runningInstance.AvailabilityZone) {
                    reservedInstance.InstanceCount--;
                    isInstanceReserved = true;
                    break;
                }
            }
            if (!isInstanceReserved) {
                instancesNotReserved.push(runningInstance);
            }
        }
        return instancesNotReserved;
    };
    return ReservedInstanceCalculator;
}());
exports.default = ReservedInstanceCalculator;
