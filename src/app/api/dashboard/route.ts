import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const email = searchParams.get('email');

    const user = email
      ? await prisma.user.findUnique({ where: { email } })
      : null;

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const isAdmin = user?.role === 'ADMIN';
    const courseWhere = isAdmin || !user ? {} : { teacherId: user.id };

    const courses = await prisma.course.findMany({
      where: courseWhere,
      include: {
        students: {
          include: {
            attendances: {
              where: { date: { gte: today, lt: tomorrow } }
            }
          }
        }
      },
      orderBy: { name: 'asc' }
    });

    let totalStudents = 0;
    let presentToday = 0;
    let absentToday = 0;
    let lateToday = 0;

    const coursesWithStats = courses.map(course => {
      const students = course.students;
      const present = students.filter(s => s.attendances.some(a => a.status === 'PRESENT')).length;
      const absent = students.filter(s => s.attendances.some(a => a.status === 'ABSENT')).length;
      const late = students.filter(s => s.attendances.some(a => a.status === 'LATE')).length;

      totalStudents += students.length;
      presentToday += present;
      absentToday += absent;
      lateToday += late;

      return { id: course.id, name: course.name, totalStudents: students.length, present, absent, late };
    });

    return NextResponse.json({
      user: user ? { name: user.name, role: user.role, email: user.email } : null,
      stats: { totalStudents, presentToday, absentToday, lateToday },
      courses: coursesWithStats,
    });
  } catch (error) {
    console.error('Error en dashboard API:', error);
    return NextResponse.json({ error: 'Error al obtener datos del dashboard' }, { status: 500 });
  }
}
