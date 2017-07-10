import '../models/instanceData';
import '../models/reservedInstanceData';
import { EC2 } from 'aws-sdk';

export default class ReservedInstanceCalculator {
    getInstanceNotReserved(reservedInstanceList: ReservedInstanceData[], runningInstanceList: InstanceData[]): InstanceData[] {
        let instancesNotReserved: InstanceData[] = [];

        for (let runningInstance of runningInstanceList) {
            let isInstanceReserved: boolean = false;
            for (let reservedInstance of reservedInstanceList) {
                if (reservedInstance.InstanceType === runningInstance.InstanceType &&
                    reservedInstance.AvailabilityZone === runningInstance.AvailabilityZone) {
                    reservedInstance.InstanceCount--;
                    isInstanceReserved = true;
                    break;
                }
            }

            if (!isInstanceReserved) {
                instancesNotReserved.push(runningInstance);
            }
        }

        return instancesNotReserved;
    }
}