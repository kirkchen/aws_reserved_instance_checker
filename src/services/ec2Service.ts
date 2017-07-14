import { EC2 } from 'aws-sdk';
import '../models/instanceData';
import '../models/reservedInstanceData';

export default class EC2Service {
    constructor(
        private region: string) {
    }

    describeActiveReservedInstances(): Promise<ReservedInstanceData[]> {
        let ec2 = new EC2({ region: this.region });
        let params: EC2.Types.DescribeReservedInstancesRequest = {
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
            ec2.describeReservedInstances(params, (err, data) => {
                if (err) {
                    reject(err);
                    return;
                }

                if (data.ReservedInstances) {
                    resolve(data.ReservedInstances as ReservedInstanceData[]);
                    return;
                }

                resolve([]);
            })
        });
    }

    describeRunningInstances(): Promise<InstanceData[]> {
        let ec2 = new EC2({ region: this.region });
        let params: EC2.Types.DescribeInstancesRequest = {
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
            ec2.describeInstances(params, (err, data) => {
                if (err) {
                    reject(err);
                    return;
                }

                if (data.Reservations) {
                    let result: (InstanceData | undefined)[] = data.Reservations
                        .map((reservation) => {
                            if (reservation.Instances &&
                                reservation.Instances[0].Placement) {
                                let instance = reservation.Instances[0];
                                let availabilityZone: string | undefined;
                                if (instance.Placement) {
                                    availabilityZone = instance.Placement.AvailabilityZone;
                                }
                                let instanceName: string | undefined;
                                if (instance.Tags) {
                                    for (let tag of instance.Tags) {
                                        if (tag.Key === 'Name') {
                                            instanceName = tag.Value;
                                            break;
                                        }
                                    }
                                }

                                let instanceData: InstanceData = {
                                    InstanceId: instance.InstanceId!,
                                    InstanceType: instance.InstanceType!,
                                    LaunchTime: instance.LaunchTime!,
                                    AvailabilityZone: availabilityZone!,
                                    InstanceName: instanceName
                                };

                                return instanceData;
                            }
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