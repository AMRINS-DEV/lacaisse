-- =============================================================
-- 001_complete_schema.sql
-- Complete idempotent schema for the Caisse application.
-- Safe to run multiple times (CREATE TABLE IF NOT EXISTS).
-- Dependency order: users → locations → categories →
--   attachments → transactions → transfers → user_locations →
--   alerts → alert_logs → audit_logs → NextAuth tables →
--   schema_migrations
-- =============================================================

-- 1. users
CREATE TABLE IF NOT EXISTS users (
  id            BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  full_name     VARCHAR(120) NOT NULL,
  email         VARCHAR(190) NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  role          ENUM('admin','manager','location_user','accountant','viewer') NOT NULL DEFAULT 'location_user',
  status        ENUM('active','disabled') NOT NULL DEFAULT 'active',
  is_active     TINYINT(1) NOT NULL DEFAULT 1,
  last_login_at DATETIME NULL,
  name          VARCHAR(120) GENERATED ALWAYS AS (full_name) VIRTUAL,
  created_at    TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at    TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_users_email (email)
);

-- 2. locations
CREATE TABLE IF NOT EXISTS locations (
  id         BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  name       VARCHAR(120) NOT NULL,
  code       VARCHAR(12)  NOT NULL,
  color      VARCHAR(7)   NOT NULL DEFAULT '#6366f1',
  is_active  TINYINT(1)   NOT NULL DEFAULT 1,
  created_at TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_locations_code (code)
);

-- 3. categories
CREATE TABLE IF NOT EXISTS categories (
  id         BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  name       VARCHAR(120) NOT NULL,
  type       ENUM('income','expense') NOT NULL,
  is_active  TINYINT(1)   NOT NULL DEFAULT 1,
  created_at TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id)
);

-- 4. attachments (depends on users)
CREATE TABLE IF NOT EXISTS attachments (
  id            BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  original_name VARCHAR(255)    NOT NULL,
  mime_type     VARCHAR(80)     NOT NULL,
  size_bytes    BIGINT UNSIGNED NOT NULL,
  path          VARCHAR(255)    NOT NULL,
  uploaded_by   BIGINT UNSIGNED NOT NULL,
  created_at    TIMESTAMP       NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  CONSTRAINT fk_attachments_uploaded_by FOREIGN KEY (uploaded_by) REFERENCES users (id)
);

-- 5. transactions (depends on users, locations, categories, attachments)
CREATE TABLE IF NOT EXISTS transactions (
  id                     BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  type                   ENUM('income','expense','transfer_out','transfer_in','reversal') NOT NULL,
  category_id            BIGINT UNSIGNED NULL,
  location_id            BIGINT UNSIGNED NOT NULL,
  amount                 DECIMAL(19,4)   NOT NULL,
  currency               CHAR(3)         NOT NULL DEFAULT 'MAD',
  description            VARCHAR(500)    NULL,
  payment_method         ENUM('cash','bank_transfer','card','check','other') NOT NULL,
  attachment_id          BIGINT UNSIGNED NULL,
  related_transaction_id BIGINT UNSIGNED NULL,
  transfer_group_id      CHAR(36)        NULL,
  created_by             BIGINT UNSIGNED NOT NULL,
  transaction_date       DATETIME        NOT NULL,
  created_at             TIMESTAMP       NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  CONSTRAINT fk_transactions_category    FOREIGN KEY (category_id)  REFERENCES categories (id),
  CONSTRAINT fk_transactions_location    FOREIGN KEY (location_id)  REFERENCES locations  (id),
  CONSTRAINT fk_transactions_created_by  FOREIGN KEY (created_by)   REFERENCES users      (id),
  CONSTRAINT fk_transactions_attachment  FOREIGN KEY (attachment_id) REFERENCES attachments (id)
);

-- 6. transfers (depends on transactions, locations, users)
CREATE TABLE IF NOT EXISTS transfers (
  id                BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  transfer_group_id CHAR(36)        NOT NULL,
  from_location_id  BIGINT UNSIGNED NOT NULL,
  to_location_id    BIGINT UNSIGNED NOT NULL,
  amount            DECIMAL(19,4)   NOT NULL,
  currency          CHAR(3)         NOT NULL DEFAULT 'MAD',
  description       VARCHAR(500)    NULL,
  payment_method    ENUM('cash','bank_transfer','card','check','other') NOT NULL,
  transfer_date     DATETIME        NOT NULL,
  out_transaction_id BIGINT UNSIGNED NOT NULL,
  in_transaction_id  BIGINT UNSIGNED NOT NULL,
  created_by        BIGINT UNSIGNED NOT NULL,
  created_at        TIMESTAMP       NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_transfers_group (transfer_group_id),
  CONSTRAINT fk_transfers_from_loc    FOREIGN KEY (from_location_id)   REFERENCES locations    (id),
  CONSTRAINT fk_transfers_to_loc      FOREIGN KEY (to_location_id)     REFERENCES locations    (id),
  CONSTRAINT fk_transfers_out_tx      FOREIGN KEY (out_transaction_id) REFERENCES transactions (id),
  CONSTRAINT fk_transfers_in_tx       FOREIGN KEY (in_transaction_id)  REFERENCES transactions (id),
  CONSTRAINT fk_transfers_created_by  FOREIGN KEY (created_by)         REFERENCES users        (id)
);

