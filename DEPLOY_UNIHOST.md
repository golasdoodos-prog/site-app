# Пошаговая инструкция: Деплой на unihost.kz

## Шаг 1: Подготовка проекта

### 1.1. Проверьте файлы проекта
Убедитесь, что у вас есть:
- ✅ `package.json` - с правильными скриптами
- ✅ Все файлы проекта на месте
- ✅ Проект работает локально (`npm run dev`)

### 1.2. Создайте файл `.env.local` (для локальной разработки)
```env
MONGODB_URI=mongodb://localhost:27017/site
JWT_SECRET=ваш-секретный-ключ-здесь
```

**Важно:** Этот файл НЕ загружайте на сервер! Он только для локальной разработки.

## Шаг 2: Регистрация и покупка хостинга на unihost.kz

### 2.1. Зарегистрируйтесь на unihost.kz
- Перейдите на https://unihost.kz/
- Зарегистрируйте аккаунт

### 2.2. Выберите тариф
Для Next.js приложения нужен один из вариантов:

**Вариант А: VPS (рекомендуется)**
- Подходит для полного контроля
- Можете установить Node.js, MongoDB
- Обычно от 2000-5000 тенге/месяц

**Вариант Б: Виртуальный хостинг с Node.js**
- Если unihost.kz предоставляет хостинг с поддержкой Node.js
- Проще в настройке
- Проверьте в описании тарифа наличие Node.js

### 2.3. Приобретите хостинг
- Выберите тариф и оплатите
- Запишите данные для доступа (IP адрес, логин, пароль)

## Шаг 3: Настройка базы данных MongoDB

### 3.1. Вариант А: MongoDB на VPS (если у вас VPS)
Вы сможете установить MongoDB прямо на сервер.

### 3.2. Вариант Б: MongoDB Atlas (рекомендуется - проще)
Используйте бесплатную облачную базу MongoDB Atlas:

1. **Зарегистрируйтесь на MongoDB Atlas:**
   - Перейдите на https://www.mongodb.com/cloud/atlas/register
   - Создайте бесплатный аккаунт

2. **Создайте кластер:**
   - Создайте бесплатный кластер (M0)
   - Выберите регион (ближайший к Казахстану)

3. **Настройте доступ:**
   - В "Database Access" создайте пользователя БД
   - В "Network Access" добавьте IP `0.0.0.0/0` (разрешить всем)

4. **Получите строку подключения:**
   - Нажмите "Connect" → "Connect your application"
   - Скопируйте строку вида: `mongodb+srv://username:password@cluster.mongodb.net/site`
   - Замените `<password>` на ваш пароль
   - Замените `site` на название базы данных

**Запишите эту строку - она понадобится на сервере!**

## Шаг 4: Подключение к серверу

### 4.1. Подключение по SSH (для VPS)

