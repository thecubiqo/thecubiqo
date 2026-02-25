/**
 * Browser Pool — Shared Chromium instances for high-throughput posting
 *
 * Instead of launching/closing a browser per post (expensive), we keep
 * a pool of N instances alive.  Each caller acquires a browser, gets a
 * fresh page, posts, closes the page, and releases the browser back.
 *
 * Pool size is controlled by env BROWSER_POOL_SIZE (default 10).
 */

import puppeteer, { Browser } from 'puppeteer';

const POOL_SIZE = Math.max(1, parseInt(process.env.BROWSER_POOL_SIZE || '10', 10));
const EXEC_PATH = process.env.PUPPETEER_EXECUTABLE_PATH || '/usr/bin/chromium';

const LAUNCH_ARGS = [
    '--no-sandbox',
    '--disable-setuid-sandbox',
    '--disable-dev-shm-usage',
    '--disable-gpu',
    '--no-first-run',
    '--no-zygote',
    '--disable-background-networking',
    '--disable-extensions',
    '--mute-audio',
];

interface Slot {
    browser: Browser;
    inUse: boolean;
}

class BrowserPool {
    private slots: Slot[] = [];
    private waiters: Array<(slot: Slot) => void> = [];
    private ready = false;

    async init(): Promise<void> {
        if (this.ready) return;
        console.log(`[BrowserPool] Launching ${POOL_SIZE} Chromium instances…`);
        const instances = await Promise.all(
            Array.from({ length: POOL_SIZE }, () =>
                puppeteer.launch({
                    headless: true,
                    executablePath: EXEC_PATH,
                    args: LAUNCH_ARGS,
                })
            )
        );
        this.slots = instances.map(browser => ({ browser, inUse: false }));
        this.ready = true;
        console.log(`[BrowserPool] ✅ ${POOL_SIZE} instances ready`);
    }

    async acquire(): Promise<{ browser: Browser; release: () => void }> {
        if (!this.ready) await this.init();

        const free = this.slots.find(s => !s.inUse);
        if (free) {
            free.inUse = true;
            return { browser: free.browser, release: () => this._release(free) };
        }

        return new Promise(resolve => {
            this.waiters.push(slot => {
                slot.inUse = true;
                resolve({ browser: slot.browser, release: () => this._release(slot) });
            });
        });
    }

    private _release(slot: Slot) {
        const waiter = this.waiters.shift();
        if (waiter) {
            waiter(slot);
        } else {
            slot.inUse = false;
        }
    }

    async close(): Promise<void> {
        await Promise.allSettled(this.slots.map(s => s.browser.close()));
        this.slots = [];
        this.ready = false;
    }
}

/** Singleton shared across the whole worker process */
export const browserPool = new BrowserPool();
