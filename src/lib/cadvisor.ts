// cAdvisor API Integration
// Fetches real container metrics from cAdvisor running on :8080

export interface ContainerStats {
    cpu_percent: number;
    memory_usage_mb: number;
    memory_limit_mb: number;
    network_rx_bytes: number;
    network_tx_bytes: number;
}

const CADVISOR_URL = 'http://192.168.1.220:8080';

export async function fetchContainerStats(containerName: string): Promise<ContainerStats | null> {
    try {
        const response = await fetch(`${CADVISOR_URL}/api/v1.3/docker/${containerName}`);
        if (!response.ok) return null;
        
        const data = await response.json();
        const containerData = data[`/docker/${containerName}`];
        
        if (!containerData || !containerData.stats || containerData.stats.length === 0) {
            return null;
        }

        // Get latest stats
        const latest = containerData.stats[containerData.stats.length - 1];
        const previous = containerData.stats[containerData.stats.length - 2] || latest;

        // Calculate CPU percentage
        const cpuDelta = latest.cpu.usage.total - previous.cpu.usage.total;
        const systemDelta = latest.timestamp - previous.timestamp;
        const cpuPercent = (cpuDelta / systemDelta) * 100;

        // Memory stats
        const memoryUsageMB = latest.memory.usage / (1024 * 1024);
        const memoryLimitMB = containerData.spec.memory.limit / (1024 * 1024);

        // Network stats
        let networkRx = 0;
        let networkTx = 0;
        if (latest.network && latest.network.interfaces) {
            latest.network.interfaces.forEach((iface: any) => {
                networkRx += iface.rx_bytes || 0;
                networkTx += iface.tx_bytes || 0;
            });
        }

        return {
            cpu_percent: Math.min(cpuPercent, 100),
            memory_usage_mb: memoryUsageMB,
            memory_limit_mb: memoryLimitMB,
            network_rx_bytes: networkRx,
            network_tx_bytes: networkTx,
        };
    } catch (error) {
        console.error('Failed to fetch cAdvisor stats:', error);
        return null;
    }
}

// Get all running containers
export async function fetchAllContainers(): Promise<string[]> {
    try {
        const response = await fetch(`${CADVISOR_URL}/api/v1.3/docker`);
        if (!response.ok) return [];
        
        const data = await response.json();
        return Object.keys(data)
            .filter(key => key.startsWith('/docker/'))
            .map(key => key.replace('/docker/', ''));
    } catch (error) {
        console.error('Failed to fetch containers:', error);
        return [];
    }
}
