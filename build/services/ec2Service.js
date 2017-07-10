"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var aws_sdk_1 = require("aws-sdk");
require("../models/instanceData");
require("../models/reservedInstanceData");
var EC2Service = (function () {
    function EC2Service(region) {
        this.region = region;
    }
    EC2Service.prototype.describeActiveReservedInstances = function () {
        var ec2 = new aws_sdk_1.EC2({ region: this.region });
        var params = {
            Filters: [
                {
                    Name: 'state',
                    Values: [
                        'active'
                    ]
                }
            ]
        };
        return new Promise(function (resolve, reject) {
            ec2.describeReservedInstances(params, function (err, data) {
                if (err) {
                    reject(err);
                    return;
                }
                if (data.ReservedInstances) {
                    resolve(data.ReservedInstances);
                    return;
                }
                resolve([]);
            });
        });
    };
    EC2Service.prototype.describeRunningInstances = function () {
        var ec2 = new aws_sdk_1.EC2({ region: this.region });
        var params = {
            Filters: [
                {
                    Name: 'instance-state-name',
                    Values: [
                        'running'
                    ]
                }
            ]
        };
        return new Promise(function (resolve, reject) {
            ec2.describeInstances(params, function (err, data) {
                if (err) {
                    reject(err);
                    return;
                }
                if (data.Reservations) {
                    var result = data.Reservations
                        .map(function (reservation) {
                        if (reservation.Instances &&
                            reservation.Instances[0].Placement) {
                            var instance = reservation.Instances[0];
                            var availabilityZone = void 0;
                            if (instance.Placement) {
                                availabilityZone = instance.Placement.AvailabilityZone;
                            }
                            var instanceName = void 0;
                            if (instance.Tags) {
                                for (var _i = 0, _a = instance.Tags; _i < _a.length; _i++) {
                                    var tag = _a[_i];
                                    if (tag.Key === 'Name') {
                                        instanceName = tag.Value;
                                        break;
                                    }
                                }
                            }
                            var instanceData = {
                                InstanceId: instance.InstanceId || '',
                                InstanceType: instance.InstanceType || '',
                                LaunchTime: instance.LaunchTime || new Date(),
                                AvailabilityZone: availabilityZone || '',
                                InstanceName: instanceName
                            };
                            return instanceData;
                        }
                    })
                        .filter(function (instance) { return !!instance; });
                    resolve(result);
                    return;
                }
                resolve([]);
            });
        });
    };
    return EC2Service;
}());
exports.default = EC2Service;