**Windows:**
- Используйте PuTTY (скачать: https://www.putty.org/)
- Или Windows Terminal (встроен в Windows 10/11)
- Или используйте Git Bash

**macOS/Linux:**
- Используйте встроенный Terminal

```bash
ssh ваш_логин@ваш_ip_адрес
# Введите пароль при запросе
```

### 4.2. Подключение через FTP (для виртуального хостинга)
- Используйте FileZilla (https://filezilla-project.org/)
- Данные FTP обычно приходят в письме от unihost.kz

## Шаг 5: Установка необходимого ПО на сервере (для VPS)

Если у вас VPS, установите:

### 5.1. Node.js (версия 18 или выше)
```bash
# Обновляем систему
sudo apt update
sudo apt upgrade -y

# Устанавливаем Node.js через nvm (рекомендуется)
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.0/install.sh | bash
source ~/.bashrc
nvm install 18
nvm use 18
nvm alias default 18

# Проверяем установку
node --version
npm --version
```

### 5.2. PM2 (менеджер процессов для Node.js)
```bash
npm install -g pm2
```

### 5.3. MongoDB (если устанавливаете локально)
```bash
# Установка MongoDB
wget -qO - https://www.mongodb.org/static/pgp/server-6.0.asc | sudo apt-key add -
echo "deb [ arch=amd64,arm64 ] https://repo.mongodb.org/apt/ubuntu focal/mongodb-org/6.0 multiverse" | sudo tee /etc/apt/sources.list.d/mongodb-org-6.0.list
sudo apt-get update
sudo apt-get install -y mongodb-org

# Запуск MongoDB
sudo systemctl start mongod
sudo systemctl enable mongod
```

### 5.4. Nginx (веб-сервер, опционально)
```bash
sudo apt install nginx -y
sudo systemctl start nginx
sudo systemctl enable nginx
```

## Шаг 6: Загрузка проекта на сервер

### 6.1. Способ А: Через Git (рекомендуется)

**На вашем компьютере:**

1. **Создайте репозиторий на GitHub:**
   - Зайдите на https://github.com
   - Создайте новый репозиторий (например, `site-app`)
   - НЕ добавляйте README, .gitignore (они уже есть)

2. **Загрузите код в GitHub:**
```bash
# В папке вашего проекта
git init
git add .
git commit -m "Initial commit"
git branch -M main
git remote add origin https://github.com/ВАШ_ЛОГИН/ВАШ_РЕПОЗИТОРИЙ.git
git push -u origin main
```

**На сервере:**
```bash
# Установите Git (если еще не установлен)
sudo apt install git -y

# Клонируйте репозиторий
cd ~
git clone https://github.com/ВАШ_ЛОГИН/ВАШ_РЕПОЗИТОРИЙ.git
cd ВАШ_РЕПОЗИТОРИЙ

# Установите зависимости
npm install
```

### 6.2. Способ Б: Через FTP/SFTP

1. **Создайте архив проекта** (исключая node_modules и .next):
```bash
# На вашем компьютере
# Удалите node_modules и .next если они есть
# Создайте архив
tar -czf site.tar.gz --exclude='node_modules' --exclude='.next' --exclude='.git' .
```

2. **Загрузите через FTP:**
   - Подключитесь через FileZilla
   - Загрузите архив на сервер
   - Распакуйте на сервере:
   ```bash
   tar -xzf site.tar.gz
   ```

3. **Установите зависимости на сервере:**
```bash
npm install
```

## Шаг 7: Настройка переменных окружения на сервере

### 7.1. Создайте файл `.env.local` на сервере
```bash
nano .env.local
```

### 7.2. Добавьте переменные:
```env
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/site
JWT_SECRET=ваш-очень-длинный-случайный-секретный-ключ-здесь
NODE_ENV=production
```

**Важно:**
- Замените `MONGODB_URI` на вашу строку подключения из MongoDB Atlas
- Сгенерируйте случайный `JWT_SECRET` (можно использовать: https://randomkeygen.com/)
- Сохраните файл: `Ctrl+O`, затем `Enter`, затем `Ctrl+X`

## Шаг 8: Сборка и запуск приложения

### 8.1. Соберите проект:
```bash
npm run build
```

### 8.2. Запустите через PM2:
```bash
pm2 start npm --name "site-app" -- start
pm2 save
pm2 startup
```

### 8.3. Проверьте статус:
```bash
pm2 status
pm2 logs site-app
```

Приложение должно запуститься на порту 3000 (или на том, который указан в настройках).

## Шаг 9: Настройка Nginx (для доступа через домен)

### 9.1. Создайте конфигурацию Nginx:
```bash
sudo nano /etc/nginx/sites-available/site
```

### 9.2. Добавьте конфигурацию:
```nginx
server {
    listen 80;
    server_name ваш-домен.kz www.ваш-домен.kz;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

### 9.3. Активируйте конфигурацию:
```bash
sudo ln -s /etc/nginx/sites-available/site /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx
```

## Шаг 10: Настройка домена в unihost.kz

### 10.1. В панели управления unihost.kz:
- Перейдите в управление доменом
- Найдите раздел "DNS записи" или "Управление DNS"

### 10.2. Добавьте A-запись:
```
Тип: A
Имя: @ (или оставьте пустым)
Значение: IP_АДРЕС_ВАШЕГО_СЕРВЕРА
TTL: 3600
```

### 10.3. Добавьте CNAME для www:
```
Тип: CNAME
Имя: www
Значение: ваш-домен.kz
TTL: 3600
```

### 10.4. Дождитесь применения DNS (1-2 часа)

## Шаг 11: Настройка SSL (HTTPS)

### 11.1. Установите Certbot:
```bash
sudo apt install certbot python3-certbot-nginx -y
```

### 11.2. Получите SSL сертификат:
```bash
sudo certbot --nginx -d ваш-домен.kz -d www.ваш-домен.kz
```

Следуйте инструкциям на экране. Certbot автоматически настроит HTTPS.

## Шаг 12: Создание первого администратора

### 12.1. Подключитесь к MongoDB Atlas:
- Зайдите в MongoDB Atlas → "Browse Collections"
- Если база пустая, создайте коллекцию `users`

### 12.2. Создайте первого пользователя:

**Вариант А: Через скрипт на сервере**
```bash
# На сервере, в папке проекта
MONGODB_URI="ваша-строка-подключения" npm run init-admin
```

**Вариант Б: Через MongoDB Compass**
1. Скачайте MongoDB Compass: https://www.mongodb.com/products/compass
2. Подключитесь используя строку подключения из Atlas
3. Создайте документ в коллекции `users`:
```json
{
  "email": "admin@example.com",
  "password": "хешированный_пароль",
  "name": "Администратор",
  "role": "superadmin"
}
```

**Важно:** Пароль должен быть захеширован с помощью bcrypt (rounds: 10).
Можно использовать онлайн генератор: https://bcrypt-generator.com/

## Шаг 13: Проверка работы

1. Откройте ваш сайт: `https://ваш-домен.kz`
2. Войдите с учетными данными администратора
3. Проверьте основные функции

## Обновление сайта после изменений

### Вариант А: Через Git (рекомендуется)
```bash
# На вашем компьютере
git add .
git commit -m "Описание изменений"
git push

# На сервере
cd ~/ВАШ_РЕПОЗИТОРИЙ
git pull
npm install  # если добавили новые зависимости
npm run build
pm2 restart site-app
```

### Вариант Б: Прямое редактирование на сервере
```bash
# Подключитесь по SSH
# Отредактируйте файлы через nano или vim
nano app/dashboard/admin/page.tsx

# После изменений
npm run build
pm2 restart site-app
```

## Полезные команды PM2

```bash
pm2 status          # Статус всех процессов
pm2 logs site-app   # Просмотр логов
pm2 restart site-app # Перезапуск
pm2 stop site-app   # Остановка
pm2 delete site-app # Удаление из PM2
```

## Решение проблем

### Проблема: Приложение не запускается
```bash
# Проверьте логи
pm2 logs site-app

# Проверьте переменные окружения
cat .env.local

# Проверьте подключение к MongoDB
```

### Проблема: Ошибка порта занят
```bash
# Найдите процесс на порту 3000
sudo lsof -i :3000

# Убейте процесс
sudo kill -9 PID_ПРОЦЕССА
```

### Проблема: MongoDB не подключается
- Проверьте строку подключения в `.env.local`
- Убедитесь, что IP адрес сервера добавлен в MongoDB Atlas Network Access
- Проверьте логи: `pm2 logs site-app`

## Контакты поддержки

- **Unihost.kz поддержка:** Обычно доступна через личный кабинет или по телефону
- **Документация Next.js:** https://nextjs.org/docs/deployment
- **Документация PM2:** https://pm2.keymetrics.io/docs/

---

**Успешного деплоя! 🚀**

