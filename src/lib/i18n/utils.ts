import { translations } from './translations.fr';

export type Primitive = string | number | boolean | null | undefined;
export type FormatParams = Record<string, Primitive | Primitive[]>;

type TranslationSection = keyof typeof translations;

const normaliseKey = (key: string | undefined): string | undefined => key?.toLowerCase().trim();

const formatValue = (value: Primitive | Primitive[] | undefined): string | undefined => {
  if (value === null || typeof value === 'undefined') {
    return undefined;
  }

  if (Array.isArray(value)) {
    return value.filter((item) => item != null).map(String).join(', ');
  }

  return String(value);
};

const interpolate = (template: string, params: FormatParams = {}): string =>
  template.replace(/\{\{\s*(\w+)\s*\}\}/g, (_, key: string) => {
    const normalisedKey = key.toLowerCase();
    const entry = params[normalisedKey] ?? params[key];
    const formatted = formatValue(entry);

    return typeof formatted === 'string' ? formatted : '';
  });

const lookup = (section: TranslationSection, key: string | undefined): string | undefined => {
  const resolvedKey = normaliseKey(key);

  if (!resolvedKey) {
    return undefined;
  }

  return translations[section][resolvedKey];
};

export const translateMessage = (key: string | undefined, params?: FormatParams): string | undefined => {
  const template = lookup('messages', key) ?? lookup('errors', key);

  if (!template) {
    return undefined;
  }

  return interpolate(template, params);
};

export const translateError = (key: string | undefined, params?: FormatParams): string | undefined => {
  const template = lookup('errors', key);

  if (!template) {
    return undefined;
  }

  return interpolate(template, params);
};

export const translate = (key: string | undefined, params?: FormatParams): string =>
  translateMessage(key, params) ?? translateError(key, params) ??
  'Une erreur est survenue. Veuillez réessayer ou contacter le support si le problème persiste.';