-- 7. user_locations (depends on users, locations)
CREATE TABLE IF NOT EXISTS user_locations (
  id          BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  user_id     BIGINT UNSIGNED NOT NULL,
  location_id BIGINT UNSIGNED NOT NULL,
  created_at  TIMESTAMP NULL,
  PRIMARY KEY (id),
  UNIQUE KEY uq_user_location (user_id, location_id),
  CONSTRAINT fk_ul_user     FOREIGN KEY (user_id)     REFERENCES users     (id),
  CONSTRAINT fk_ul_location FOREIGN KEY (location_id) REFERENCES locations (id)
);

-- 8. alerts (depends on locations, users)
CREATE TABLE IF NOT EXISTS alerts (
  id         BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  name       VARCHAR(100)    NOT NULL,
  type       ENUM('budget_exceeded','low_balance','custom') NOT NULL DEFAULT 'budget_exceeded',
  location_id BIGINT UNSIGNED NULL,
  category   VARCHAR(100)    NULL,
  threshold  DECIMAL(15,2)   NOT NULL,
  period     ENUM('daily','weekly','monthly') NOT NULL DEFAULT 'monthly',
  is_active  TINYINT(1)      NOT NULL DEFAULT 1,
  created_by BIGINT UNSIGNED NULL,
  created_at TIMESTAMP       NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP       NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  CONSTRAINT fk_alerts_location   FOREIGN KEY (location_id) REFERENCES locations (id),
  CONSTRAINT fk_alerts_created_by FOREIGN KEY (created_by)  REFERENCES users     (id)
);

-- 9. alert_logs (depends on alerts)
CREATE TABLE IF NOT EXISTS alert_logs (
  id               BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  alert_id         BIGINT UNSIGNED NOT NULL,
  triggered_value  DECIMAL(15,2)   NOT NULL,
  message          VARCHAR(500)    NOT NULL,
  is_read          TINYINT(1)      NOT NULL DEFAULT 0,
  created_at       TIMESTAMP       NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  CONSTRAINT fk_alert_logs_alert FOREIGN KEY (alert_id) REFERENCES alerts (id)
);

-- 10. audit_logs (depends on users)
CREATE TABLE IF NOT EXISTS audit_logs (
  id          BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  user_id     BIGINT UNSIGNED NULL,
  action      VARCHAR(80)     NOT NULL,
  table_name  VARCHAR(50)     NULL,
  record_id   BIGINT UNSIGNED NULL,
  before_data JSON            NULL,
  after_data  JSON            NULL,
  ip_address  VARCHAR(64)     NULL,
  created_at  TIMESTAMP       NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  CONSTRAINT fk_audit_logs_user FOREIGN KEY (user_id) REFERENCES users (id)
);

-- 11. NextAuth: accounts (depends on users)
CREATE TABLE IF NOT EXISTS accounts (
  id                  VARCHAR(255) NOT NULL,
  userId              VARCHAR(255) NOT NULL,
  type                VARCHAR(255) NOT NULL,
  provider            VARCHAR(255) NOT NULL,
  providerAccountId   VARCHAR(255) NOT NULL,
  refresh_token       TEXT         NULL,
  access_token        TEXT         NULL,
  expires_at          BIGINT       NULL,
  token_type          VARCHAR(255) NULL,
  scope               VARCHAR(255) NULL,
  id_token            TEXT         NULL,
  session_state       VARCHAR(255) NULL,
  PRIMARY KEY (id),
  UNIQUE KEY uq_accounts_provider (provider, providerAccountId)
);

-- 12. NextAuth: sessions (depends on users)
CREATE TABLE IF NOT EXISTS sessions (
  id           VARCHAR(255) NOT NULL,
  sessionToken VARCHAR(255) NOT NULL,
  userId       VARCHAR(255) NOT NULL,
  expires      DATETIME     NOT NULL,
  PRIMARY KEY (id),
  UNIQUE KEY uq_sessions_token (sessionToken)
);

-- 13. NextAuth: verification_tokens
CREATE TABLE IF NOT EXISTS verification_tokens (
  identifier VARCHAR(255) NOT NULL,
  token      VARCHAR(255) NOT NULL,
  expires    DATETIME     NOT NULL,
  UNIQUE KEY uq_vt_identifier_token (identifier, token)
);

-- 14. schema_migrations
CREATE TABLE IF NOT EXISTS schema_migrations (
  id         INT          NOT NULL AUTO_INCREMENT,
  version    VARCHAR(100) NOT NULL,
  created_at TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_schema_migrations_version (version)
)
