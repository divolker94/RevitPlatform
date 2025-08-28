-- revit_platform/parser/load_data_to_postgres.sql

-- 1. Загружаем семейства
\copy families_bimfamily_2 (
    name, external_id, url, description, technical_specs, 
    basic_specs, catalog_items, company_info, download_info,
    parsing_method, total_images, parsed_at
) FROM 'families_bimfamily_simple.csv' WITH (FORMAT csv, HEADER true, ENCODING 'UTF8');

-- 2. Загружаем изображения через временную таблицу
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

\copy temp_images FROM 'family_images_simple.csv' WITH (FORMAT csv, HEADER true, ENCODING 'UTF8');

-- 3. Вставляем изображения с правильными family_id
INSERT INTO family_images_2 (
    family_id, local_path, alt_text, title, image_type,
    width, height, file_size, local_filename
)
SELECT 
    f.id as family_id,
    ti.local_path, ti.alt_text, ti.title, ti.image_type,
    ti.width, ti.height, ti.file_size, ti.local_filename
FROM temp_images ti
JOIN families_bimfamily_2 f ON f.external_id = ti.family_external_id;

-- 4. Удаляем временную таблицу
DROP TABLE temp_images;

-- 5. Проверяем результат
SELECT COUNT(*) as total_families FROM families_bimfamily_2;
SELECT COUNT(*) as total_images FROM family_images_2;

-- 6. Примеры данных
SELECT name, external_id, total_images FROM families_bimfamily_2 LIMIT 5;
SELECT local_path, local_filename FROM family_images_2 LIMIT 5;