import { RDS } from 'aws-sdk';
import { ResourceType } from '../providers/resourceType';
import '../models/instanceData';
import '../models/reservedInstanceData';
import ResourceProvider from '../providers/resourceProvider';

export default class RDSService implements ResourceProvider {
    constructor(
        private region: string) {
    }

    ResourceType: ResourceType = ResourceType.RDS;

    describeActiveReservedInstances(): Promise<ReservedInstanceData[]> {
        let rds = new RDS({ region: this.region });

        let params: RDS.DescribeReservedDBInstancesMessage = {}

        return new Promise((resolve, reject) => {
            rds.describeReservedDBInstances(params, (err, data) => {
                if (err) {
                    reject(err);
                    return;
                }

                if (data.ReservedDBInstances) {
                    let reservedInstances = data.ReservedDBInstances
                        .filter((dbInstance) => dbInstance.State === 'active')
                        .map((dbInstance) => {
                            let reservedInstance: ReservedInstanceData = {
                                AvailabilityZone: `MultiAZ-${dbInstance.MultiAZ}`,
                                InstanceType: dbInstance.DBInstanceClass!,
                                InstanceCount: dbInstance.DBInstanceCount!
                            }
                            return reservedInstance;
                        });

                    resolve(reservedInstances);
                    return;
                }

                resolve([]);
            })
        });
    }

    describeRunningInstances(): Promise<InstanceData[]> {
        let rds = new RDS({ region: this.region });
        let params: RDS.Types.DescribeDBInstancesMessage = {}

        return new Promise((resolve, reject) => {
            rds.describeDBInstances(params, (err, data) => {
                if (err) {
                    reject(err);
                    return;
                }

                if (data.DBInstances) {
                    let result: (InstanceData | undefined)[] = data.DBInstances
                        .filter((dbInstance) => dbInstance.DBInstanceStatus === 'available')
                        .map((dbInstance) => {
                            let instanceData: InstanceData = {
                                InstanceId: dbInstance.DbiResourceId!,
                                InstanceType: dbInstance.DBInstanceClass!,
                                LaunchTime: dbInstance.InstanceCreateTime!,
                                AvailabilityZone: `MultiAZ-${dbInstance.MultiAZ}`,
                                InstanceName: dbInstance.DBInstanceIdentifier
                            };

                            return instanceData;
                        })
                        .filter((instance) => !!instance);

                    resolve(result as InstanceData[]);
                    return;
                }

                resolve([]);
            })
        });
    }
}