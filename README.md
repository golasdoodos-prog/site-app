# Система управления заявками

Веб-приложение для управления заявками с системой ролей и аутентификации.

## Возможности

- **Аутентификация**: Вход в систему по email и паролю
- **Роли пользователей**:
  - Пользователь: создание и просмотр своих заявок
  - Специалист: обработка заявок, создание пользователей
  - Главный специалист: обработка заявок, создание пользователей, управление пользователями (кроме руководителей отдела)
  - Руководитель отдела: полное управление пользователями, изменение ролей, сброс паролей
- **Заявки**: Создание, просмотр и обработка заявок

## Технологии

- Next.js 14 (App Router)
- TypeScript
- MongoDB (Mongoose)
- Tailwind CSS
- JWT для аутентификации

## Установка

1. Установите зависимости:
```bash
npm install
```

2. Создайте файл `.env.local` в корне проекта:
```env
MONGODB_URI=mongodb://localhost:27017/site
JWT_SECRET=your-secret-key-change-in-production
```

3. Убедитесь, что MongoDB запущена локально или используйте MongoDB Atlas

4. Запустите сервер разработки:
```bash
npm run dev
```

5. Откройте [http://localhost:3000](http://localhost:3000) в браузере

## Первый запуск

После установки зависимостей и настройки MongoDB, создайте первого руководителя отдела:

```bash
npm run init-admin
```

Или с параметрами:
```bash
npm run init-admin admin@example.com password123 "Имя Руководителя"
```

По умолчанию создается пользователь:
- Email: admin@example.com
- Пароль: admin123
- Имя: Главный администратор
- Роль: superadmin (отображается как "Руководитель отдела")

## Структура проекта

- `app/` - Страницы и API routes
- `components/` - React компоненты
- `lib/` - Утилиты и функции
- `models/` - Mongoose модели

## API Endpoints

### Аутентификация
- `POST /api/auth/login` - Вход
- `GET /api/auth/me` - Получить текущего пользователя
- `POST /api/auth/logout` - Выход

### Заявки
- `GET /api/applications` - Список заявок
- `POST /api/applications` - Создать заявку
- `PATCH /api/applications/[id]` - Обновить статус заявки

### Пользователи (только для специалистов и руководителей)
- `GET /api/users` - Список пользователей
- `POST /api/users` - Создать пользователя
- `PATCH /api/users/[id]` - Обновить пользователя (только руководитель отдела)

## Развертывание в интернете

Подробная инструкция по развертыванию находится в файле [DEPLOY.md](./DEPLOY.md)

### Быстрый старт (Vercel + MongoDB Atlas)

1. **Настройте MongoDB Atlas:**
   - Зарегистрируйтесь на https://www.mongodb.com/cloud/atlas
   - Создайте бесплатный кластер
   - Получите строку подключения

2. **Загрузите код в GitHub:**
   ```bash
   git init
   git add .
   git commit -m "Initial commit"
   git remote add origin https://github.com/YOUR_USERNAME/YOUR_REPO.git
   git push -u origin main
   ```

3. **Разверните на Vercel:**
   - Зарегистрируйтесь на https://vercel.com
   - Подключите GitHub репозиторий
   - Добавьте переменные окружения:
     - `MONGODB_URI` - строка подключения из MongoDB Atlas
     - `JWT_SECRET` - случайный секретный ключ
   - Нажмите "Deploy"

4. **Создайте первого администратора:**
   - Используйте MongoDB Compass или веб-интерфейс Atlas
   - Или запустите локально: `MONGODB_URI="your-atlas-uri" npm run init-admin`

Подробнее см. [DEPLOY.md](./DEPLOY.md)

