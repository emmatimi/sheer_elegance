-- Refactor services into homepage parent categories and hairstyles into bookable style/service options.
-- Run this after deploying the matching code.

ALTER TABLE services
  DROP INDEX slug,
  DROP COLUMN slug,
  DROP COLUMN sort_order;

ALTER TABLE hairstyles
  DROP INDEX slug,
  DROP COLUMN slug,
  DROP COLUMN sort_order;

UPDATE services
SET category = name
WHERE category IS NULL OR category = '' OR category <> name;
