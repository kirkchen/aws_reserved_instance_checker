import RDSService from './rdsService';
import { expect, use } from 'chai';
import * as chaiAsPromise from 'chai-as-promised';
import { sandbox } from 'sinon';
import * as AWS from 'aws-sdk';

use(chaiAsPromise);

describe('RDSService', () => {
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

            let rdsService = new RDSService(region);
            let reservedInstances = rdsService.describeActiveReservedInstances();

            expect(rdsStub.calledOnce).to.be.true;
            expect(rdsStub.getCall(0).args[0]).to.be.eql({ region: region });
        });

        it('should return reserved instances if has data', (done) => {
            let reservedInstanceList: AWS.RDS.Types.ReservedDBInstanceMessage = {
                ReservedDBInstances: [
                    {
                        MultiAZ: true,
                        DBInstanceClass: "db.r3.8xlarge",
                        DBInstanceCount: 1
                    },
                    {
                        MultiAZ: false,
                        DBInstanceClass: "db.r3.large",
                        DBInstanceCount: 2
                    },
                ]
            };
            let expected: ReservedInstanceData[] = [
                {
                    AvailabilityZone: 'MultiAZ-true',
                    InstanceType: 'db.r3.8xlarge',
                    InstanceCount: 1
                },
                {
                    AvailabilityZone: 'MultiAZ-false',
                    InstanceType: 'db.r3.large',
                    InstanceCount: 2
                }
            ]
            describeReservedInstancesShouldReturns(reservedInstanceList)

            let rdsService = new RDSService(region);
            let reservedInstances = rdsService.describeActiveReservedInstances();

            expect(reservedInstances).to.eventually.deep.equal(expected).notify(done);
        });

        it('should return empty array if no data exists', (done) => {
            let reservedInstanceList: AWS.RDS.ReservedDBInstanceMessage = {
                ReservedDBInstances: undefined
            };
            let expected: ReservedInstanceData[] = [];
            describeReservedInstancesShouldReturns(reservedInstanceList)

            let rdsService = new RDSService(region);
            let reservedInstances = rdsService.describeActiveReservedInstances();

            expect(reservedInstances).to.eventually.have.members(expected).notify(done);
        })

        it('should be rejected if errro occurs', (done) => {
            let error = new Error('Error occors');
            describeReservedInstancesShouldThrows(error);

            let rdsService = new RDSService(region);
            let reservedInstances = rdsService.describeActiveReservedInstances();

            expect(reservedInstances).to.be.rejectedWith(error).notify(done);
        })

        function describeReservedInstancesShouldReturns(reservedInstances: AWS.RDS.Types.ReservedDBInstanceMessage) {
            describeReservedDBInstancesStub.callsArgWith(1, null, reservedInstances);
        }

        function describeReservedInstancesShouldThrows(error: Error) {
            describeReservedDBInstancesStub.callsArgWith(1, error, null);
        }
    });
});