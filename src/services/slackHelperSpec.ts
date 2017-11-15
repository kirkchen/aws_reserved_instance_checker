import { expect, use } from 'chai';
import * as chaiAsPromise from 'chai-as-promised';
import { sandbox } from 'sinon';
import SlackHelper from './slackHelper';
import * as SlackClient from '@slack/client';
import { ResourceType } from '../providers/resourceType';
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
            let resourceType = ResourceType.EC2; 
            let instanceDataList: InstanceData[] = [
                {
                    GroupKey: 't2.medium @ ap-northeast-1a',
                    LaunchTime: new Date('2017-02-07T08:52:21.000Z'),
                    InstanceId: 'i-05e6b03e39edd7162',
                    InstanceType: "t2.medium",
                    AvailabilityZone: "ap-northeast-1a",
                    InstanceName: "instance-a"
                },
                {
                    GroupKey: 'c4.large @ ap-northeast-1c',
                    LaunchTime: new Date('2017-02-07T08:52:21.000Z'),
                    InstanceId: 'i-07d1a68260e73015c',
                    InstanceType: "c4.large",
                    AvailabilityZone: "ap-northeast-1c",
                    InstanceName: "instance-b",
                },
                {
                    GroupKey: 't2.medium @ ap-northeast-1a',
                    LaunchTime: new Date('2017-02-07T08:52:21.000Z'),
                    InstanceId: 'i-07d1a6fdserf3015c',
                    InstanceType: "t2.medium",
                    AvailabilityZone: "ap-northeast-1a",
                    InstanceName: "instance-c",
                }
            ];
            let expected: SlackMessageAttachment =
                {
                    title: "EC2 instances not in reserved instance list",
                    color: "warning",
                    fields: [
                        {
                            title: 't2.medium @ ap-northeast-1a',
                            value: 'instance-a, instance-c',
                            short: true
                        },
                        {
                            title: 'c4.large @ ap-northeast-1c',
                            value: 'instance-b',
                            short: true
                        }
                    ]
                }


            slackHelper = new SlackHelper(region, webhookUrl);
            let actual = slackHelper.formatInstanceToSlackAttachment(resourceType, instanceDataList);

            expect(actual).to.be.deep.equal(expected);
        });

        it('should display success color and message if no data to alarm', () => {
            let resourceType = ResourceType.EC2; 
            let instanceDataList: InstanceData[] = [
            ];
            let expected: SlackMessageAttachment =
                {
                    title: "EC2 instances are all in reserved instance list :tada::tada::tada:",
                    color: "good",
                    fields: [
                    ]
                }

            slackHelper = new SlackHelper(region, webhookUrl);
            let actual = slackHelper.formatInstanceToSlackAttachment(resourceType, instanceDataList);

            expect(actual).to.be.deep.equal(expected);
        });

        it('should change title with correct resource type', () => {
            let resourceType = ResourceType.RDS; 
            let instanceDataList: InstanceData[] = [
                {
                    GroupKey: 'db.t2.large with MultiAZ',
                    LaunchTime: new Date('2017-02-07T08:52:21.000Z'),
                    InstanceId: 'db-JHISHIRLA3IDENBHCLVTWQJVEM',
                    InstanceType: "db.t2.large",
                    AvailabilityZone: "MultiAZ-true",
                    InstanceName: "db-1"
                }
            ];
            let expected: SlackMessageAttachment =
                {
                    title: "RDS instances not in reserved instance list",
                    color: "warning",
                    fields: [
                        {
                            title: 'db.t2.large with MultiAZ',
                            value: 'db-1',
                            short: true
                        }
                    ]
                }


            slackHelper = new SlackHelper(region, webhookUrl);
            let actual = slackHelper.formatInstanceToSlackAttachment(resourceType, instanceDataList);

            expect(actual).to.be.deep.equal(expected);
        });

        it('should change title with excluded if resource type is exclude', () => {
            let resourceType = ResourceType.Excluded; 
            let instanceDataList: InstanceData[] = [
                {
                    GroupKey: 'db.t2.large with MultiAZ',
                    LaunchTime: new Date('2017-02-07T08:52:21.000Z'),
                    InstanceId: 'db-JHISHIRLA3IDENBHCLVTWQJVEM',
                    InstanceType: "db.t2.large",
                    AvailabilityZone: "MultiAZ-true",
                    InstanceName: "db-1"
                }
            ];
            let expected: SlackMessageAttachment =
                {
                    title: "Instances which is excluded",
                    color: "good",
                    fields: [
                        {
                            title: 'db.t2.large with MultiAZ',
                            value: 'db-1',
                            short: true
                        }
                    ]
                }


            slackHelper = new SlackHelper(region, webhookUrl);
            let actual = slackHelper.formatInstanceToSlackAttachment(resourceType, instanceDataList);

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

        it('should use channel if channel exist', (done) => {
            let channel = '#my-channel'
            let message: SlackMessage = {
                attachments: []
            };
            sendStub.callsArgWith(1, null, null);

            slackHelper = new SlackHelper(region, webhookUrl, channel);
            let actual = slackHelper.sendToSlack(message);

            actual.then(()=>{
                expect(message).to.eql({
                   channel: channel, 
                   attachments: [] 
                });
                done();
            })
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