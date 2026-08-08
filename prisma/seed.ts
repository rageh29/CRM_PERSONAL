import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding database...');

  // Clean existing sample data
  await prisma.invoice.deleteMany();
  await prisma.employee.deleteMany();

  // Create Master Admin user
  const masterPassword = await bcrypt.hash('admin123', 12);
  const masterAdmin = await prisma.user.upsert({
    where: { email: 'master@highsystem.com' },
    update: {
      role: 'MASTER_ADMIN',
      isMasterAdmin: true,
    },
    create: {
      name: 'المالك الرئيسي للنظام',
      email: 'master@highsystem.com',
      password: masterPassword,
      role: 'MASTER_ADMIN',
      isMasterAdmin: true,
      permissions: JSON.stringify(['*']),
    },
  });
  console.log('✅ Master Admin user created:', masterAdmin.email);

  // Create an employee user with customized permissions
  const empPassword = await bcrypt.hash('emp123', 12);
  const empUser = await prisma.user.upsert({
    where: { email: 'emp@shahrani.com' },
    update: {},
    create: {
      name: 'أحمد محمد (موظف فواتير)',
      email: 'emp@shahrani.com',
      password: empPassword,
      role: 'EMPLOYEE',
      permissions: JSON.stringify(['invoices:view', 'invoices:create', 'reports:export']),
    },
  });
  console.log('✅ Employee user created:', empUser.email);

  // Create employees list
  const employees = await Promise.all([
    prisma.employee.create({
      data: { name: 'أحمد محمد', email: 'ahmed@company.com', phone: '+966501234567', position: 'مصمم', salary: 5000, currency: 'SAR' },
    }),
    prisma.employee.create({
      data: { name: 'سارة علي', email: 'sara@company.com', phone: '+966509876543', position: 'مبرمجة', salary: 7000, currency: 'SAR' },
    }),
    prisma.employee.create({
      data: { name: 'محمد خالد', email: 'mohammed@company.com', phone: '+966505555555', position: 'مسوق', salary: 4500, currency: 'SAR' },
    }),
  ]);
  console.log('✅ Employees created:', employees.length);

  // Create sample invoices for the past 3 months
  const now = new Date();
  const invoices = [];
  let counter = 0;

  for (let monthOffset = 0; monthOffset < 3; monthOffset++) {
    const month = new Date(now.getFullYear(), now.getMonth() - monthOffset, 1);
    
    // Revenue invoices
    const revenues = [
      { name: 'إيراد مشروع تصميم', amount: 15000, desc: 'تصميم هوية بصرية لعميل' },
      { name: 'إيراد برمجة موقع', amount: 25000, desc: 'تطوير موقع إلكتروني' },
      { name: 'إيراد استشارات', amount: 8000, desc: 'استشارات تقنية' },
    ];
    
    for (const rev of revenues) {
      counter++;
      invoices.push(prisma.invoice.create({
        data: {
          invoiceNumber: `INV-${now.getFullYear()}-${String(counter).padStart(5, '0')}`,
          name: rev.name,
          description: rev.desc,
          amount: rev.amount * (1 - monthOffset * 0.1),
          currency: 'SAR',
          category: 'REVENUE',
          date: new Date(month.getFullYear(), month.getMonth(), 5 + Math.floor(Math.random() * 20)),
          createdById: masterAdmin.id,
        },
      }));
    }

    // Expense invoices
    const expenses = [
      { name: 'إيجار المكتب', amount: 3000, desc: 'إيجار شهري' },
      { name: 'اشتراك سيرفرات', amount: 500, desc: 'AWS hosting' },
      { name: 'أدوات تصميم', amount: 200, desc: 'اشتراك Adobe' },
      { name: 'مصاريف تنقل', amount: 800, desc: 'مواصلات ووقود' },
    ];

    for (const exp of expenses) {
      counter++;
      invoices.push(prisma.invoice.create({
        data: {
          invoiceNumber: `INV-${now.getFullYear()}-${String(counter).padStart(5, '0')}`,
          name: exp.name,
          description: exp.desc,
          amount: exp.amount * (1 + monthOffset * 0.05),
          currency: 'SAR',
          category: 'EXPENSE',
          date: new Date(month.getFullYear(), month.getMonth(), 1 + Math.floor(Math.random() * 25)),
          createdById: masterAdmin.id,
        },
      }));
    }

    // Return invoices
    counter++;
    invoices.push(prisma.invoice.create({
      data: {
        invoiceNumber: `INV-${now.getFullYear()}-${String(counter).padStart(5, '0')}`,
        name: 'مرتجع خدمة تصميم',
        description: 'استرجاع جزئي لعميل',
        amount: 2000,
        currency: 'SAR',
        category: 'RETURN',
        date: new Date(month.getFullYear(), month.getMonth(), 15),
        createdById: masterAdmin.id,
      },
    }));

    // Salary invoices
    for (const emp of employees) {
      counter++;
      invoices.push(prisma.invoice.create({
        data: {
          invoiceNumber: `INV-${now.getFullYear()}-${String(counter).padStart(5, '0')}`,
          name: `راتب ${emp.name}`,
          description: `راتب شهر ${month.getMonth() + 1}`,
          amount: emp.salary,
          currency: 'SAR',
          category: 'SALARY',
          date: new Date(month.getFullYear(), month.getMonth(), 28),
          createdById: masterAdmin.id,
          employeeId: emp.id,
        },
      }));
    }
  }

  await Promise.all(invoices);
  console.log(`✅ Invoices created: ${counter}`);

  // Create system settings
  await prisma.systemSettings.upsert({
    where: { id: 'default' },
    update: {},
    create: {
      id: 'default',
      companyName: 'خالد الشهراني',
      primaryColor: '#6366f1',
      secondaryColor: '#8b5cf6',
      contactEmail: 'info@shahrani.com',
      contactPhone: '+966501234567',
      contactAddress: 'المملكة العربية السعودية',
      defaultCurrency: 'SAR',
    },
  });
  console.log('✅ System settings created');

  console.log('\n🎉 Seed complete!');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('📧 Super Admin login: admin@shahrani.com');
  console.log('🔑 Password: admin123');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
