import ReservedInstanceCalculator from '../services/reservedInstanceCalculator';
import SlackHelper from '../services/slackHelper';
import ResourceProvider from '../providers/resourceProvider';
import { ResourceType } from '../providers/resourceType';

export default class App {
    constructor(
        private resourceProviders: ResourceProvider[],
        private reservedInstanceCalculator: ReservedInstanceCalculator,
        private slackHelper: SlackHelper,
        private excludePattern?: string) {
    }

    async Run(): Promise<void> {
        let slackMessage: SlackMessage = {
            username: 'AWS Reserved Instance Status Check',
            attachments: []
        };

        let excludedInstances: InstanceData[] = [];
        for (let provider of this.resourceProviders) {
            let reservedInstances = await provider.describeActiveReservedInstances();
            let runningInstances = await provider.describeRunningInstances();

            let notReservedInstances = this.reservedInstanceCalculator.getInstanceNotReserved(reservedInstances, runningInstances);

            let excludedInstancesForProvider: InstanceData[] = [];
            notReservedInstances = notReservedInstances.filter(i => {
                if (!this.excludePattern) {
                    return true;
                }

                let regex = new RegExp(this.excludePattern, "g");
                let matches = i.InstanceName!.match(regex);
                if (matches && matches.length > 0) {
                    excludedInstancesForProvider.push(i);
                    return false;
                }

                return true;
            });
            excludedInstances = excludedInstances.concat(excludedInstancesForProvider);

            let slackAttachment = this.slackHelper.formatInstanceToSlackAttachment(provider.ResourceType, notReservedInstances);
            slackAttachment.footer = provider.getInstancesUrl(notReservedInstances);
            slackMessage.attachments.push(slackAttachment);
        }

        let slackAttachment = this.slackHelper.formatInstanceToSlackAttachment(ResourceType.Excluded, excludedInstances);
        slackMessage.attachments.push(slackAttachment);
        await this.slackHelper.sendToSlack(slackMessage);
    }
}