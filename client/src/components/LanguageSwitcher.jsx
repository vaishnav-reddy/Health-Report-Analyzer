import React, { useState } from "react";
import { useTranslation } from "react-i18next";
import { ChevronDown, Globe } from "lucide-react";

const languages = [
  { code: "en", label: "English", flag: "🇺🇸" },
  { code: "hi", label: "हिन्दी", flag: "🇮🇳" },
];

export default function LanguageSwitcher() {
  const { i18n } = useTranslation();
  const [open, setOpen] = useState(false);

  const getCurrent = () => {
    const langFromI18n = i18n.language ? i18n.language.split("-")[0] : "en";
    return langFromI18n || "en";
  };

  const handleChange = (lng) => {
    i18n.changeLanguage(lng);
    try {
      localStorage.setItem("i18nextLng", lng);
    } catch (err) {
      console.warn("Could not save language preference:", err);
    }
    setOpen(false);
  };

  const current = getCurrent();
  const currentLanguage =
    languages.find((lang) => lang.code === current) || languages[0];

  return (
    <div className="language-switcher-wrapper">
      {/* Trigger Button */}
      <button
        className="landing-signin-button language-trigger"
        onClick={() => setOpen((prev) => !prev)}
      >
        <Globe size={16} className="mr-2" />
        {currentLanguage.flag} {currentLanguage.label}
        <ChevronDown
          size={16}
          className={`ml-2 transition-transform ${
            open ? "rotate-180" : "rotate-0"
          }`}
        />
      </button>

      {/* Dropdown */}
      {open && (
  <div className="language-dropdown">
    {languages.map((lang) => (
      <button
        key={lang.code}
        onClick={() => handleChange(lang.code)}
      >
        {lang.flag} {lang.label}
      </button>
    ))}
  </div>
)}
    </div>
  );
}
