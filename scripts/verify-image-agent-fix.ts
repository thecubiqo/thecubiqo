
import { executeImageAgent } from '../src/lib/emergent/subagents/image-agent';
import { SubAgentRequest } from '../src/lib/emergent/agent-types';

/**
 * Verification script for Image Agent fix.
 * This runs the subagent directly to verify that the type casting issues are resolved.
 */
async function verify() {
    console.log('🚀 Starting Image Agent verification...');

    const request: SubAgentRequest = {
        type: 'image',
        projectId: 'test-project',
        params: {
            prompt: 'A beautiful mountain landscape with a lake at sunrise',
            size: '1024x1024',
            style: 'vivid'
        }
    };

    try {
        const response = await executeImageAgent(request);

        if (response.success) {
            console.log('✅ SUCCESS: Image Agent executed successfully!');
            console.log('Generated URL:', (response.data as any)?.url);
            console.log('Metadata:', JSON.stringify(response.metadata, null, 2));
        } else {
            console.error('❌ FAILED: Image Agent returned an error:', response.error);
        }
    } catch (error) {
        console.error('❌ CRITICAL ERROR during execution:', error);
    }
}

verify();
