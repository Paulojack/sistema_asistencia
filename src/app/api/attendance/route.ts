import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);

export async function POST(request: NextRequest) {
  try {
    const { courseId, attendances } = await request.json();
    
    // Validación
    if (!courseId || !attendances || !Array.isArray(attendances)) {
      return NextResponse.json(
        { error: 'Datos inválidos' },
        { status: 400 }
      );
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Guardar asistencias en la BD
    const savedAttendances = await Promise.all(
      attendances.map(async (att: { studentId: string; status: string }) => {
        return await prisma.attendance.upsert({
          where: {
            date_studentId: {
              date: today,
              studentId: att.studentId
            }
          },
          update: {
            status: att.status
          },
          create: {
            date: today,
            status: att.status,
            studentId: att.studentId
          }
        });
      })
    );

    // Obtener estudiantes ausentes y tardíos con sus datos de padres
    const absentAndLateStudents = await prisma.student.findMany({
      where: {
        id: {
          in: attendances
            .filter((att: any) => att.status === 'ABSENT' || att.status === 'LATE')
            .map((att: any) => att.studentId)
        }
      },
      include: {
        course: {
          include: {
            teacher: true
          }
        }
      }
    });

    // Enviar correos a padres
    const emailPromises = absentAndLateStudents.map(async (student) => {
      const attendance = attendances.find((att: any) => att.studentId === student.id);
      const statusText = attendance?.status === 'ABSENT' ? 'AUSENTE' : 'TARDANZA';
      const statusEmoji = attendance?.status === 'ABSENT' ? '❌' : '⏰';
      
      const emailHtml = `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; border-radius: 10px 10px 0 0; text-align: center; }
            .content { background: #f7fafc; padding: 30px; border-radius: 0 0 10px 10px; }
            .alert-box { background: ${attendance?.status === 'ABSENT' ? '#fee' : '#fef3cd'}; border-left: 4px solid ${attendance?.status === 'ABSENT' ? '#e53e3e' : '#f6ad55'}; padding: 20px; margin: 20px 0; border-radius: 5px; }
            .info { background: white; padding: 15px; border-radius: 5px; margin: 10px 0; }
            .footer { text-align: center; color: #718096; font-size: 12px; margin-top: 30px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>🏫 Sistema de Asistencia Escolar</h1>
              <p>I.E. Generalísimo José de San Martín</p>
            </div>
            <div class="content">
              <div class="alert-box">
                <h2>${statusEmoji} Notificación de ${statusText}</h2>
                <p>Estimado padre/madre de familia,</p>
                <p>Le informamos que su hijo(a) <strong>${student.firstName} ${student.lastName}</strong> ha sido marcado(a) como <strong>${statusText}</strong> el día de hoy.</p>
              </div>
              
              <div class="info">
                <h3>📋 Información del estudiante:</h3>
                <p><strong>Nombre:</strong> ${student.firstName} ${student.lastName}</p>
                <p><strong>Curso:</strong> ${student.course.name}</p>
                <p><strong>Fecha:</strong> ${today.toLocaleDateString('es-PE', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</p>
                <p><strong>Estado:</strong> ${statusText}</p>
                <p><strong>Docente:</strong> ${student.course.teacher.name || 'No especificado'}</p>
              </div>

              <p>Si tiene alguna consulta, por favor comuníquese con la institución educativa.</p>
              
              <div class="footer">
                <p>Este es un mensaje automático del Sistema de Asistencia Escolar.</p>
                <p>Por favor no responda a este correo.</p>
              </div>
            </div>
          </div>
        </body>
        </html>
      `;

      try {
        await resend.emails.send({
          from: 'Asistencia Escolar <onboarding@resend.dev>', // Cambiar por tu dominio verificado
          to: [student.parentEmail],
          subject: `${statusEmoji} Notificación de ${statusText} - ${student.firstName} ${student.lastName}`,
          html: emailHtml
        });
        return { studentId: student.id, success: true };
      } catch (emailError) {
        console.error(`Error enviando correo a ${student.parentEmail}:`, emailError);
        return { studentId: student.id, success: false, error: emailError };
      }
    });

    const emailResults = await Promise.all(emailPromises);
    const successfulEmails = emailResults.filter(r => r.success).length;

    return NextResponse.json({
      success: true,
      message: 'Asistencia guardada correctamente',
      attendances: savedAttendances,
      emailsSent: successfulEmails,
      totalEmails: emailResults.length
    });

  } catch (error) {
    console.error('Error en la API de asistencia:', error);
    return NextResponse.json(
      { error: 'Error al procesar la asistencia', details: error },
      { status: 500 }
    );
  }
}

// Obtener cursos del docente
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const teacherId = searchParams.get('teacherId');

    if (!teacherId) {
      return NextResponse.json(
        { error: 'teacherId es requerido' },
        { status: 400 }
      );
    }

    // Si teacherId es "all", devolver todos los cursos
    const whereClause = teacherId === 'all' ? {} : { teacherId: teacherId };

    const courses = await prisma.course.findMany({
      where: whereClause,
      include: {
        students: {
          orderBy: {
            lastName: 'asc'
          }
        }
      }
    });

    console.log(`✅ Cursos encontrados: ${courses.length}`);
    return NextResponse.json({ courses });

  } catch (error) {
    console.error('Error obteniendo cursos:', error);
    return NextResponse.json(
      { error: 'Error al obtener cursos', details: error },
      { status: 500 }
    );
  }
}
