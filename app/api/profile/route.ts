import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/db';
import User, { IUser } from '@/models/User';
import { requireAuth } from '@/lib/middleware';
import bcrypt from 'bcryptjs';
import mongoose from 'mongoose';

// GET - получить профиль текущего пользователя
export async function GET(request: NextRequest) {
  try {
    await connectDB();

    const user = await requireAuth(request);
    if (user instanceof NextResponse) return user;

    const userProfile = await User.findById((user as IUser)._id).select('-password');
    
    if (!userProfile) {
      return NextResponse.json(
        { error: 'Пользователь не найден' },
        { status: 404 }
      );
    }

    return NextResponse.json({ user: userProfile });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Ошибка сервера' },
      { status: 500 }
    );
  }
}

// PATCH - обновить профиль (имя и/или пароль)
export async function PATCH(request: NextRequest) {
  try {
    await connectDB();

    const user = await requireAuth(request);
    if (user instanceof NextResponse) return user;

    const { name, password } = await request.json();

    const targetUser = await User.findById((user as IUser)._id);

    if (!targetUser) {
      return NextResponse.json(
        { error: 'Пользователь не найден' },
        { status: 404 }
      );
    }

    // Обновляем имя, если оно предоставлено
    if (name) {
      targetUser.name = name;
    }

    // Обновляем пароль, если он предоставлен
    if (password) {
      if (password.length < 6) {
        return NextResponse.json(
          { error: 'Пароль должен содержать минимум 6 символов' },
          { status: 400 }
        );
      }
      const salt = await bcrypt.genSalt(10);
      targetUser.password = await bcrypt.hash(password, salt);
    }

    // Если ничего не обновляется
    if (!name && !password) {
      return NextResponse.json(
        { error: 'Не указаны данные для обновления' },
        { status: 400 }
      );
    }

    await targetUser.save();

    const userResponse = {
      _id: targetUser._id.toString(),
      email: targetUser.email,
      name: targetUser.name,
      role: targetUser.role,
    };

    return NextResponse.json({ 
      user: userResponse,
      message: 'Профиль успешно обновлен'
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Ошибка сервера' },
      { status: 500 }
    );
  }
}

