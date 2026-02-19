import { bootstrapAgents } from './bootstrap';
import { startCron } from './cron';
import { taskRouter } from './router';

let initialized = false;

export async function initializeEngine() {
  if (initialized) return;
  
  // Skip initialization during build time
  if (process.env.NODE_ENV === 'production' && !process.env.NEXT_PUBLIC_SUPABASE_URL1) {
    console.log('⏭️ Skipping Agent Engine init (build time)');
    return;
  }

  console.log('🤖 Initializing CubiQo Agent Engine...');

  try {
    await bootstrapAgents();
    startCron();
    initialized = true;
    console.log('✅ Agent Engine ready');
  } catch (error) {
    console.error('❌ Failed to initialize Agent Engine:', error);
  }
}

export { taskRouter };

// Auto-initialize on import (server-side only, not during build)
if (typeof window === 'undefined' && process.env.NEXT_PHASE !== 'phase-production-build') {
  initializeEngine();
}
