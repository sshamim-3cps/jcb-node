import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    // Create roles
    const adminRole = await prisma.role.create({
        data: {
            name: 'Admin',
            permissions: 15,
        },
    });

    const userRole = await prisma.role.create({
        data: {
            name: 'User',
            permissions: 1,
        },
    });



    console.log('Dummy data created');
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });