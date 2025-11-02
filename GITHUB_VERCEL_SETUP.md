# 📤 Как загрузить проект в GitHub и подключить к Vercel

## Шаг 1: Создание репозитория на GitHub

### 1.1. Зарегистрируйтесь на GitHub
1. Откройте: https://github.com
2. Нажмите "Sign up" (если еще нет аккаунта)
3. Зарегистрируйтесь (можно через email или Google)

### 1.2. Создайте новый репозиторий
1. После входа нажмите "+" в правом верхнем углу
2. Выберите "New repository"
3. Заполните:
   - **Repository name:** например, `site-app` или `my-applications`
   - **Description:** опционально (можно оставить пустым)
   - **Public** или **Private:** выберите как хотите
   - ❌ **НЕ** ставьте галочки на:
     - Add a README file
     - Add .gitignore
     - Choose a license
4. Нажмите "Create repository"

✅ **Запомните название репозитория!** Например: `ваш-логин/site-app`

---

## Шаг 2: Загрузка кода в GitHub

### 2.1. Откройте терминал в папке проекта

**Windows:**
- Откройте папку проекта: `C:\Users\Admin\Desktop\site`
- Правой кнопкой → "Git Bash Here" (если установлен Git)
- Или откройте PowerShell в этой папке

**Или используйте командную строку:**
- Нажмите `Win + R`
- Введите `cmd` и нажмите Enter
- Перейдите в папку:
  ```bash
  cd C:\Users\Admin\Desktop\site
  ```

### 2.2. Проверьте установлен ли Git

```bash
git --version
```

Если показывает версию - Git установлен.  
Если ошибка - скачайте Git: https://git-scm.com/download/win

### 2.3. Инициализируйте Git и загрузите код

Выполните команды по порядку (замените `ВАШ_ЛОГИН` и `ВАШ_РЕПОЗИТОРИЙ`):

```bash
# Инициализация Git
git init

# Добавить все файлы
git add .

# Создать первый коммит
git commit -m "Initial commit"

# Переименовать ветку в main
git branch -M main

# Добавить удаленный репозиторий (ЗАМЕНИТЕ НА ВАШИ ДАННЫЕ!)
git remote add origin https://github.com/ВАШ_ЛОГИН/ВАШ_РЕПОЗИТОРИЙ.git

# Загрузить код
git push -u origin main
```

**Пример:**
Если ваш логин `john` и репозиторий `site-app`, то команда будет:
```bash
git remote add origin https://github.com/john/site-app.git
```

### 2.4. Введите данные GitHub

При выполнении `git push` может попросить:
- **Username:** ваш логин GitHub
- **Password:** НЕ пароль! Используйте Personal Access Token
  - Как получить токен: https://github.com/settings/tokens
  - Нажмите "Generate new token" → выберите срок → отметьте "repo" → скопируйте токен

---

## Шаг 3: Подключение к Vercel

### 3.1. В Vercel выберите способ подключения

На странице "Let's build something new" есть несколько вариантов:

**Вариант А: Через GitHub (РЕКОМЕНДУЕТСЯ)**
1. Нажмите "Continue with GitHub" или иконку GitHub
2. Войдите через GitHub аккаунт
3. Разрешите доступ Vercel к репозиториям
4. Выберите ваш репозиторий из списка
5. Нажмите "Import"

**Вариант Б: Через URL (если не работает вариант А)**
1. В поле "Enter a Git repository URL" вставьте:
   ```
   https://github.com/ВАШ_ЛОГИН/ВАШ_РЕПОЗИТОРИЙ
   ```
   Например: `https://github.com/john/site-app`
2. Нажмите "Continue"
3. Войдите через GitHub если попросит

---

## Шаг 4: Настройка проекта в Vercel

После импорта репозитория:

1. **Настройте проект:**
   - Project Name: можете оставить как есть
   - Framework Preset: должен определиться автоматически "Next.js"
   - Root Directory: оставьте `./`
   - Build Command: `npm run build` (должно быть автоматически)
   - Output Directory: `.next` (должно быть автоматически)

2. **Добавьте переменные окружения:**
   - Найдите раздел "Environment Variables"
   - Добавьте:
     - `MONGODB_URI` = значение из Railway `MONGO_URL`
     - `JWT_SECRET` = любой случайный ключ

3. **Нажмите "Deploy"**

---

## ✅ Готово!

Через 2-3 минуты сайт будет доступен по адресу: `ваш-проект.vercel.app`

---

## 🆘 Если не получается загрузить в GitHub

### Проблема: "git: command not found"
- Установите Git: https://git-scm.com/download/win
- Перезапустите терминал

### Проблема: "Authentication failed"
- Используйте Personal Access Token вместо пароля
- Получите токен: https://github.com/settings/tokens

### Проблема: "Repository not found"
- Проверьте что репозиторий создан на GitHub
- Проверьте правильность URL (логин и название репозитория)

---

## 📝 Краткая версия команд

```bash
cd C:\Users\Admin\Desktop\site
git init
git add .
git commit -m "Initial commit"
git branch -M main
git remote add origin https://github.com/ВАШ_ЛОГИН/ВАШ_РЕПОЗИТОРИЙ.git
git push -u origin main
```

Замените `ВАШ_ЛОГИН` и `ВАШ_РЕПОЗИТОРИЙ` на ваши данные!

