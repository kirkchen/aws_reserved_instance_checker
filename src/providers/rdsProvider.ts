import { RDS } from 'aws-sdk';
import { ResourceType } from '../providers/resourceType';
import '../models/instanceData';
import '../models/reservedInstanceData';
import ResourceProvider from '../providers/resourceProvider';

export default class RDSProvider implements ResourceProvider {
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
                                AvailabilityZone: '',
                                InstanceType: dbInstance.DBInstanceClass!,
                                InstanceCount: dbInstance.DBInstanceCount!,
                                CompareKey: `MultiAZ-${dbInstance.MultiAZ}`
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
                                GroupKey: `${dbInstance.DBInstanceClass} ${dbInstance.MultiAZ ? 'with' : 'without'} MultiAZ`,
                                InstanceId: dbInstance.DbiResourceId!,
                                InstanceType: dbInstance.DBInstanceClass!,
                                LaunchTime: dbInstance.InstanceCreateTime!,
                                AvailabilityZone: '',
                                InstanceName: dbInstance.DBInstanceIdentifier,
                                CompareKey: `MultiAZ-${dbInstance.MultiAZ}`
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

    getInstancesUrl(instances: InstanceData[]): string | undefined {
        if (instances.length === 0) {
            return undefined;
        }

        let result = `<https://${this.region}.console.aws.amazon.com/rds/home?region=${this.region}|Click to details>`

        return result;
    }
}