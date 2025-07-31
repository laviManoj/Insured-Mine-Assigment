// cpuMonitor.js
const os = require('os');
const process = require('process');

class CPUMonitor {
    constructor(threshold = 70, checkInterval = 5000) {
        this.threshold = threshold;
        this.checkInterval = checkInterval;
        this.monitoring = false;
        this.restartCallback = null;
    }

    // Calculate CPU usage percentage
    getCPUUsage() {
        return new Promise((resolve) => {
            const startMeasure = this.cpuAverage();
            
            setTimeout(() => {
                const endMeasure = this.cpuAverage();
                const idleDifference = endMeasure.idle - startMeasure.idle;
                const totalDifference = endMeasure.total - startMeasure.total;
                const percentageCPU = 100 - ~~(100 * idleDifference / totalDifference);
                resolve(percentageCPU);
            }, 1000);
        });
    }

    // Helper function to get CPU average
    cpuAverage() {
        const cpus = os.cpus();
        let idle = 0;
        let total = 0;

        cpus.forEach((cpu) => {
            for (let type in cpu.times) {
                total += cpu.times[type];
            }
            idle += cpu.times.idle;
        });

        return { idle: idle / cpus.length, total: total / cpus.length };
    }

    // Start monitoring CPU usage
    startMonitoring(restartCallback) {
        if (this.monitoring) {
            console.log('CPU monitoring is already running');
            return;
        }

        this.monitoring = true;
        this.restartCallback = restartCallback;
        
        console.log(`🔍 CPU monitoring started. Threshold: ${this.threshold}%`);
        
        const monitor = async () => {
            if (!this.monitoring) return;

            try {
                const cpuUsage = await this.getCPUUsage();
                const timestamp = new Date().toISOString();
                
                console.log(`[${timestamp}] CPU Usage: ${cpuUsage.toFixed(2)}%`);

                if (cpuUsage >= this.threshold) {
                    console.log(`🚨 CPU usage (${cpuUsage.toFixed(2)}%) exceeded threshold (${this.threshold}%)`);
                    console.log('🔄 Initiating server restart...');
                    
                    if (this.restartCallback) {
                        this.restartCallback(cpuUsage);
                    } else {
                        this.restartServer();
                    }
                    return;
                }

                setTimeout(monitor, this.checkInterval);
            } catch (error) {
                console.error('Error monitoring CPU:', error);
                setTimeout(monitor, this.checkInterval);
            }
        };

        monitor();
    }

    // Stop monitoring
    stopMonitoring() {
        this.monitoring = false;
        console.log('🛑 CPU monitoring stopped');
    }

    // Default restart function
    restartServer() {
        console.log('🔄 Restarting server due to high CPU usage...');
        
        // Graceful shutdown
        setTimeout(() => {
            process.exit(0);
        }, 2000);
    }

    // Get current CPU info
    async getCurrentCPUInfo() {
        const usage = await this.getCPUUsage();
        return {
            usage: usage.toFixed(2),
            threshold: this.threshold,
            cores: os.cpus().length,
            platform: os.platform(),
            arch: os.arch(),
            totalMemory: (os.totalmem() / 1024 / 1024 / 1024).toFixed(2) + ' GB',
            freeMemory: (os.freemem() / 1024 / 1024 / 1024).toFixed(2) + ' GB'
        };
    }
}

module.exports = CPUMonitor;