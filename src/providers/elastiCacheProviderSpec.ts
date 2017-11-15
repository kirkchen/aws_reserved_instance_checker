import ElastiCacheProvider from './elastiCacheProvider';
import { expect, use } from 'chai';
import * as chaiAsPromise from 'chai-as-promised';
import { sandbox } from 'sinon';
import * as AWS from 'aws-sdk';

use(chaiAsPromise);

describe('elastiCacheProvider', () => {
    let region = 'ap-northeast-1';
    let environment: sinon.SinonSandbox;
    let elsatiCacheStub: sinon.SinonStub;
    beforeEach(() => {
        environment = sandbox.create();
        elsatiCacheStub = environment.stub(AWS, "ElastiCache")
    })

    afterEach(() => {
        environment.restore();
    })

    describe('#describeActiveReservedInstances', () => {
        let describeReservedInstancesStub: sinon.SinonStub;
        beforeEach(() => {
            describeReservedInstancesStub = environment.stub();
            elsatiCacheStub.prototype.describeReservedCacheNodes = describeReservedInstancesStub;
        })

        it('should initial ElastiCache with region', () => {
            elsatiCacheStub.withArgs({ region: region });

            let elastiCacheProvider = new ElastiCacheProvider(region);
            let reservedInstances = elastiCacheProvider.describeActiveReservedInstances();

            expect(elsatiCacheStub.calledOnce).to.be.true;
            expect(elsatiCacheStub.getCall(0).args[0]).to.be.eql({ region: region });
        });

        it('should return reserved instances if has data', (done) => {
            let reservedInstanceList: AWS.ElastiCache.ReservedCacheNodeMessage = {
                ReservedCacheNodes: [
                    {
                        CacheNodeType: 'cache.t2.medium',
                        CacheNodeCount: 2,
                        State: 'active'
                    },
                    {
                        CacheNodeType: 'cache.r3.large',
                        CacheNodeCount: 4,
                        State: 'active'
                    },
                ]
            };
            let expected: ReservedInstanceData[] = [
                {
                    AvailabilityZone: '',
                    InstanceType: 'cache.t2.medium',
                    InstanceCount: 2,
                    CompareKey: 'cache.t2.medium',
                },
                {
                    AvailabilityZone: '',
                    InstanceType: 'cache.r3.large',
                    InstanceCount: 4,
                    CompareKey: 'cache.r3.large',
                }
            ]
            describeReservedInstancesShouldReturns(reservedInstanceList)

            let elastiCacheProvider = new ElastiCacheProvider(region);
            let reservedInstances = elastiCacheProvider.describeActiveReservedInstances();

            expect(reservedInstances).to.eventually.deep.equal(expected).notify(done);
        });

        it('should return reserved instances with active state', (done) => {
            let reservedInstanceList: AWS.ElastiCache.Types.ReservedCacheNodeMessage = {
               ReservedCacheNodes: [
                    {
                        CacheNodeType: 'cache.t2.medium',
                        CacheNodeCount: 2,
                        State: 'active'
                    },
                    {
                        CacheNodeType: 'cache.r3.large',
                        CacheNodeCount: 4,
                        State: 'retired'
                    },
                ]
            };
            let expected: ReservedInstanceData[] = [
                {
                    AvailabilityZone: '',
                    InstanceType: 'cache.t2.medium',
                    InstanceCount: 2,
                    CompareKey: 'cache.t2.medium',
                }
            ];
            describeReservedInstancesShouldReturns(reservedInstanceList)

            let elastiCacheProvider = new ElastiCacheProvider(region);
            let reservedInstances = elastiCacheProvider.describeActiveReservedInstances();

            expect(reservedInstances).to.eventually.deep.equal(expected).notify(done);
        });


        it('should return empty array if no data exists', (done) => {
            let reservedInstanceList: AWS.ElastiCache.ReservedCacheNodeMessage = {
                ReservedCacheNodes: undefined
            };
            let expected: ReservedInstanceData[] = [];
            describeReservedInstancesShouldReturns(reservedInstanceList)

            let elastiCacheProvider = new ElastiCacheProvider(region);
            let reservedInstances = elastiCacheProvider.describeActiveReservedInstances();

            expect(reservedInstances).to.eventually.have.members(expected).notify(done);
        })

        it('should be rejected if errro occurs', (done) => {
            let error = new Error('Error occors');
            describeReservedInstancesShouldThrows(error);

            let elastiCacheProvider = new ElastiCacheProvider(region);
            let reservedInstances = elastiCacheProvider.describeActiveReservedInstances();

            expect(reservedInstances).to.be.rejectedWith(error).notify(done);
        })

        function describeReservedInstancesShouldReturns(reservedInstances: AWS.ElastiCache.ReservedCacheNodeMessage) {
            describeReservedInstancesStub.callsArgWith(1, null, reservedInstances);
        }

        function describeReservedInstancesShouldThrows(error: Error) {
            describeReservedInstancesStub.callsArgWith(1, error, null);
        }
    });

    describe('#describeRunningInstances', () => {
        let describeInstancesStub: sinon.SinonStub;
        beforeEach(() => {
            describeInstancesStub = environment.stub();
            elsatiCacheStub.prototype.describeCacheClusters = describeInstancesStub;
        })

        it('should initial EC2 with region', () => {
            elsatiCacheStub.withArgs({ region: region });

            let elastiCacheProvider = new ElastiCacheProvider(region);
            let reservedInstances = elastiCacheProvider.describeRunningInstances();

            expect(elsatiCacheStub.calledOnce).to.be.true;
            expect(elsatiCacheStub.getCall(0).args[0]).to.be.eql({ region: region });
        });

        it('should return running instances if has data', (done) => {
            let runningInstanceList: AWS.ElastiCache.Types.CacheClusterMessage = {
                CacheClusters: [
                    {
                        CacheClusterCreateTime: new Date('2017-02-07T08:52:21.000Z'),
                        CacheClusterId: 'redis-001',
                        CacheNodeType: "cache.t2.medium"
                    },
                    {
                        CacheClusterCreateTime: new Date('2017-02-07T08:52:21.000Z'),
                        CacheClusterId: 'redis-002',
                        CacheNodeType: "cache.t2.large",
                    },
                ]
            };
            let expected: InstanceData[] = [
                {
                    GroupKey: 'cache.t2.medium',
                    LaunchTime: new Date('2017-02-07T08:52:21.000Z'),
                    InstanceId: 'redis-001',
                    InstanceType: "cache.t2.medium",
                    AvailabilityZone: "",
                    InstanceName: "redis-001",
                    CompareKey: "cache.t2.medium",
                }, {
                    GroupKey: 'cache.t2.large',
                    LaunchTime: new Date('2017-02-07T08:52:21.000Z'),
                    InstanceId: 'redis-002',
                    InstanceType: "cache.t2.large",
                    AvailabilityZone: "",
                    InstanceName: "redis-002",
                    CompareKey: "cache.t2.large",
                }
            ]
            describeInstancesShouldReturns(runningInstanceList)

            let elastiCacheProvider = new ElastiCacheProvider(region);
            let actual = elastiCacheProvider.describeRunningInstances();

            expect(actual).to.eventually.have.deep.equal(expected).notify(done);
        });

        it('should return empty array if no data exists', (done) => {
            let runningInstanceList: AWS.ElastiCache.Types.CacheClusterMessage = {
                CacheClusters: undefined
            };
            let expected: InstanceData[] = []
            describeInstancesShouldReturns(runningInstanceList)

            let elastiCacheProvider = new ElastiCacheProvider(region);
            let actual = elastiCacheProvider.describeRunningInstances();

            expect(actual).to.eventually.have.deep.equal(expected).notify(done);
        });

        it('should be rejected if errro occurs', (done) => {
            let error = new Error('Error occors');
            describeRunningInstancesShouldThrows(error);

            let elastiCacheProvider = new ElastiCacheProvider(region);
            let reservedInstances = elastiCacheProvider.describeRunningInstances();

            expect(reservedInstances).to.be.rejectedWith(error).notify(done);
        })

        function describeInstancesShouldReturns(runningInstanceList: AWS.ElastiCache.Types.CacheClusterMessage) {
            describeInstancesStub.callsArgWith(1, null, runningInstanceList);
        }

        function describeRunningInstancesShouldThrows(error: Error) {
            describeInstancesStub.callsArgWith(1, error, null);
        }
    });

    describe('#getInstancesUrl', () => {
        it('should return url for instance', () => {
           let instanceDatas: InstanceData[] = [
                {
                    GroupKey: 'cache.t2.medium',
                    LaunchTime: new Date('2017-02-07T08:52:21.000Z'),
                    InstanceId: 'redis-001',
                    InstanceType: "cache.t2.medium",
                    AvailabilityZone: "",
                    InstanceName: "redis-001"
                }, {
                    GroupKey: 'cache.t2.large',
                    LaunchTime: new Date('2017-02-07T08:52:21.000Z'),
                    InstanceId: 'redis-002',
                    InstanceType: "cache.t2.large",
                    AvailabilityZone: "",
                    InstanceName: "redis-002",
                }
            ];
            let expected = "<https://ap-northeast-1.console.aws.amazon.com/elasticache/home?region=ap-northeast-1|Click to details>"

            let elastiCacheProvider = new ElastiCacheProvider(region);
            let actual = elastiCacheProvider.getInstancesUrl(instanceDatas);

            expect(actual).to.equal(expected);
        });

        it('should return undefined if no data', () => {
            let instanceDatas: InstanceData[] = [];

            let elastiCacheProvider = new ElastiCacheProvider(region);
            let actual = elastiCacheProvider.getInstancesUrl(instanceDatas);

            expect(actual).to.undefined;
        });
    }); 
});