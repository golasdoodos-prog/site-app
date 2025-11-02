import mongoose from 'mongoose';
import User from '../models/User';

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/site';

async function resetPassword() {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log('Подключение к MongoDB установлено');

    const email = process.argv[2];
    const newPassword = process.argv[3];

    if (!email || !newPassword) {
      console.log('Использование: npm run reset-password <email> <новый_пароль>');
      console.log('Пример: npm run reset-password user@example.com newpassword123');
      process.exit(1);
    }

    const normalizedEmail = email.toLowerCase().trim();
    const user = await User.findOne({ email: normalizedEmail });

    if (!user) {
      console.log('Пользователь с таким email не найден:', normalizedEmail);
      process.exit(1);
    }

    // Устанавливаем новый пароль (модель User автоматически захеширует его через pre-save hook)
    // Явно помечаем поле как измененное, чтобы pre-save hook сработал
    user.set('password', newPassword);
    user.markModified('password');
    await user.save();
    
    // Проверяем, что пароль правильно сохранен
    const updatedUser = await User.findOne({ email: normalizedEmail });
    const testMatch = await updatedUser!.comparePassword(newPassword);
    if (!testMatch) {
      console.error('ОШИБКА: Пароль не совпадает после сохранения!');
      process.exit(1);
    }
    console.log('✓ Пароль успешно проверен - совпадение подтверждено');

    console.log('Пароль успешно изменен!');
    console.log(`Email: ${user.email}`);
    console.log(`Имя: ${user.name}`);
    console.log(`Роль: ${user.role}`);
    console.log(`Новый пароль: ${newPassword}`);
    
    await mongoose.disconnect();
    process.exit(0);
  } catch (error) {
    console.error('Ошибка:', error);
    process.exit(1);
  }
}

resetPassword();

