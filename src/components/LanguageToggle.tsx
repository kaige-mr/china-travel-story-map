import type { Language } from "../i18n";
import { translations } from "../i18n";

interface LanguageToggleProps {
  language: Language;
  onLanguageChange: (language: Language) => void;
}

export function LanguageToggle({ language, onLanguageChange }: LanguageToggleProps) {
  const labels = translations[language].language;

  return (
    <div className="language-toggle" role="group" aria-label={labels.label}>
      <button
        className={language === "zh" ? "language-toggle__option language-toggle__option--active" : "language-toggle__option"}
        type="button"
        aria-pressed={language === "zh"}
        onClick={() => onLanguageChange("zh")}
      >
        {labels.chinese}
      </button>
      <button
        className={language === "en" ? "language-toggle__option language-toggle__option--active" : "language-toggle__option"}
        type="button"
        aria-pressed={language === "en"}
        onClick={() => onLanguageChange("en")}
      >
        {labels.english}
      </button>
    </div>
  );
}
