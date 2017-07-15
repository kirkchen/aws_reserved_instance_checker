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

            groupedInstanceDatas[key].push(instance);
        })

        let resourceTypeString = ResourceType[resourceType];
        let slaceMessageAttachment: SlackMessageAttachment =
            {
                title: `${resourceTypeString} instances not in reserved instance list`,
                color: "warning",
                fields: []
            }

        let instanceIds: string[] = []
        for (let key in groupedInstanceDatas) {
            let field: SlackMessageAttachmentField = {
                title: key,
                value: groupedInstanceDatas[key].map((instance)=>instance.InstanceName).join(', '),
                short: true
            }

            slaceMessageAttachment.fields.push(field)
            if (field.value) {
                field.value.split(', ').forEach((value) => {
                    instanceIds.push(value);
                })
            }
        }

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