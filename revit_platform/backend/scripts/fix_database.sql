-- SQL скрипт для исправления структуры таблицы specialists_specialistprofile
-- Удаляем поля, которые больше не нужны в модели

ALTER TABLE specialists_specialistprofile DROP COLUMN IF EXISTS skills;
ALTER TABLE specialists_specialistprofile DROP COLUMN IF EXISTS software;
ALTER TABLE specialists_specialistprofile DROP COLUMN IF EXISTS work_type;
ALTER TABLE specialists_specialistprofile DROP COLUMN IF EXISTS linkedin;
ALTER TABLE specialists_specialistprofile DROP COLUMN IF EXISTS website;
