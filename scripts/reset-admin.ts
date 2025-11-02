import mongoose from 'mongoose';
import User from '../models/User';

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/site';

async function resetAdmin() {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log('Подключение к MongoDB установлено');

    const email = process.argv[2] || 'admin@example.com';
    const password = process.argv[3] || 'admin123';
    const name = process.argv[4] || 'Главный администратор';

    const normalizedEmail = email.toLowerCase().trim();
    
    // Удаляем существующего пользователя, если есть
    await User.deleteOne({ email: normalizedEmail });
    console.log('Старый пользователь удален (если существовал)');

    // Создаем нового с правильным хешированием
    const admin = new User({
      email: normalizedEmail,
      password: password, // Модель автоматически захеширует через pre-save hook
      name,
      role: 'superadmin',
    });

    await admin.save();
    console.log('Главный администратор создан успешно!');
    console.log(`Email: ${normalizedEmail}`);
    console.log(`Пароль: ${password}`);
    
    await mongoose.disconnect();
    process.exit(0);
  } catch (error) {
    console.error('Ошибка:', error);
    process.exit(1);
  }
}

resetAdmin();

