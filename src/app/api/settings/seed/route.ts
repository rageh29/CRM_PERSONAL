import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { auth } from '@/lib/auth';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  const session = await auth();
  const userId = (session?.user as any)?.id;
  const userRole = (session?.user as any)?.role;

  if (!session?.user || userRole !== 'SUPER_ADMIN') {
    return NextResponse.json({ error: 'غير مصرح لك بإجراء هذه العملية' }, { status: 403 });
  }

  try {
    // 1. Clean existing invoices, employees, and non-admin users
    await prisma.invoice.deleteMany({});
    await prisma.employee.deleteMany({});
    await prisma.activityLog.deleteMany({});

    // 2. Create sample employees list
    const emp1 = await prisma.employee.create({
      data: { name: 'أحمد محمد', email: 'ahmed@company.com', phone: '+966501234567', position: 'مصمم غرافيك', salary: 5500, currency: 'SAR' },
    });
    const emp2 = await prisma.employee.create({
      data: { name: 'سارة علي', email: 'sara@company.com', phone: '+966509876543', position: 'مهندسة برمجيات', salary: 8500, currency: 'SAR' },
    });
    const emp3 = await prisma.employee.create({
      data: { name: 'محمد خالد', email: 'mohammed@company.com', phone: '+966505555555', position: 'أخصائي تسويق', salary: 4800, currency: 'SAR' },
    });

    const employees = [emp1, emp2, emp3];

    // 3. Create sample invoices for the past 3 months
    const now = new Date();
    const invoicePromises = [];
    let counter = 100;

    for (let monthOffset = 0; monthOffset < 3; monthOffset++) {
      const monthDate = new Date(now.getFullYear(), now.getMonth() - monthOffset, 1);

      // Revenues
      const revenues = [
        { name: 'إيراد تصميم هوية تجارية', amount: 18000, desc: 'عقد تصميم هويات واستشارات' },
        { name: 'إيراد تطوير نظام إلكتروني', amount: 32000, desc: 'تطوير وتسليم مشروع متكامل' },
        { name: 'إيراد حملة تسويقية رقمية', amount: 12500, desc: 'إدارة وتفعيل حملات الإعلانات' },
      ];

      for (const rev of revenues) {
        counter++;
        invoicePromises.push(
          prisma.invoice.create({
            data: {
              invoiceNumber: `INV-${monthDate.getFullYear()}-${String(counter).padStart(5, '0')}`,
              name: rev.name,
              description: rev.desc,
              amount: rev.amount,
              currency: 'SAR',
              category: 'REVENUE',
              date: new Date(monthDate.getFullYear(), monthDate.getMonth(), 5 + Math.floor(Math.random() * 15)),
              createdById: userId,
            },
          })
        );
      }

      // Expenses
      const expenses = [
        { name: 'إيجار المقر الرئيسي', amount: 4500, desc: 'إيجار شهري للمكتب' },
        { name: 'اشتراكات الخوادم والسحاب', amount: 1200, desc: 'استضافة خوادم AWS وVercel' },
        { name: 'مصاريف تشغيلية ودعاية', amount: 2200, desc: 'تجهيزات ومستلزمات مكتبية' },
      ];

      for (const exp of expenses) {
        counter++;
        invoicePromises.push(
          prisma.invoice.create({
            data: {
              invoiceNumber: `INV-${monthDate.getFullYear()}-${String(counter).padStart(5, '0')}`,
              name: exp.name,
              description: exp.desc,
              amount: exp.amount,
              currency: 'SAR',
              category: 'EXPENSE',
              date: new Date(monthDate.getFullYear(), monthDate.getMonth(), 2 + Math.floor(Math.random() * 20)),
              createdById: userId,
            },
          })
        );
      }

      // Returns
      counter++;
      invoicePromises.push(
        prisma.invoice.create({
          data: {
            invoiceNumber: `INV-${monthDate.getFullYear()}-${String(counter).padStart(5, '0')}`,
            name: 'مرتجع خدمة دعم فني',
            description: 'تسوية واسترجاع جزئي لعميل',
            amount: 1500,
            currency: 'SAR',
            category: 'RETURN',
            date: new Date(monthDate.getFullYear(), monthDate.getMonth(), 18),
            createdById: userId,
          },
        })
      );

      // Salaries
      for (const emp of employees) {
        counter++;
        invoicePromises.push(
          prisma.invoice.create({
            data: {
              invoiceNumber: `INV-${monthDate.getFullYear()}-${String(counter).padStart(5, '0')}`,
              name: `راتب ${emp.name}`,
              description: `صرف راتب شهر ${monthDate.getMonth() + 1}`,
              amount: emp.salary,
              currency: 'SAR',
              category: 'SALARY',
              date: new Date(monthDate.getFullYear(), monthDate.getMonth(), 27),
              createdById: userId,
              employeeId: emp.id,
            },
          })
        );
      }
    }

    await Promise.all(invoicePromises);

    // 4. Log activity
    await prisma.activityLog.create({
      data: {
        action: 'CREATE',
        entityType: 'DemoDataSeed',
        details: 'تم إعادة توليد وإنشاء البيانات التجريبية الشاملة في المنصة بنجاح',
        userId,
      },
    });

    return NextResponse.json({
      success: true,
      message: 'تم إعادة توليد البيانات التجريبية بنجاح! تم إنشاء الفواتير والموظفين وسجلات النشاط.',
    });
  } catch (error: any) {
    console.error('Seed Demo Data Error:', error);
    return NextResponse.json(
      { error: error.message || 'حدث خطأ أثناء إعادة توليد البيانات التجريبية' },
      { status: 500 }
    );
  }
}
