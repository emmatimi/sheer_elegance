CREATE TABLE admins (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(120) NOT NULL,
  email VARCHAR(190) NOT NULL UNIQUE,
  password_hash VARCHAR(255) NOT NULL,
  role ENUM('owner', 'manager', 'editor') NOT NULL DEFAULT 'editor',
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

CREATE TABLE salon_settings (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
  setting_key VARCHAR(120) NOT NULL UNIQUE,
  setting_value TEXT NOT NULL,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

CREATE TABLE services (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(160) NOT NULL,
  slug VARCHAR(180) NOT NULL UNIQUE,
  category VARCHAR(120) NOT NULL,
  price_naira INT UNSIGNED NOT NULL,
  duration_minutes INT UNSIGNED NOT NULL,
  image_url MEDIUMTEXT NOT NULL,
  short_description TEXT NOT NULL,
  is_featured BOOLEAN NOT NULL DEFAULT FALSE,
  sort_order INT NOT NULL DEFAULT 0,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

CREATE TABLE bookings (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
  service_id BIGINT UNSIGNED NOT NULL,
  stylist_name VARCHAR(160) NOT NULL,
  customer_name VARCHAR(160) NOT NULL,
  customer_phone VARCHAR(40) NOT NULL,
  customer_email VARCHAR(190) NOT NULL,
  appointment_date VARCHAR(40) NOT NULL,
  appointment_time VARCHAR(40) NOT NULL,
  payment_option ENUM('deposit', 'half', 'full', 'pay_on_arrival') NOT NULL DEFAULT 'pay_on_arrival',
  payment_status ENUM('not_required', 'pending', 'paid', 'failed') NOT NULL DEFAULT 'not_required',
  payment_amount_naira INT UNSIGNED NOT NULL DEFAULT 0,
  amount_paid_naira INT UNSIGNED NOT NULL DEFAULT 0,
  payment_reference VARCHAR(190) NULL UNIQUE,
  transaction_reference VARCHAR(190) NULL,
  receipt_html MEDIUMTEXT NULL,
  status ENUM('pending', 'confirmed', 'completed', 'cancelled') NOT NULL DEFAULT 'pending',
  notes TEXT NULL,
  hairstyle_name VARCHAR(180) NULL,
  hairstyle_category VARCHAR(120) NULL,
  hairstyle_image_url MEDIUMTEXT NULL,
  hairstyle_description TEXT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT bookings_service_id_fk FOREIGN KEY (service_id) REFERENCES services(id)
);

CREATE TABLE hairstyles (
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

INSERT INTO salon_settings (setting_key, setting_value) VALUES
('studio_address', 'Private studio address shared after booking confirmation'),
('phone', '+234 810 000 2026'),
('email', 'hello@sheerelegance.ng'),
('opening_hours', 'Tue-Fri 9am-7pm, Sat 8am-6pm');

INSERT INTO services (name, slug, category, price_naira, duration_minutes, image_url, short_description, is_featured, sort_order) VALUES
('Silk press and trim', 'silk-press-and-trim', 'Natural hair', 30000, 120, 'https://images.unsplash.com/photo-1595476108010-b4d1f102b1b1?auto=format&fit=crop&w=900&q=85', 'Heat-protected silk press, light trim and humidity-conscious finish.', TRUE, 1),
('Boho knotless braids', 'boho-knotless-braids', 'Protective styling', 65000, 300, 'https://images.unsplash.com/photo-1605980776566-0486c3ac7617?auto=format&fit=crop&w=900&q=85', 'Lightweight knotless braids with soft boho curls and gentle tension.', TRUE, 2),
('Frontal wig install', 'frontal-wig-install', 'Wigs and lace', 45000, 150, 'https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?auto=format&fit=crop&w=900&q=85', 'Lace prep, install, styling and melt designed to protect edges.', TRUE, 3),
('Ghana weaving cornrows', 'ghana-weaving-cornrows', 'Braids', 25000, 150, 'https://images.unsplash.com/photo-1616683693504-3ea7e9ad6fec?auto=format&fit=crop&w=900&q=85', 'Neat Ghana weaving, stitch cornrows or feed-in patterns.', TRUE, 4),
('Relaxer retouch and treatment', 'relaxer-retouch-and-treatment', 'Hair care', 28000, 120, 'https://images.unsplash.com/photo-1560066984-138dadb4c035?auto=format&fit=crop&w=900&q=85', 'Relaxer retouch, deep treatment and scalp-conscious finishing care.', TRUE, 5),
('Bridal hair styling', 'bridal-hair-styling', 'Events', 120000, 0, 'https://images.unsplash.com/photo-1519699047748-de8e457a634e?auto=format&fit=crop&w=900&q=85', 'Consultation-led bridal styling for polished event-ready hair.', TRUE, 6);

INSERT INTO hairstyles (name, slug, category, image_url, description, tags, sort_order) VALUES
('Soft stitch cornrows', 'soft-stitch-cornrows', 'Cornrows', 'https://ik.imagekit.io/4lndq5ke52/sheer_elegance/hair2.jpeg?auto=format&fit=crop&w=900&q=85', 'Clean stitch parts with a soft, wearable finish for everyday polish.', 'cornrows,stitch,protective', 1),
('Sculpted braided updo', 'sculpted-braided-updo', 'Braids', 'https://ik.imagekit.io/4lndq5ke52/sheer_elegance/hair.jpeg?auto=format&fit=crop&w=900&q=85', 'A statement braided updo with neat parting and elegant shape.', 'braids,updo,event', 2),
('Silk press flow', 'silk-press-flow', 'Silk press', 'https://images.unsplash.com/photo-1595476108010-b4d1f102b1b1?auto=format&fit=crop&w=900&q=85', 'Smooth, bouncy silk press inspiration with light movement.', 'silk press,natural hair', 3),
('Boho knotless length', 'boho-knotless-length', 'Knotless braids', 'https://images.unsplash.com/photo-1605980776566-0486c3ac7617?auto=format&fit=crop&w=900&q=85', 'Soft knotless braids with loose boho texture and airy length.', 'knotless,boho,protective', 4),
('Soft bridal waves', 'soft-bridal-waves', 'Bridal', 'https://images.unsplash.com/photo-1519699047748-de8e457a634e?auto=format&fit=crop&w=900&q=85', 'Romantic event-ready styling with a polished soft-wave finish.', 'bridal,event,waves', 5);
