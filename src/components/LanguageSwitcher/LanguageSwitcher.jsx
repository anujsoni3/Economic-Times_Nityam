import { useState, useRef, useEffect } from 'react';
import { useLanguage, SUPPORTED_LANGUAGES } from '../../context/LanguageContext';
import './LanguageSwitcher.css';

export default function LanguageSwitcher() {
  const { language, setLanguage } = useLanguage();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);

  const currentLang = SUPPORTED_LANGUAGES.find((l) => l.code === language) || SUPPORTED_LANGUAGES[0];

  useEffect(() => {
    function handleClickOutside(e) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div className="lang-switcher" ref={dropdownRef}>
      <button
        className="lang-switcher-btn"
        onClick={() => setIsOpen(!isOpen)}
        title="Switch Language"
        id="language-switcher-btn"
      >
        <i className="bi bi-translate"></i>
        <span className="lang-switcher-current">{currentLang.native}</span>
        <i className={`bi bi-chevron-down lang-switcher-arrow ${isOpen ? 'open' : ''}`}></i>
      </button>

      {isOpen && (
        <div className="lang-switcher-dropdown">
          <div className="lang-dropdown-header">
            <i className="bi bi-globe2"></i> Select Language
          </div>
          {SUPPORTED_LANGUAGES.map((lang) => (
            <button
              key={lang.code}
              className={`lang-option ${language === lang.code ? 'active' : ''}`}
              onClick={() => {
                setLanguage(lang.code);
                setIsOpen(false);
              }}
              id={`lang-option-${lang.code}`}
            >
              <span className="lang-option-native">{lang.native}</span>
              <span className="lang-option-name">{lang.name}</span>
              {language === lang.code && <i className="bi bi-check2 lang-option-check"></i>}
            </button>
          ))}
          <div className="lang-dropdown-footer">
            <i className="bi bi-stars"></i> Culturally adapted, not translated
          </div>
        </div>
      )}
    </div>
  );
}
