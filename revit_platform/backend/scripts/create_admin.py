#!/usr/bin/env python
"""
Скрипт для создания суперпользователя Django
"""
import os
import sys
import django

# Добавляем путь к проекту
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

# Настраиваем Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup()

from django.contrib.auth import get_user_model
from django.core.management import execute_from_command_line

User = get_user_model()

def create_superuser():
    """Создает суперпользователя Django"""
    try:
        # Проверяем, есть ли уже суперпользователь
        if User.objects.filter(is_superuser=True).exists():
            print("Суперпользователь уже существует!")
            return
        
        # Создаем суперпользователя
        email = input("Введите email для суперпользователя: ")
        password = input("Введите пароль: ")
        confirm_password = input("Подтвердите пароль: ")
        
        if password != confirm_password:
            print("Пароли не совпадают!")
            return
        
        # Создаем пользователя
        user = User.objects.create_user(
            email=email,
            username=email,
            password=password,
            first_name=input("Введите имя: "),
            last_name=input("Введите фамилию: "),
            user_type='admin',
            is_staff=True,
            is_superuser=True
        )
        
        print(f"Суперпользователь {email} успешно создан!")
        
    except Exception as e:
        print(f"Ошибка при создании суперпользователя: {e}")

if __name__ == '__main__':
    print("Создание суперпользователя Django...")
    create_superuser()
