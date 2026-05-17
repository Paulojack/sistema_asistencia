import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET() {
  const checks: Record<string, any> = {
    env: {
      DATABASE_URL:    process.env.DATABASE_URL ? '✓ presente' : '✗ FALTA',
      GMAIL_USER:      process.env.GMAIL_USER   ? '✓ presente' : '✗ FALTA',
    },
  };

  try {
    const count = await prisma.course.count();
    checks.database = { status: '✓ conectado', courses: count };
  } catch (error: any) {
    checks.database = { status: '✗ ERROR', message: error?.message ?? String(error) };
  }

  return NextResponse.json(checks);
}
