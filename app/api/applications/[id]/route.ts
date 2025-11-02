import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/db';
import Application from '@/models/Application';
import { requireRole } from '@/lib/middleware';
import { IUser } from '@/models/User';
import mongoose from 'mongoose';

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await connectDB();

    const user = await requireRole(request, ['admin', 'senioradmin', 'superadmin']);
    if (user instanceof NextResponse) return user;

    const { status, adminComment } = await request.json();

    if (!status || !['pending', 'in_progress', 'approved', 'rejected'].includes(status)) {
      return NextResponse.json(
        { error: 'Неверный статус' },
        { status: 400 }
      );
    }

    const application = await Application.findById(params.id);

    if (!application) {
      return NextResponse.json(
        { error: 'Заявка не найдена' },
        { status: 404 }
      );
    }

    application.status = status;
    application.adminId = (user as IUser)._id as mongoose.Types.ObjectId;
    if (adminComment) {
      application.adminComment = adminComment;
    }

    await application.save();
    await application.populate('userId', 'name email');
    await application.populate('adminId', 'name email');

    return NextResponse.json({ application });
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

    const user = await requireRole(request, ['admin', 'senioradmin', 'superadmin']);
    if (user instanceof NextResponse) return user;

    const application = await Application.findById(params.id);

    if (!application) {
      return NextResponse.json(
        { error: 'Заявка не найдена' },
        { status: 404 }
      );
    }

    await Application.findByIdAndDelete(params.id);

    return NextResponse.json({ message: 'Заявка удалена' });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Ошибка сервера' },
      { status: 500 }
    );
  }
}

