
-- Add new contractor and payment method specific columns to payments table
ALTER TABLE btp.payments 
ADD COLUMN contractor_id uuid,
ADD COLUMN contractor_name text NOT NULL DEFAULT '',
ADD COLUMN contractor_contact text NOT NULL DEFAULT '',
ADD COLUMN bank_name text,
ADD COLUMN account_number text,
ADD COLUMN check_number text,
ADD COLUMN mobile_number text,
ADD COLUMN mobile_operator text,
ADD COLUMN receiver_name text;

-- Remove the NOT NULL constraint defaults after adding the columns
ALTER TABLE btp.payments 
ALTER COLUMN contractor_name DROP DEFAULT,
ALTER COLUMN contractor_contact DROP DEFAULT;
