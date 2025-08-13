-- Security Fix: Enable auth security features and set secure defaults
-- Enable leaked password protection
UPDATE auth.config 
SET value = 'true' 
WHERE parameter = 'password_hibp_enabled';

-- Set minimum password length to 8 characters
UPDATE auth.config 
SET value = '8' 
WHERE parameter = 'password_min_length';

-- Enable additional security features if not already enabled
INSERT INTO auth.config (parameter, value) 
VALUES ('password_hibp_enabled', 'true')
ON CONFLICT (parameter) DO UPDATE SET value = 'true';

INSERT INTO auth.config (parameter, value) 
VALUES ('password_min_length', '8')
ON CONFLICT (parameter) DO UPDATE SET value = '8';

-- Ensure session timeout is reasonable (24 hours)
INSERT INTO auth.config (parameter, value) 
VALUES ('jwt_expiry', '86400')
ON CONFLICT (parameter) DO UPDATE SET value = '86400';