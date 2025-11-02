# Инструкция по загрузке файлов в GitHub

## Шаг 1: Установите Git (если еще не установлен)

### Windows:
1. Скачайте Git с https://git-scm.com/download/win
2. Установите с настройками по умолчанию
3. Откройте PowerShell или Command Prompt

### Проверка установки:
```bash
git --version
```
Должна показаться версия Git (например, `git version 2.43.0`)

---

## Шаг 2: Создайте аккаунт на GitHub

1. Перейдите на https://github.com/signup
2. Зарегистрируйтесь (можно использовать email или через Google)
3. Подтвердите email адрес

---

## Шаг 3: Создайте репозиторий на GitHub

1. После входа нажмите кнопку **"+"** в правом верхнем углу
2. Выберите **"New repository"**
3. Заполните форму:
   - **Repository name**: например, `site-applications` или `my-app-site`
   - **Description** (опционально): "Система управления заявками"
   - **Public** или **Private** (выберите Private, если не хотите, чтобы код был виден всем)
   - ❌ **НЕ** ставьте галочки на "Add a README file", "Add .gitignore", "Choose a license" (они уже есть в проекте)
4. Нажмите **"Create repository"**

---

## Шаг 4: Инициализируйте Git в вашем проекте

Откройте PowerShell или Command Prompt в папке вашего проекта:

```bash
# Перейдите в папку проекта (если еще не там)
cd C:\Users\Admin\Desktop\site

# Инициализируйте Git репозиторий
git init

# Добавьте все файлы
git add .

# Создайте первый коммит (сохранение)
git commit -m "Initial commit - первая загрузка проекта"
```

---

## Шаг 5: Подключите GitHub и загрузите файлы

```bash
# Добавьте удаленный репозиторий (замените YOUR_USERNAME и YOUR_REPO на ваши)
# Пример: git remote add origin https://github.com/ivanov/site-applications.git
git remote add origin https://github.com/YOUR_USERNAME/YOUR_REPO.git

# Переименуйте основную ветку в main
git branch -M main

# Загрузите файлы на GitHub
git push -u origin main
```

**Примечание:** При первом `git push` GitHub попросит ввести логин и пароль. 
- Логин: ваш username на GitHub
- Пароль: нужно создать **Personal Access Token** (см. Шаг 6)

---

## Шаг 6: Создайте Personal Access Token (для входа в Git)

GitHub больше не принимает обычные пароли. Нужен токен:

1. На GitHub: нажмите на свой аватар (правый верхний угол) → **Settings**
2. В левом меню: **Developer settings**
3. **Personal access tokens** → **Tokens (classic)**
4. Нажмите **"Generate new token"** → **"Generate new token (classic)"**
5. Заполните:
   - **Note**: например, "Мой компьютер"
   - **Expiration**: выберите срок действия (можно "No expiration")
   - Отметьте галочку **`repo`** (полный доступ к репозиториям)
6. Нажмите **"Generate token"** внизу
7. **СКОПИРУЙТЕ ТОКЕН** (он показывается только один раз!)

8. При выполнении `git push` используйте:
   - Username: ваш GitHub username
   - Password: вставьте скопированный токен

---

## Шаг 7: Проверьте загрузку

1. Зайдите на https://github.com/YOUR_USERNAME/YOUR_REPO
2. Вы должны увидеть все файлы вашего проекта

---

## Что дальше?

После загрузки файлов в GitHub:

1. **Vercel автоматически подхватит проект** из GitHub
2. При каждом изменении файлов и команде `git push` сайт будет автоматически обновляться

---

## Полезные команды Git для работы

```bash
# Проверить статус файлов
git status

# Добавить изменения
git add .

# Сохранить изменения
git commit -m "Описание изменений"

# Загрузить на GitHub
git push

# Посмотреть историю коммитов
git log
```

---

## Если возникли проблемы

### Ошибка "remote origin already exists"
```bash
git remote remove origin
git remote add origin https://github.com/YOUR_USERNAME/YOUR_REPO.git
```

### Ошибка "authentication failed"
- Убедитесь, что используете Personal Access Token, а не пароль
- Проверьте, что токен имеет права `repo`

### Файлы не загружаются
```bash
# Проверьте подключение
git remote -v

# Должно показать:
# origin  https://github.com/YOUR_USERNAME/YOUR_REPO.git (fetch)
# origin  https://github.com/YOUR_USERNAME/YOUR_REPO.git (push)
```

