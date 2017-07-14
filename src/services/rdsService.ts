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
}