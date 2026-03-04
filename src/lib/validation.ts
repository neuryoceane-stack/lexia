const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function validateEmail(email: string): { valid: boolean; error?: string } {
  const trimmed = email.trim().toLowerCase();
  if (!trimmed) return { valid: false, error: "Email requis" };
  if (!EMAIL_REGEX.test(trimmed)) return { valid: false, error: "Format d'email invalide" };
  return { valid: true };
}

export function validatePassword(password: string): { valid: boolean; error?: string } {
  if (!password || password.length < 8) {
    return { valid: false, error: "Le mot de passe doit faire au moins 8 caractères" };
  }
  if (!/[A-Z]/.test(password)) {
    return { valid: false, error: "Le mot de passe doit contenir au moins une majuscule" };
  }
  if (!/\d/.test(password)) {
    return { valid: false, error: "Le mot de passe doit contenir au moins un chiffre" };
  }
  return { valid: true };
}
