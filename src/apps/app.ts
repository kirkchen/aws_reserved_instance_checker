import ReservedInstanceCalculator from '../services/reservedInstanceCalculator';
import SlackHelper from '../services/slackHelper';
import ResourceProvider from '../providers/resourceProvider';

export default class App {
    constructor(
        private resourceProviders: ResourceProvider[],
        private reservedInstanceCalculator: ReservedInstanceCalculator,
        private slackHelper: SlackHelper) {
    }

    async Run(): Promise<void> {
        let slackMessage: SlackMessage = {
            username: 'AWS Reserved Instance Status Check',
            attachments: []
        };

        for (let provider of this.resourceProviders) {
            let reservedInstances = await provider.describeActiveReservedInstances();
            let runningInstances = await provider.describeRunningInstances();

            let notReservedInstances = this.reservedInstanceCalculator.getInstanceNotReserved(reservedInstances, runningInstances);

            let slackAttachment = this.slackHelper.formatInstanceToSlackAttachment(provider.ResourceType, notReservedInstances);
            slackAttachment.footer = provider.getInstancesUrl(notReservedInstances);
            slackMessage.attachments.push(slackAttachment);
        }
        await this.slackHelper.sendToSlack(slackMessage);
    }
}