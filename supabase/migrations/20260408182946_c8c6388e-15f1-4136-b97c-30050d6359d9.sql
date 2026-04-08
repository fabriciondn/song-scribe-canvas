
UPDATE subscriptions
SET status = 'active',
    started_at = now(),
    expires_at = now() + interval '30 days'
WHERE id = '48934c4f-b03d-4b18-b5ac-ebb9b6263b99'
  AND user_id = '4d684d02-6177-436f-a1d7-47da2b30a8a6';
