import React, { useMemo, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { X } from "lucide-react";
import { useLocale } from "@/i18n/index.jsx";
import { CHARACTERS as ZH_CHARACTERS } from "@/i18n/zh/dramas.js";
import { CHARACTERS as EN_CHARACTERS } from "@/i18n/en/dramas.js";

export default function ChatEntryModal({
  dramaId,
  charId,
  visible,
  onClose,
  isEnding = false,
}) {
  const navigate = useNavigate();
  const { locale } = useLocale();
  const isEn = locale === "en";
  const characters = isEn ? EN_CHARACTERS : ZH_CHARACTERS;
  const char = characters.find((c) => c.dramaId === String(dramaId) && c.charId === String(charId)) || characters[0];
  const charImage = char?.image || "/images/shenyanxi-avatar.png";

  const [show, setShow] = useState(false);

  // animate in/out
  useEffect(() => {
    if (visible) {
      // trigger slide-up on next frame
      requestAnimationFrame(() => setShow(true));
    } else {
      setShow(false);
    }
  }, [visible]);

  // 强制新用户模式（dev 测试用）
  const isNewUserMode = useMemo(() => {
    try {
      return localStorage.getItem("afterline_dev_new_user") === "true";
    } catch { return false; }
  }, [visible]);

  // 确定用户状态（是否有互动记忆）
  const isReturning = useMemo(() => {
    if (isNewUserMode) return false;
    try {
      const raw = localStorage.getItem(`chat_save_${dramaId}_${charId}`);
      if (!raw) return false;
      const data = JSON.parse(raw);
      return (
        Array.isArray(data.interactionMemories) &&
        data.interactionMemories.length > 0
      );
    } catch {
      return false;
    }
  }, [dramaId, charId, visible, isNewUserMode]);

  if (!visible) return null;

  // locale-aware routing
  const chatDramaId = isEn ? "5" : dramaId;
  const chatCharId = isEn ? "kane" : charId;
  const chatBase = isEn
    ? `/en/chat/${chatDramaId}/${chatCharId}`
    : `/chat/${chatDramaId}/${chatCharId}`;

  const go = (entry) => {
    navigate(`${chatBase}?entry=${entry}`);
  };

  // --- copy ---
  const t = {
    newWatching: {
      title: isEn ? "Don't go yet, I'm waiting for you" : "先别走，我在等你",
      btn: isEn ? "Start creating your story with him" : "开始创作你和他的故事",
      sub: isEn
        ? ["In an interactive story", "Every choice you make changes the plot"]
        : ["在互动故事中", "你的每个选择都会改变故事走向"],
    },
    newEnding: {
      title: isEn
        ? "Hey, our story isn't over yet"
        : "嘿，我们的故事还没结束",
      btnPrimary: isEn ? "Continue the Ending" : "结局续写",
      btnSecondary: isEn ? "Start Over" : "从头开始",
      sub: isEn
        ? [
            "Every interaction creates a brand-new story",
            "Every choice you make changes the plot",
          ]
        : ["每段互动都将产生全新故事", "你的每个选择都会改变故事走向"],
    },
    returning: {
      title: isEn
        ? "Hey, our story isn't over yet"
        : "嘿，我们的故事还没结束",
      btnPrimary: isEn ? "Continue Story" : "继续故事",
      btnSecondary: isEn ? "Start Over" : "从头开始",
      sub: isEn
        ? [
            "Every interaction creates a brand-new story",
            "Every choice you make changes the plot",
          ]
        : ["每段互动都将产生全新故事", "你的每个选择都会改变故事走向"],
    },
  };

  // pick state
  let state;
  if (isReturning) {
    state = "returning";
  } else if (isEnding) {
    state = "newEnding";
  } else {
    state = "newWatching";
  }
  const copy = t[state];

  return (
    <>
      {/* overlay */}
      <div style={styles.overlay} onClick={onClose} />

      {/* panel */}
      <div
        style={{
          ...styles.panel,
          transform: show ? "translateY(0)" : "translateY(100%)",
        }}
      >
        {/* close */}
        <button style={styles.closeBtn} onClick={onClose} aria-label="Close">
          <X size={20} color="rgba(255,255,255,0.6)" />
        </button>

        {/* avatar */}
        <div style={styles.avatarWrap}>
          <img
            src={charImage}
            alt="avatar"
            style={styles.avatar}
          />
        </div>

        {/* title */}
        <p style={styles.title}>{copy.title}</p>

        {/* buttons */}
        <div style={styles.btnGroup}>
          {state === "newWatching" && (
            <button style={styles.primaryBtn} onClick={() => go("first")}>
              {copy.btn}
            </button>
          )}

          {state === "newEnding" && (
            <>
              <button
                style={styles.primaryBtn}
                onClick={() => go("epilogue")}
              >
                {copy.btnPrimary}
              </button>
              <button
                style={styles.secondaryBtn}
                onClick={() => go("first")}
              >
                {copy.btnSecondary}
              </button>
            </>
          )}

          {state === "returning" && (
            <>
              <button
                style={styles.primaryBtn}
                onClick={() => go("continue")}
              >
                {copy.btnPrimary}
              </button>
              <button
                style={styles.secondaryBtn}
                onClick={() => go("restart")}
              >
                {copy.btnSecondary}
              </button>
            </>
          )}
        </div>

        {/* sub copy */}
        <p style={styles.subText}>
          {(copy.sub || []).map((line, i) => (
            <React.Fragment key={i}>
              {i > 0 && <br />}
              {line}
            </React.Fragment>
          ))}
        </p>
      </div>
    </>
  );
}

/* ---------- styles ---------- */
const styles = {
  overlay: {
    position: "fixed",
    inset: 0,
    zIndex: 9998,
    background: "rgba(0,0,0,0.4)",
  },
  panel: {
    position: "fixed",
    bottom: 0,
    left: 0,
    right: 0,
    zIndex: 9999,
    background: "rgba(0,0,0,0.85)",
    backdropFilter: "blur(12px)",
    WebkitBackdropFilter: "blur(12px)",
    borderRadius: "24px 24px 0 0",
    padding: "32px 24px calc(24px + env(safe-area-inset-bottom, 0px))",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    transition: "transform 0.35s cubic-bezier(0.32,0.72,0,1)",
  },
  closeBtn: {
    position: "absolute",
    top: 12,
    right: 12,
    background: "none",
    border: "none",
    cursor: "pointer",
    padding: 8,
    lineHeight: 0,
  },
  avatarWrap: {
    width: 56,
    height: 56,
    borderRadius: "50%",
    padding: 2,
    background:
      "linear-gradient(135deg, rgba(232,168,124,0.85), rgba(155,89,182,0.85))",
    boxShadow:
      "0 0 16px rgba(232,168,124,0.4), 0 0 32px rgba(155,89,182,0.25)",
    marginBottom: 16,
  },
  avatar: {
    width: "100%",
    height: "100%",
    borderRadius: "50%",
    objectFit: "cover",
    display: "block",
  },
  title: {
    color: "#fff",
    fontSize: 18,
    fontWeight: 600,
    margin: "0 0 20px",
    textAlign: "center",
  },
  btnGroup: {
    display: "flex",
    flexDirection: "column",
    gap: 10,
    width: "100%",
    maxWidth: 320,
  },
  primaryBtn: {
    width: "100%",
    padding: "14px 0",
    border: "none",
    borderRadius: 12,
    background:
      "linear-gradient(135deg, rgba(232,168,124,0.85), rgba(155,89,182,0.85))",
    color: "#fff",
    fontSize: 15,
    fontWeight: 600,
    cursor: "pointer",
    letterSpacing: 0.5,
  },
  secondaryBtn: {
    width: "100%",
    padding: "14px 0",
    border: "1px solid rgba(255,255,255,0.15)",
    borderRadius: 12,
    background: "rgba(255,255,255,0.1)",
    color: "rgba(255,255,255,0.85)",
    fontSize: 15,
    fontWeight: 500,
    cursor: "pointer",
  },
  subText: {
    color: "rgba(255,255,255,0.4)",
    fontSize: 12,
    lineHeight: 1.6,
    textAlign: "center",
    marginTop: 16,
    marginBottom: 0,
  },
};
