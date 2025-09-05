import { useI18n, Locale } from "@/i18n/I18nContext";
import styles from "./LanguageSwitcher.module.scss";

const langs: Array<{ code: Locale; label: string }> = [
    { code: "ru", label: "Рус" },
    { code: "uk", label: "Укр" },
    { code: "en", label: "EN" },
    { code: "de", label: "DE" },
];

export default function LanguageSwitcher() {
    const { locale, setLocale } = useI18n();
    return (
        <label className={styles.wrap} aria-label="Language">
            <select
                className="input"
                value={locale}
                onChange={(e) => setLocale(e.target.value as Locale)}
                aria-label="Language"
            >
                {langs.map(l => <option key={l.code} value={l.code}>{l.label}</option>)}
            </select>
        </label>
    );
}
