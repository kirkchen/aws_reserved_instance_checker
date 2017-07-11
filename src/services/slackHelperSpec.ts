import { expect, use } from 'chai';
import * as chaiAsPromise from 'chai-as-promised';
import { sandbox } from 'sinon';
import SlackHelper from './slackHelper';
import * as SlackClient from '@slack/client';
import '../models/instanceData';

use(chaiAsPromise);

describe('SlackHelper', () => {
    let region: string = 'ap-northeast-1';
    let webhookUrl: string = 'http://webhook/url'

    describe('#New', () => {
        it('should success when new instance', () => {
            let slackHelper = new SlackHelper(region, webhookUrl);

            expect(slackHelper).to.be.instanceof(SlackHelper);
        })
    })

    describe('#formatInstanceToSlackAttachment', () => {
        let slackHelper: SlackHelper;

        it('should convert instance data to slack attachment json', () => {
            let instanceDataList: InstanceData[] = [
                {
                    LaunchTime: new Date('2017-02-07T08:52:21.000Z'),
                    InstanceId: 'i-05e6b03e39edd7162',
                    InstanceType: "t2.medium",
                    AvailabilityZone: "ap-northeast-1a",
                    InstanceName: "instance-a"
                },
                {
                    LaunchTime: new Date('2017-02-07T08:52:21.000Z'),
                    InstanceId: 'i-07d1a68260e73015c',
                    InstanceType: "c4.large",
                    AvailabilityZone: "ap-northeast-1c",
                    InstanceName: "instance-b",
                },
                {
                    LaunchTime: new Date('2017-02-07T08:52:21.000Z'),
                    InstanceId: 'i-07d1a6fdserf3015c',
                    InstanceType: "t2.medium",
                    AvailabilityZone: "ap-northeast-1a",
                    InstanceName: "instance-c",
                }
            ];
            let expected: SlackMessage = {
                username: "AWS Reserved Instance Status Check",
                attachments: [
                    {
                        title: "EC2 instances not in reserved instance list",
                        color: "warning",
                        fields: [
                            {
                                title: 't2.medium @ ap-northeast-1a',
                                value: 'i-05e6b03e39edd7162, i-07d1a6fdserf3015c',
                                short: true
                            },
                            {
                                title: 'c4.large @ ap-northeast-1c',
                                value: 'i-07d1a68260e73015c',
                                short: true
                            }
                        ],
                        footer: `<https://ap-northeast-1.console.aws.amazon.com/ec2/v2/home?region=ap-northeast-1#Instances:instanceId=i-05e6b03e39edd7162,i-07d1a6fdserf3015c,i-07d1a68260e73015c;sort=instanceId|Click to details>`
                    }
                ]
            };

            slackHelper = new SlackHelper(region, webhookUrl);
            let actual = slackHelper.formatInstanceToSlackAttachment(instanceDataList);

            expect(actual).to.be.deep.equal(expected);
        });

        it('should contains channel if channel exist', () => {
            let channel = '#my-channel'
            let instanceDataList: InstanceData[] = [
                {
                    LaunchTime: new Date('2017-02-07T08:52:21.000Z'),
                    InstanceId: 'i-05e6b03e39edd7162',
                    InstanceType: "t2.medium",
                    AvailabilityZone: "ap-northeast-1a",
                    InstanceName: "instance-a"
                },
                {
                    LaunchTime: new Date('2017-02-07T08:52:21.000Z'),
                    InstanceId: 'i-07d1a68260e73015c',
                    InstanceType: "c4.large",
                    AvailabilityZone: "ap-northeast-1c",
                    InstanceName: "instance-b",
                },
                {
                    LaunchTime: new Date('2017-02-07T08:52:21.000Z'),
                    InstanceId: 'i-07d1a6fdserf3015c',
                    InstanceType: "t2.medium",
                    AvailabilityZone: "ap-northeast-1a",
                    InstanceName: "instance-c",
                }
            ];
            let expected: SlackMessage = {
                username: "AWS Reserved Instance Status Check",
                channel: channel,
                attachments: [
                    {
                        title: "EC2 instances not in reserved instance list",
                        color: "warning",
                        fields: [
                            {
                                title: 't2.medium @ ap-northeast-1a',
                                value: 'i-05e6b03e39edd7162, i-07d1a6fdserf3015c',
                                short: true
                            },
                            {
                                title: 'c4.large @ ap-northeast-1c',
                                value: 'i-07d1a68260e73015c',
                                short: true
                            }
                        ],
                        footer: `<https://ap-northeast-1.console.aws.amazon.com/ec2/v2/home?region=ap-northeast-1#Instances:instanceId=i-05e6b03e39edd7162,i-07d1a6fdserf3015c,i-07d1a68260e73015c;sort=instanceId|Click to details>`
                    }
                ]
            };

            slackHelper = new SlackHelper(region, webhookUrl, channel);
            let actual = slackHelper.formatInstanceToSlackAttachment(instanceDataList);

            expect(actual).to.be.deep.equal(expected);
        });
    });

    describe('#sendToSlack', () => {
        let slackHelper: SlackHelper;
        let environment: sinon.SinonSandbox;
        let incomingWebhookStub: sinon.SinonStub;
        let sendStub: sinon.SinonStub;

        before(() => {
            slackHelper = new SlackHelper(region, webhookUrl);
        });

        beforeEach(() => {
            environment = sandbox.create();
            incomingWebhookStub = environment.stub(SlackClient, "IncomingWebhook");
            sendStub = environment.stub();
            incomingWebhookStub.prototype.send = sendStub;
        })

        afterEach(() => {
            environment.restore();
        })

        it('should initial IncomingWebhook with webhook url', () => {
            let message: SlackMessage = {
                attachments: []
            };
            incomingWebhookStub.withArgs(webhookUrl);

            slackHelper.sendToSlack(message);

            expect(incomingWebhookStub.calledOnce).to.be.true;
            expect(incomingWebhookStub.getCall(0).args[0]).to.be.eql(webhookUrl);
        });

        it('should be fulfilled when send message success', (done) => {
            let message: SlackMessage = {
                attachments: []
            };
            sendStub.callsArgWith(1, null, null);

            let actual = slackHelper.sendToSlack(message);

            expect(actual).to.be.fulfilled.and.notify(done);
        });

        it('should be rejected when error occurs', (done) => {
            let message: SlackMessage = {
                attachments: []
            };
            let error: Error = new Error('error occurs');
            sendStub.callsArgWith(1, error, null);

            let actual = slackHelper.sendToSlack(message);

            expect(actual).to.be.rejectedWith(error).and.notify(done);
        });
    });
})