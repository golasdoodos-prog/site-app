import mongoose from 'mongoose';
import User from '../models/User';

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/site';

async function initAdmin() {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log('Подключение к MongoDB установлено');

    const email = process.argv[2] || 'admin@example.com';
    const password = process.argv[3] || 'admin123';
    const name = process.argv[4] || 'Главный администратор';

    const normalizedEmail = email.toLowerCase().trim();
    const existingUser = await User.findOne({ email: normalizedEmail });
    if (existingUser) {
      console.log('Пользователь с таким email уже существует');
      process.exit(1);
    }

    // Передаем обычный пароль - модель User сама захеширует его через pre-save hook
    const admin = new User({
      email: normalizedEmail,
      password: password, // Модель автоматически захеширует через pre-save hook
      name,
      role: 'superadmin',
    });

    await admin.save();
    console.log('Главный администратор создан успешно!');
    console.log(`Email: ${email}`);
    console.log(`Пароль: ${password}`);
    
    await mongoose.disconnect();
    process.exit(0);
  } catch (error) {
    console.error('Ошибка:', error);
    process.exit(1);
  }
}

initAdmin();

