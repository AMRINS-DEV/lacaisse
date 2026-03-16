CREATE TABLE IF NOT EXISTS services (
  id INT NOT NULL AUTO_INCREMENT,
  service_key VARCHAR(32) NOT NULL,
  name VARCHAR(128) NOT NULL,
  is_active TINYINT(1) NOT NULL DEFAULT 1,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_services_key (service_key),
  KEY idx_services_active (is_active)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

INSERT IGNORE INTO services (service_key, name, is_active)
VALUES
  ('bestside', 'Bestside Services', 1),
  ('bscompta', 'BSCompta', 1);
