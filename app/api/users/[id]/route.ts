import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/db';
import User from '@/models/User';
import { requireRole } from '@/lib/middleware';
import bcrypt from 'bcryptjs';

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await connectDB();

    const user = await requireRole(request, ['senioradmin', 'superadmin']);
    if (user instanceof NextResponse) return user;

    const { role, password } = await request.json();

    const targetUser = await User.findById(params.id);

    if (!targetUser) {
      return NextResponse.json(
        { error: 'Пользователь не найден' },
        { status: 404 }
      );
    }

    // senioradmin не может изменять superadmin
    if (user.role === 'senioradmin' && targetUser.role === 'superadmin') {
      return NextResponse.json(
        { error: 'Недостаточно прав для изменения этого пользователя' },
        { status: 403 }
      );
    }

    // senioradmin не может назначать роль superadmin
    if (user.role === 'senioradmin' && role === 'superadmin') {
      return NextResponse.json(
        { error: 'Недостаточно прав для назначения этой роли' },
        { status: 403 }
      );
    }

    if (role && ['user', 'admin', 'senioradmin', 'superadmin'].includes(role)) {
      targetUser.role = role;
    }

    if (password) {
      const salt = await bcrypt.genSalt(10);
      targetUser.password = await bcrypt.hash(password, salt);
    }

    await targetUser.save();

    const userResponse = {
      _id: targetUser._id.toString(),
      email: targetUser.email,
      name: targetUser.name,
      role: targetUser.role,
    };

    return NextResponse.json({ user: userResponse });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Ошибка сервера' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await connectDB();

    const user = await requireRole(request, ['senioradmin', 'superadmin']);
    if (user instanceof NextResponse) return user;

    const targetUser = await User.findById(params.id);

    if (!targetUser) {
      return NextResponse.json(
        { error: 'Пользователь не найден' },
        { status: 404 }
      );
    }

    // Нельзя удалить самого себя
    if (targetUser._id.toString() === user._id.toString()) {
      return NextResponse.json(
        { error: 'Нельзя удалить самого себя' },
        { status: 400 }
      );
    }

    // senioradmin не может удалять superadmin
    if (user.role === 'senioradmin' && targetUser.role === 'superadmin') {
      return NextResponse.json(
        { error: 'Недостаточно прав для удаления этого пользователя' },
        { status: 403 }
      );
    }

    await User.findByIdAndDelete(params.id);

    return NextResponse.json({ message: 'Пользователь удален' });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Ошибка сервера' },
      { status: 500 }
    );
  }
}

