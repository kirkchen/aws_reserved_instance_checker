import { ResourceType } from '../providers/resourceType';

export default interface ResourceProvider {
    ResourceType: ResourceType;

    describeActiveReservedInstances(): Promise<ReservedInstanceData[]>;

    describeRunningInstances(): Promise<InstanceData[]>;
}