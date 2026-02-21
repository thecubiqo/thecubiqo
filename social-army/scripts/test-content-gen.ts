import { generateContent } from '../src/content-engine';

async function testGen() {
    console.log('🤖 TESTING SOCIAL ARMY CONTENT ENGINE...\n');

    const sampleRequest = {
        campaignTopic: "Launch of CubiQo AI - The future of personal intelligence",
        personaType: "builder",
        platform: "twitter",
        contentType: "text" as const
    };

    try {
        const result = await generateContent(sampleRequest);
        console.log('--- SAMPLE POST ---');
        console.log(`PLATFORM: ${result.platform}`);
        console.log(`PERSONA: ${result.persona}`);
        console.log(`CAPTION:\n"${result.caption}"`);
        console.log(`SOURCE: ${result.source}`);
        console.log('-------------------');
    } catch (err) {
        console.error('❌ Content generation failed:', err instanceof Error ? err.message : String(err));
    }
}

testGen();
