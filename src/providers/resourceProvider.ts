import { ResourceType } from '../providers/resourceType';
import '../models/instanceData';

export default interface ResourceProvider {
    ResourceType: ResourceType;

    describeActiveReservedInstances(): Promise<ReservedInstanceData[]>;

    describeRunningInstances(): Promise<InstanceData[]>;

    getInstancesUrl(instances: InstanceData[]): string | undefined;
}