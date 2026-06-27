/**
 * i18n - Locale Provider & Hook
 *
 * Usage:
 *   1. Wrap <App> with <LocaleProvider>
 *   2. In any component: const { t, locale, dramas, chat } = useLocale();
 *
 * Language is determined by URL hash prefix:
 *   /#/en/...  → English
 *   /#/zh/...  → Chinese (default)
 *   /#/...     → Chinese (default, no prefix)
 */
import { createContext, useContext, useMemo, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";

import zhStrings from "./zh/strings";
import enStrings from "./en/strings";
import zhDramas from "./zh/dramas";
import enDramas from "./en/dramas";
import zhChat from "./zh/chat";
import enChat from "./en/chat";

const LocaleContext = createContext(null);

const LOCALE_MAP = {
  zh: { strings: zhStrings, dramas: zhDramas, chat: zhChat },
  en: { strings: enStrings, dramas: enDramas, chat: enChat },
};

/**
 * Detect locale from current hash path.
 * /#/en/xxx → "en"
 * /#/zh/xxx or /#/xxx → "zh"
 */
export function detectLocale(pathname) {
  if (pathname.startsWith("/en/") || pathname === "/en") return "en";
  if (pathname.startsWith("/zh/") || pathname === "/zh") return "zh";
  return "zh"; // default
}

/**
 * Strip locale prefix from path for route matching.
 * "/en/drama" → "/drama"
 * "/zh/full"  → "/full"
 * "/drama"    → "/drama"
 */
export function stripLocalePrefix(pathname) {
  if (pathname.startsWith("/en/")) return pathname.slice(3) || "/";
  if (pathname.startsWith("/zh/")) return pathname.slice(3) || "/";
  if (pathname === "/en" || pathname === "/zh") return "/";
  return pathname;
}

/**
 * Prepend locale prefix to a path.
 * ("en", "/drama") → "/en/drama"
 * ("zh", "/drama") → "/drama"  (zh is default, no prefix needed)
 */
export function localePath(locale, path) {
  if (locale === "zh") return path;
  return `/${locale}${path}`;
}

export const LocaleProvider = ({ children }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const locale = detectLocale(location.pathname);
  const data = LOCALE_MAP[locale];

  // 读取 localStorage，若用户之前选过英文且当前路径没有 /en 前缀，自动跳转到英文版
  useEffect(() => {
    const preferred = localStorage.getItem("preferred_locale");
    if (preferred === "en" && locale === "zh") {
      const currentPath = location.pathname;
      const enPath = "/en" + (currentPath === "/" ? "" : currentPath);
      navigate(enPath, { replace: true });
    }
  // 只在首次挂载时执行一次
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const value = useMemo(
    () => ({
      locale,
      t: data.strings,
      dramas: data.dramas,
      chat: data.chat,
      localePath: (path) => localePath(locale, path),
    }),
    [locale, data]
  );

  return (
    <LocaleContext.Provider value={value}>{children}</LocaleContext.Provider>
  );
};

export const useLocale = () => {
  const ctx = useContext(LocaleContext);
  if (!ctx) {
    throw new Error("useLocale must be used within a LocaleProvider");
  }
  return ctx;
};

export default useLocale;
