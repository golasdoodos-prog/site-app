import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/db';
import User from '@/models/User';

// ВРЕМЕННЫЙ endpoint для создания первого администратора
// УДАЛИТЕ ЭТОТ ФАЙЛ ПОСЛЕ СОЗДАНИЯ АДМИНИСТРАТОРА!
export async function POST(request: NextRequest) {
  try {
    await connectDB();

    // Проверяем, есть ли уже пользователи
    const userCount = await User.countDocuments();
    if (userCount > 0) {
      return NextResponse.json(
        { error: 'Пользователи уже существуют. Используйте обычный вход.' },
        { status: 400 }
      );
    }

    const { email, password, name } = await request.json();

    if (!email || !password || !name) {
      return NextResponse.json(
        { error: 'Email, пароль и имя обязательны' },
        { status: 400 }
      );
    }

    const normalizedEmail = email.toLowerCase().trim();
    const existingUser = await User.findOne({ email: normalizedEmail });
    
    if (existingUser) {
      return NextResponse.json(
        { error: 'Пользователь с таким email уже существует' },
        { status: 400 }
      );
    }

    // Создаем администратора - модель User автоматически захеширует пароль
    const admin = new User({
      email: normalizedEmail,
      password: password, // Будет автоматически захеширован через pre-save hook
      name,
      role: 'superadmin',
    });

    await admin.save();

    return NextResponse.json({
      message: 'Администратор успешно создан!',
      user: {
        email: admin.email,
        name: admin.name,
        role: admin.role,
      },
      warning: 'ВАЖНО: Удалите файл app/api/admin/create-first/route.ts после использования!'
    }, { status: 201 });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Ошибка сервера' },
      { status: 500 }
    );
  }
}

