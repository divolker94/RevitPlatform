-- Добавляем недостающие поля в таблицу architectural_projects
-- Выполнить в PostgreSQL

-- Добавляем поле views_count (количество просмотров)
ALTER TABLE architectural_projects 
ADD COLUMN views_count INTEGER DEFAULT 0;

-- Добавляем поле rating_average (средний рейтинг)
ALTER TABLE architectural_projects 
ADD COLUMN rating_average DECIMAL(3,2) DEFAULT 0.00;

-- Добавляем поле rating_count (количество оценок)
ALTER TABLE architectural_projects 
ADD COLUMN rating_count INTEGER DEFAULT 0;

-- Создаем таблицу для рейтингов проектов
CREATE TABLE IF NOT EXISTS architectural_projects_projectrating (
    id BIGSERIAL PRIMARY KEY,
    rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    project_id INTEGER NOT NULL REFERENCES architectural_projects(id) ON DELETE CASCADE,
    user_id INTEGER NOT NULL REFERENCES accounts_user(id) ON DELETE CASCADE,
    UNIQUE(project_id, user_id)
);

-- Создаем индекс для быстрого поиска рейтингов по проекту
CREATE INDEX IF NOT EXISTS idx_projectrating_project_id ON architectural_projects_projectrating(project_id);

-- Создаем индекс для быстрого поиска рейтингов по пользователю
CREATE INDEX IF NOT EXISTS idx_projectrating_user_id ON architectural_projects_projectrating(user_id);

-- Обновляем существующие записи, устанавливая значения по умолчанию
UPDATE architectural_projects 
SET views_count = 0, rating_average = 0.00, rating_count = 0 
WHERE views_count IS NULL OR rating_average IS NULL OR rating_count IS NULL;
