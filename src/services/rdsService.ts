import { RDS } from 'aws-sdk';
import '../models/instanceData';
import '../models/reservedInstanceData';

export default class RDSService {
    constructor(
        private region: string) {
    }

    describeActiveReservedInstances(): Promise<ReservedInstanceData[]> {
        let rds = new RDS({ region: this.region });

        let params: RDS.DescribeDBInstancesMessage = {
            Filters: [
                {
                    Name: 'state',
                    Values: [
                        'active'
                    ]
                }
            ]
        }

        return new Promise((resolve, reject) => {
            rds.describeReservedDBInstances(params, (err, data) => {
                if (err) {
                    reject(err);
                    return;
                }

                if (data.ReservedDBInstances) {
                    let reservedInstances = data.ReservedDBInstances.map((dbInstance) => {
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
        let params: RDS.Types.DescribeDBInstancesMessage = {
            Filters: [
                {
                    Name: 'instance-state-name',
                    Values: [
                        'running'
                    ]
                }
            ]
        }

        return new Promise((resolve, reject) => {
            rds.describeDBInstances(params, (err, data) => {
                if (err) {
                    reject(err);
                    return;
                }

                if (data.DBInstances) {
                    let result: (InstanceData | undefined)[] = data.DBInstances
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