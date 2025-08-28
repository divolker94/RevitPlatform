# Revit Platform

Платформа для работы с проектами Revit и BIM-специалистами.

## Исправленные проблемы

### 1. Проблемы с регистрацией пользователей

**Было:**
- Несоответствие полей в сериализаторе и модели User
- Ошибки в создании профилей клиентов
- Проблемы с наследованием моделей

**Исправлено:**
- Упрощена модель User (наследуется от AbstractUser)
- Исправлены сериализаторы
- Переработаны модели клиентов (отдельные модели с ForeignKey)
- Обновлен admin.py для корректной работы

### 2. Проблемы с Django Admin

**Было:**
- Django Admin не мог создать суперпользователя
- Конфликты с кастомной моделью User

**Исправлено:**
- Правильная настройка AUTH_USER_MODEL
- Корректная настройка admin.py
- Создан скрипт create_admin.py для создания суперпользователя

## Установка и настройка

### 1. Создание миграций

```bash
cd revit_platform/backend
python manage.py makemigrations
python manage.py migrate
```

### 2. Создание суперпользователя

```bash
cd revit_platform/backend
python create_admin.py
```

Или через Django:

```bash
python manage.py createsuperuser
```

### 3. Запуск сервера

```bash
# Backend
cd revit_platform/backend
python manage.py runserver

# Frontend (в другом терминале)
cd revit_platform/frontend
npm start
```

## Структура проекта

### Backend
- `accounts/` - управление пользователями
- `clients/` - профили клиентов
- `specialists/` - профили специалистов
- `config/` - настройки Django

### Frontend
- `components/` - React компоненты
- `services/` - API сервисы
- `pages/` - страницы приложения

## API Endpoints

### Регистрация
- `POST /api/accounts/register/` - регистрация пользователя
- `POST /api/accounts/users/set_type/` - установка типа пользователя

### Аутентификация
- `POST /api/auth/jwt/create/` - вход (получение токенов)
- `POST /api/auth/jwt/refresh/` - обновление токена

## Типы пользователей

1. **individual** - физическое лицо
2. **legal** - юридическое лицо  
3. **specialist** - BIM-специалист
4. **admin** - администратор

## Профили

После регистрации пользователь выбирает тип профиля и заполняет соответствующие данные:

- **IndividualClient** - для физических лиц
- **LegalEntityClient** - для юридических лиц
- **SpecialistProfile** - для BIM-специалистов

## Решение проблем

### Если не работает регистрация:
1. Проверьте миграции: `python manage.py migrate`
2. Проверьте логи сервера Django
3. Проверьте консоль браузера на ошибки

### Если не работает Django Admin:
1. Создайте суперпользователя: `python create_admin.py`
2. Проверьте настройки AUTH_USER_MODEL в settings.py
3. Убедитесь, что все приложения добавлены в INSTALLED_APPS 