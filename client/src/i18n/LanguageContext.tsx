import { createContext, useContext, useEffect, useMemo, useState } from 'react'
import type { ReactNode } from 'react'

import type { LanguageCode, TranslateFn, TranslationValues } from '../types/shop'
import { translations } from './translations/index'

const LANGUAGE_KEY = 'marseille04_language'
const DEFAULT_LANGUAGE: LanguageCode = 'vi'

interface LanguageContextValue {
  language: LanguageCode
  setLanguage: (language: LanguageCode) => void
  toggleLanguage: () => void
  t: TranslateFn
}

const LanguageContext = createContext<LanguageContextValue | null>(null)

function isLanguageCode(value: string): value is LanguageCode {
  return value === 'en' || value === 'vi'
}

function formatTranslation(template: string, values?: TranslationValues) {
  if (!values) return template
  return Object.entries(values).reduce(
    (text, [key, value]) => text.replaceAll(`{${key}}`, String(value)),
    template,
  )
}

function getDictionary(language: LanguageCode) {
  return translations[language] || translations[DEFAULT_LANGUAGE]
}

function translate(language: LanguageCode, key: string, values?: TranslationValues) {
  const dictionary = getDictionary(language)
  const fallbackDictionary = translations[DEFAULT_LANGUAGE]
  const template = dictionary?.[key] || fallbackDictionary?.[key] || key

  return formatTranslation(template, values)
}

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [language, setLanguageState] = useState<LanguageCode>(() => {
    const storedLanguage = localStorage.getItem(LANGUAGE_KEY) || DEFAULT_LANGUAGE
    return isLanguageCode(storedLanguage) ? storedLanguage : DEFAULT_LANGUAGE
  })

  useEffect(() => {
    document.documentElement.lang = language
  }, [language])

  function setLanguage(nextLanguage: LanguageCode) {
    const supportedLanguage = translations[nextLanguage] ? nextLanguage : DEFAULT_LANGUAGE

    setLanguageState(supportedLanguage)
    localStorage.setItem(LANGUAGE_KEY, supportedLanguage)
    document.documentElement.lang = supportedLanguage
  }

  function toggleLanguage() {
    setLanguage(language === 'vi' ? 'en' : 'vi')
  }

  const value = useMemo(
    () => ({
      language,
      setLanguage,
      toggleLanguage,
      t: (key: string, values?: TranslationValues) => translate(language, key, values),
    }),
    [language],
  )

  return <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>
}

export function useLanguage() {
  const context = useContext(LanguageContext)
  if (!context) {
    throw new Error('useLanguage must be used within LanguageProvider')
  }
  return context
}
