ALTER TABLE bookings
  ADD COLUMN hairstyle_name VARCHAR(180) NULL,
  ADD COLUMN hairstyle_category VARCHAR(120) NULL,
  ADD COLUMN hairstyle_image_url MEDIUMTEXT NULL,
  ADD COLUMN hairstyle_description TEXT NULL;

CREATE TABLE IF NOT EXISTS hairstyles (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(180) NOT NULL,
  slug VARCHAR(200) NOT NULL UNIQUE,
  category VARCHAR(120) NOT NULL,
  image_url MEDIUMTEXT NOT NULL,
  description TEXT NOT NULL,
  tags VARCHAR(255) NOT NULL DEFAULT '',
  sort_order INT NOT NULL DEFAULT 0,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

INSERT INTO hairstyles (name, slug, category, image_url, description, tags, sort_order) VALUES
('Soft stitch cornrows', 'soft-stitch-cornrows', 'Cornrows', 'https://ik.imagekit.io/4lndq5ke52/sheer_elegance/hair2.jpeg?auto=format&fit=crop&w=900&q=85', 'Clean stitch parts with a soft, wearable finish for everyday polish.', 'cornrows,stitch,protective', 1),
('Sculpted braided updo', 'sculpted-braided-updo', 'Braids', 'https://ik.imagekit.io/4lndq5ke52/sheer_elegance/hair.jpeg?auto=format&fit=crop&w=900&q=85', 'A statement braided updo with neat parting and elegant shape.', 'braids,updo,event', 2),
('Silk press flow', 'silk-press-flow', 'Silk press', 'https://images.unsplash.com/photo-1595476108010-b4d1f102b1b1?auto=format&fit=crop&w=900&q=85', 'Smooth, bouncy silk press inspiration with light movement.', 'silk press,natural hair', 3),
('Boho knotless length', 'boho-knotless-length', 'Knotless braids', 'https://images.unsplash.com/photo-1605980776566-0486c3ac7617?auto=format&fit=crop&w=900&q=85', 'Soft knotless braids with loose boho texture and airy length.', 'knotless,boho,protective', 4),
('Soft bridal waves', 'soft-bridal-waves', 'Bridal', 'https://images.unsplash.com/photo-1519699047748-de8e457a634e?auto=format&fit=crop&w=900&q=85', 'Romantic event-ready styling with a polished soft-wave finish.', 'bridal,event,waves', 5)
ON DUPLICATE KEY UPDATE
  name = VALUES(name),
  category = VALUES(category),
  image_url = VALUES(image_url),
  description = VALUES(description),
  tags = VALUES(tags),
  sort_order = VALUES(sort_order);
