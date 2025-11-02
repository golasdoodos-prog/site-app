import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/db';
import User from '@/models/User';
import { requireRole } from '@/lib/middleware';

export async function GET(request: NextRequest) {
  try {
    await connectDB();

    const user = await requireRole(request, ['admin', 'senioradmin', 'superadmin']);
    if (user instanceof NextResponse) return user;

    const users = await User.find({}, { password: 0 }).sort({ createdAt: -1 });

    return NextResponse.json({ users });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Ошибка сервера' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    await connectDB();

    const user = await requireRole(request, ['admin', 'senioradmin', 'superadmin']);
    if (user instanceof NextResponse) return user;

    const { email, password, name, role } = await request.json();

    if (!email || !password || !name) {
      return NextResponse.json(
        { error: 'Email, пароль и имя обязательны' },
        { status: 400 }
      );
    }

    const existingUser = await User.findOne({ email: email.toLowerCase() });
    if (existingUser) {
      return NextResponse.json(
        { error: 'Пользователь с таким email уже существует' },
        { status: 400 }
      );
    }

    let newUserRole = role || 'user';
    // senioradmin не может создавать superadmin
    if (user.role === 'senioradmin' && role === 'superadmin') {
      newUserRole = 'user';
    }
    // admin не может создавать superadmin и senioradmin
    if (user.role === 'admin' && (role === 'superadmin' || role === 'senioradmin')) {
      newUserRole = 'user';
    }

    const newUser = new User({
      email: email.toLowerCase(),
      password,
      name,
      role: newUserRole,
    });

    await newUser.save();

    const userResponse = {
      _id: newUser._id.toString(),
      email: newUser.email,
      name: newUser.name,
      role: newUser.role,
    };

    return NextResponse.json({ user: userResponse }, { status: 201 });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Ошибка сервера' },
      { status: 500 }
    );
  }
}

