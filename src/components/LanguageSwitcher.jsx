import { Globe } from "lucide-react";
import { useNavigate, useLocation } from "react-router-dom";
import { createPortal } from "react-dom";
import { detectLocale } from "@/i18n";

/**
 * LanguageSwitcher
 *
 * 固定在页面右上角的中/EN 语言切换按钮。
 * 点击后通过 navigate 在当前路径上加上/去掉 /en 前缀来实现切换，
 * 并把用户的选择存入 localStorage。
 */
const LanguageSwitcher = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const locale = detectLocale(location.pathname);

  // Only show on landing page (/ or /en)
  const isLanding = location.pathname === "/" || location.pathname === "/en" || location.pathname === "/en/";
  if (!isLanding) return null;

  const handleSwitch = () => {
    const currentPath = location.pathname;

    if (locale === "zh") {
      // 切换到英文：在路径前加 /en
      const enPath = "/en" + (currentPath === "/" ? "" : currentPath);
      localStorage.setItem("preferred_locale", "en");
      navigate(enPath + location.search + location.hash);
    } else {
      // 切换到中文：去掉 /en 前缀
      let zhPath = currentPath;
      if (zhPath.startsWith("/en/")) {
        zhPath = zhPath.slice(3) || "/";
      } else if (zhPath === "/en") {
        zhPath = "/";
      }
      localStorage.setItem("preferred_locale", "zh");
      navigate(zhPath + location.search + location.hash);
    }
  };

  const label = locale === "zh" ? "EN" : "中";

  return createPortal(
    <button
      onClick={handleSwitch}
      title={locale === "zh" ? "Switch to English" : "切换到中文"}
      style={{
        position: "fixed",
        top: "calc(env(safe-area-inset-top, 0px) + 12px)",
        right: "16px",
        zIndex: 9998,
        display: "flex",
        alignItems: "center",
        gap: "4px",
        padding: "5px 10px",
        borderRadius: "20px",
        border: "1px solid rgba(255,255,255,0.18)",
        background: "rgba(13,13,13,0.55)",
        backdropFilter: "blur(12px)",
        WebkitBackdropFilter: "blur(12px)",
        color: "rgba(245,240,235,0.85)",
        fontSize: "12px",
        fontFamily: "sans-serif",
        fontWeight: "600",
        cursor: "pointer",
        letterSpacing: "0.04em",
        boxShadow: "0 2px 12px rgba(0,0,0,0.3)",
        transition: "background 0.2s, border-color 0.2s",
      }}
      onPointerEnter={(e) => {
        e.currentTarget.style.background = "rgba(232,168,124,0.18)";
        e.currentTarget.style.borderColor = "rgba(232,168,124,0.45)";
      }}
      onPointerLeave={(e) => {
        e.currentTarget.style.background = "rgba(13,13,13,0.55)";
        e.currentTarget.style.borderColor = "rgba(255,255,255,0.18)";
      }}
    >
      <Globe size={13} strokeWidth={2} />
      <span>{label}</span>
    </button>,
    document.body
  );
};

export default LanguageSwitcher;
