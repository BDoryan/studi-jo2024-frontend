export type TranslationDictionary = {
  messages: Record<string, string>;
  errors: Record<string, string>;
};

export const translations: TranslationDictionary = {
  messages: {
    customer_registered:
      'Compte créé avec succès. Vous pouvez maintenant vous connecter et commencer à réserver vos billets.',
  },
  errors: {
    email_already_used: 'Cette adresse e-mail est déjà utilisée. Veuillez en choisir une autre.',
    invalid_credentials: 'Identifiants invalides. Vérifiez vos informations et réessayez.',
    unauthorized: 'Vous devez être authentifié pour accéder à cette ressource.',
    forbidden: "Vous n'avez pas les droits nécessaires pour effectuer cette action.",
    not_found: 'La ressource demandée est introuvable.',
    server_error: 'Une erreur interne est survenue. Veuillez réessayer plus tard.',
    validation_failed:
      'Certains champs contiennent des erreurs. Vérifiez vos informations et réessayez.',
    is_required: '{{field}} est requis.',
    must_be_valid_email: '{{field}} doit contenir une adresse e-mail valide.',
    min_length: '{{field}} doit contenir au moins {{min}} caractères.',
    max_length: '{{field}} ne peut pas dépasser {{max}} caractères.',
    password_mismatch: 'Les mots de passe ne correspondent pas.',
    password_too_weak:
      'Le mot de passe est trop faible. Utilisez au moins une majuscule, une minuscule, un chiffre et un caractère spécial.',
    password_policy_not_respected:
      'Le mot de passe ne respecte pas la politique de sécurité attendue (minimum 8 caractères, incluant une majuscule, une minuscule et un chiffre).',
    value_not_allowed: '{{field}} n’autorise pas cette valeur.',
  },
};
