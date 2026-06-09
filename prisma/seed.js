require('dotenv').config();
const { PrismaClient } = require('@prisma/client');
const { PrismaLibSQL } = require('@prisma/adapter-libsql');
const { createClient } = require('@libsql/client');
const bcrypt = require('bcryptjs');

const libsql = createClient({ url: process.env.TURSO_DATABASE_URL, authToken: process.env.TURSO_AUTH_TOKEN });
const prisma = new PrismaClient({ adapter: new PrismaLibSQL(libsql) });

async function main() {
  console.log('Seeding database...');

  const superAdmin = await prisma.adminUser.upsert({
    where: { email: 'admin@posadmin.com' },
    update: {},
    create: {
      name: 'Super Admin',
      email: 'admin@posadmin.com',
      password: await bcrypt.hash('Admin@123456', 12),
      role: 'SUPER_ADMIN',
    },
  });
  console.log(`Super Admin created: ${superAdmin.email}`);

  await prisma.adminUser.upsert({
    where: { email: 'finance@posadmin.com' },
    update: {},
    create: {
      name: 'Finance Officer',
      email: 'finance@posadmin.com',
      password: await bcrypt.hash('Finance@123456', 12),
      role: 'FINANCE_OFFICER',
    },
  });

  await prisma.adminUser.upsert({
    where: { email: 'support@posadmin.com' },
    update: {},
    create: {
      name: 'Support Agent',
      email: 'support@posadmin.com',
      password: await bcrypt.hash('Support@123456', 12),
      role: 'SUPPORT_AGENT',
    },
  });

  await prisma.subscriptionPlan.upsert({
    where: { name: 'Basic' },
    update: { price: 25000, duration_days: 30, features: JSON.stringify(['1 POS device', 'Monthly billing', 'Email support']) },
    create: { name: 'Basic', price: 25000, duration_days: 30, features: JSON.stringify(['1 POS device', 'Monthly billing', 'Email support']) },
  });

  await prisma.subscriptionPlan.upsert({
    where: { name: 'Intermediate' },
    update: { price: 75000, duration_days: 90, features: JSON.stringify(['Up to 3 POS devices', 'Quarterly billing', 'Priority support']) },
    create: { name: 'Intermediate', price: 75000, duration_days: 90, features: JSON.stringify(['Up to 3 POS devices', 'Quarterly billing', 'Priority support']) },
  });

  await prisma.subscriptionPlan.upsert({
    where: { name: 'Professional' },
    update: { price: 125000, duration_days: 180, features: JSON.stringify(['Up to 5 POS devices', 'Half-yearly billing', 'Priority support', 'Sales reports']) },
    create: { name: 'Professional', price: 125000, duration_days: 180, features: JSON.stringify(['Up to 5 POS devices', 'Half-yearly billing', 'Priority support', 'Sales reports']) },
  });

  await prisma.subscriptionPlan.upsert({
    where: { name: 'Enterprise' },
    update: { price: 250000, duration_days: 365, features: JSON.stringify(['Unlimited POS devices', 'Yearly billing', '24/7 support', 'Full analytics', 'Multi-branch']) },
    create: { name: 'Enterprise', price: 250000, duration_days: 365, features: JSON.stringify(['Unlimited POS devices', 'Yearly billing', '24/7 support', 'Full analytics', 'Multi-branch']) },
  });

  console.log('Seed completed successfully');
  console.log('\nDefault credentials:');
  console.log('  Super Admin: admin@posadmin.com / Admin@123456');
  console.log('  Finance:     finance@posadmin.com / Finance@123456');
  console.log('  Support:     support@posadmin.com / Support@123456');
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());
