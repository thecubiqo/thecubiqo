
import { prisma } from '../src/lib/db';
import { deploy } from '../src/lib/deployment';
import path from 'path';

async function main() {
    console.log('Starting debug deployment...');

    // 1. Ensure Domain
    let domain = await prisma.domain.findFirst({
        where: { domainName: 'test.local' }
    });

    if (!domain) {
        console.log('Creating test domain...');
        domain = await prisma.domain.create({
            data: {
                domainName: 'test.local',
                status: 'ACTIVE',
                dnsInstructions: 'Local test'
            }
        });
    }

    // 2. Ensure Template
    let template = await prisma.template.findFirst({
        where: { name: 'template1' }
    });

    if (!template) {
        console.log('Creating test template record...');
        // We assume the directory exists at /home/codenia/webportal/data/templates/template1
        // derived from .env or defaults
        template = await prisma.template.create({
            data: {
                name: 'template1',
                templatePath: '/home/codenia/webportal/data/templates/template1',
                description: 'Test Template',
                isActive: true
            }
        });
    }

    // 3. Create Deployment
    console.log('Creating deployment record...');
    const deployment = await prisma.deployment.create({
        data: {
            domainId: domain.id,
            templateId: template.id,
            status: 'DRAFT'
        }
    });

    console.log(`Created deployment ${deployment.id}. Starting deploy process...`);

    // 4. Run Deploy
    try {
        const result = await deploy(deployment.id, {
            onProgress: (p) => console.log(`[${p.stage}] ${p.status}: ${p.message}`)
        });
        console.log('Deploy result:', result);
    } catch (error) {
        console.error('Deploy failed:', error);
    }

    // 5. Verify DB Status
    const finalDeployment = await prisma.deployment.findUnique({
        where: { id: deployment.id }
    });
    console.log('Final DB Status:', finalDeployment?.status);
}

main()
    .catch(console.error)
    .finally(async () => {
        await prisma.$disconnect();
    });
