import EC2Provider from './providers/ec2Provider';
import RDSProvider from './providers/rdsProvider';
import ReservedInstanceCalculator from './services/reservedInstanceCalculator';
import SlackHelper from './services/slackHelper';
import App from './apps/app';

export default function CheckAwsReservedInstance(): Promise<void> {
    let webhookUrl: string | undefined = process.env.RICHECKER_WEBHOOK_URL;
    let region: string = process.env.RICHECKER_REGION || 'us-east-1';
    let channel: string | undefined = process.env.RICHECKER_SLACK_CHANNEL;

    if (!webhookUrl) {
        throw new Error('Webhook url is not set, please check your environment variable RICHECKER_WEBHOOK_URL');
    }
    let result = new App(
        [
            new EC2Provider(region), 
            new RDSProvider(region)
        ],
        new ReservedInstanceCalculator(), 
        new SlackHelper(region, webhookUrl, channel)).Run();

    return result;
}

CheckAwsReservedInstance();