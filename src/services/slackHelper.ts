import { IncomingWebhook } from '@slack/client';
import '../typings/slack';
import '../models/groupedInstanceData';
import '../models/instanceData';

export default class SlackHelper {
    constructor(
        private region: string,
        private webhookUrl: string,
        private channel?: string) {
    }

    formatInstanceToSlackAttachment(instances: InstanceData[]) {
        let groupedInstanceDatas: GroupedInstanceData = {};

        instances.forEach((instance) => {
            let key = `${instance.InstanceType} @ ${instance.AvailabilityZone}`;
            if (!groupedInstanceDatas[key]) {
                groupedInstanceDatas[key] = [];
            }

            groupedInstanceDatas[key].push(instance.InstanceId);
        })

        let slaceMessage: SlackMessage = {
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

        let instanceIds: string[] = []
        for (let key in groupedInstanceDatas) {
            let field: SlackMessageAttachmentField = {
                title: key,
                value: groupedInstanceDatas[key].join(', '),
                short: true
            }

            if (slaceMessage.attachments) {
                slaceMessage.attachments[0].fields.push(field);
            }

            if (field.value) {
                field.value.split(', ').forEach((value) => {
                    instanceIds.push(value);
                })
            }
        }

        slaceMessage.attachments[0].footer = `<https://${this.region}.console.aws.amazon.com/ec2/v2/home?region=${this.region}#Instances:instanceId=${instanceIds.join(',').trim()};sort=instanceId|Click to details>`

        if (this.channel) {
            slaceMessage.channel = this.channel
        }

        return slaceMessage;
    }

    sendToSlack(message: SlackMessage): Promise<void> {
        var webhook = new IncomingWebhook(this.webhookUrl);
        return new Promise<void>((resolve, reject) => {
            webhook.send(message, (err: Error) => {
                if (err) {
                    reject(err);
                }

                resolve();
            });
        });
    }
}