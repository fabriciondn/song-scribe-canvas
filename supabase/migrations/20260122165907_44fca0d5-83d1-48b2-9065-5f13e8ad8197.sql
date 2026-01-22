-- Add password field to public_registration_forms table
ALTER TABLE public.public_registration_forms 
ADD COLUMN password text;