import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/db';
import User, { IUser } from '@/models/User';
import { generateToken } from '@/lib/auth';

export async function POST(request: NextRequest) {
  try {
    await connectDB();

    const { email, password } = await request.json();

    console.log('Login attempt for email:', email ? email.substring(0, 3) + '***' : 'empty');

    if (!email || !password) {
      return NextResponse.json(
        { error: 'Email и пароль обязательны' },
        { status: 400 }
      );
    }

    const normalizedEmail = email.toLowerCase().trim();
    console.log('Normalized email:', normalizedEmail);
    
    const userDoc = await User.findOne({ email: normalizedEmail });
    
    if (!userDoc) {
      console.log('User not found for email:', normalizedEmail);
      // Проверим, может быть есть пользователь с похожим email (для отладки)
      const allUsers = await User.find({}, { email: 1, _id: 0 }).limit(5);
      console.log('Available emails (first 5):', allUsers.map(u => u.email));
      return NextResponse.json(
        { error: 'Пользователь с таким email не найден. Проверьте правильность email или обратитесь к администратору.' },
        { status: 401 }
      );
    }

    const user = userDoc as IUser;
    console.log('User found:', user.email, 'User ID:', user._id);
    const isMatch = await user.comparePassword(password);
    
    if (!isMatch) {
      console.log('Password mismatch for user:', normalizedEmail);
      return NextResponse.json(
        { error: 'Неверный пароль. Если вы недавно меняли email, убедитесь, что используете правильный email для входа.' },
        { status: 401 }
      );
    }

    console.log('Login successful for user:', normalizedEmail);

    const token = generateToken(user);

    const response = NextResponse.json({
      token,
      user: {
        _id: user._id.toString(),
        email: user.email,
        name: user.name,
        role: user.role,
      },
    });

    response.cookies.set('token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 7, // 7 days
    });

    return response;
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Ошибка сервера' },
      { status: 500 }
    );
  }
}

