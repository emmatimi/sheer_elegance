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
  category VARCHAR(120) NOT NULL,
  price_naira INT UNSIGNED NOT NULL,
  duration_minutes INT UNSIGNED NOT NULL,
  image_url MEDIUMTEXT NOT NULL,
  short_description TEXT NOT NULL,
  is_featured BOOLEAN NOT NULL DEFAULT FALSE,
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
  category VARCHAR(120) NOT NULL,
  image_url MEDIUMTEXT NOT NULL,
  description TEXT NOT NULL,
  tags VARCHAR(255) NOT NULL DEFAULT '',
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

INSERT INTO salon_settings (setting_key, setting_value) VALUES
('studio_address', 'Private studio address shared after booking confirmation'),
('phone', '+234 810 000 2026'),
('email', 'hello@sheerelegance.ng'),
('opening_hours', 'Tue-Fri 9am-7pm, Sat 8am-6pm');

INSERT INTO services (name, category, price_naira, duration_minutes, image_url, short_description, is_featured) VALUES
('Braiding', 'Braiding', 0, 0, 'https://images.unsplash.com/photo-1616683693504-3ea7e9ad6fec?auto=format&fit=crop&w=900&q=85', 'knotless braids, box braids, cornrows, Ghana weaving, stitch braids, feed-in braids', TRUE),
('Natural hair styling', 'Natural hair styling', 0, 0, 'https://images.unsplash.com/photo-1595476108010-b4d1f102b1b1?auto=format&fit=crop&w=900&q=85', 'afro styling, puff styling, twists, bantu knots, natural updos and wash-and-go styling', TRUE),
('Wig and weave services', 'Wig and weave services', 0, 0, 'https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?auto=format&fit=crop&w=900&q=85', 'wig installation, frontal installation, closure installation, sew-ins and lace melting', TRUE);

INSERT INTO hairstyles (name, category, image_url, description, tags) VALUES
('Soft stitch cornrows', 'Braiding', 'https://ik.imagekit.io/4lndq5ke52/sheer_elegance/hair2.jpeg?auto=format&fit=crop&w=900&q=85', 'Clean stitch parts with a soft, wearable finish for everyday polish.', 'cornrows,stitch,protective'),
('Sculpted braided updo', 'Braiding', 'https://ik.imagekit.io/4lndq5ke52/sheer_elegance/hair.jpeg?auto=format&fit=crop&w=900&q=85', 'A statement braided updo with neat parting and elegant shape.', 'braids,updo,event'),
('Silk press flow', 'Natural hair styling', 'https://images.unsplash.com/photo-1595476108010-b4d1f102b1b1?auto=format&fit=crop&w=900&q=85', 'Smooth, bouncy silk press inspiration with light movement.', 'silk press,natural hair');
