import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import nodemailer from 'nodemailer';

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
    today.setUTCHours(0, 0, 0, 0);

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
            status: att.status as 'PRESENT' | 'ABSENT' | 'LATE'
          },
          create: {
            date: today,
            status: att.status as 'PRESENT' | 'ABSENT' | 'LATE',
            studentId: att.studentId
          }
        });
      })
    );

    // Obtener todos los estudiantes con sus datos de padres
    const allStudents = await prisma.student.findMany({
      where: {
        id: { in: attendances.map((att: any) => att.studentId) }
      },
      include: {
        course: { include: { teacher: true } }
      }
    });

    // Enviar correos a padres
    const transporter = nodemailer.createTransport({
      host: 'smtp.gmail.com',
      port: 587,
      secure: false,
      auth: {
        user: process.env.GMAIL_USER,
        pass: process.env.GMAIL_APP_PASSWORD,
      },
    });

    const statusConfig: Record<string, { text: string; emoji: string; color: string; border: string; message: string }> = {
      PRESENT: { text: 'PRESENTE', emoji: '✅', color: '#f0fff4', border: '#38a169', message: 'Nos complace informarle que su hijo(a) asistió puntualmente a clases el día de hoy.' },
      LATE:    { text: 'TARDANZA', emoji: '⏰', color: '#fef3cd', border: '#f6ad55', message: 'Le informamos que su hijo(a) llegó tarde a clases el día de hoy.' },
      ABSENT:  { text: 'AUSENTE',  emoji: '❌', color: '#fff5f5', border: '#e53e3e', message: 'Le informamos que su hijo(a) no asistió a clases el día de hoy.' },
    };

    const emailPromises = allStudents.map(async (student) => {
      const attendance = attendances.find((att: any) => att.studentId === student.id);
      const cfg = statusConfig[attendance?.status ?? 'PRESENT'];

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
            .alert-box { background: ${cfg.color}; border-left: 4px solid ${cfg.border}; padding: 20px; margin: 20px 0; border-radius: 5px; }
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
                <h2>${cfg.emoji} Notificación de Asistencia — ${cfg.text}</h2>
                <p>Estimado padre/madre de familia,</p>
                <p>${cfg.message} Su hijo(a) es <strong>${student.firstName} ${student.lastName}</strong>.</p>
              </div>

              <div class="info">
                <h3>📋 Información del estudiante:</h3>
                <p><strong>Nombre:</strong> ${student.firstName} ${student.lastName}</p>
                <p><strong>Curso:</strong> ${student.course.name}</p>
                <p><strong>Fecha:</strong> ${today.toLocaleDateString('es-PE', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</p>
                <p><strong>Estado:</strong> ${cfg.text}</p>
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
        await transporter.sendMail({
          from: `"Asistencia Escolar" <${process.env.GMAIL_USER}>`,
          to: student.parentEmail,
          subject: `${cfg.emoji} Asistencia ${cfg.text} - ${student.firstName} ${student.lastName}`,
          html: emailHtml,
        });
        return { studentId: student.id, success: true };
      } catch (emailError: any) {
        const errMsg = emailError?.message ?? String(emailError);
        console.error(`Error enviando correo a ${student.parentEmail}:`, errMsg);
        return { studentId: student.id, success: false, error: errMsg };
      }
    });

    const emailResults = await Promise.all(emailPromises);
    const successfulEmails = emailResults.filter(r => r.success).length;

    const emailErrors = emailResults.filter(r => !r.success).map(r => r.error);

    return NextResponse.json({
      success: true,
      message: 'Asistencia guardada correctamente',
      attendances: savedAttendances,
      emailsSent: successfulEmails,
      totalEmails: emailResults.length,
      emailErrors,
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
