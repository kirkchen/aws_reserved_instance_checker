import EC2Service from './ec2Service';
import { expect, use } from 'chai';
import * as chaiAsPromise from 'chai-as-promised';
import { sandbox } from 'sinon';
import * as AWS from 'aws-sdk';

use(chaiAsPromise);

describe('EC2Service', () => {
    let region = 'ap-northeast-1';
    let environment: sinon.SinonSandbox;
    let ec2Stub: sinon.SinonStub;
    beforeEach(() => {
        environment = sandbox.create();
        ec2Stub = environment.stub(AWS, "EC2")
    })

    afterEach(() => {
        environment.restore();
    })

    describe('#describeActiveReservedInstances', () => {
        let describeReservedInstancesStub: sinon.SinonStub;
        beforeEach(() => {
            describeReservedInstancesStub = environment.stub();
            ec2Stub.prototype.describeReservedInstances = describeReservedInstancesStub;
        })

        it('should initial EC2 with region', () => {
            ec2Stub.withArgs({ region: region });

            let ec2Service = new EC2Service(region);
            let reservedInstances = ec2Service.describeActiveReservedInstances();

            expect(ec2Stub.calledOnce).to.be.true;
            expect(ec2Stub.getCall(0).args[0]).to.be.eql({ region: region });
        });

        it('should return reserved instances if has data', (done) => {
            let reservedInstanceList: AWS.EC2.DescribeReservedInstancesResult = {
                ReservedInstances: [
                    {
                        AvailabilityZone: 'ap-northeast-1',
                        InstanceType: 't2.medium',
                        InstanceCount: 2
                    },
                    {
                        AvailabilityZone: 'ap-northeast-1',
                        InstanceType: 't2.large',
                        InstanceCount: 4
                    },
                ]
            };
            let expected: ReservedInstanceData[] = [
                {
                    AvailabilityZone: 'ap-northeast-1',
                    InstanceType: 't2.medium',
                    InstanceCount: 2
                },
                {
                    AvailabilityZone: 'ap-northeast-1',
                    InstanceType: 't2.large',
                    InstanceCount: 4
                }
            ]
            describeReservedInstancesShouldReturns(reservedInstanceList)

            let ec2Service = new EC2Service(region);
            let reservedInstances = ec2Service.describeActiveReservedInstances();

            expect(reservedInstances).to.eventually.deep.equal(expected).notify(done);
        });

        it('should return empty array if no data exists', (done) => {
            let reservedInstanceList: AWS.EC2.DescribeReservedInstancesResult = {
                ReservedInstances: undefined
            };
            let expected: ReservedInstanceData[] = [];
            describeReservedInstancesShouldReturns(reservedInstanceList)

            let ec2Service = new EC2Service(region);
            let reservedInstances = ec2Service.describeActiveReservedInstances();

            expect(reservedInstances).to.eventually.have.members(expected).notify(done);
        })

        it('should be rejected if errro occurs', (done) => {
            let error = new Error('Error occors');
            describeReservedInstancesShouldThrows(error);

            let ec2Service = new EC2Service(region);
            let reservedInstances = ec2Service.describeActiveReservedInstances();

            expect(reservedInstances).to.be.rejectedWith(error).notify(done);
        })

        function describeReservedInstancesShouldReturns(reservedInstances: AWS.EC2.DescribeReservedInstancesResult) {
            describeReservedInstancesStub.callsArgWith(1, null, reservedInstances);
        }

        function describeReservedInstancesShouldThrows(error: Error) {
            describeReservedInstancesStub.callsArgWith(1, error, null);
        }
    })

    describe('#describeRunningInstances', () => {
        let describeInstancesStub: sinon.SinonStub;
        beforeEach(() => {
            describeInstancesStub = environment.stub();
            ec2Stub.prototype.describeInstances = describeInstancesStub;
        })

        it('should initial EC2 with region', () => {
            ec2Stub.withArgs({ region: region });

            let ec2Service = new EC2Service(region);
            let reservedInstances = ec2Service.describeRunningInstances();

            expect(ec2Stub.calledOnce).to.be.true;
            expect(ec2Stub.getCall(0).args[0]).to.be.eql({ region: region });
        });

        it('should return running instances if has data', (done) => {
            let runningInstanceList: AWS.EC2.DescribeInstancesResult = {
                Reservations: [
                    {
                        Instances: [
                            {
                                LaunchTime: new Date('2017-02-07T08:52:21.000Z'),
                                InstanceId: 'i-05e6b03e39edd7162',
                                InstanceType: "t2.medium",
                                Placement: {
                                    AvailabilityZone: "ap-northeast-1a"
                                },
                                Tags: [
                                    {
                                        Value: "instance-a",
                                        Key: "Name"
                                    }
                                ]
                            }
                        ]
                    },
                    {
                        Instances: [
                            {
                                LaunchTime: new Date('2017-02-07T08:52:21.000Z'),
                                InstanceId: 'i-07d1a68260e73015c',
                                InstanceType: "t2.medium",
                                Placement: {
                                    AvailabilityZone: "ap-northeast-1c"
                                },
                                Tags: [
                                    {
                                        Value: "instance-b",
                                        Key: "Name"
                                    }
                                ]
                            }
                        ]
                    }
                ]
            };
            let expected: InstanceData[] = [
                {
                    LaunchTime: new Date('2017-02-07T08:52:21.000Z'),
                    InstanceId: 'i-05e6b03e39edd7162',
                    InstanceType: "t2.medium",
                    AvailabilityZone: "ap-northeast-1a",
                    InstanceName: "instance-a"
                }, {
                    LaunchTime: new Date('2017-02-07T08:52:21.000Z'),
                    InstanceId: 'i-07d1a68260e73015c',
                    InstanceType: "t2.medium",
                    AvailabilityZone: "ap-northeast-1c",
                    InstanceName: "instance-b",
                }
            ]
            describeInstancesShouldReturns(runningInstanceList)

            let ec2Service = new EC2Service(region);
            let actual = ec2Service.describeRunningInstances();

            expect(actual).to.eventually.have.deep.equal(expected).notify(done);
        });

        it('should return running instances and filter null instance if has data', (done) => {
            let runningInstanceList: AWS.EC2.DescribeInstancesResult = {
                Reservations: [
                    {
                        Instances: [
                            {
                                LaunchTime: new Date('2017-02-07T08:52:21.000Z'),
                                InstanceId: 'i-05e6b03e39edd7162',
                                InstanceType: "t2.medium",
                                Placement: {
                                    AvailabilityZone: "ap-northeast-1a"
                                },
                                Tags: [
                                    {
                                        Value: "instance-a",
                                        Key: "Name"
                                    }
                                ]
                            }
                        ]
                    },
                    {
                        Instances: undefined
                    }
                ]
            };
            let expected: InstanceData[] = [
                {
                    LaunchTime: new Date('2017-02-07T08:52:21.000Z'),
                    InstanceId: 'i-05e6b03e39edd7162',
                    InstanceType: "t2.medium",
                    AvailabilityZone: "ap-northeast-1a",
                    InstanceName: "instance-a"

                }
            ]
            describeInstancesShouldReturns(runningInstanceList)

            let ec2Service = new EC2Service(region);
            let actual = ec2Service.describeRunningInstances();

            expect(actual).to.eventually.have.deep.equal(expected).notify(done);
        });

        it('should return empty array if no data exists', (done) => {
            let runningInstanceList: AWS.EC2.DescribeInstancesResult = {
                Reservations: undefined
            };
            let expected: InstanceData[] = []
            describeInstancesShouldReturns(runningInstanceList)

            let ec2Service = new EC2Service(region);
            let actual = ec2Service.describeRunningInstances();

            expect(actual).to.eventually.have.deep.equal(expected).notify(done);
        });

        it('should be rejected if errro occurs', (done) => {
            let error = new Error('Error occors');
            describeRunningInstancesShouldThrows(error);

            let ec2Service = new EC2Service(region);
            let reservedInstances = ec2Service.describeRunningInstances();

            expect(reservedInstances).to.be.rejectedWith(error).notify(done);
        })

        function describeInstancesShouldReturns(runningInstanceList: AWS.EC2.DescribeInstancesResult) {
            describeInstancesStub.callsArgWith(1, null, runningInstanceList);
        }

        function describeRunningInstancesShouldThrows(error: Error) {
            describeInstancesStub.callsArgWith(1, error, null);
        }
    })
});