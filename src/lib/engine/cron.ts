
import { getAgent } from './agent';

interface CronJob {
    id: string;
    schedule: 'hourly' | 'daily' | 'demo'; // 'demo' runs every 5 mins for testing
    agentId: string;
    task: string;
    lastRun?: Date;
}

// Define system jobs here
const jobs: CronJob[] = [
    {
        id: 'daily-report',
        schedule: 'daily',
        agentId: 'a1',
        task: 'Generate a brief status report of the workspace and save it to REPORTS/DAILY.md. Include updates from other agents if possible.'
    }
];

let intervalId: NodeJS.Timeout | null = null;

export function startCron() {
    if (intervalId) return;

    console.log('⏰ Starting Cron Scheduler...');

    // Simple poller every minute
    intervalId = setInterval(async () => {
        const now = new Date();

        for (const job of jobs) {
            if (shouldRun(job, now)) {
                console.log(`[Cron] Running job: ${job.id}`);
                try {
                    const agent = getAgent(job.agentId);
                    if (agent) {
                        // Run in background (fire and forget)
                        // We use a specific session ID for cron jobs to keep history isolated or use a new one?
                        // For now, let's spawn a new "task" for it so it doesn't pollute the main chat session
                        await agent.spawn(`[CRON JOB: ${job.id}] ${job.task}`, 'system-cron');
                        job.lastRun = now;
                    } else {
                        console.warn(`[Cron] Agent not found: ${job.agentId}`);
                    }
                } catch (error) {
                    console.error(`[Cron] Job failed: ${job.id}`, error);
                }
            }
        }
    }, 60 * 1000); // Check every minute
}

function shouldRun(job: CronJob, now: Date): boolean {
    if (!job.lastRun) {
        // Don't run immediately on server start to avoid storms, wait for next interval match?
        // For simplicity, let's say we mark it as "just run" on startup so it waits one cycle
        job.lastRun = new Date();
        return false;
    }

    const diff = now.getTime() - job.lastRun.getTime();
    const minute = 60 * 1000;
    const hour = 60 * minute;
    const day = 24 * hour;

    switch (job.schedule) {
        case 'demo': return diff >= 5 * minute;
        case 'hourly': return diff >= hour;
        case 'daily': return diff >= day;
        default: return false;
    }
}
