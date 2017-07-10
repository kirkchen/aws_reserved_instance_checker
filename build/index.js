"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var ec2Service_1 = require("./services/ec2Service");
var reservedInstanceCalculator_1 = require("./services/reservedInstanceCalculator");
var slackHelper_1 = require("./services/slackHelper");
var app_1 = require("./apps/app");
function CheckAwsReservedInstance() {
    var webhookUrl = process.env.RICHECKER_WEBHOOK_URL;
    var region = process.env.RICHECKER_REGION || 'us-east-1';
    if (!webhookUrl) {
        throw new Error('Webhook url is not set, please check your environment variable RICHECKER_WEBHOOK_URL');
    }
    new app_1.default(new ec2Service_1.default(region), new reservedInstanceCalculator_1.default(), new slackHelper_1.default(region, webhookUrl)).Run();
}
exports.default = CheckAwsReservedInstance;
CheckAwsReservedInstance();
