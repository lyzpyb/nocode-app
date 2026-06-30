import { useState, useRef, useEffect, useCallback } from "react";
import { useNavigate, useParams, useLocation, useSearchParams } from "react-router-dom";
import { useABVersion, trackABClick } from "@/hooks/useABVersion";
import { callAI, callCozeAgent } from "@/lib/aiClient";
import { useLocale } from "@/i18n";
import {
  preprocessAIOutput,
  extractVisualMeta,
  parseStoryMode,
  parseChatMode,
  parseCozeOutput,
  parseCozeChat,
  detectGarbledText,
  buildStoryModePrompt,
  buildChatModePrompt,
} from "@/lib/aiResponseParser";
import {
  ArrowLeft,
  Phone,
  MoreVertical,
  Mic,
  MicOff,
  Send,
  Heart,
  Sparkles,
  Volume2,
  VolumeX,
  Loader,
  ChevronRight,
  Lock,
  Play,
  MessageCircle,
  Share2,
  Plus,
} from "lucide-react";


// Chat data (CHARACTERS, EPISODE_OPENINGS, etc.) is now loaded from i18n via useLocale().chat

// ─── Drama AI Prompt Configs ──────────────────────────────────────────────────
const DRAMA_CONFIG_ZH = {
  locale: "zh",
  title: "心动禁区",
  protagonist: "苏眠",
  mainCharacter: { name: "沈彦希", description: "沈氏财阀私生子，篮球队学长，银灰色蓬松头发，金框眼镜，嘴角常有血迹。外表慵懒冷漠，实则城府极深。和苏眠同住一个宿舍，早已察觉苏眠女扮男装" },
  setting: "贵族学院，宿舍同居",
  tone: "现代都市言情，暧昧张力",
  wordCount: "约500字",
};

const DRAMA_CONFIG_EN = {
  locale: "en",
  title: "Beastblood Throne",
  protagonist: "Elena von Adrian",
  mainCharacter: { name: "Prince Kane", description: "Lion Clan Crown Prince, golden beast-mask, burning gold fissures on skin, fierce and territorial, voice like a snarl that softens only for Elena" },
  setting: "Fantasy beast-clan world with noble houses, healing magic, and political intrigue",
  tone: "Epic romantic fantasy, dangerous passion, power dynamics",
  wordCount: "400-600 words",
};

//─── Keyframe styles ───────────────────────────────────────────────────────────

const STYLES = `
  @keyframes proseReveal {
    from { opacity: 0; transform: translateY(12px); }
    to   { opacity: 1; transform: translateY(0); }
  }
  @keyframes choiceIn {
    from { opacity: 0; transform: translateY(18px); }
    to   { opacity: 1; transform: translateY(0); }
  }
  @keyframes dialogueIn {
    from { opacity: 0; transform: translateX(-10px); }
    to   { opacity: 1; transform: translateX(0); }
  }
  @keyframes cursorBlink {
    0%, 100% { opacity: 1; }
    50%{ opacity: 0; }
  }
  @keyframes intimacyPop {
    0%{ transform: scale(1); }
    50%  { transform: scale(1.18); }
    100% { transform: scale(1); }
  }
  @keyframes shimmerChoice {
    0%   { background-position: -300% center; }
    100% { background-position:  300% center; }
  }
  @keyframes spin {
    from { transform: rotate(0deg); }
    to   { transform: rotate(360deg); }
  }
@keyframes fadeIn {
from { opacity: 0; }
to   { opacity: 1; }
}
@keyframes blink {
0%, 100% { opacity: 1; }
50%      { opacity: 0; }
}
@keyframes pulse {
0%, 100% { transform: scale(1); box-shadow: 0 4px 20px rgba(124,58,237,0.5); }
50% { transform: scale(1.05); box-shadow: 0 6px 28px rgba(168,85,247,0.7); }
}
@keyframes pulseGlow {
    0%, 100% { box-shadow: 0 0 0 0 rgba(232,168,124,0.3); }
    50%{ box-shadow: 0 0 0 6px rgba(232,168,124,0); }
  }
  @keyframes introCursorBlink {
    0%, 100% { opacity: 1; }
    50%       { opacity: 0; }
  }
  @keyframes introFadeIn {
    from { opacity: 0; }
    to   { opacity: 1; }
  }
  @keyframes introFadeOut {
    from { opacity: 1; }
    to   { opacity: 0; }
  }
  @keyframes introSubFadeIn {
    from { opacity: 0; transform: translateY(8px); }
    to   { opacity: 1; transform: translateY(0); }
  }
  @keyframes introLineDraw {
    from { width: 0; }
    to   { width: 100%; }
  }
  @keyframes storyFadeIn {
    from { opacity: 0; transform: translateY(30px); }
    to   { opacity: 1; transform: translateY(0); }
  }
  @keyframes bgImageFadeIn {
    from { opacity: 0; transform: scale(1.05); }
    to   { opacity: 1; transform: scale(1); }
  }
`;

// ─── Prose Block ───────────────────────────────────────────────────────────────

const ProseBlock = ({ paragraphs, delay = 0, visibleIndices }) => {
  //确保从空开始逐步显示：如果没有指定 visibleIndices，显示所有；否则只显示指定的
  const hasStaggerEffect = visibleIndices !== undefined;
  
  return (
    <div
      style={{
        // 只有非逐步显示时才使用入场动画
        animation: hasStaggerEffect ? "none" : `proseReveal 0.6s ease ${delay}s both`,
        padding: "024px",
        marginBottom: "8px",
      }}
    >
      {paragraphs.map((p, i) => {
        //逐步显示模式：检查当前段落索引是否在可见列表中
        const isVisible = !hasStaggerEffect || visibleIndices.includes(i);
        // 计算延迟：每个段落之间间隔 0.8s
        const paragraphDelay = hasStaggerEffect ? visibleIndices.indexOf(i) * 0.8 : 0;
        
        return (
          <p
            key={i}
            className="font-sans"
            style={{
              color: "rgba(212,201,190,0.7)",
              fontSize: "14px",
              lineHeight: "1.9",
              marginBottom: i< paragraphs.length - 1 ? "16px" : "0",
              letterSpacing: "0.01em",
              opacity: isVisible ? 1 : 0,transform: isVisible ? "translateY(0)" : "translateY(20px)",
              transition: hasStaggerEffect 
                ? `opacity 0.5s ease ${paragraphDelay}s, transform 0.5s ease ${paragraphDelay}s`
                : "opacity 0.6s ease, transform 0.6s ease",//隐藏时不可交互，不占用布局空间
              display: isVisible ? "block" : "none",
            }}
          >
            {p}
          </p>
        );
      })}
    </div>
  );
};

// ─── Dialogue Line（与旁白统一样式，不再特殊处理） ────────────────────────────

const DialogueLine = ({ text, delay = 0 }) => (
  <div
    style={{
      animation: `dialogueIn 0.5s ease ${delay}s both`,
      padding: "0 24px",
      marginBottom: "8px",
    }}
  >
    <p
      className="font-sans"
      style={{
        color: "rgba(212,201,190,0.7)",
        fontSize: "14px",
        lineHeight: "1.9",
        letterSpacing: "0.01em",
      }}
    >
      {text}
    </p>
  </div>
);

// ─── Shared Custom Input Component ─────────────────────────────────────────────

const CustomInputBox = ({ customText, onCustomChange, onCustomSend, disabled, inputHint, variant = "default" }) => (
  <div
    style={{
      display: "flex",
      alignItems: "center",
      gap: variant === "chat" ? "10px" : "8px",
      padding: variant === "chat" ? "12px 16px" : "11px 14px",
      borderRadius: "14px",
      background: variant === "chat" ? "rgba(255,255,255,0.04)" : "rgba(255,255,255,0.03)",
      border: variant === "chat" ? "1px solid rgba(232,168,124,0.18)" : "1px solid rgba(232,168,124,0.12)",
    }}
  >
    <input
      type="text"
      value={customText}
      onChange={(e) => onCustomChange(e.target.value)}
      onKeyDown={(e) => e.key === "Enter" && customText.trim() && onCustomSend()}
      placeholder={inputHint || (variant === "chat" ? "输入你想说的话…" : "输入你想做或说的…")}
      disabled={disabled}
      className="flex-1 bg-transparent outline-none font-sans"
      style={{
        color: variant === "chat" ? "#F5F0EB" : "rgba(245,240,235,0.6)",
        fontSize: variant === "chat" ? "14px" : "13px",
        caretColor: "#E8A87C",
      }}
    />
    <button
      onClick={onCustomSend}
      disabled={disabled || !customText.trim()}
      style={{
        width: variant === "chat" ? "36px" : "30px",
        height: variant === "chat" ? "36px" : "30px",
        borderRadius: "50%",
        background: customText.trim()
          ? "linear-gradient(135deg, #E8A87C, #C8906A)"
          : "rgba(255,255,255,0.06)",
        border: customText.trim() ? "none" : "1px solid rgba(255,255,255,0.1)",
        cursor: customText.trim() && !disabled ? "pointer" : "not-allowed",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        flexShrink: 0,
        transition: "all 0.2s ease",
        opacity: disabled ? 0.4 : 1,
      }}
    >
      {variant === "chat" ? (
        <Send size={14} style={{ color: customText.trim() ? "#1A0E08" : "rgba(245,240,235,0.3)" }} />
      ) : (
        <ChevronRight size={14} style={{ color: customText.trim() ? "#1A0E08" : "rgba(245,240,235,0.3)" }} />
      )}
    </button>
  </div>
);

// ─── Choice Panel (Story Mode - with choices + input) ──────────────────────────

