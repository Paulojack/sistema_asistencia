import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// GET - Obtener todos los estudiantes
export async function GET(request: NextRequest) {
  try {
    const students = await prisma.student.findMany({
      include: {
        course: {
          select: {
            name: true
          }
        }
      },
      orderBy: [
        { course: { name: 'asc' } },
        { lastName: 'asc' }
      ]
    });

    return NextResponse.json({ success: true, students });
  } catch (error) {
    console.error('Error obteniendo estudiantes:', error);
    return NextResponse.json(
      { success: false, error: 'Error al obtener estudiantes' },
      { status: 500 }
    );
  }
}

// POST - Crear nuevo estudiante
export async function POST(request: NextRequest) {
  try {
    const { firstName, lastName, parentEmail, parentPhone, courseId } = await request.json();

    // Validación
    if (!firstName || !lastName || !parentEmail || !courseId) {
      return NextResponse.json(
        { success: false, error: 'Faltan campos requeridos' },
        { status: 400 }
      );
    }

    const student = await prisma.student.create({
      data: {
        firstName,
        lastName,
        parentEmail,
        parentPhone: parentPhone || null,
        courseId
      }
    });

    return NextResponse.json({ success: true, student });
  } catch (error) {
    console.error('Error creando estudiante:', error);
    return NextResponse.json(
      { success: false, error: 'Error al crear estudiante' },
      { status: 500 }
    );
  }
}

// PUT - Actualizar estudiante
export async function PUT(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json(
        { success: false, error: 'ID es requerido' },
        { status: 400 }
      );
    }

    const { firstName, lastName, parentEmail, parentPhone, courseId } = await request.json();

    const student = await prisma.student.update({
      where: { id },
      data: {
        firstName,
        lastName,
        parentEmail,
        parentPhone: parentPhone || null,
        courseId
      }
    });

    return NextResponse.json({ success: true, student });
  } catch (error) {
    console.error('Error actualizando estudiante:', error);
    return NextResponse.json(
      { success: false, error: 'Error al actualizar estudiante' },
      { status: 500 }
    );
  }
}

// DELETE - Eliminar estudiante
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json(
        { success: false, error: 'ID es requerido' },
        { status: 400 }
      );
    }

    // Primero eliminar las asistencias relacionadas
    await prisma.attendance.deleteMany({
      where: { studentId: id }
    });

    // Luego eliminar el estudiante
    await prisma.student.delete({
      where: { id }
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error eliminando estudiante:', error);
    return NextResponse.json(
      { success: false, error: 'Error al eliminar estudiante' },
      { status: 500 }
    );
  }
}
