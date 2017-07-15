import { IncomingWebhook } from '@slack/client';
import { ResourceType } from '../providers/resourceType';
import '../typings/slack';
import '../models/groupedInstanceData';
import '../models/instanceData';

export default class SlackHelper {
    constructor(
        private region: string,
        private webhookUrl: string,
        private channel?: string) {
    }

    formatInstanceToSlackAttachment(resourceType: ResourceType, instances: InstanceData[]) {
        let groupedInstanceDatas: GroupedInstanceData = {};

        instances.forEach((instance) => {
            let key = instance.GroupKey;
            if (!groupedInstanceDatas[key]) {
                groupedInstanceDatas[key] = [];
            }

            groupedInstanceDatas[key].push(instance.InstanceId);
        })

        let resourceTypeString = ResourceType[resourceType];
        let slaceMessageAttachment: SlackMessageAttachment =
            {
                title: `${resourceTypeString} instances not in reserved instance list`,
                color: "warning",
                fields: [],
                footer: ""
            }

        let instanceIds: string[] = []
        for (let key in groupedInstanceDatas) {
            let field: SlackMessageAttachmentField = {
                title: key,
                value: groupedInstanceDatas[key].join(', '),
                short: true
            }

            slaceMessageAttachment.fields.push(field)
            if (field.value) {
                field.value.split(', ').forEach((value) => {
                    instanceIds.push(value);
                })
            }
        }

        // TODO: Footer should change depend on resource type
        slaceMessageAttachment.footer = `<https://${this.region}.console.aws.amazon.com/ec2/v2/home?region=${this.region}#Instances:instanceId=${instanceIds.join(',').trim()};sort=instanceId|Click to details>`

        return slaceMessageAttachment;
    }

    sendToSlack(message: SlackMessage): Promise<void> {
        if(this.channel) {
            message.channel = this.channel;
        }

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