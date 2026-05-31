import { createContext, useContext, useEffect, useMemo, useState } from 'react'

import { translations } from './translations/index.js'

const LANGUAGE_KEY = 'marseille04_language'
const DEFAULT_LANGUAGE = 'vi'

const LanguageContext = createContext(null)

function formatTranslation(template, values) {
  if (!values) return template
  return Object.entries(values).reduce(
    (text, [key, value]) => text.replaceAll(`{${key}}`, value),
    template,
  )
}

function getDictionary(language) {
  return translations[language] || translations[DEFAULT_LANGUAGE]
}

function translate(language, key, values) {
  const dictionary = getDictionary(language)
  const fallbackDictionary = translations[DEFAULT_LANGUAGE]
  const template = dictionary?.[key] || fallbackDictionary?.[key] || key

  return formatTranslation(template, values)
}

export function LanguageProvider({ children }) {
  const [language, setLanguageState] = useState(() => localStorage.getItem(LANGUAGE_KEY) || DEFAULT_LANGUAGE)

  useEffect(() => {
    document.documentElement.lang = language
  }, [language])

  function setLanguage(nextLanguage) {
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
      t: (key, values) => translate(language, key, values),
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
