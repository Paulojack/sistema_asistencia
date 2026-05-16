import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET() {
  try {
    const courses = await prisma.course.findMany({
      include: {
        teacher: { select: { id: true, name: true, email: true } },
        students: { select: { id: true } },
      },
      orderBy: { name: 'asc' },
    });
    const teachers = await prisma.user.findMany({
      select: { id: true, name: true, email: true, role: true },
      orderBy: { name: 'asc' },
    });
    return NextResponse.json({ success: true, courses, teachers });
  } catch (error) {
    console.error('Error obteniendo cursos:', error);
    return NextResponse.json({ error: 'Error al obtener cursos' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const { name, teacherId } = await request.json();
    if (!name?.trim() || !teacherId) {
      return NextResponse.json({ error: 'Nombre y docente son requeridos' }, { status: 400 });
    }
    const course = await prisma.course.create({
      data: { name: name.trim(), teacherId },
      include: { teacher: { select: { id: true, name: true, email: true } }, students: { select: { id: true } } },
    });
    return NextResponse.json({ success: true, course });
  } catch (error) {
    console.error('Error creando curso:', error);
    return NextResponse.json({ error: 'Error al crear curso' }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    if (!id) return NextResponse.json({ error: 'ID requerido' }, { status: 400 });

    const { name, teacherId } = await request.json();
    if (!name?.trim() || !teacherId) {
      return NextResponse.json({ error: 'Nombre y docente son requeridos' }, { status: 400 });
    }
    const course = await prisma.course.update({
      where: { id },
      data: { name: name.trim(), teacherId },
      include: { teacher: { select: { id: true, name: true, email: true } }, students: { select: { id: true } } },
    });
    return NextResponse.json({ success: true, course });
  } catch (error) {
    console.error('Error actualizando curso:', error);
    return NextResponse.json({ error: 'Error al actualizar curso' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    if (!id) return NextResponse.json({ error: 'ID requerido' }, { status: 400 });

    // Eliminar asistencias de los estudiantes del curso primero
    const students = await prisma.student.findMany({ where: { courseId: id }, select: { id: true } });
    await prisma.attendance.deleteMany({ where: { studentId: { in: students.map(s => s.id) } } });
    await prisma.student.deleteMany({ where: { courseId: id } });
    await prisma.course.delete({ where: { id } });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error eliminando curso:', error);
    return NextResponse.json({ error: 'Error al eliminar curso' }, { status: 500 });
  }
}
