import { PrismaClient, Role } from './generated/client/client';
import { PrismaPg } from '@prisma/adapter-pg';
import pg from 'pg';
import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import path from 'path';

const { Pool } = pg;

// Cargamos el archivo .env explícitamente desde la raíz
dotenv.config({ path: path.resolve(process.cwd(), '.env') });

// Solución nuclear para errores de certificados SSL en scripts locales
process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';

const connectionString = process.env.DIRECT_URL || process.env.DATABASE_URL;

if (!connectionString) {
  throw new Error('DATABASE_URL is not defined in environment variables');
}

// Configuración de Prisma 7 con Driver Adapter
const pool = new Pool({ 
  connectionString
});
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || '',
  process.env.SUPABASE_SERVICE_ROLE_KEY || ''
);

async function main() {
  console.log('🚀 Iniciando proceso de seed institucional...');

  try {
    // 1. Limpiar datos existentes
    console.log('🧹 Limpiando base de datos...');
    await prisma.attendance.deleteMany();
    await prisma.student.deleteMany();
    await prisma.course.deleteMany();
    await prisma.user.deleteMany();

    const adminEmail = 'admin@admin.com';
    const adminPassword = 'admin123';

    // 2. Crear usuario en Supabase Auth
    console.log('🔐 Verificando usuario en Supabase Auth...');
    let userId: string;
    
    const { data: authUser, error: authError } = await supabaseAdmin.auth.admin.createUser({
      email: adminEmail,
      password: adminPassword,
      email_confirm: true,
    });

    if (authError) {
      if (authError.message.includes('already been registered')) {
        console.log('ℹ️  Usuario ya existe, obteniendo ID...');
        const { data: existingUsers } = await supabaseAdmin.auth.admin.listUsers();
        const existingUser = existingUsers?.users.find(u => u.email === adminEmail);
        if (!existingUser) {
          throw new Error('No se pudo encontrar el usuario existente');
        }
        userId = existingUser.id;
        console.log(`✅ Usuario encontrado con ID: ${userId}`);
      } else {
        throw new Error(`Error en Supabase Auth: ${authError.message}`);
      }
    } else {
      userId = authUser?.user?.id || 'admin-profile-id';
      console.log(`✅ Usuario creado con ID: ${userId}`);
    }

    // 3. Crear perfil en Prisma
    console.log('👤 Creando perfil de administrador...');

    const adminProfile = await prisma.user.upsert({
      where: { email: adminEmail },
      update: { 
        name: 'Administrador General',
        id: userId 
      },
      create: {
        id: userId,
        email: adminEmail,
        name: 'Administrador General',
        role: Role.ADMIN,
      },
    });

    // 4. Crear datos de prueba
    console.log('📚 Creando cursos y estudiantes...');
    
    // Curso 1: 6to Grado A
    const curso1 = await prisma.course.create({
      data: {
        name: '6to Grado A',
        teacherId: adminProfile.id,
      },
    });

    const estudiantes1 = [
      { firstName: 'Juan', lastName: 'Pérez García', parentEmail: 'juan.padre@ejemplo.com' },
      { firstName: 'María', lastName: 'López Sánchez', parentEmail: 'maria.padre@ejemplo.com' },
      { firstName: 'Carlos', lastName: 'Rodríguez Díaz', parentEmail: 'carlos.padre@ejemplo.com' },
      { firstName: 'Ana', lastName: 'Martínez Torres', parentEmail: 'ana.padre@ejemplo.com' },
      { firstName: 'Luis', lastName: 'González Ruiz', parentEmail: 'luis.padre@ejemplo.com' },
      { firstName: 'Sofia', lastName: 'Hernández López', parentEmail: 'sofia.padre@ejemplo.com' },
      { firstName: 'Pedro', lastName: 'Ramírez Castro', parentEmail: 'pedro.padre@ejemplo.com' },
      { firstName: 'Laura', lastName: 'Torres Vega', parentEmail: 'laura.padre@ejemplo.com' },
    ];

    for (const estudiante of estudiantes1) {
      await prisma.student.create({
        data: {
          firstName: estudiante.firstName,
          lastName: estudiante.lastName,
          parentEmail: estudiante.parentEmail,
          courseId: curso1.id,
        },
      });
    }

    // Curso 2: 5to Grado B
    const curso2 = await prisma.course.create({
      data: {
        name: '5to Grado B',
        teacherId: adminProfile.id,
      },
    });

    const estudiantes2 = [
      { firstName: 'Diego', lastName: 'Flores Morales', parentEmail: 'diego.padre@ejemplo.com' },
      { firstName: 'Valentina', lastName: 'Silva Ortiz', parentEmail: 'valentina.padre@ejemplo.com' },
      { firstName: 'Mateo', lastName: 'Cruz Mendoza', parentEmail: 'mateo.padre@ejemplo.com' },
      { firstName: 'Isabella', lastName: 'Reyes Vargas', parentEmail: 'isabella.padre@ejemplo.com' },
    ];

    for (const estudiante of estudiantes2) {
      await prisma.student.create({
        data: {
          firstName: estudiante.firstName,
          lastName: estudiante.lastName,
          parentEmail: estudiante.parentEmail,
          courseId: curso2.id,
        },
      });
    }

    console.log('✅ Seed completado con éxito.');
    console.log(`📊 Resumen:`);
    console.log(`   - Usuario admin: ${adminEmail} / ${adminPassword}`);
    console.log(`   - Cursos creados: 2`);
    console.log(`   - Estudiantes creados: ${estudiantes1.length + estudiantes2.length}`);
  } catch (error) {
    console.error('❌ Error durante el seed:', error);
    process.exit(1);
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
    await pool.end();
  });
