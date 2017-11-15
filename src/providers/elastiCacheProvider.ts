import { ElastiCache } from 'aws-sdk';
import { ResourceType } from '../providers/resourceType';
import '../models/instanceData';
import '../models/reservedInstanceData';
import ResourceProvider from '../providers/resourceProvider';

export default class ElastiCacheProvider implements ResourceProvider {
    constructor(
        private region: string) {
    }

    ResourceType: ResourceType = ResourceType.ElastiCache;

    describeActiveReservedInstances(): Promise<ReservedInstanceData[]> {
        let elastiCache = new ElastiCache({ region: this.region });
        let params: ElastiCache.Types.DescribeReservedCacheNodesMessage = {
        }

        return new Promise((resolve, reject) => {
            elastiCache.describeReservedCacheNodes(params, (err, data) => {
                if (err) {
                    reject(err);
                    return;
                }

                if (data.ReservedCacheNodes) {
                    let reservedNodes: ReservedInstanceData[] = data.ReservedCacheNodes
                        .filter((cacheNode) => cacheNode.State === 'active')
                        .map((cacheNode) => {
                            let node: ReservedInstanceData = {
                                AvailabilityZone: '',
                                InstanceCount: cacheNode.CacheNodeCount!,
                                InstanceType: cacheNode.CacheNodeType!,
                                CompareKey: cacheNode.CacheNodeType!,
                            }
                            return node;
                        })
                    resolve(reservedNodes);
                    return;
                }

                resolve([]);
            })
        });
    }

    describeRunningInstances(): Promise<InstanceData[]> {
        let elastiCache = new ElastiCache({ region: this.region });
        let params: ElastiCache.Types.DescribeCacheClustersMessage = {}

        return new Promise((resolve, reject) => {
            elastiCache.describeCacheClusters(params, (err, data) => {
                if (err) {
                    reject(err);
                    return;
                }

                if (data.CacheClusters) {
                    let result: (InstanceData | undefined)[] = data.CacheClusters
                        .map((cacheCluster) => {
                            let instanceData: InstanceData = {
                                GroupKey: `${cacheCluster.CacheNodeType}`,
                                InstanceId: cacheCluster.CacheClusterId!,
                                InstanceType: cacheCluster.CacheNodeType!,
                                LaunchTime: cacheCluster.CacheClusterCreateTime!,
                                AvailabilityZone: '',
                                InstanceName: cacheCluster.CacheClusterId,
                                CompareKey: cacheCluster.CacheNodeType!,
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

    getInstancesUrl(instanceDatas: InstanceData[]): string | undefined {
        if (instanceDatas.length === 0) {
            return undefined;
        }

        let result = `<https://${this.region}.console.aws.amazon.com/elasticache/home?region=${this.region}|Click to details>`

        return result;
    }
}