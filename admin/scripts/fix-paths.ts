
import { prisma } from '../src/lib/db';

async function main() {
    const templates = await prisma.template.findMany();
    console.log('Found templates:', templates.length);

    for (const t of templates) {
        console.log(`Checking template: ${t.name}, Path: ${t.templatePath}`);

        if (t.templatePath.includes('C:\\Users') || t.templatePath.includes('OneDrive')) {
            console.log('Found Windows path, updating...');
            // Assuming structure matches: .../data/templates/templateX
            const templateName = t.name;
            const newPath = `/home/codenia/webportal/data/templates/${templateName}`;

            await prisma.template.update({
                where: { id: t.id },
                data: { templatePath: newPath }
            });
            console.log(`Updated to: ${newPath}`);
        }
    }

    // Also verify valid path exists
    // fs.access...
}

main()
    .catch(console.error)
    .finally(async () => {
        await prisma.$disconnect();
    });
