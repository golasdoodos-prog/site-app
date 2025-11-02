import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/db';
import Application from '@/models/Application';
import { requireAuth } from '@/lib/middleware';

export async function GET(request: NextRequest) {
  try {
    await connectDB();

    const user = await requireAuth(request);
    if (user instanceof NextResponse) return user;

    let applications;
    
    if (user.role === 'user') {
      applications = await Application.find({ userId: user._id })
        .sort({ createdAt: -1 })
        .populate('userId', 'name email')
        .populate('adminId', 'name email');
    } else {
      applications = await Application.find()
        .sort({ createdAt: -1 })
        .populate('userId', 'name email')
        .populate('adminId', 'name email');
    }

    return NextResponse.json({ applications });
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

    const user = await requireAuth(request);
    if (user instanceof NextResponse) return user;

    if (user.role !== 'user') {
      return NextResponse.json(
        { error: 'Только пользователи могут создавать заявки' },
        { status: 403 }
      );
    }

    const { title, description } = await request.json();

    if (!title || !description) {
      return NextResponse.json(
        { error: 'Название и описание обязательны' },
        { status: 400 }
      );
    }

    const application = new Application({
      title,
      description,
      userId: user._id,
    });

    await application.save();
    await application.populate('userId', 'name email');

    return NextResponse.json({ application }, { status: 201 });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Ошибка сервера' },
      { status: 500 }
    );
  }
}

