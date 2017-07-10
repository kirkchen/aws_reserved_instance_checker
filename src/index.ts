import EC2Service from './services/ec2Service';
import ReservedInstanceCalculator from './services/reservedInstanceCalculator';
import SlackHelper from './services/slackHelper';
import App from './apps/app';

export default function CheckAwsReservedInstance() {
    let webhookUrl: string | undefined = process.env.RICHECKER_WEBHOOK_URL;
    let region: string = process.env.RICHECKER_REGION || 'us-east-1';

    if (!webhookUrl) {
        throw new Error('Webhook url is not set, please check your environment variable RICHECKER_WEBHOOK_URL');
    }
    new App(
        new EC2Service(region), 
        new ReservedInstanceCalculator(), 
        new SlackHelper(region, webhookUrl)).Run();
}

CheckAwsReservedInstance();