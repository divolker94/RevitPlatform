-- Упрощенный SQL скрипт для загрузки CSV файлов
-- Выполните эти команды в psql или pgAdmin

-- 1. Загружаем семейства
\copy families_bimfamily (
    name, external_id, url, description, technical_specs, 
    basic_specs, catalog_items, company_info, download_info,
    parsing_method, total_images, parsed_at
) FROM 'families_bimfamily_simple.csv' WITH (FORMAT csv, HEADER true, ENCODING 'UTF8');

-- 2. Загружаем изображения
-- Создаем временную таблицу
CREATE TEMP TABLE temp_images (
    family_external_id VARCHAR(100),
    local_path TEXT,
    alt_text TEXT,
    title TEXT,
    image_type VARCHAR(50),
    width INTEGER,
    height INTEGER,
    file_size INTEGER,
    local_filename VARCHAR(255)
);

-- Загружаем изображения во временную таблицу
\copy temp_images FROM 'family_images_simple.csv' WITH (FORMAT csv, HEADER true, ENCODING 'UTF8');

-- Вставляем изображения с правильными family_id
INSERT INTO family_images (
    family_id, local_path, alt_text, title, image_type,
    width, height, file_size, local_filename
)
SELECT 
    f.id as family_id,
    ti.local_path, ti.alt_text, ti.title, ti.image_type,
    ti.width, ti.height, ti.file_size, ti.local_filename
FROM temp_images ti
JOIN families_bimfamily f ON f.external_id = ti.family_external_id;

-- Удаляем временную таблицу
DROP TABLE temp_images;

-- 3. Проверяем результат
SELECT COUNT(*) as total_families FROM families_bimfamily;
SELECT COUNT(*) as total_images FROM family_images;

-- 4. Примеры данных
SELECT name, external_id, total_images FROM families_bimfamily LIMIT 5;
SELECT local_path, local_filename FROM family_images LIMIT 5;
