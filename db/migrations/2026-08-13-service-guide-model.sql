-- Service-guide model update for Oreoluwa Sheer Elegance.
-- Run this after the original db/mysql-schema.sql and db/migrations/2026-08-12-hairstyles.sql.
--
-- The app now treats services as:
--   service name + service image + a comma/newline-separated list of hairstyle/service types.
--
-- We keep price_naira, duration_minutes and category for compatibility with older code/schema,
-- but set price/duration to 0 and use category = service name.

ALTER TABLE services
  MODIFY category VARCHAR(160) NOT NULL,
  MODIFY price_naira INT UNSIGNED NOT NULL DEFAULT 0,
  MODIFY duration_minutes INT UNSIGNED NOT NULL DEFAULT 0,
  MODIFY short_description TEXT NOT NULL;

UPDATE services
SET
  category = name,
  price_naira = 0,
  duration_minutes = 0
WHERE price_naira <> 0
   OR duration_minutes <> 0
   OR category <> name;

UPDATE services
SET short_description = CASE slug
  WHEN 'silk-press-and-trim' THEN 'silk press, blow-dry and straightening, roller sets, wrap styling, curls, waves, sleek styling'
  WHEN 'boho-knotless-braids' THEN 'knotless braids, box braids, bohemian braids, crochet braids, twist braids, Senegalese twists, passion twists'
  WHEN 'frontal-wig-install' THEN 'wig installation, frontal installation, closure installation, sew-ins, quick weaves, wig revamping, wig styling, wig customization, lace melting'
  WHEN 'ghana-weaving-cornrows' THEN 'cornrows, Ghana weaving, stitch braids, feed-in braids, lemonade braids, Fulani braids, tribal braids'
  WHEN 'relaxer-retouch-and-treatment' THEN 'washing, conditioning, detangling, blow-drying, trimming, edge styling, hair treatment, scalp treatment'
  WHEN 'bridal-hair-styling' THEN 'bridal updos, bridesmaid hairstyles, traditional wedding hairstyles, birthday hairstyles, prom styling, formal updos, hair-accessory installation'
  ELSE short_description
END;

UPDATE hairstyles h
JOIN services s
  ON LOWER(h.category) = LOWER(s.slug)
  OR LOWER(h.category) = LOWER(s.category)
  OR LOWER(h.category) = LOWER(s.name)
SET h.category = s.name;
