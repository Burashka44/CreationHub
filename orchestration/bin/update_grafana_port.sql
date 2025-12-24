UPDATE services SET port = '3000' WHERE name = 'Grafana';
DELETE FROM services WHERE name ILIKE '%Homepage%';
-- Ensure no duplicate 3000
DELETE FROM services WHERE port = '3000' AND name != 'Grafana';