const ChoicePanel = ({ choices, onSelect, disabled, customText, onCustomChange, onCustomSend, inputHint, t }) => (
  <div
    style={{
      padding: "24px 20px 8px",
      animation: "choiceIn 0.5s ease both",
    }}
  >
    {/* Section label */}
    <div className="flex items-center gap-2 mb-4">
      <div style={{ flex: 1, height: "1px", background: "rgba(232,168,124,0.15)" }} />
      <span
        className="font-sans"
        style={{
          color: "#E8A87C",
          fontSize: "11px",
          fontWeight: "700",
          letterSpacing: "0.12em",
          textTransform: "uppercase",
        }}
      >
        {t.chat.branchLabel}
      </span>
      <div style={{ flex: 1, height: "1px", background: "rgba(232,168,124,0.15)" }} />
    </div>

    {/* Choice buttons */}
    <div style={{ display: "flex", flexDirection: "column", gap: "10px", marginBottom: "20px" }}>
      {choices.map((choice, i) => (
        <button
          key={choice.label}
          disabled={disabled}
          onClick={() => onSelect(choice)}
          style={{
            width: "100%",
            padding: "14px 16px",
            borderRadius: "14px",
            textAlign: "left",
            background: "rgba(255,255,255,0.04)",
            border: "1px solid rgba(232,168,124,0.18)",
            cursor: disabled ? "not-allowed" : "pointer",
            opacity: disabled ? 0.5 : 1,
            transition: "all 0.2s ease",
            animation: `choiceIn 0.4s ease ${i * 0.08}s both`,
            display: "flex",
            alignItems: "center",
            gap: "10px",
          }}
        ><Sparkles
            size={13}
            style={{ color: "rgba(232,168,124,0.6)", flexShrink: 0 }}
          />
          <span
            className="font-sans"
            style={{
              color: "#E8D5C0",
              fontSize: "14px",
              lineHeight: "1.5",
            }}
          >
            {choice.label}
          </span>
        </button>
      ))}
    </div>

    {/* Divider with "or" label */}
    <div className="flex items-center gap-3 mb-3">
      <div style={{ flex: 1, height: "1px", background: "rgba(255,255,255,0.07)" }} />
      <span
        className="font-sans"
        style={{
          color: "rgba(245,240,235,0.3)",
          fontSize: "11px",
          letterSpacing: "0.06em",
          whiteSpace: "nowrap",
        }}
      >
        {t.chat.orCustom}
      </span>
      <div style={{ flex: 1, height: "1px", background: "rgba(255,255,255,0.07)" }} />
    </div>

    {/* Custom input */}
    <CustomInputBox
      customText={customText}
      onCustomChange={onCustomChange}
      onCustomSend={onCustomSend}
      disabled={disabled}
      inputHint={inputHint}
      variant="default"
    />
  </div>
);

// ─── Chat Input Panel (for Chat Mode) ──────────────────────────────────────────

const ChatInputPanel = ({ customText, onCustomChange, onCustomSend, disabled, inputHint }) => (
  <div style={{ animation: "fadeIn 0.4s ease both" }}>
    <CustomInputBox
      customText={customText}
      onCustomChange={onCustomChange}
      onCustomSend={onCustomSend}
      disabled={disabled}
      inputHint={inputHint}
      variant="chat"
    />
  </div>
);

// ─── Chat Bubbles (for Chat Mode) ──────────────────────────────────────────────

//用户消息气泡（右侧）
const UserChatBubble = ({ text }) => (
  <div
    style={{
      padding: "8px 16px",
      animation: "fadeIn 0.3s ease both",
      display: "flex",
      justifyContent: "flex-end",
    }}
  >
    <div
      style={{
        maxWidth: "75%",
        padding: "12px 16px",
        borderRadius: "18px 18px 4px 18px",
        background: "linear-gradient(135deg, #E8A87C, #C8906A)",
        color: "#1A0E08",
        fontSize: "14px",
        lineHeight: "1.5",
        wordBreak: "break-word",
      }}
    >
      {text}
    </div>
  </div>
);

// 解析对话文本，分离动作描写（括号内）和台词
const parseDialogueText = (text) => {
  if (!text) return [];
  
  const segments = [];
  //匹配（动作描写）或普通对话
  const regex = /(（[^）]+）)|([^（）]+)/g;
  let match;
  
  while ((match = regex.exec(text)) !== null) {
    if (match[1]) {
      // 括号内的动作描写
      segments.push({ type: "action", content: match[1] });
    } else if (match[2]) {
      // 普通对话
      const content = match[2].trim();
      if (content) {
        segments.push({ type: "dialogue", content });
      }
    }
  }
  
  return segments;
};

// 角色消息气泡（左侧）- 支持动作描写（括号内）浅色显示
const CharacterChatBubble = ({ text, charName, avatar }) => {
  const segments = parseDialogueText(text);
  
  return (
    <div
      style={{
        padding: "8px 16px",
        animation: "fadeIn 0.3s ease both",
        display: "flex",
        justifyContent: "flex-start",
        gap: "10px",
      }}
    >
      {/* 头像 */}
      <div
        style={{
          width: "36px",
          height: "36px",
          borderRadius: "50%",
          background: "rgba(232,168,124,0.15)",
          border: "1px solid rgba(232,168,124,0.3)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          flexShrink: 0,
          fontSize: "12px",
          color: "#E8A87C",
          overflow: "hidden",
        }}
      >
        {avatar ? (
          <img src={avatar} alt={charName} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
        ) : (
          charName?.charAt(0))}
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: "4px", maxWidth: "75%" }}>
        <span
          style={{
            fontSize: "11px",
            color: "rgba(245,240,235,0.5)",
            marginLeft: "4px",
          }}
        >
          {charName}
        </span>
        <div
          style={{
            padding: "12px 16px",
            borderRadius: "18px 18px 18px 4px",
            background: "rgba(255,255,255,0.08)",
            border: "1px solid rgba(255,255,255,0.1)",
            fontSize: "14px",
            lineHeight: "1.6",
            wordBreak: "break-word",
          }}
        >
          {segments.map((seg, i) => (
            <span
              key={i}
              style={{
                color: seg.type === "action" 
                  ? "rgba(212,201,190,0.55)" // 动作描写：浅色
                  : "#F5F0EB", // 对话：正常颜色
                }}
            >
              {seg.content}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
};

// ─── Selected Choice Echo (普通模式使用) ───────────────────────────────────────

const ChoiceEcho = ({ text }) => (
  <div
    style={{
      padding: "10px 24px",
      animation: "fadeIn 0.4s ease both",
    }}
  >
    <div
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: "6px",
        padding: "8px 14px",
        borderRadius: "20px",
        background: "rgba(232,168,124,0.1)",
        border: "1px solid rgba(232,168,124,0.25)",
      }}
    >
      <Sparkles size={11} style={{ color: "#E8A87C" }} />
      <span
        className="font-sans"
        style={{ color: "#E8A87C", fontSize: "13px" }}
      >
        {text}
      </span>
    </div>
  </div>
);

// ─── Intimacy Toast────────────────────────────────────────────────────────────

const IntimacyToast = ({ gain, t }) => (
  <div
    style={{
      position: "fixed",
      top: "50%",
      left: "50%",
      transform: "translate(-50%, -50%)",
      zIndex: 999,
      padding: "10px 20px",
      borderRadius: "20px",
      background: "rgba(22,10,32,0.95)",
      border: "1px solid rgba(232,168,124,0.4)",
      boxShadow: "0 8px 32px rgba(0,0,0,0.5)",
      display: "flex",
      alignItems: "center",
      gap: "8px",
      animation: "proseReveal 0.3s ease both",
      pointerEvents: "none",
    }}
  >
    <Heart size={14} fill="#E8A87C" style={{ color: "#E8A87C" }} />
    <span className="font-sans" style={{ color: "#E8A87C", fontSize: "13px", fontWeight: "600" }}>
      {(t?.chat?.intimacyGain || "+{n}亲密度").replace("{n}", String(gain))}
    </span>
  </div>
);

// ─── Level Unlock Animation ────────────────────────────────────────────────────

const LevelUnlockAnimation = ({ level, onComplete, t }) => {
  const [showSparkles, setShowSparkles] = useState(false);
  
  useEffect(() => {
    // 1.5秒后触发完成回调
    const timer = setTimeout(() => {
      onComplete();
    }, 2500);
    
    // 0.3秒后显示闪光效果
    const sparkleTimer = setTimeout(() => {
      setShowSparkles(true);
    }, 300);
    
    return () => {
      clearTimeout(timer);
      clearTimeout(sparkleTimer);
    };
  }, [onComplete]);

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 1000,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: "rgba(0,0,0,0.92)",
        backdropFilter: "blur(12px)",
        animation: "fadeIn 0.4s ease",
      }}
    >
      <style>{`
        @keyframes levelPulse {
          0%, 100% { transform: scale(1); opacity: 1; }
          50% { transform: scale(1.05); opacity: 0.9; }
        }
        @keyframes sparkle {
          0%, 100% { opacity: 0; transform: scale(0) rotate(0deg); }
          50% { opacity: 1; transform: scale(1) rotate(180deg); }
        }
        @keyframes floatUp {
          0% { transform: translateY(0); opacity: 1; }
          100% { transform: translateY(-30px); opacity: 0; }
        }
      `}</style>

      {/* 闪光效果 */}
      {showSparkles && (
        <>
          {[...Array(8)].map((_, i) => (
            <Sparkles
              key={i}
              size={20}
              style={{
                position: "absolute",
                color: "#E8A87C",
                opacity: 0,
                animation: `sparkle 0.8s ease ${i * 0.1}s`,left: `${50 + 35 * Math.cos((i * Math.PI) / 4)}%`,
                top: `${50 + 35 * Math.sin((i * Math.PI) / 4)}%`,
              }}
            />
          ))}</>
      )}

      {/* 主内容 */}
      <div
        style={{
          textAlign: "center",
          animation: "levelPulse 1s ease-in-out",
        }}
      >
        {/* 等级图标 */}
        <div
          style={{
            width: "100px",
            height: "100px",
            borderRadius: "50%",
            background: "linear-gradient(135deg, #E8A87C 0%, #C2185B 100%)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            margin: "0 auto 20px",
            boxShadow: "0 0 60px rgba(232,168,124,0.5), 0 0 100px rgba(194,24,89,0.3)",
            position: "relative",
          }}
        >
          <Heart size={48} fill="#fff" style={{ color: "#fff" }} />
        </div>

        {/* 解锁提示 */}
        <p
          className="font-sans mb-2"
          style={{
            color: "rgba(245,240,235,0.6)",
            fontSize: "14px",
            letterSpacing: "0.1em",
          }}
        >
          {t?.chat?.intimacyLevelUp || "亲密度等级提升"}
        </p>

        {/* 等级数字 */}
        <h2
          className="font-sans"
          style={{
            color: "#E8A87C",
            fontSize: "48px",
            fontWeight: "700",
            marginBottom: "8px",
            textShadow: "0 0 30px rgba(232,168,124,0.5)",
          }}
        >Lv.{level}
        </h2>

        {/* 解锁内容提示 */}
        <p
          className="font-sans"
          style={{
            color: "rgba(245,240,235,0.8)",
            fontSize: "16px",
          }}
        >
          {t?.chat?.unlockExclusive || "解锁专属心动剧情"}
        </p>
      </div>
    </div>
  );
};

