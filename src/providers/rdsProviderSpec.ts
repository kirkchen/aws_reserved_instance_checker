import RDSProvider from './rdsProvider';
import { expect, use } from 'chai';
import * as chaiAsPromise from 'chai-as-promised';
import { sandbox } from 'sinon';
import * as AWS from 'aws-sdk';

use(chaiAsPromise);

describe('RDSProvider', () => {
    let region = 'ap-northeast-1';
    let environment: sinon.SinonSandbox;
    let rdsStub: sinon.SinonStub;
    beforeEach(() => {
        environment = sandbox.create();
        rdsStub = environment.stub(AWS, "RDS")
    })

    afterEach(() => {
        environment.restore();
    })

    describe('#describeActiveReservedInstances', () => {
        let describeReservedDBInstancesStub: sinon.SinonStub;
        beforeEach(() => {
            describeReservedDBInstancesStub = environment.stub();
            rdsStub.prototype.describeReservedDBInstances = describeReservedDBInstancesStub;
        })

        it('should initial RDS with region', () => {
            rdsStub.withArgs({ region: region });

            let rdsProvider = new RDSProvider(region);
            let reservedInstances = rdsProvider.describeActiveReservedInstances();

            expect(rdsStub.calledOnce).to.be.true;
            expect(rdsStub.getCall(0).args[0]).to.be.eql({ region: region });
        });

        it('should return reserved instances if has data', (done) => {
            let reservedInstanceList: AWS.RDS.Types.ReservedDBInstanceMessage = {
                ReservedDBInstances: [
                    {
                        MultiAZ: true,
                        DBInstanceClass: "db.r3.8xlarge",
                        DBInstanceCount: 1,
                        State: 'active'
                    },
                    {
                        MultiAZ: false,
                        DBInstanceClass: "db.r3.large",
                        DBInstanceCount: 2,
                        State: 'active'
                    },
                ]
            };
            let expected: ReservedInstanceData[] = [
                {
                    AvailabilityZone: '',
                    InstanceType: 'db.r3.8xlarge',
                    InstanceCount: 1,
                    CompareKey: 'MultiAZ-true',
                },
                {
                    AvailabilityZone: '',
                    InstanceType: 'db.r3.large',
                    InstanceCount: 2,
                    CompareKey: 'MultiAZ-false',
                }
            ]
            describeReservedInstancesShouldReturns(reservedInstanceList)

            let rdsProvider = new RDSProvider(region);
            let reservedInstances = rdsProvider.describeActiveReservedInstances();

            expect(reservedInstances).to.eventually.deep.equal(expected).notify(done);
        });

        it('should return reserved instances with active state', (done) => {
            let reservedInstanceList: AWS.RDS.Types.ReservedDBInstanceMessage = {
                ReservedDBInstances: [
                    {
                        MultiAZ: true,
                        DBInstanceClass: "db.r3.8xlarge",
                        DBInstanceCount: 1,
                        State: 'active'
                    },
                    {
                        MultiAZ: false,
                        DBInstanceClass: "db.r3.large",
                        DBInstanceCount: 2,
                        State: 'retired'
                    },
                ]
            };
            let expected: ReservedInstanceData[] = [
                {
                    AvailabilityZone: '',
                    InstanceType: 'db.r3.8xlarge',
                    InstanceCount: 1,
                    CompareKey: 'MultiAZ-true',
                }
            ];
            describeReservedInstancesShouldReturns(reservedInstanceList)

            let rdsProvider = new RDSProvider(region);
            let reservedInstances = rdsProvider.describeActiveReservedInstances();

            expect(reservedInstances).to.eventually.deep.equal(expected).notify(done);
        });

        it('should return empty array if no data exists', (done) => {
            let reservedInstanceList: AWS.RDS.ReservedDBInstanceMessage = {
                ReservedDBInstances: undefined
            };
            let expected: ReservedInstanceData[] = [];
            describeReservedInstancesShouldReturns(reservedInstanceList)

            let rdsProvider = new RDSProvider(region);
            let reservedInstances = rdsProvider.describeActiveReservedInstances();

            expect(reservedInstances).to.eventually.have.members(expected).notify(done);
        })

        it('should be rejected if errro occurs', (done) => {
            let error = new Error('Error occors');
            describeReservedInstancesShouldThrows(error);

            let rdsProvider = new RDSProvider(region);
            let reservedInstances = rdsProvider.describeActiveReservedInstances();

            expect(reservedInstances).to.be.rejectedWith(error).notify(done);
        })

        function describeReservedInstancesShouldReturns(reservedInstances: AWS.RDS.Types.ReservedDBInstanceMessage) {
            describeReservedDBInstancesStub.callsArgWith(1, null, reservedInstances);
        }

        function describeReservedInstancesShouldThrows(error: Error) {
            describeReservedDBInstancesStub.callsArgWith(1, error, null);
        }
    });

    describe('#describeRunningInstances', () => {
        let describeDBInstancesStub: sinon.SinonStub;
        beforeEach(() => {
            describeDBInstancesStub = environment.stub();
            rdsStub.prototype.describeDBInstances = describeDBInstancesStub;
        })

        it('should initial EC2 with region', () => {
            rdsStub.withArgs({ region: region });

            let ec2Service = new RDSProvider(region);
            let reservedInstances = ec2Service.describeRunningInstances();

            expect(rdsStub.calledOnce).to.be.true;
            expect(rdsStub.getCall(0).args[0]).to.be.eql({ region: region });
        });

        it('should return running instances if has data', (done) => {
            let runningInstanceList: AWS.RDS.Types.DBInstanceMessage = {
                DBInstances: [
                    {
                        InstanceCreateTime: new Date('2017-02-07T08:52:21.000Z'),
                        DbiResourceId: 'db-JHISHIRLA3RDEIJHCLVTWQJVEM',
                        DBInstanceClass: "db.r3.2xlarge",
                        MultiAZ: true,
                        DBInstanceIdentifier: "db-1",
                        DBInstanceStatus: 'available'
                    },
                    {
                        InstanceCreateTime: new Date('2017-02-07T08:52:21.000Z'),
                        DbiResourceId: 'db-JHISHIRLA3IDENBHCLVTWQJVEM',
                        DBInstanceClass: "db.r3.large",
                        MultiAZ: false,
                        DBInstanceIdentifier: "db-2",
                        DBInstanceStatus: 'available'
                    }
                ]
            };
            let expected: InstanceData[] = [
                {
                    GroupKey: 'db.r3.2xlarge with MultiAZ',
                    LaunchTime: new Date('2017-02-07T08:52:21.000Z'),
                    InstanceId: 'db-JHISHIRLA3RDEIJHCLVTWQJVEM',
                    InstanceType: "db.r3.2xlarge",
                    AvailabilityZone: '',
                    InstanceName: "db-1",
                    CompareKey: "MultiAZ-true",
                }, {
                    GroupKey: 'db.r3.large without MultiAZ',
                    LaunchTime: new Date('2017-02-07T08:52:21.000Z'),
                    InstanceId: 'db-JHISHIRLA3IDENBHCLVTWQJVEM',
                    InstanceType: "db.r3.large",
                    AvailabilityZone: '',
                    InstanceName: "db-2",
                    CompareKey: "MultiAZ-false",
                }
            ]
            describeInstancesShouldReturns(runningInstanceList)

            let rdsProvider = new RDSProvider(region);
            let actual = rdsProvider.describeRunningInstances();

            expect(actual).to.eventually.have.deep.equal(expected).notify(done);
        });

        it('should return only insatnce with status available', (done) => {
            let runningInstanceList: AWS.RDS.Types.DBInstanceMessage = {
                DBInstances: [
                    {
                        InstanceCreateTime: new Date('2017-02-07T08:52:21.000Z'),
                        DbiResourceId: 'db-JHISHIRLA3RDEIJHCLVTWQJVEM',
                        DBInstanceClass: "db.r3.2xlarge",
                        MultiAZ: true,
                        DBInstanceIdentifier: "db-1",
                        DBInstanceStatus: 'available'
                    },
                    {
                        InstanceCreateTime: new Date('2017-02-07T08:52:21.000Z'),
                        DbiResourceId: 'db-JHISHIRLA3IDENBHCLVTWQJVEM',
                        DBInstanceClass: "db.r3.large",
                        MultiAZ: false,
                        DBInstanceIdentifier: "db-2",
                        DBInstanceStatus: 'modify'
                    }
                ]
            };
            let expected: InstanceData[] = [
                {
                    GroupKey: "db.r3.2xlarge with MultiAZ",
                    LaunchTime: new Date('2017-02-07T08:52:21.000Z'),
                    InstanceId: 'db-JHISHIRLA3RDEIJHCLVTWQJVEM',
                    InstanceType: "db.r3.2xlarge",
                    AvailabilityZone: '',
                    InstanceName: "db-1",
                    CompareKey: "MultiAZ-true",
                }
            ]
            describeInstancesShouldReturns(runningInstanceList)

            let rdsProvider = new RDSProvider(region);
            let actual = rdsProvider.describeRunningInstances();

            expect(actual).to.eventually.have.deep.equal(expected).notify(done);
        });

        it('should return empty array if no data exists', (done) => {
            let runningInstanceList: AWS.RDS.Types.DBInstanceMessage = {
                DBInstances: undefined
            };
            let expected: InstanceData[] = []
            describeInstancesShouldReturns(runningInstanceList)

            let rdsProvider = new RDSProvider(region);
            let actual = rdsProvider.describeRunningInstances();

            expect(actual).to.eventually.have.deep.equal(expected).notify(done);
        });

        it('should be rejected if errro occurs', (done) => {
            let error = new Error('Error occors');
            describeRunningInstancesShouldThrows(error);

            let rdsProvider = new RDSProvider(region);
            let reservedInstances = rdsProvider.describeRunningInstances();

            expect(reservedInstances).to.be.rejectedWith(error).notify(done);
        })

        function describeInstancesShouldReturns(runningInstanceList: AWS.RDS.Types.DBInstanceMessage) {
            describeDBInstancesStub.callsArgWith(1, null, runningInstanceList);
        }

        function describeRunningInstancesShouldThrows(error: Error) {
            describeDBInstancesStub.callsArgWith(1, error, null);
        }
    })

    describe('#getInstancesUrl', () => {
        it('should return url for instance', () => {
            let instanceDatas: InstanceData[] = [
                {
                    GroupKey: '',
                    LaunchTime: new Date('2017-02-07T08:52:21.000Z'),
                    InstanceId: 'db-JHISHIRLA3RDEIJHCLVTWQJVEM',
                    InstanceType: "db.r3.2xlarge",
                    AvailabilityZone: "MultiAZ-true",
                    InstanceName: "db-1"
                }, {
                    GroupKey: '',
                    LaunchTime: new Date('2017-02-07T08:52:21.000Z'),
                    InstanceId: 'db-JHISHIRLA3IDENBHCLVTWQJVEM',
                    InstanceType: "db.r3.large",
                    AvailabilityZone: "MultiAZ-false",
                    InstanceName: "db-2",
                }
            ]
            let expected = "<https://ap-northeast-1.console.aws.amazon.com/rds/home?region=ap-northeast-1|Click to details>"

            let rdsProvider = new RDSProvider(region);
            let actual = rdsProvider.getInstancesUrl(instanceDatas);

            expect(actual).to.equal(expected);
        });

        it('should return undefined if no data', () => {
            let instanceDatas: InstanceData[] = [];

            let rdsProvider = new RDSProvider(region);
            let actual = rdsProvider.getInstancesUrl(instanceDatas);

            expect(actual).to.undefined;
        });
    }); 
});