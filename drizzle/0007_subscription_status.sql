-- Statut d'abonnement (Stripe ou bypass test dev)
ALTER TABLE users ADD COLUMN subscription_status TEXT DEFAULT 'inactive';
