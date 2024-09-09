import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    // Create roles
    // const adminRole = await prisma.role.create({
    //     data: {
    //         name: 'Admin',
    //         permissions: 15,
    //     },
    // });

    // const userRole = await prisma.role.create({
    //     data: {
    //         name: 'User',
    //         permissions: 1,
    //     },
    // });

    // create projects
    await prisma.project.createMany({
        data: [{
            name: 'WHW',
            fullname: 'What Happened When'
        },
        {
            name: 'CSA',
            fullname: 'Customer Service Automation'
        },
        {
            name: 'SAN',
            fullname: 'Service Arrival Nomenclature'
        }
    ]
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