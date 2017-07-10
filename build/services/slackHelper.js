"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var client_1 = require("@slack/client");
require("../typings/slack");
require("../models/groupedInstanceData");
require("../models/instanceData");
var SlackHelper = (function () {
    function SlackHelper(region, webhookUrl) {
        this.region = region;
        this.webhookUrl = webhookUrl;
    }
    SlackHelper.prototype.formatInstanceToSlackAttachment = function (instances) {
        var groupedInstanceDatas = {};
        instances.forEach(function (instance) {
            var key = instance.InstanceType + " @ " + instance.AvailabilityZone;
            if (!groupedInstanceDatas[key]) {
                groupedInstanceDatas[key] = [];
            }
            groupedInstanceDatas[key].push(instance.InstanceId);
        });
        var slaceMessage = {
            username: "AWS Reserved Instance Status Check",
            attachments: [
                {
                    title: "EC2 instances not in reserved instance list",
                    color: "warning",
                    fields: [],
                    footer: ""
                }
            ]
        };
        var instanceIds = [];
        for (var key in groupedInstanceDatas) {
            var field = {
                title: key,
                value: groupedInstanceDatas[key].join(', '),
                short: true
            };
            if (slaceMessage.attachments) {
                slaceMessage.attachments[0].fields.push(field);
            }
            if (field.value) {
                field.value.split(', ').forEach(function (value) {
                    instanceIds.push(value);
                });
            }
        }
        slaceMessage.attachments[0].footer = "<https://" + this.region + ".console.aws.amazon.com/ec2/v2/home?region=" + this.region + "#Instances:instanceId=" + instanceIds.join(',').trim() + ";sort=instanceId|Click to details>";
        return slaceMessage;
    };
    SlackHelper.prototype.sendToSlack = function (message) {
        var webhook = new client_1.IncomingWebhook(this.webhookUrl);
        return new Promise(function (resolve, reject) {
            webhook.send(message, function (err) {
                if (err) {
                    reject(err);
                }
                resolve();
            });
        });
    };
    return SlackHelper;
}());
exports.default = SlackHelper;
