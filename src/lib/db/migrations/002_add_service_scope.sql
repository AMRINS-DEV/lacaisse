-- Add service scoping for multi-service support.
-- Existing rows are assigned to bestside by default.

ALTER TABLE transactions
  ADD COLUMN service_key VARCHAR(32) NOT NULL DEFAULT 'bestside' AFTER type;

ALTER TABLE transfers
  ADD COLUMN service_key VARCHAR(32) NOT NULL DEFAULT 'bestside' AFTER transfer_group_id;

CREATE INDEX idx_transactions_service_date ON transactions (service_key, transaction_date);
CREATE INDEX idx_transfers_service_date ON transfers (service_key, transfer_date);

