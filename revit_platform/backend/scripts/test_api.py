#!/usr/bin/env python
"""
Скрипт для тестирования API BIM семейств
"""

import os
import sys
import django
import requests
import json

# Добавляем путь к проекту
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

# Настраиваем Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup()

from bim_families.models import BimFamily, FamilyImage

def test_api():
    print("🧪 ТЕСТИРОВАНИЕ API BIM СЕМЕЙСТВ")
    print("=" * 50)
    
    # Тестируем API endpoint
    api_url = "http://localhost:8000/api/bim-families/"
    
    try:
        print(f"📡 Тестируем API: {api_url}")
        response = requests.get(api_url)
        
        if response.status_code == 200:
            print(f"✅ API ответил успешно (статус: {response.status_code})")
            
            data = response.json()
            print(f"📊 Получено семейств: {len(data)}")
            
            if len(data) > 0:
                first_family = data[0]
                print(f"\n🔍 ПЕРВОЕ СЕМЕЙСТВО:")
                print(f"   ID: {first_family.get('id')}")
                print(f"   Name: {first_family.get('name')}")
                print(f"   External ID: {first_family.get('external_id')}")
                print(f"   Total images: {first_family.get('total_images')}")
                
                # Проверяем изображения
                images = first_family.get('images', [])
                print(f"   Images count: {len(images)}")
                
                if len(images) > 0:
                    first_image = images[0]
                    print(f"   🖼️  Первое изображение:")
                    print(f"      ID: {first_image.get('id')}")
                    print(f"      local_path: {first_image.get('local_path')}")
                    print(f"      local_filename: {first_image.get('local_filename')}")
                    
                    # Проверяем, можно ли загрузить изображение
                    if first_image.get('local_path'):
                        image_url = f"http://localhost:8000/{first_image['local_path']}"
                        print(f"      Image URL: {image_url}")
                        
                        try:
                            img_response = requests.head(image_url)
                            print(f"      Image status: {img_response.status_code}")
                            if img_response.status_code == 200:
                                print(f"      ✅ Изображение доступно")
                            else:
                                print(f"      ❌ Изображение недоступно")
                        except Exception as e:
                            print(f"      ❌ Ошибка при проверке изображения: {e}")
                else:
                    print(f"   ❌ Нет изображений")
            else:
                print(f"❌ API вернул пустой список")
        else:
            print(f"❌ API вернул ошибку (статус: {response.status_code})")
            print(f"Ответ: {response.text}")
            
    except Exception as e:
        print(f"❌ Ошибка при тестировании API: {e}")
    
    # Тестируем конкретное семейство
    print(f"\n🔍 ТЕСТИРОВАНИЕ КОНКРЕТНОГО СЕМЕЙСТВА:")
    try:
        family_id = 1
        family_url = f"http://localhost:8000/api/bim-families/{family_id}/"
        
        print(f"📡 Тестируем: {family_url}")
        response = requests.get(family_url)
        
        if response.status_code == 200:
            family_data = response.json()
            print(f"✅ Семейство загружено успешно")
            print(f"   Name: {family_data.get('name')}")
            print(f"   External ID: {family_data.get('external_id')}")
            print(f"   Images: {len(family_data.get('images', []))}")
        else:
            print(f"❌ Ошибка при загрузке семейства: {response.status_code}")
            
    except Exception as e:
        print(f"❌ Ошибка при тестировании конкретного семейства: {e}")

if __name__ == "__main__":
    try:
        test_api()
    except Exception as e:
        print(f"❌ Ошибка при выполнении скрипта: {e}")
        import traceback
        traceback.print_exc()
