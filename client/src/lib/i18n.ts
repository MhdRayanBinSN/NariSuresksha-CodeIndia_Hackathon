import { useState, useEffect } from 'react';
import enMessages from '../messages/en.json';
import hiMessages from '../messages/hi.json';

export type Language = 'en' | 'hi';

const messages = {
  en: enMessages,
  hi: hiMessages,
};

export const useI18n = () => {
  const [language, setLanguage] = useState<Language>(() => {
    const saved = localStorage.getItem('nari-suraksha-lang');
    return (saved as Language) || 'en';
  });

  useEffect(() => {
    localStorage.setItem('nari-suraksha-lang', language);
  }, [language]);

  const t = (key: string): string => {
    const keys = key.split('.');
    let value: any = messages[language];
    
    for (const k of keys) {
      if (value && typeof value === 'object') {
        value = value[k];
      } else {
        return key; // Return key if translation not found
      }
    }
    
    return typeof value === 'string' ? value : key;
  };

  const toggleLanguage = () => {
    setLanguage(prev => prev === 'en' ? 'hi' : 'en');
  };

  return { language, setLanguage, t, toggleLanguage };
};
