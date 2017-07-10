import { expect } from 'chai';
import ReservedInstanceCalculator from './reservedInstanceCalculator';
import '../models/reservedInstanceData';
import '../models/instanceData';


describe('ReservedInstanceCalculator', () => {
    let reservedInstanceCalculator = new ReservedInstanceCalculator();

    describe('#New', () => {
        it('should success when new instance', () => {
            expect(reservedInstanceCalculator).to.be.instanceof(ReservedInstanceCalculator);
        })
    })

    describe('#getInstanceNotReserved', () => {
        it('should return instance not in reserved instance list', () => {
            let reservedInstanceList: ReservedInstanceData[] = [
                {
                    InstanceType: "t2.medium",
                    AvailabilityZone: "ap-northeast-1a",
                    InstanceCount: 2
                }
            ]
            let instanceList: InstanceData[] = [
                {
                    InstanceId: 'i-05e6b03e39edd7162',
                    InstanceType: 't2.medium',
                    AvailabilityZone: "ap-northeast-1a",
                    LaunchTime: new Date(),
                    InstanceName: 'instance a'
                },
                {
                    InstanceId: 'i-07d1a68260e73015c',
                    InstanceType: 'c4.large',
                    AvailabilityZone: "ap-northeast-1a",
                    LaunchTime: new Date(),
                    InstanceName: 'instance b'
                }
            ]
            let expected:  InstanceData[] = [
                {
                    InstanceId: 'i-07d1a68260e73015c',
                    InstanceType: 'c4.large',
                    AvailabilityZone: "ap-northeast-1a",
                    LaunchTime: new Date(),
                    InstanceName: 'instance b'
                } 
            ];

            let actual = reservedInstanceCalculator.getInstanceNotReserved(reservedInstanceList, instanceList);

            expect(actual).to.be.deep.equal(expected);
        })

    })
})