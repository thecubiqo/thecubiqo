import { bootstrapAgents } from './bootstrap';

let initialized = false;

export async function initializeEngine() {
  if (initialized) return;
  
  console.log('🤖 Initializing CubiQo Agent Engine...');
  
  try {
    await bootstrapAgents();
    initialized = true;
    console.log('✅ Agent Engine ready');
  } catch (error) {
    console.error('❌ Failed to initialize Agent Engine:', error);
  }
}

// Auto-initialize on import (server-side only)
if (typeof window === 'undefined') {
  initializeEngine();
}
