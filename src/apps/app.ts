import EC2Service from '../services/ec2Service';
import ReservedInstanceCalculator from '../services/reservedInstanceCalculator';
import SlackHelper from '../services/slackHelper';

export default class App {
    constructor(
        private ec2Service: EC2Service,
        private reservedInstanceCalculator: ReservedInstanceCalculator,
        private slackHelper: SlackHelper) {
    }

    async Run(): Promise<void> {
        let reservedInstances = await this.ec2Service.describeActiveReservedInstances();
        let runningInstances = await this.ec2Service.describeRunningInstances();

        let notReservedInstances = this.reservedInstanceCalculator.getInstanceNotReserved(reservedInstances, runningInstances);

        let formattedSlackMessage = this.slackHelper.formatInstanceToSlackAttachment(notReservedInstances);
        await this.slackHelper.sendToSlack(formattedSlackMessage);
    }
}