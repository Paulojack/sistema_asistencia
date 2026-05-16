import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function PATCH(request: NextRequest) {
  try {
    const { email, name } = await request.json();

    if (!email || !name?.trim()) {
      return NextResponse.json({ error: 'Datos inválidos' }, { status: 400 });
    }

    const user = await prisma.user.upsert({
      where: { email },
      update: { name: name.trim() },
      create: { email, name: name.trim() },
    });

    return NextResponse.json({ success: true, user });
  } catch (error) {
    console.error('Error actualizando usuario:', error);
    return NextResponse.json({ error: 'Error al actualizar usuario' }, { status: 500 });
  }
}
