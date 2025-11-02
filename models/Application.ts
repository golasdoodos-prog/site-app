import mongoose, { Schema, Document } from 'mongoose';

export interface IApplication extends Document {
  title: string;
  description: string;
  status: 'pending' | 'in_progress' | 'approved' | 'rejected';
  userId: mongoose.Types.ObjectId;
  adminId?: mongoose.Types.ObjectId;
  adminComment?: string;
  createdAt: Date;
  updatedAt: Date;
}

const ApplicationSchema = new Schema<IApplication>(
  {
    title: {
      type: String,
      required: [true, 'Title is required'],
      trim: true,
    },
    description: {
      type: String,
      required: [true, 'Description is required'],
      trim: true,
    },
    status: {
      type: String,
      enum: ['pending', 'in_progress', 'approved', 'rejected'],
      default: 'pending',
    },
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    adminId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
    },
    adminComment: {
      type: String,
      trim: true,
    },
  },
  {
    timestamps: true,
  }
);

// Удаляем модель из кэша, если она существует, чтобы обновить схему
if (mongoose.models.Application) {
  delete mongoose.models.Application;
}

const Application = mongoose.model<IApplication>('Application', ApplicationSchema);

export default Application;

