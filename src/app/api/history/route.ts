import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const startDate = searchParams.get('startDate');
  const endDate   = searchParams.get('endDate');
  const courseId  = searchParams.get('courseId');

  const start = startDate ? new Date(startDate) : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
  const end   = endDate   ? new Date(endDate)   : new Date();
  start.setUTCHours(0, 0, 0, 0);
  end.setUTCHours(23, 59, 59, 999);

  console.log('[history] rango:', start.toISOString(), '->', end.toISOString(), '| courseId:', courseId);

  try {
    const courses = await prisma.course.findMany({ orderBy: { name: 'asc' } });

    // Obtener estudiantes (filtrados por salón si aplica)
    const students = await prisma.student.findMany({
      where: courseId ? { courseId } : {},
      include: { course: true },
      orderBy: [{ course: { name: 'asc' } }, { lastName: 'asc' }],
    });

    console.log('[history] estudiantes encontrados:', students.length);

    if (students.length === 0) {
      return NextResponse.json({ records: [], courses });
    }

    // Obtener asistencias en el rango para esos estudiantes
    const attendances = await prisma.attendance.findMany({
      where: {
        studentId: { in: students.map(s => s.id) },
        date: { gte: start, lte: end },
      },
      orderBy: { date: 'asc' },
    });

    console.log('[history] asistencias encontradas:', attendances.length);

    // Agrupar por estudiante
    const records = students
      .map(student => {
        const atts = attendances.filter(a => a.studentId === student.id);
        if (atts.length === 0) return null;
        return {
          studentId:  student.id,
          firstName:  student.firstName,
          lastName:   student.lastName,
          courseName: student.course.name,
          courseId:   student.courseId,
          present: atts.filter(a => a.status === 'PRESENT').length,
          late:    atts.filter(a => a.status === 'LATE').length,
          absent:  atts.filter(a => a.status === 'ABSENT').length,
          days: atts.map(a => ({
            date:   a.date.toISOString().split('T')[0],
            status: a.status,
          })),
        };
      })
      .filter(Boolean);

    return NextResponse.json({ records, courses });
  } catch (error: any) {
    console.error('[history] error:', error?.message ?? error);
    return NextResponse.json({ error: error?.message ?? 'Error al obtener historial', records: [], courses: [] }, { status: 500 });
  }
}