// ─── POV Unlock Modal ──────────────────────────────────────────────────────────

const UnlockModal = ({ onClose, onEnter, t }) => (
  <div
    style={{
      position: "fixed",
      inset: 0,
      zIndex: 1000,
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      background: "rgba(0,0,0,0.85)",
      backdropFilter: "blur(8px)",
      animation: "fadeIn 0.3s ease both",
    }}
    onClick={onClose}
  >
    <div
      style={{
        width: "90%",
        maxWidth: "400px",
        padding: "28px 24px",
        borderRadius: "20px",
        background: "linear-gradient(145deg, rgba(22,12,30,0.98), rgba(15,8,22,0.98))",
        border: "1px solid rgba(232,168,124,0.3)",
        boxShadow: "0 20px 60px rgba(0,0,0,0.6), 0 0 40px rgba(232,168,124,0.1)",
        animation: "proseReveal 0.4s ease 0.1s both",
      }}
      onClick={(e) => e.stopPropagation()}
    >
      {/* 右上角关闭 */}
      <button
        onClick={onClose}
        style={{
          position: "absolute",
          top: "14px",
          right: "14px",
          width: "28px",
          height: "28px",
          borderRadius: "50%",
          background: "rgba(255,255,255,0.06)",
          border: "1px solid rgba(255,255,255,0.12)",
          cursor: "pointer",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          color: "rgba(255,255,255,0.45)",
          fontSize: "14px",
          lineHeight: 1,
        }}
      >
        ✕
      </button>

      {/* Header */}
      <div style={{ textAlign: "center", marginBottom: "24px" }}>
        <div
          style={{
            width: "60px",
            height: "60px",
            borderRadius: "50%",
            background: "linear-gradient(135deg, #E8A87C, #C8906A)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            margin: "0 auto 14px",
            boxShadow: "0 8px 24px rgba(232,168,124,0.3)",
          }}
        >
          <Heart size={28} fill="#1A0E08" style={{ color: "#1A0E08" }} />
        </div>

        {/* 主标题 */}
        <h3
          className="font-serif"
          style={{
            color: "#E8A87C",
            fontSize: "18px",
            fontWeight: "600",
            marginBottom: "8px",
          }}
        >
          {t?.chat?.unlockPOV || "解锁心动 POV"}
        </h3>

        {/* 小剧场副标题 */}
        <p
          className="font-serif"
          style={{
            color: "rgba(245,235,220,0.88)",
            fontSize: "15px",
            fontWeight: "500",
            marginBottom: "6px",
            letterSpacing: "0.04em",
          }}
        >
          {t?.chat?.unlockTheatreTitle || "《停电夜的越界》"}
        </p>

        {/* 亲密度说明 */}
        <p
          className="font-sans"
          style={{
            color: "rgba(245,240,235,0.45)",
            fontSize: "12px",
            marginBottom: "0",}}
        >
          {t?.chat?.unlockTheatreDesc || "亲密度达到 3 级· 开启专属剧情"}
        </p>
      </div>

      {/* 描述文字 */}
      <div
        style={{
          background: "rgba(232,168,124,0.06)",
          border: "1px solid rgba(232,168,124,0.15)",
          borderRadius: "12px",
          padding: "14px 16px",
          marginBottom: "24px",
          textAlign: "center",
        }}
      >
        <p
          className="font-serif"
          style={{
            color: "rgba(245,235,220,0.75)",
            fontSize: "14px",
            lineHeight: "1.7",
            margin: 0,
            whiteSpace: "pre-line",
          }}
        >
          {t?.chat?.unlockTheatreStory || "深夜停电，你们独处宿舍…\n选择你的故事走向"}
        </p>
      </div>

      {/* 进入小剧场按钮 */}
      <div style={{ display: "flex", justifyContent: "center" }}>
        <button
          onClick={onEnter}
          style={{
            width: "100%",
            padding: "14px 32px",
            borderRadius: "14px",
            background: "linear-gradient(135deg, #E8A87C 0%, #9B59B6 100%)",
            border: "none",
            color: "#fff",
            fontSize: "15px",
            fontWeight: "600",
            cursor: "pointer",
            letterSpacing: "0.04em",
            boxShadow: "0 6px 20px rgba(155,89,182,0.4)",
            transition: "opacity 0.2s ease",}}
          onMouseEnter={(e) => (e.currentTarget.style.opacity = "0.9")}
          onMouseLeave={(e) => (e.currentTarget.style.opacity = "1")}
        >
          {t?.chat?.enterTheatre || "进入小剧场 →"}
        </button>
      </div>
    </div>
  </div>
);

// ─── Scene Divider ─────────────────────────────────────────────────────────────

const SceneDivider = () => (
  <div
    style={{
      display: "flex",
      alignItems: "center",
      gap: "12px",
      padding: "8px 24px",
      animation: "fadeIn 0.5s ease both",
    }}
  >
    <div style={{ flex: 1, height: "1px", background: "linear-gradient(90deg, transparent, rgba(232,168,124,0.2))" }} />
    <div
      style={{
        width: "6px",
        height: "6px",
        borderRadius: "50%",
        background: "rgba(232,168,124,0.4)",
      }}
    />
    <div style={{ flex: 1, height: "1px", background: "linear-gradient(90deg, rgba(232,168,124,0.2), transparent)" }} />
  </div>
);

// ─── Intimacy Bar (unified header) ────────────────────────────────────────────

// 动态等级计算：8级映射
const INTIMACY_THRESHOLDS = [0, 9, 21, 35, 49, 61, 73, 85];
function calcLevel(intimacy) {
  for (let i = INTIMACY_THRESHOLDS.length - 1; i >= 0; i--) {
    if (intimacy >= INTIMACY_THRESHOLDS[i]) return i + 1;
  }
  return 1;
}

const IntimacyBar = ({ value, max, gained }) => {
  const pct = Math.min(100, (value / max) * 100);
  const level = calcLevel(value);
  return (
    <div style={{ padding: "10px 24px", display: "flex", alignItems: "center", gap: "10px", flexShrink: 0 }}>
      <Heart size={13} fill="#E8A87C" style={{ color: "#E8A87C", flexShrink: 0 }} />
      <div style={{ flex: 1, height: "3px", background: "rgba(255,255,255,0.1)", borderRadius: "2px", overflow: "hidden" }}>
        <div style={{ height: "100%", width: `${pct}%`, background: "linear-gradient(90deg, #E8A87C, #C8906A)", borderRadius: "2px", transition: "width 0.6s cubic-bezier(0.34,1.56,0.64,1)" }} />
      </div>
      <span className="font-sans" style={{ color: "rgba(232,168,124,0.7)", fontSize: "10px", fontWeight: "600", letterSpacing: "0.06em", flexShrink: 0 }}>Lv.{level}</span>
      {gained !== 0 && <span className="font-sans" style={{ color: gained > 0 ? "#E8A87C" : "#e85d5d", fontSize: "11px", fontWeight: "700", flexShrink: 0, animation: "intimacyPop 0.4s ease" }}>{gained > 0 ? '+' : ''}{gained}</span>}
    </div>
  );
};

// ─── Main Chat Page ────────────────────────────────────────────────────────────

const Chat = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { dramaId, charId: rawCharId } = useParams();
  const [searchParams] = useSearchParams();
  const entryMode = searchParams.get("entry"); // first | epilogue | continue | restart
  const { t, locale, localePath: lp, chat: chatData } = useLocale();
  const { CHARACTERS, EPISODE_SUMMARIES, EPISODE_OPENINGS, STORY_SCENES } = chatData;
  const charId = CHARACTERS[rawCharId] ? rawCharId : (dramaId === "5" ? "kane" : "1");
  const char = CHARACTERS[charId];
  const scenes = STORY_SCENES[charId] || STORY_SCENES["1"];

  // Auto-redirect EN drama to /en/ path so locale resolves to English
  useEffect(() => {
    if (dramaId === "5" && locale !== "en") {
      navigate(`/en/chat/${dramaId}/${charId}`, { replace: true });
    }
  }, [dramaId, locale, charId, navigate]);

  // Build scene map for quick lookup
  const sceneMap = {};
  scenes.forEach((s) => { sceneMap[s.id] = s; });

  // ── Episode progress from localStorage ──
  const [episodeProgress, setEpisodeProgress] = useState(() => {
    try { return Number(localStorage.getItem("xindongjinqu_progress")) || 1; }
    catch { return 1; }
  });

  // ── 聊天存档 key（按角色隔离）──
  const chatSaveKey = `chat_save_${dramaId}_${charId}`;

  // ── 从localStorage 恢复存档的工具函数 ──
  const loadSave = (field, fallback) => {
    try {
      const raw = localStorage.getItem(chatSaveKey);
      if (!raw) return fallback;
      const save = JSON.parse(raw);
      return save[field] !== undefined ? save[field] : fallback;
    } catch { return fallback; }
  };

  const [currentSceneId, setCurrentSceneId] = useState(() => loadSave("currentSceneId", "s1"));
  const [history, setHistory] = useState(() => loadSave("history", []));
  const [choicesDisabled, setChoicesDisabled] = useState(false);
  const [customText, setCustomText] = useState("");
  const [intimacy, setIntimacy] = useState(() => loadSave("intimacy", char.intimacy));
  const [intimacyAnim, setIntimacyAnim] = useState(false);
  const [intimacyGain, setIntimacyGain] = useState(0);
  const [showIntimacyToast, setShowIntimacyToast] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [showMenu, setShowMenu] = useState(false);
  const [visibleParagraphs, setVisibleParagraphs] = useState([]); // 逐步显示的段落索引
  const [shouldAutoScroll, setShouldAutoScroll] = useState(true); // 控制是否自动滚动
  const newContentRef = useRef(null); // 新内容的引用
  const [isChatMode, setIsChatMode] = useState(() => loadSave("isChatMode", false)); // 对话模式/剧情模式切换
  const [chatRound, setChatRound] = useState(() => loadSave("chatRound", 0)); // 对话模式下的聊天轮数
  const [showUnlockModal, setShowUnlockModal] = useState(false); // 解锁POV弹窗
  const [povUnlocked, setPovUnlocked] = useState(() => loadSave("povUnlocked", false)); // 是否已解锁POV
  const [showLevelUnlockAnimation, setShowLevelUnlockAnimation] = useState(false); // 等级解锁动画
  const [showExclusiveDrawer, setShowExclusiveDrawer] = useState(false); // 专属剧情抽屉
  const isEnglishDrama = dramaId === "5";
  const [showEpSelector, setShowEpSelector] = useState(false); // Episode selector (EN drama)
  const [currentEp, setCurrentEp] = useState(() => {
    try { return Number(localStorage.getItem(`en_chat_ep_${charId}`)) || 1; } catch { return 1; }
  });
  const [visualMetas, setVisualMetas] = useState(() => loadSave("visualMetas", [])); // 每轮AI 回复的视觉元数据
  const [activeBranch, setActiveBranch] = useState(() => loadSave("activeBranch", null)); // 当前激活的写死支线 id
  const [interactionMemories, setInteractionMemories] = useState(() => loadSave("interactionMemories", []));
  const [lastInteractionTime, setLastInteractionTime] = useState(() => loadSave("lastInteractionTime", null));
  // ── Coze Agent 会话 ID ──
  const [cozeSessionId, setCozeSessionId] = useState(() => {
    const key = `coze_session_${dramaId}_${charId}`;
    const saved = localStorage.getItem(key);
    if (saved) return saved;
    const newId = `session-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
    localStorage.setItem(key, newId);
    return newId;
  });
  const [lastDailyDate, setLastDailyDate] = useState(() => loadSave("lastDailyDate", null));
  const [consecutiveDays, setConsecutiveDays] = useState(() => loadSave("consecutiveDays", 0));
  const [showLevelUp, setShowLevelUp] = useState(false);
  const [levelUpTarget, setLevelUpTarget] = useState(1);

  const scrollRef = useRef(null);
  const bottomRef = useRef(null);

  // EN drama: reset chat
  const [showResetConfirm, setShowResetConfirm] = useState(false);
  const handleRestart = useCallback(() => {
    setShowMenu(false);
    setShowResetConfirm(true);
  }, []);

  // ── 通过 Coze Agent 加载每集开场（共用辅助函数） ──
  const loadOpeningFromCoze = useCallback(async (ep, sessionId) => {
    setIsGenerating(true);
    setChoicesDisabled(true);
    try {
      const result = await callCozeAgent({
        text: `故事模式-进入第${ep}集`,
        sessionId,
      });
      const aiContent = result.content || "";
      const storyResult = parseCozeOutput(aiContent);

      const openingScene = {
        id: "opening_s1",
        prose: storyResult.prose.length > 0 ? storyResult.prose : [t.chat.continuingStory],
        dialogue: storyResult.dialogue || "……",
        choices: storyResult.choices.length > 0
          ? storyResult.choices.map((c, idx) => ({
              label: c.label,
              index: idx,
              next: "s1",
              intimacyGain: c.intimacyGain || 0,
            }))
          : [{ label: t.chat.continueStoryChoice, next: "s1", intimacyGain: 5 }],
        inputHint: storyResult.inputHint || t.chat.aiInputHint,
      };
      setHistory([{ type: "scene", scene: openingScene, key: "init_s1" }]);
      // 立即显示所有段落（Coze 返回的已是完整内容，无需逐段动画）
      setVisibleParagraphs(Array.from({ length: 20 }, (_, i) => i));
    } catch (err) {
      console.error("Coze Agent 加载开场失败:", err);
      setHistory([{
        type: "scene",
        scene: {
          id: "error_opening",
          prose: [],
          dialogue: t.chat.connectionError,
          choices: [{ label: t.chat.retryBtn, next: "s1", intimacyGain: 0 }],
          inputHint: t.chat.retryHint,
        },
        key: "error_opening",
      }]);
      setVisibleParagraphs(Array.from({ length: 20 }, (_, i) => i));
    } finally {
      setIsGenerating(false);
      setChoicesDisabled(false);
    }
  }, [t]);

  const confirmReset = useCallback(() => {
    setShowResetConfirm(false);
    // Clear saved state
    localStorage.removeItem(chatSaveKey);
    if (isEnglishDrama) localStorage.removeItem(`en_chat_ep_${charId}`);
    try { localStorage.removeItem("xindongjinqu_chat_history"); } catch (e) {}
    // Reset states
    const ep = isEnglishDrama ? 1 : (episodeProgress || 1);
    setVisibleParagraphs([]);
    setHistory([]);
    setCurrentSceneId(isEnglishDrama ? "ep1" : "s1");
    if (isEnglishDrama) setCurrentEp(1);
    setCustomText("");
    setIntimacy(char.intimacy);
    setActiveBranch(null);
    setInteractionMemories([]);
    setLastInteractionTime(null);
    setLastDailyDate(null);
    setConsecutiveDays(0);
    setIsChatMode(false);
    setChatRound(0);
    // 重新生成 Coze Agent 会话 ID 并通过 Agent 加载开场
    const cozeKey = `coze_session_${dramaId}_${charId}`;
    const newSessionId = `session-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
    localStorage.setItem(cozeKey, newSessionId);
    setCozeSessionId(newSessionId);
    loadOpeningFromCoze(ep, newSessionId);
  }, [chatSaveKey, charId, dramaId, char, isEnglishDrama, episodeProgress, loadOpeningFromCoze]);

  // 入场模式处理
  useEffect(() => {
    if (!entryMode) return;
    if (entryMode === "first" || entryMode === "restart" || entryMode === "epilogue") {
      // 清空所有状态，准备新用户入场（first/restart）或结局续写（epilogue）
      const emptyState = {};
      localStorage.setItem(chatSaveKey, JSON.stringify(emptyState));
      setHistory([]);
      setIntimacy(0);
      setCurrentSceneId("s1");
      setIsChatMode(false);
      setChatRound(0);
      setPovUnlocked(false);
      setVisualMetas([]);
      setActiveBranch(null);
      setInteractionMemories([]);
      setLastInteractionTime(null);
      setLastDailyDate(null);
      setConsecutiveDays(0);
      setVisibleParagraphs([]);
      let ep = 1;
      if (entryMode === "epilogue") {
        ep = Math.max(...Object.keys(EPISODE_SUMMARIES).map(Number));
      } else {
        // first/restart：从 localStorage 读取 Player 设置的集数
        try { ep = Number(localStorage.getItem("xindongjinqu_progress")) || 1; } catch { ep = 1; }
      }
      setEpisodeProgress(ep);
      // 生成新的 Coze 会话 ID 并通过 Agent 加载开场
      const cozeKey = `coze_session_${dramaId}_${charId}`;
      const newSessionId = `session-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
      localStorage.setItem(cozeKey, newSessionId);
      setCozeSessionId(newSessionId);
      loadOpeningFromCoze(ep, newSessionId);
    }
    // 清除 URL 中的 entry 参数，防止刷新重复触发
    if (entryMode) {
      const url = new URL(window.location);
      url.searchParams.delete("entry");
      window.history.replaceState({}, "", url.pathname + url.hash);
    }
  }, []); // 只在挂载时执行一次

  // 手动切换剧集
  const handleEpSelect = useCallback((ep) => {
    setShowEpSelector(false);
    setCurrentEp(ep);
    if (isEnglishDrama) localStorage.setItem(`en_chat_ep_${charId}`, ep);
    localStorage.setItem("xindongjinqu_progress", String(ep));
    setEpisodeProgress(ep);
    // 清空聊天状态
    localStorage.removeItem(chatSaveKey);
    setHistory([]);
    setVisibleParagraphs([]);
    setCurrentSceneId("s1");
    setIsChatMode(false);
    setChatRound(0);
    setCustomText("");
    setIntimacy(char.intimacy);
    setActiveBranch(null);
    setInteractionMemories([]);
    setLastInteractionTime(null);
    // 生成新 Coze 会话并请求新集开场
    const cozeKey = `coze_session_${dramaId}_${charId}`;
    const newSessionId = `session-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
    localStorage.setItem(cozeKey, newSessionId);
    setCozeSessionId(newSessionId);
    loadOpeningFromCoze(ep, newSessionId);
  }, [charId, dramaId, isEnglishDrama, chatSaveKey, char, loadOpeningFromCoze]);

  const scrollToBottom = useCallback(() => {
    setTimeout(() => {
      bottomRef.current?.scrollIntoView({ behavior: "smooth" });
    }, 100);
  }, []);

  //滚动到新内容开始位置
  const scrollToNewContent = useCallback(() => {
    setTimeout(() => {
      newContentRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    }, 100);
  }, []);

  // ── 自动持久化聊天状态到localStorage ──────────────────────────────────────────
  useEffect(() => {
    try {
      const save = {
        history,
        currentSceneId,
        intimacy,
        isChatMode,
        chatRound,
        povUnlocked,
        visualMetas,
        activeBranch,
        interactionMemories,
        lastInteractionTime,
        lastDailyDate,
        consecutiveDays,
      };
      localStorage.setItem(chatSaveKey, JSON.stringify(save));
    } catch { /* 忽略 quota exceeded 等错误 */ }
  }, [history, currentSceneId, intimacy, isChatMode, chatRound, povUnlocked, visualMetas, activeBranch, interactionMemories, lastInteractionTime, lastDailyDate, consecutiveDays, chatSaveKey]);

  // Trigger intimacy animation
  const triggerIntimacy = useCallback((gain) => {
    setIntimacy((prev) => {
      const oldLevel = calcLevel(prev);
      const newVal = Math.max(0, Math.min(prev + gain, char.intimacyMax));
      const newLevel = calcLevel(newVal);
      if (newLevel > oldLevel) {
        setShowLevelUp(true);
        setLevelUpTarget(newLevel);
      }
      return newVal;
    });
    setIntimacyGain(gain);
    setIntimacyAnim(true);
    setShowIntimacyToast(true);
    setTimeout(() => {
      setIntimacyAnim(false);
      setShowIntimacyToast(false);
    }, 1800);
  }, [char.intimacyMax]);

  // 每日互动奖惩
  useEffect(() => {
    const today = new Date().toISOString().slice(0, 10);
    if (lastDailyDate === today) return; // 今天已结算
    
    if (lastDailyDate) {
      const lastDate = new Date(lastDailyDate);
      const diffDays = Math.floor((new Date(today) - lastDate) / 86400000);
      
      if (diffDays === 1) {
        // 连续互动
        const newConsec = consecutiveDays + 1;
        setConsecutiveDays(newConsec);
        triggerIntimacy(1); // 每日首次互动 +1
        if (newConsec >= 3 && newConsec % 3 === 0) {
          triggerIntimacy(2); // 连续3天额外 +2
        }
      } else if (diffDays > 1) {
        // 超过24h未互动
        const penalty = Math.min(diffDays - 1, 5); // 最多 -5
        triggerIntimacy(-penalty);
        setConsecutiveDays(0);
      }
    } else {
      // 首次使用，给 +1
      triggerIntimacy(1);
    }
    setLastDailyDate(today);
  }, [lastDailyDate, consecutiveDays, triggerIntimacy]);

  // Initialize: render opening scene via Coze Agent (or restore from save)
  useEffect(() => {
    //── 有存档则直接恢复，跳过开场初始化 ──
    try {
      const raw = localStorage.getItem(chatSaveKey);
      if (raw) {
        const save = JSON.parse(raw);
        if (save.history && save.history.length > 0) {
          // 存档已在useState 初始化时恢复，这里只需显示全部段落
          setVisibleParagraphs(Array.from({ length: 20 }, (_, i) => i));
          return;
        }
      }
    } catch { /* 无存档，继续初始化 */ }

    // 无存档：通过 Coze Agent 请求每集开场剧情
    const ep = episodeProgress || 1;
    loadOpeningFromCoze(ep, cozeSessionId);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // 自动滚动控制：只在初始化时滚动到底部，用户操作后不自动滚动
  useEffect(() => {
    if (shouldAutoScroll) {
      scrollToBottom();
    }
  }, [shouldAutoScroll, scrollToBottom]);

  // ── 公共AI 生成函数（选项和自由输入都走这里，通过阿里云代理调用 Coze Agent）──
  const generateScene = useCallback(async (text, isRetry = false) => {
    setChoicesDisabled(true);
    setIsGenerating(true);

    try {
      let aiContent = "";

      // ── 调用 Coze Agent（通过阿里云 FC 代理） ──
      try {
        const result = await callCozeAgent({
          text,
          sessionId: cozeSessionId,
        });
        aiContent = result.content;
      } catch (err) {
        if (!isRetry) {
          console.log("Coze Agent 请求失败，正在重试...", err);
          return generateScene(text, true);
        }
        throw err;
      }

      setIsGenerating(false);

      let proseArr = isChatMode ? [] : [t.chat.continuingStory];
      let dialogueLine = null;
      let parsedChoices = null;
      let inputHint = null;

      if (aiContent) {
        // 乱码检测
        const garbleCheck = detectGarbledText(aiContent);
        if (garbleCheck.isGarbled && !isRetry) {
          console.warn("AI输出乱码检测触发:", garbleCheck.reasons);
          return generateScene(text, true);
        }

        // ── 使用 Coze 解析器 ──
        if (!isChatMode) {
          const storyResult = parseCozeOutput(aiContent);
          proseArr = storyResult.prose.length > 0
            ? storyResult.prose
            : (storyResult.dialogue ? [t.chat.chatting] : [t.chat.continuingStory]);
          dialogueLine = storyResult.dialogue || "嗯……";

          if (storyResult.choices.length > 0) {
            parsedChoices = storyResult.choices.map((c, idx) => ({
              label: c.label,
              index: idx, // 记住原始编号，用于发给 Coze
              next: currentSceneId,
              intimacyGain: c.intimacyGain || 0,
            }));
          }
          inputHint = storyResult.inputHint;
        } else {
          const chatResult = parseCozeChat(aiContent);
          dialogueLine = chatResult.dialogue;
          proseArr = [];
        }
      }

      // 根据模式构建不同的场景对象
      const aiScene = isChatMode
        ? {
            id: `ai_${Date.now()}`,
            prose: proseArr,
            dialogue: dialogueLine || "……",
            choices: [],
            inputHint: t.chat.aiChatHint.replace("{name}", char.name),
            isCustom: true,
            isChatMode: true,
          }
        : {
            id: `ai_${Date.now()}`,
            prose: proseArr,
            dialogue: dialogueLine,
            choices: parsedChoices?.length > 0
              ? parsedChoices
              : [{ label: t.chat.continueStoryChoice, next: currentSceneId, intimacyGain: 5 }],
            inputHint: inputHint || t.chat.aiInputHint,
            isCustom: true,
          };

      // 从 AI 返回中解析亲密度评分（聊天模式，Coze 可能返回 ===INTIMACY_SCORE=== 块）
      let aiScore = 0;
      if (isChatMode) {
        const scoreMatch = aiContent.match(/===INTIMACY_SCORE===[\s\S]*?score:\s*([+-]?\d+)[\s\S]*?===/);
        aiScore = scoreMatch ? parseInt(scoreMatch[1], 10) : 0;
      }
      if (aiScore !== 0) triggerIntimacy(aiScore);

      setHistory((prev) => [
        ...prev,
        { type: "divider", key: `div_${Date.now()}` },
        { type: "scene", scene: aiScene, key: `ai_scene_${Date.now()}` },
      ]);

      // ── 追加互动记忆（前端侧保留，Coze agent 也在管） ──
      const newMemory = `[EP${episodeProgress}] ${char.name}${dialogueLine ? `说"${dialogueLine.slice(0, 30)}"` : "与苏眠互动"}，苏眠${text.slice(0, 20)}`;
      setInteractionMemories(prev => {
        const updated = [...prev, newMemory];
        return updated.length > 50 ? updated.slice(-50) : updated;
      });
      setLastInteractionTime(Date.now());

      setChoicesDisabled(false);
      scrollToNewContent();

      // 增加轮数并检查解锁条件
      setChatRound((prev) => {
        const newRound = prev + 1;
        if (newRound >= 3 && !povUnlocked) {
          setPovUnlocked(true);
          setShowLevelUnlockAnimation(true);
        }
        return newRound;
      });
    } catch (err) {
      console.error("generateScene error:", err);
      setIsGenerating(false);
      setChoicesDisabled(false);

      if (isRetry) {
        setHistory((prev) => [
          ...prev,
          { type: "divider", key: `div_${Date.now()}` },
          {
            type: "scene",
            scene: {
              id: `error_${Date.now()}`,
              prose: [],
              dialogue: t.chat.connectionError,
              choices: [{ label: t.chat.retryBtn, next: currentSceneId, intimacyGain: 0 }],
              inputHint: t.chat.retryHint,
              isCustom: true,
            },
            key: `error_scene_${Date.now()}`,
          },
        ]);
      }
    }
  }, [currentSceneId, cozeSessionId, episodeProgress, triggerIntimacy, scrollToNewContent, isChatMode, povUnlocked, setHistory, t, char.name]);

  // 选项点击 → AI 生成（发送选项编号给 Coze Agent）
  const handleChoiceSelect = useCallback((choice) => {
    if (choicesDisabled) return;
    trackABClick("B", "click_choice", { label: choice.label });
    setShouldAutoScroll(false);
    // 亲密度评分：Coze 返回的选项自带 intimacyGain
    const gain = choice.intimacyGain || 0;
    if (gain !== 0) triggerIntimacy(gain);
    setHistory((prev) => [
        ...prev,
        { type: "choice_echo", text: choice.label, key: `echo_${Date.now()}`, isChatMode },
    ]);
    // 发送选项编号给 Coze（如 "1"、"2"、"3"），agent 按编号匹配
    const choiceText = typeof choice.index === 'number' ? String(choice.index + 1) : choice.label;
    generateScene(choiceText);
  }, [choicesDisabled, generateScene, isChatMode, triggerIntimacy]);

  // 自由输入 → AI 生成
  const handleCustomSend = useCallback(() => {
    const text = customText.trim();
    if (!text || choicesDisabled) return;
    trackABClick("B", "click_send_message", { text_length: text.length });
    //用户发送消息后，禁用自动滚动到底部
    setShouldAutoScroll(false);
    setCustomText("");
    setHistory((prev) => [
      ...prev,
      { type: "choice_echo", text, key: `echo_${Date.now()}`, isChatMode },
    ]);
    // 聊天模式下自动加前缀 "聊天模式-"，让 Coze Agent 识别模式
    const agentText = isChatMode ? `聊天模式-${text}` : text;
    generateScene(agentText);
  }, [customText, choicesDisabled, generateScene, isChatMode]);

  const progressPercent = (intimacy / char.intimacyMax) * 100;

  // 计算用户发送的消息数量（choice_echo 类型即为用户消息）
  const userMessageCount = history.filter(b => b.type === "choice_echo").length;
  const showVideoBtn = userMessageCount >= 1;

  // 点击「生成视频」按钮
  const handleGenerateVideo = useCallback(() => {
    const ep = episodeProgress || 1;
    localStorage.setItem("creative-messages", JSON.stringify(history));
    localStorage.setItem("creative-visual-metas", JSON.stringify(visualMetas));
    navigate(lp(`/video-create/${dramaId}/${ep}`));
  }, [history, visualMetas, dramaId, episodeProgress, navigate]);

  return (

    <div
      className="flex flex-col"
      style={{
        background: "#0D0D0D",
        maxWidth: "480px",
        margin: "0 auto",
        height: "100vh",
        position: "relative",
        overflow: "hidden",
      }}
    >
      <style>{STYLES}</style>

      {/* Ambient glow */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background:
            "radial-gradient(ellipse 80% 50% at 50% 0%, rgba(155,89,182,0.06) 0%, transparent 60%)",
          zIndex: 0,
        }}
      />

      {/* ── HEADER ── */}
      <div
        className="absolute top-0 left-0 right-0 z-30"
        style={{
          background: "linear-gradient(to bottom, rgba(13,13,13,0.8) 0%, rgba(13,13,13,0.4) 50%, transparent 100%)",
          paddingTop: "max(12px, env(safe-area-inset-top, 12px))",
          paddingBottom: "20px",
        }}
      >
        {/* ── UNIFIED HEADER ── */}
        <>
          <div className="flex items-center gap-3 px-4 py-2">
            {/* Back */}
            <button
              onClick={() => navigate(isEnglishDrama ? lp("/player/5") : lp("/full"))}
              className="w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0"
              style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.1)" }}
            >
              <ArrowLeft size={18} style={{ color: "rgba(245,240,235,0.8)" }} />
            </button>
            {/* Avatar */}
            <img src={char.image} alt={char.name} className="object-cover rounded-full flex-shrink-0" style={{ width: "42px", height: "42px", border: "1.5px solid rgba(232,168,124,0.5)" }} />
            {/* Name / Role */}
            <div className="flex-1 min-w-0">
              <p className="font-serif truncate" style={{ color: "#F5F0EB", fontSize: "15px", fontWeight: "600" }}>{char.name}</p>
              {char.role && <p className="font-sans truncate" style={{ color: "#E8A87C", fontSize: "11px" }}>{char.role}</p>}
            </div>
            {/* Episode selector */}
            <button onClick={() => setShowEpSelector(true)} className="px-3 py-1.5 rounded-full flex-shrink-0" style={{ background: "rgba(232,168,124,0.1)", border: "1px solid rgba(232,168,124,0.25)" }}>
              <span className="font-sans" style={{ color: "#E8A87C", fontSize: "11px", fontWeight: "600" }}>EP {episodeProgress}</span>
            </button>
            {/* Mode toggle */}
            <button
              onClick={() => setIsChatMode(!isChatMode)}
              className="w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0"
              style={{ background: isChatMode ? "rgba(232,168,124,0.18)" : "rgba(255,255,255,0.06)", border: `1px solid ${isChatMode ? "rgba(232,168,124,0.4)" : "rgba(255,255,255,0.1)"}` }}
              title={isChatMode ? t.chat.modeDialogue : t.chat.modeDrama}
            >
              {isChatMode ? <Sparkles size={16} style={{ color: "#E8A87C" }} /> : <MessageCircle size={16} style={{ color: "rgba(245,240,235,0.7)" }} />}
            </button>
            {/* Menu (⋮) */}
            <div className="relative flex-shrink-0">
              <button
                onClick={() => setShowMenu((v) => !v)}
                className="w-10 h-10 rounded-full flex items-center justify-center"
                style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.1)" }}
              ><MoreVertical size={16} style={{ color: "rgba(245,240,235,0.7)" }} />
              </button>
              {showMenu && (
                <div
                  className="absolute right-0 top-12 rounded-xl overflow-hidden z-50"
                  style={{ background: "rgba(22,12,30,0.97)", backdropFilter: "blur(16px)", border: "1px solid rgba(232,168,124,0.15)", boxShadow: "0 8px 32px rgba(0,0,0,0.6)", minWidth: "160px" }}
                >
                  {/* Restart */}
                  <button
                    onClick={handleRestart}
                    className="w-full text-left px-4 py-3 font-sans transition-colors"
                    style={{ color: "rgba(245,240,235,0.75)", fontSize: "13px", borderBottom: "1px solid rgba(255,255,255,0.05)" }}
                  >
                    {t.chat.menuRestart}
                  </button>
                  {/* Circle (ZH only) */}
                  {!isEnglishDrama && (
                    <button
                      onClick={() => { setShowMenu(false); setShowExclusiveDrawer(true); }}
                      className="w-full text-left px-4 py-3 font-sans transition-colors"
                      style={{ color: povUnlocked ? "#E8A87C" : "rgba(245,240,235,0.75)", fontSize: "13px", borderBottom: "1px solid rgba(255,255,255,0.05)", position: "relative" }}
                    >
                      {t.chat.circleBtn}
                      {povUnlocked && <span style={{ display: "inline-block", width: "6px", height: "6px", borderRadius: "50%", background: "#E8A87C", marginLeft: "6px", verticalAlign: "middle" }} />}
                    </button>
                  )}
                  {/* Report */}
                  <button
                    onClick={() => setShowMenu(false)}
                    className="w-full text-left px-4 py-3 font-sans transition-colors"
                    style={{ color: "rgba(229,57,53,0.8)", fontSize: "13px" }}
                  >
                    {t.chat.menuReport}
                  </button>
                </div>
              )}
            </div>
          </div>
          {/* Intimacy Bar */}
          <IntimacyBar value={intimacy} max={char.intimacyMax} gained={intimacyGain} />
        </>
      </div>

      {/* ── CHARACTER BACKGROUND (1/3screen) ── */}
      <div
        className="relative flex-shrink-0 overflow-hidden"
        style={{
          height: "33.333vh",
          animation: "bgImageFadeIn 1.2s ease both",
        }}
      >
        {/* Background Image -显示人物头部 */}
        <img
          src={char.image}
          alt={char.name}
          className="absolute inset-0 w-full h-full object-cover"
          style={{
            filter: "brightness(0.7) saturate(0.9)",
            objectPosition: "center 15%", // 显示图片上方15%位置，以头部为主maskImage: "linear-gradient(to bottom, rgba(0,0,0,1) 0%, rgba(0,0,0,1) 60%, rgba(0,0,0,0) 100%)",
            WebkitMaskImage: "linear-gradient(to bottom, rgba(0,0,0,1) 0%, rgba(0,0,0,1) 60%, rgba(0,0,0,0) 100%)",
          }}
        />
        {/* Gradient overlay for depth */}
        <div
          className="absolute inset-0"
          style={{
            background: "linear-gradient(to bottom, rgba(13,13,13,0.3) 0%, rgba(13,13,13,0.1) 50%, rgba(13,13,13,0.95) 100%)",
          }}
        />
        {/* Character name overlay */}
        <div
          className="absolute bottom-4 left-0 right-0 px-6"
          style={{
            animation: "storyFadeIn 0.8s ease 0.4s both",
          }}
        >
          <p
            className="font-serif"
            style={{
              color: "rgba(245,240,235,0.5)",
              fontSize: "12px",
              letterSpacing: "0.1em",
              marginBottom: "4px",
            }}
          >
            {t.chat.yourStory}
          </p><h2
            className="font-serif"
            style={{
              color: "#F5F0EB",
              fontSize: "24px",
              fontWeight: "600",
              textShadow: "0 2px 20px rgba(0,0,0,0.5)",
            }}
          >
            {char.name}
          </h2>
        </div>
      </div>

      {/* ── STORY SCROLL AREA ── */}
      <div
        ref={scrollRef}
        className="relative z-10 flex-1 overflow-y-auto scrollbar-hide"
        style={{
          paddingTop: "20px",
          paddingBottom: "16px",
          animation: "storyFadeIn 0.8s ease 0.6s both",
        }}
        onClick={() => showMenu && setShowMenu(false)}
      >
        {history.map((block, index) => {
          if (block.type === "divider") {
            // 只在最新的 divider（即新内容的起始位置）添加 ref
            const isLatestDivider = block.key?.includes("div_") &&
              !history.slice(index + 1).some(b => b.type === "divider");
            return (
              <div 
                key={block.key} 
                ref={isLatestDivider ? newContentRef : null}
              >
                <SceneDivider />
              </div>
            );
          }

          if (block.type === "choice_echo") {
            // 根据当前切换后的模式决定显示样式（用户选择时的模式）
            const isChatModeEcho = block.isChatMode || false;
            return isChatModeEcho 
              ? <UserChatBubble key={block.key} text={block.text} />
              : <ChoiceEcho key={block.key} text={block.text} />;
          }

          if (block.type === "scene") {
            const { scene } = block;
            const isLast = block.key === history[history.length - 1]?.key;
            const isFirstScene = block.key?.includes("init_");
            // 每个场景保持自己生成时的模式样式，不随当前模式切换而改变
            const isChatModeScene = scene.isChatMode || (!scene.prose?.length && scene.dialogue && !scene.choices?.length);

            // 对话后旁白（第一集专用）
            const proseAfterDialogue = scene.proseAfterDialogue || [];
            // 前置旁白显示完毕后才显示对话
            const proseReady = !isFirstScene || visibleParagraphs.length >= (scene.prose?.length || 0);
            // 对话后旁白的可见索引（从前置旁白长度开始计数）
            const proseAfterVisibleIndices = isFirstScene
              ? visibleParagraphs.filter(i => i >= (scene.prose?.length || 0)).map(i => i - (scene.prose?.length || 0))
              : proseAfterDialogue.map((_, i) => i);
            // 选项必须等proseAfterDialogue 全部显示完毕后才出现
            const totalProseCount = (scene.prose?.length || 0) + proseAfterDialogue.length;
            const choicesReady = !isFirstScene || visibleParagraphs.length >= totalProseCount;
            return (
              <div key={block.key}>
                {/* Prose paragraphs -剧情模式显示 */}
                {!isChatModeScene && (
                  <ProseBlock 
                    paragraphs={scene.prose} 
                    visibleIndices={isFirstScene ? visibleParagraphs : undefined}
                  />
                )}

                {/* Dialogue - 根据场景自身模式决定显示样式 */}
                {scene.dialogue && (isChatModeScene || proseReady) && (
                  <div style={{ marginTop: isChatModeScene ? "4px" : "20px", marginBottom: "8px" }}>
                    {isChatModeScene ? (
                      <CharacterChatBubble 
                        text={scene.dialogue} 
                        charName={char.name.split(" ")[0]} 
                        avatar={char.image} 
                      />
                    ) : (
                      <DialogueLine text={scene.dialogue} />
                    )}
                  </div>
                )}

                {/* 对话后旁白（第一集专用，在对话之后逐步显示） */}
                {!isChatModeScene && proseAfterDialogue.length > 0 && proseReady && (
                  <div style={{ marginTop: "16px" }}>
                    <ProseBlock
                      paragraphs={proseAfterDialogue}
                      visibleIndices={proseAfterVisibleIndices}
                    />
                  </div>
                )}

                {/* 输入控件 - 根据当前模式显示，避免重复 */}
                {isLast && !scene.isEnd && choicesReady && (
                  <>
                    {/* 剧情模式：显示选项面板（包含输入框） */}
                    {!isChatMode && scene.choices.length > 0 && (
                      <div style={{ marginTop: "16px" }}>
                        <ChoicePanel
                          choices={scene.choices}
                          onSelect={handleChoiceSelect}
                          disabled={choicesDisabled}
                          customText={customText}
                          onCustomChange={setCustomText}
                          onCustomSend={handleCustomSend}
                          inputHint={scene.inputHint}
                          t={t}
                        />
                      </div>
                    )}
                    {/* 剧情模式但无选项：只显示输入框 */}
                    {!isChatMode && scene.choices.length === 0 && (
                      <div style={{ marginTop: "16px", padding: "0 20px" }}>
                        <CustomInputBox
                          customText={customText}
                          onCustomChange={setCustomText}
                          onCustomSend={handleCustomSend}
                          disabled={choicesDisabled}
                          inputHint={scene.inputHint}
                          variant="default"
                        />
                      </div>
                    )}
                    {/* 对话模式：显示聊天输入框 */}
                    {isChatMode && (
                      <div style={{ marginTop: "16px" }}>
                        <ChatInputPanel
                          customText={customText}
                          onCustomChange={setCustomText}
                          onCustomSend={handleCustomSend}
                          disabled={choicesDisabled}
                          inputHint={scene.inputHint}
                        />
                      </div>
                    )}
                  </>
                )}

                {/* End card */}
                {scene.isEnd && (
                  <div
                    style={{
                      margin: "32px 24px 16px",
                      padding: "20px",
                      borderRadius: "16px",
                      background: "rgba(232,168,124,0.06)",
                      border: "1px solid rgba(232,168,124,0.2)",
                      textAlign: "center",
                      animation: "fadeIn 0.6s ease both",
                    }}
                  >
                    <p
                      className="font-serif"
                      style={{ color: "#E8A87C", fontSize: "15px", marginBottom: "8px" }}
                    >
                      {isEnglishDrama ? (t.englishChat?.episodeComplete || "Episode Complete") : t.chat.chapterComplete}
                    </p>
                    <p
                      className="font-sans"
                      style={{ color: "rgba(245,240,235,0.4)", fontSize: "12px", marginBottom: "16px" }}
                    >
                      {isEnglishDrama ? (t.englishChat?.shapedStory || "Your choices have shaped this story.") : t.chat.chapterCompleteSubtitle}
                    </p>
                    <button
                      onClick={() => navigate(isEnglishDrama ? lp("/player/5") : lp("/full"))}
                      style={{
                        padding: "10px 24px",
                        borderRadius: "999px",
                        background: "linear-gradient(135deg, #E8A87C, #C8906A)",
                        border: "none",
                        cursor: "pointer",
                        color: "#1A0E08",
                        fontSize: "13px",
                        fontFamily: "sans-serif",
                        fontWeight: "600",
                      }}
                    >
                      {isEnglishDrama ? (t.englishChat?.returnDrama || "Return to Drama") : t.chat.backToEpisode}
                    </button>
                  </div>
                )}
              </div>
            );
          }

          return null;
        })}

        {/* AI generating indicator */}
        {isGenerating && (
          <div
            style={{
              padding: "16px 24px",
              display: "flex",
              alignItems: "center",
              gap: "10px",
              animation: "fadeIn 0.3s ease both",
            }}
          >
            <Loader
              size={14}
              style={{ color: "rgba(232,168,124,0.6)", animation: "spin 1s linear infinite" }}
            />
            <span
              className="font-sans"
              style={{ color: "rgba(232,168,124,0.5)", fontSize: "13px" }}
            >
              {t.chat.writingStory}
            </span>
          </div>
        )}<div ref={bottomRef} style={{ height: "8px" }} />
      </div>

      {/* 生成视频浮动按钮已移除 */}

      {/* Intimacy toast */}
      {showIntimacyToast && <IntimacyToast gain={intimacyGain} t={t} />}

      {/* 等级解锁动画 */}
      {showLevelUnlockAnimation && (
        <LevelUnlockAnimation
          level={3}
          t={t}
          onComplete={() => {
            setShowLevelUnlockAnimation(false);
            setShowUnlockModal(true);
          }}
        />
      )}

      {/* POV Unlock Modal */}
{showUnlockModal && (
<UnlockModal
onClose={() => setShowUnlockModal(false)}
onEnter={() => { setShowUnlockModal(false); navigate(lp("/interactive-player")); }}
t={t}
/>
      )}

      {/* ── EN Episode Selector Overlay ── */}
      {showEpSelector && (
        <>
          <div className="absolute inset-0 z-40" style={{ background: "rgba(0,0,0,0.6)" }} onClick={() => setShowEpSelector(false)} />
          <div className="absolute inset-x-0 bottom-0 z-50 rounded-t-3xl px-5 pt-4 pb-10" style={{ background: "rgba(16,8,24,0.97)", backdropFilter: "blur(28px)", border: "1px solid rgba(232,168,124,0.15)", borderBottom: "none", maxHeight: "60vh", overflowY: "auto" }}>
            <div className="mx-auto mb-4 rounded-full" style={{ width: "36px", height: "4px", background: "rgba(232,168,124,0.3)" }} />
            <h3 className="font-serif text-center mb-5" style={{ color: "#F5F0EB", fontSize: "16px", fontWeight: "600" }}>Episodes</h3>
            <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
              {Object.entries(EPISODE_SUMMARIES).map(([ep, summary]) => {
                const epNum = parseInt(ep);
                const isActive = epNum === episodeProgress;
                return (
                  <button key={ep} onClick={() => handleEpSelect(epNum)} style={{ padding: "14px 16px", borderRadius: "14px", textAlign: "left", background: isActive ? "rgba(232,168,124,0.12)" : "rgba(255,255,255,0.04)", border: isActive ? "1px solid rgba(232,168,124,0.4)" : "1px solid rgba(255,255,255,0.07)", cursor: "pointer" }}>
                    <p className="font-sans" style={{ color: isActive ? "#E8A87C" : "rgba(245,240,235,0.8)", fontSize: "12px", fontWeight: "600", marginBottom: "4px" }}>{(t.englishChat?.episodeLabel || "Episode {n}").replace("{n}", ep)}</p>
                    <p className="font-sans" style={{ color: "rgba(245,240,235,0.45)", fontSize: "11px", lineHeight: "1.5" }}>{summary.slice(0, 60)}…</p>
                  </button>
                );
              })}
            </div>
          </div>
        </>
      )}

      {/* ── Reset Confirm Modal ── */}
      {showResetConfirm && (
        <>
          <div className="absolute inset-0 z-40" style={{ background: "rgba(0,0,0,0.6)" }} onClick={() => setShowResetConfirm(false)} />
          <div className="absolute z-50" style={{ top: "50%", left: "50%", transform: "translate(-50%, -50%)", background: "rgba(16,8,24,0.97)", backdropFilter: "blur(28px)", border: "1px solid rgba(232,168,124,0.15)", borderRadius: "20px", padding: "28px 24px", minWidth: "280px", textAlign: "center" }}>
            <h3 className="font-serif" style={{ color: "#F5F0EB", fontSize: "16px", fontWeight: "600", marginBottom: "12px" }}>
              {t.chatReset.title}
            </h3>
            <p className="font-sans" style={{ color: "rgba(245,240,235,0.6)", fontSize: "13px", lineHeight: "1.6", marginBottom: "24px" }}>
              {t.chatReset.confirm}
            </p>
            <div style={{ display: "flex", gap: "12px" }}>
              <button onClick={() => setShowResetConfirm(false)} className="flex-1 py-2.5 rounded-xl font-sans" style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.1)", color: "rgba(245,240,235,0.7)", fontSize: "13px" }}>
                {t.chatReset.cancel}
              </button>
              <button onClick={confirmReset} className="flex-1 py-2.5 rounded-xl font-sans" style={{ background: "rgba(220,80,80,0.2)", border: "1px solid rgba(220,80,80,0.4)", color: "rgba(255,120,120,0.9)", fontSize: "13px", fontWeight: "600" }}>
                {t.chatReset.confirmBtn}
              </button>
            </div>
          </div>
        </>
      )}

      {/* ── 圈子抽屉 ── */}
      {showExclusiveDrawer && (
        <div
          style={{
            position: "absolute",
            inset: 0,
            zIndex: 200,
            display: "flex",
            flexDirection: "column",
            justifyContent: "flex-end",
          }}
          onClick={() => setShowExclusiveDrawer(false)}
        >
          {/* 半透明遮罩 */}
          <div style={{
            position: "absolute", inset: 0,
            background: "rgba(0,0,0,0.7)",
            backdropFilter: "blur(4px)",
          }} />

          {/* 抽屉主体 */}
          <div
            style={{
              position: "relative",
              background: "linear-gradient(180deg, rgba(18,8,28,0.98) 0%, rgba(10,5,18,0.99) 100%)",
              borderRadius: "20px 20px 0 0",
              border: "1px solid rgba(232,168,124,0.15)",
              borderBottom: "none",
              maxHeight: "85vh",
              display: "flex",
              flexDirection: "column",
              animation: "slideUpDrawer 0.32s cubic-bezier(0.32,0.72,0,1) both",
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* 顶部拖拽条 */}
            <div style={{ display: "flex", justifyContent: "center", padding: "12px 0 4px", flexShrink: 0 }}>
              <div style={{ width: "36px", height: "4px", borderRadius: "2px", background: "rgba(255,255,255,0.15)" }} />
            </div>

            {/* 标题栏 */}
            <div style={{
              display: "flex", alignItems: "center", justifyContent: "space-between",
              padding: "6px 20px 12px", flexShrink: 0,}}>
              <h3 style={{ color: "#F5F0EB", fontSize: "17px", fontWeight: "700", fontFamily: "serif", letterSpacing: "0.02em" }}>
                {t.chat.circleTitle}
              </h3>
              <button
                onClick={() => setShowExclusiveDrawer(false)}
                style={{
                  width: "28px", height: "28px", borderRadius: "50%",
                  background: "rgba(255,255,255,0.06)",
                  border: "1px solid rgba(255,255,255,0.1)",
                  cursor: "pointer", display: "flex", alignItems: "center",
                  justifyContent: "center", color: "rgba(255,255,255,0.45)", fontSize: "14px",
                }}
              >✕</button>
            </div>

            {/* 可滚动内容区 */}
            <div style={{ flex: 1, overflowY: "auto", padding: "0 16px", paddingBottom: "80px" }}>

              {/* ── UGC 帖子：微博风格 ── */}
              <div style={{
                borderRadius: "14px", overflow: "hidden",
                background: "rgba(255,255,255,0.03)",
                border: "1px solid rgba(255,255,255,0.07)",
                marginBottom: "12px", padding: "14px",
              }}>
                {/* 用户信息行 */}
                <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "10px" }}>
                  <img
                    src="https://nocode.meituan.com/photo/search?keyword=girl,avatar&width=40&height=40"
                    alt="avatar"
                    style={{ width: "36px", height: "36px", borderRadius: "50%", objectFit: "cover", border: "1.5px solid rgba(232,168,124,0.3)" }}
                  />
                  <div>
                    <p style={{ color: "#F5F0EB", fontSize: "13px", fontWeight: "600", marginBottom: "1px" }}>{t.chat.post1Username}</p>
                    <p style={{ color: "rgba(255,255,255,0.3)", fontSize: "11px" }}>{t.chat.justNow}</p>
                  </div>
                  <div style={{
                    marginLeft: "auto", padding: "3px 10px", borderRadius: "20px",
                    background: "rgba(232,168,124,0.1)", border: "1px solid rgba(232,168,124,0.2)",
                    color: "#E8A87C", fontSize: "11px", cursor: "pointer",
                  }}>{t.chat.followBtn}</div>
                </div>

                {/* 正文 */}
                <p style={{
                  color: "rgba(245,240,235,0.85)", fontSize: "14px",
                  lineHeight: "1.7", marginBottom: "12px",
                }}>
                  {t.chat.post1Content}
                </p>

                {/* 专属剧情入口卡片 */}
                <div
                  style={{
                    borderRadius: "12px", overflow: "hidden",
                    background: "linear-gradient(135deg, rgba(155,89,182,0.3) 0%, rgba(100,55,150,0.35) 100%)",
                    border: "1px solid rgba(232,168,124,0.2)",
                    cursor: "pointer",}}
                  onClick={() => { setShowExclusiveDrawer(false); navigate(lp("/interactive-player")); }}
                >
                  <div style={{ position: "relative", height: "100px", overflow: "hidden" }}>
                    <img
                      src="https://s3plus.meituan.net/mcopilot-pub/nocode-task/chenyanbo/ujnj6kjw27ro1feytk76v2lr4ztv2r/ep1_60s.jpg"
                      alt="专属剧情"
                      style={{ width: "100%", height: "100%", objectFit: "cover", filter: "brightness(0.5)", objectPosition: "center 20%" }}
                    />
                <div style={{
                      position: "absolute", inset: 0,
                      background: "linear-gradient(to right, rgba(0,0,0,0.6) 0%, transparent 60%)",
                    }} />
                    <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", padding: "0 14px", gap: "10px" }}>
                      <div style={{
                        width: "36px", height: "36px", borderRadius: "50%",
                        background: "rgba(232,168,124,0.9)",
                        display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
                      }}>
                        <Play size={14} fill="#1A0E08" style={{ color: "#1A0E08", marginLeft: "2px" }} />
                      </div>
                      <div>
                        <p style={{ color: "#F5F0EB", fontSize: "13px", fontWeight: "600", marginBottom: "2px" }}>{t.chat.exclusiveTitle}</p>
                        <p style={{ color: "rgba(245,240,235,0.5)", fontSize: "11px" }}>{t.chat.exclusiveHint}</p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* 互动栏 */}
                <div style={{ display: "flex", gap: "16px", marginTop: "12px" }}>
                  {[[Heart, "218"], [MessageCircle, "34"], [Share2, t.chat.forwardBtn]].map(([Icon, label], i) => (
                    <button key={i} style={{
                      display: "flex", alignItems: "center", gap: "4px",
                      background: "none", border: "none", cursor: "pointer",
                      color: "rgba(255,255,255,0.35)", fontSize: "12px",}}>
                      <Icon size={14} />
                      {label}
                    </button>
                  ))}
                </div>
              </div>

              {/*── 第二条 UGC 帖子：温泉危机互动影游入口 ── */}
              <div style={{
                borderRadius: "14px",
                background: "rgba(255,255,255,0.03)",
                border: "1px solid rgba(255,255,255,0.07)",
                marginBottom: "12px", padding: "14px",
              }}>
                {/* 用户信息行 */}
                <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "10px" }}>
                  <img
                    src="https://nocode.meituan.com/photo/search?keyword=woman,portrait&width=40&height=40"
                    alt="avatar2"
                    style={{ width: "36px", height: "36px", borderRadius: "50%", objectFit: "cover", border: "1.5px solid rgba(232,168,124,0.35)" }}
                  />
                  <div>
                    <p style={{ color: "#F5F0EB", fontSize: "13px", fontWeight: "600", marginBottom: "1px" }}>{t.chat.post2Username}</p>
                    <p style={{ color: "rgba(255,255,255,0.3)", fontSize: "11px" }}>{t.chat.justNow}</p>
                  </div>
                  <div style={{
                    marginLeft: "auto", padding: "2px 10px", borderRadius: "20px",
                    background: "rgba(232,168,124,0.15)", border: "1px solid rgba(232,168,124,0.25)",
                    color: "#E8A87C", fontSize: "10px", letterSpacing: "0.5px",
                  }}>
                    {t.chat.interactiveTag}
                  </div>
                </div>
                <p style={{ color: "rgba(245,240,235,0.8)", fontSize: "14px", lineHeight: "1.7", marginBottom: "10px" }}>
                  {t.chat.post2Content}
                </p>
                {/* 封面入口卡片 */}
                <div
                  onClick={() => { setShowExclusiveDrawer(false); navigate(lp("/hotspring")); }}
                  style={{
                    borderRadius: "12px", overflow: "hidden",
                    cursor: "pointer", position: "relative",
                  }}
                >
                  <img
                    src="https://s.coze.cn/image/8HM4YhUq6Ug/"
                    alt="温泉危机"
                    style={{ width: "100%", height: "160px", objectFit: "cover", display: "block" }}
                  />
                  {/* 渐变遮罩 */}
                  <div style={{
                    position: "absolute", inset: 0,
                    background: "linear-gradient(to top, rgba(0,0,0,0.8) 0%, rgba(0,0,0,0.2) 50%, transparent 100%)",
                  }} />
                  {/* 标题 + 按钮 */}
                  <div style={{
                    position: "absolute", bottom: 0, left: 0, right: 0,
                    padding: "12px 14px",
                    display: "flex", alignItems: "flex-end", justifyContent: "space-between",}}>
                    <div>
                      <p style={{ color: "#F5F0EB", fontSize: "15px", fontWeight: "700", fontFamily: "serif", marginBottom: "2px" }}>{t.chat.hotspringTitle}</p>
                      <p style={{ color: "rgba(255,255,255,0.5)", fontSize: "11px" }}>{t.chat.hotspringBranches}</p>
                    </div>
                    <div style={{
                      padding: "7px 14px", borderRadius: "20px",
                      background: "linear-gradient(135deg, #E8A87C, #C2185B)",
                      color: "#fff", fontSize: "12px", fontWeight: "600",
                      boxShadow: "0 2px 10px rgba(232,168,124,0.4)",
                    }}>
                      {t.chat.hotspringStart}
                    </div>
                  </div>
                </div>
                {/* 底部互动栏 */}
                <div style={{ display: "flex", gap: "16px", marginTop: "12px" }}>
                  {[[Heart, "231"], [MessageCircle, "38"], [Share2, t.chat.shareBtn]].map(([Icon, label], i) => (
                    <button key={i} style={{
                      display: "flex", alignItems: "center", gap: "4px",
                      background: "none", border: "none", cursor: "pointer",
                      color: "rgba(255,255,255,0.35)", fontSize: "12px",
                    }}>
                      <Icon size={14} />
                      {label}
                    </button>
                  ))}
                </div>
              </div>

            </div>

            {/* ── 底部固定：+ 发布按钮 ── */}
            <div style={{
              position: "absolute", bottom: "calc(env(safe-area-inset-bottom, 0px) + 20px)",
              right: "20px",}}>
              <button
                onClick={() => { setShowExclusiveDrawer(false); navigate(lp("/recreation-create")); }}
                style={{
                  width: "52px", height: "52px", borderRadius: "50%", border: "none",
                  background: "linear-gradient(135deg, #E8A87C, #C2185B)",
                  boxShadow: "0 4px 20px rgba(232,168,124,0.45)",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  cursor: "pointer",
                }}
              >
                <Plus size={24} style={{ color: "#fff" }} />
              </button>
            </div></div>
        </div>
      )}<style>{`
        @keyframes slideUpDrawer {
          from { transform: translateY(100%); opacity: 0; }
          to   { transform: translateY(0);opacity: 1; }
        }`}</style>
    </div>
  );
};

export default Chat;
