import { useState, useRef, useCallback, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useABVersion, trackABClick } from "@/hooks/useABVersion";
import { useLocale } from "@/i18n";
import {
  ArrowLeft,
  Play,
  Pause,
  Heart,
  MessageCircle,
  Share2,
  Phone,
  PhoneOff,
  PhoneCall,
  Mic,
  Sparkles,
  X,
  List,
} from "lucide-react";

import ChatEntryModal from "@/components/ChatEntryModal.jsx";

// ─── Keyframes ─────────────────────────────────────────────────────────────────
const KEYFRAMES = `
  @keyframes phonePulse {
    0%,100% { transform: scale(1) rotate(-10deg); }
    25%     { transform: scale(1.08) rotate(10deg); }
    50%     { transform: scale(1) rotate(-8deg); }
    75%     { transform: scale(1.05) rotate(8deg); }
  }
  @keyframes ringGlow {
    0%,100% { box-shadow: 0 0 0 0 rgba(155,89,182,0.7); }
    50%     { box-shadow: 0 0 0 18px rgba(155,89,182,0); }
  }
  @keyframes slideUpPanel {
    from { transform: translateY(100%); }
    to   { transform: translateY(0); }
  }
  @keyframes slideDownPanel {
    from { transform: translateY(0); }
    to   { transform: translateY(100%); }
  }
  @keyframes fadeInDown {
    from { transform: translateY(-24px); opacity: 0; }
    to   { transform: translateY(0);     opacity: 1; }
  }
  @keyframes toastFade {
    0%   { opacity: 0; transform: translateY(-14px); }
    12%  { opacity: 1; transform: translateY(0); }
    75%  { opacity: 1; transform: translateY(0); }
    100% { opacity: 0; transform: translateY(-14px); }
  }
  @keyframes pulseRing {
    0%   { transform: scale(1);   opacity: 0.75; }
    100% { transform: scale(2.4); opacity: 0; }
  }
  @keyframes slideUpPost {
    from { transform: translateY(100%); opacity: 0; }
    to   { transform: translateY(0);    opacity: 1; }
  }
  @keyframes wave {
    from { transform: scaleY(0.35); }
    to   { transform: scaleY(1); }
  }
  @keyframes swipeExitUp {
    from { transform: translateY(0); }
    to   { transform: translateY(-110%); }
  }
  @keyframes swipeExitDown {
    from { transform: translateY(0); }
    to   { transform: translateY(110%); }
  }
  @keyframes swipeEnterFromBottom {
    from { transform: translateY(110%); }
    to   { transform: translateY(0); }
  }
  @keyframes swipeEnterFromTop {
    from { transform: translateY(-110%); }
    to   { transform: translateY(0); }
  }
  @keyframes epBarBounce0 {
    from { transform: scaleY(0.4); }
    to   { transform: scaleY(1); }
  }
  @keyframes epBarBounce1 {
    from { transform: scaleY(1); }
    to   { transform: scaleY(0.4); }
  }
  @keyframes epBarBounce2 {
    from { transform: scaleY(0.6); }
    to   { transform: scaleY(1); }
  }
  @keyframes playBtnFadeIn {
    from { opacity: 0; transform: scale(0.8); }
    to   { opacity: 1; transform: scale(1); }
  }
  @keyframes playBtnFadeOut {
    from { opacity: 1; transform: scale(1); }
    to   { opacity: 0; transform: scale(0.8); }
  }
  @keyframes obFadeIn {
    from { opacity: 0; }
    to   { opacity: 1; }
  }
  @keyframes obAvatarShrink {
    0%   { width: 60vw; height: 60vw; top: 50%; left: 50%; transform: translate(-50%, -50%); border-radius: 50%; }
    100% { width: 56px;  height: 56px;  top: 52px; left: 20px; transform: translate(0, 0); border-radius: 50%; }
  }
  @keyframes obCardSlideUp {
    from { opacity: 0; transform: translateY(32px); }
    to   { opacity: 1; transform: translateY(0); }
  }
  @keyframes obBtnPop {
    from { opacity: 0; transform: scale(0.88); }
    to   { opacity: 1; transform: scale(1); }
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
  @keyframes introCursorBlink {
    0%, 100% { opacity: 1; }
    50%       { opacity: 0; }
  }
`;

// ─── Waveform ──────────────────────────────────────────────────────────────────

const Waveform = ({ playing }) => {
  const bars = [3, 6, 9, 7, 4, 8, 5, 10, 6, 3, 7, 9, 4, 6, 8];
  return (
    <div className="flex items-center gap-0.5" style={{ height: "22px" }}>
      {bars.map((h, i) => (
        <div
          key={i}
          className="rounded-full"
          style={{
            width: "2px",
            height: playing ? `${h * 2}px` : "4px",
            background: "linear-gradient(180deg, #E8A87C, #9B59B6)",
            animation: playing ? `wave ${0.4 + i * 0.07}s ease-in-out infinite alternate` : "none",
            transition: "height 0.3s ease",
          }}
        />
      ))}
    </div>
  );
};

// ─── Incoming Call Overlay ─────────────────────────────────────────────────────

const IncomingCallOverlay = ({ caller, onAccept, onDecline, t }) => {
  // Vibration + ringtone on mount
  useEffect(() => {
    if (navigator.vibrate) {
      const pattern = [400, 200, 400, 200, 400, 200, 400, 200, 400];
      navigator.vibrate(pattern);
    }
    const audio = new Audio(
      "https://s3plus.meituan.net/mcopilot-pub/afterline-task/chenyanbo/zmmsqqlhctcgy35orqmrgi6rams2o2/Opening.m4a"
    );
    audio.loop = true;
    audio.volume = 0.85;
    audio.play().catch(() => {});
    return () => {
      if (navigator.vibrate) navigator.vibrate(0);
      audio.pause();
      audio.src = "";
    };
  }, []);

  return (
    <div
      className="absolute inset-0 z-50 flex flex-col"
      style={{
        background: "linear-gradient(180deg, #1a1a2e 0%, #0d0d1a 40%, #0d0d0d 100%)",
        animation: "fadeInDown 0.35s ease",
      }}
    >
      {/* Top: INCOMING CALL label */}
      <div className="flex flex-col items-center pt-16 pb-4">
        <p
          className="font-sans uppercase tracking-widest mb-2"
          style={{ color: "rgba(245,240,235,0.45)", fontSize: "11px", letterSpacing: "0.2em" }}
        >
          {t.player.incomingCall}
        </p>
        <h2 className="font-serif" style={{ color: "#F5F0EB", fontSize: "28px", fontWeight: "700", letterSpacing: "-0.3px" }}>
          {caller.name}
        </h2>
        <p className="font-sans mt-1" style={{ color: "rgba(232,168,124,0.65)", fontSize: "13px" }}>
          {caller.role}
        </p>
      </div>

      {/* Center: Avatar with pulse rings */}
      <div className="flex-1 flex items-center justify-center">
        <div className="relative flex items-center justify-center" style={{ width: "200px", height: "200px" }}>
          {[0, 1, 2].map((i) => (
            <div
              key={i}
              className="absolute rounded-full"
              style={{
                width: "200px", height: "200px",
                border: "1.5px solid rgba(232,168,124,0.25)",
                animation: `pulseRing 2.4s ease-out ${i * 0.7}s infinite`,
              }}
            />
          ))}
          <div
            className="rounded-full overflow-hidden"
            style={{
              width: "170px",
              height: "170px",
              border: "3px solid rgba(232,168,124,0.5)",
              boxShadow: "0 0 40px rgba(232,168,124,0.2), 0 0 80px rgba(155,89,182,0.15)",
            }}
          >
            <img
              src={caller.image}
              alt={caller.name}
              className="mx-auto object-cover w-full h-full"
            />
          </div>
          <div
            className="absolute bottom-2 right-2 w-10 h-10 rounded-full flex items-center justify-center"
            style={{
              background: "rgba(13,13,13,0.7)",
              backdropFilter: "blur(8px)",
              animation: "phonePulse 0.7s ease-in-out infinite",
            }}
          >
            <PhoneCall size={18} style={{ color: "#E8A87C" }} />
          </div>
        </div>
      </div>

      {/* Bottom: Buttons + hint text */}
      <div className="flex flex-col items-center pb-14">
        <div className="flex items-end justify-between w-full px-16 mb-8">
          <div className="flex flex-col items-center gap-3">
            <button
              onClick={onDecline}
              className="w-16 h-16 rounded-full flex items-center justify-center active:scale-90 transition-transform"
              style={{
                background: "linear-gradient(135deg, #E53935, #C62828)",
                boxShadow: "0 6px 24px rgba(229,57,53,0.45)",
              }}
            >
              <PhoneOff size={26} style={{ color: "#fff" }} />
            </button>
            <span className="font-sans" style={{ color: "rgba(245,240,235,0.55)", fontSize: "13px" }}>{t.player.decline}</span>
          </div>

          <div className="flex flex-col items-center gap-3">
            <button
              onClick={onAccept}
              className="w-16 h-16 rounded-full flex items-center justify-center active:scale-90 transition-transform"
              style={{
                background: "linear-gradient(135deg, #43A047, #2E7D32)",
                boxShadow: "0 6px 24px rgba(67,160,71,0.45)",
                animation: "ringGlow 1.6s ease-in-out infinite",
              }}
            >
              <Phone size={26} style={{ color: "#fff" }} />
            </button>
            <span className="font-sans" style={{ color: "rgba(245,240,235,0.55)", fontSize: "13px" }}>{t.player.accept}</span>
          </div>
        </div>

        <p
          className="font-sans text-center px-8"
          style={{ color: "rgba(245,240,235,0.35)", fontSize: "13px", lineHeight: "1.5" }}
        >
          {t.player.callHint.replace("{name}", caller.name)}
        </p>
      </div>
    </div>
  );
};

// ─── Post-Video Panel ──────────────────────────────────────────────────────────

const PostVideoPanel = ({ caller, onContinue, t }) => {
  const [voicePlaying, setVoicePlaying] = useState(false);
  return (
    <div
      className="absolute inset-x-0 bottom-0 z-40 rounded-t-3xl px-5 pt-5 pb-10"
      style={{
        background: "rgba(16,8,22,0.97)",
        backdropFilter: "blur(24px)",
        WebkitBackdropFilter: "blur(24px)",
        border: "1px solid rgba(232,168,124,0.15)",
        borderBottom: "none",
        boxShadow: "0 -20px 60px rgba(155,89,182,0.22)",
        animation: "slideUpPost 0.5s cubic-bezier(0.34,1.56,0.64,1)",
      }}
    >
      <div className="mx-auto mb-4 rounded-full" style={{ width: "36px", height: "4px", background: "rgba(232,168,124,0.3)" }} />

      <div className="flex items-center gap-3 mb-4 p-3 rounded-2xl" style={{ background: "rgba(229,57,53,0.08)", border: "1px solid rgba(229,57,53,0.2)" }}>
        <div className="relative">
          <img src={caller.image} alt={caller.name} className="mx-auto object-cover rounded-full" style={{ width: "40px", height: "40px", border: "1.5px solid rgba(229,57,53,0.5)" }} />
          <div className="absolute -top-1 -right-1 w-5 h-5 rounded-full flex items-center justify-center" style={{ background: "#E53935", fontSize: "10px", color: "#fff", fontWeight: "700" }}>3</div>
        </div>
        <div className="flex-1">
          <p className="font-sans" style={{ color: "#F5F0EB", fontSize: "13px", fontWeight: "500" }}>{caller.name}</p>
          <p className="font-sans" style={{ color: "rgba(229,57,53,0.8)", fontSize: "11px" }}>{t.player.missedCallCount}</p>
        </div>
        <PhoneCall size={16} style={{ color: "rgba(229,57,53,0.6)" }} />
      </div>

      <div className="flex items-center gap-3 mb-3 p-3 rounded-2xl" style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(232,168,124,0.12)" }}>
        <img src={caller.image} alt={caller.name} className="mx-auto object-cover rounded-full flex-shrink-0" style={{ width: "36px", height: "36px", border: "1.5px solid rgba(232,168,124,0.3)" }} />
        <div className="flex-1">
          <p className="font-sans mb-1" style={{ color: "rgba(245,240,235,0.5)", fontSize: "10px" }}>{t.player.newVoice}</p>
          <div className="flex items-center gap-2">
            <button onClick={() => setVoicePlaying(v => !v)} className="w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0" style={{ background: "rgba(232,168,124,0.2)", border: "1px solid rgba(232,168,124,0.4)" }}>
              {voicePlaying
                ? <Pause size={10} fill="#E8A87C" style={{ color: "#E8A87C" }} />
                : <Play  size={10} fill="#E8A87C" style={{ color: "#E8A87C", marginLeft: "1px" }} />}
            </button>
            <Waveform playing={voicePlaying} />
            <span className="font-sans flex-shrink-0" style={{ color: "rgba(245,240,235,0.4)", fontSize: "10px" }}>0:12</span>
          </div>
        </div>
        <Mic size={14} style={{ color: "rgba(232,168,124,0.5)" }} />
      </div>

      <div className="mb-5 p-3 rounded-2xl" style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(155,89,182,0.15)" }}>
        <div className="flex items-center gap-2 mb-2">
          <img src={caller.image} alt={caller.name} className="mx-auto object-cover rounded-full flex-shrink-0" style={{ width: "24px", height: "24px" }} />
          <span className="font-sans" style={{ color: "#E8A87C", fontSize: "11px", fontWeight: "500" }}>{caller.name}</span>
          <span className="font-sans ml-auto" style={{ color: "rgba(245,240,235,0.3)", fontSize: "10px" }}>just now</span>
        </div>
        <p className="font-sans italic" style={{ color: "rgba(245,240,235,0.65)", fontSize: "13px", lineHeight: "1.5" }}>
          {t.player.voiceMessage}
        </p>
      </div>

      <button
        onClick={onContinue}
        className="w-full py-4 rounded-2xl font-sans font-semibold active:scale-98"
        style={{
          background: "linear-gradient(135deg,#E8A87C 0%,#C8906A 50%,#9B59B6 100%)",
          color: "#0D0D0D", fontSize: "15px", letterSpacing: "0.02em",
          boxShadow: "0 8px 32px rgba(232,168,124,0.4), 0 0 60px rgba(155,89,182,0.2)",
        }}
      >
        {t.player.continueStory}
      </button>
    </div>
  );
};

// ─── Missed Call Toast ─────────────────────────────────────────────────────────

const MissedCallToast = ({ name, t }) => (
  <div
    className="absolute top-16 left-4 right-4 z-50 flex items-center gap-3 px-4 py-3 rounded-2xl"
    style={{
      background: "rgba(28,12,38,0.96)",
      backdropFilter: "blur(16px)",
      WebkitBackdropFilter: "blur(16px)",
      border: "1px solid rgba(229,57,53,0.3)",
      boxShadow: "0 4px 24px rgba(229,57,53,0.2)",
      animation: "toastFade 3s ease forwards",
    }}
  >
    <div className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0" style={{ background: "rgba(229,57,53,0.2)", border: "1px solid rgba(229,57,53,0.4)" }}>
      <PhoneOff size={14} style={{ color: "#E53935" }} />
    </div>
    <p className="font-sans" style={{ color: "#F5F0EB", fontSize: "13px" }}>
      <span style={{ color: "rgba(245,240,235,0.6)" }}>{t.player.missedCall}</span>
      <span style={{ color: "#E8A87C", fontWeight: "500" }}>{name}</span>
    </p>
  </div>
);

// ─── Character Onboarding Overlay (Interactive Story Guide) ───────────────────

const CharacterOnboarding = ({ char, dramaId, onConfirm, t, storyFeatures }) => {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setVisible(true), 80);
    return () => clearTimeout(timer);
  }, []);

  return (
    <div
      className="absolute inset-0 z-40 flex flex-col"
      style={{
        background: "linear-gradient(180deg, #0A0412 0%, #0D0D0D 100%)",
        animation: "obFadeIn 0.35s ease forwards",
        overflowY: "auto",
      }}
    >
      {/* ── Top ambient glow ── */}
      <div
        className="absolute inset-x-0 top-0 pointer-events-none"
        style={{
          height: "55%",
          background:
            "radial-gradient(ellipse 90% 60% at 50% 0%, rgba(194,24,91,0.18) 0%, rgba(155,89,182,0.10) 40%, transparent 70%)",
        }}
      />

      {/* ── Hero: full-bleed character image ── */}
      <div
        style={{
          position: "relative",
          width: "100%",
          height: "52vw",
          maxHeight: "260px",
          flexShrink: 0,
          overflow: "hidden",
        }}
      >
        <img
          src={char.image}
          alt=""
          className="object-cover"
          style={{
            position: "absolute",
            inset: 0,
            width: "100%",
            height: "100%",
            filter: "blur(18px) brightness(0.45) saturate(1.2)",
            transform: "scale(1.12)",
          }}
        />

        {/* Centered avatar */}
        <div
          className="absolute"
          style={{
            top: "50%",
            left: "50%",
            transform: "translate(-50%, -50%)",
            opacity: visible ? 1 : 0,
            transition: "opacity 0.5s ease 0.1s",
          }}
        >
          <div
            style={{
              position: "absolute",
              inset: "-18px",
              borderRadius: "50%",
              border: "1px solid rgba(232,168,124,0.15)",
              animation: "pulseRing 2.8s ease-out infinite",
            }}
          />
          <div
            style={{
              position: "absolute",
              inset: "-8px",
              borderRadius: "50%",
              border: "1.5px solid rgba(232,168,124,0.25)",
              animation: "pulseRing 2.8s ease-out 0.9s infinite",
            }}
          />
          <img
            src={char.image}
            alt={char.name}
            className="mx-auto object-cover rounded-full"
            style={{
              width: "108px",
              height: "108px",
              border: "3px solid rgba(232,168,124,0.8)",
              boxShadow:
                "0 0 32px rgba(232,168,124,0.45), 0 0 72px rgba(194,24,91,0.25)",
            }}
          />
        </div>

        {/* Bottom fade */}
        <div
          className="absolute inset-x-0 bottom-0"
          style={{
            height: "60%",
            background:
              "linear-gradient(to bottom, transparent 0%, #0A0412 100%)",
          }}
        />
      </div>

      {/* ── Character name + role ── */}
      <div
        className="flex flex-col items-center"
        style={{
          paddingTop: "4px",
          paddingBottom: "20px",
          opacity: visible ? 1 : 0,
          transform: visible ? "translateY(0)" : "translateY(12px)",
          transition: "opacity 0.5s ease 0.2s, transform 0.5s ease 0.2s",
        }}
      >
        <h2
          className="font-serif text-center"
          style={{
            color: "#F5F0EB",
            fontSize: "26px",
            fontWeight: "700",
            letterSpacing: "-0.02em",
            marginBottom: "6px",
          }}
        >
          {char.name}
        </h2>
        <div
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: "6px",
            padding: "4px 14px",
            borderRadius: "999px",
            background: "rgba(232,168,124,0.1)",
            border: "1px solid rgba(232,168,124,0.35)",
          }}
        >
          <div
            style={{
              width: "5px",
              height: "5px",
              borderRadius: "50%",
              background: "#E8A87C",
              boxShadow: "0 0 6px rgba(232,168,124,0.8)",
            }}
          />
          <span
            className="font-sans"
            style={{
              color: "#E8A87C",
              fontSize: "11px",
              fontWeight: "600",
              letterSpacing: "0.1em",
              textTransform: "uppercase",
            }}
          >
            {char.role}
          </span>
        </div>
      </div>

      {/* ── Divider ── */}
      <div
        style={{
          margin: "0 24px 20px",
          height: "1px",
          background:
            "linear-gradient(90deg, transparent, rgba(232,168,124,0.2), transparent)",
          opacity: visible ? 1 : 0,
          transition: "opacity 0.5s ease 0.3s",
        }}
      />

      {/* ── Interactive Story card ── */}
      <div
        style={{
          margin: "0 20px",
          padding: "22px 20px 24px",
          borderRadius: "20px",
          background: "rgba(255,255,255,0.03)",
          border: "1px solid rgba(232,168,124,0.12)",
          boxShadow: "0 8px 32px rgba(0,0,0,0.4)",
          opacity: visible ? 1 : 0,
          transform: visible ? "translateY(0)" : "translateY(16px)",
          transition: "opacity 0.55s ease 0.35s, transform 0.55s ease 0.35s",
        }}
      >
        {/* Label */}
        <div className="flex items-center gap-2 mb-3">
          <Sparkles size={13} style={{ color: "#E8A87C" }} />
          <span
            className="font-sans"
            style={{
              color: "#E8A87C",
              fontSize: "10px",
              fontWeight: "700",
              letterSpacing: "0.14em",
              textTransform: "uppercase",
            }}
          >
            {t.player.interactiveStory}
          </span>
        </div>

        {/* Headline */}
        <p
          className="font-serif"
          style={{
            color: "#F5F0EB",
            fontSize: "18px",
            fontWeight: "600",
            lineHeight: "1.4",
            marginBottom: "16px",
            letterSpacing: "-0.01em",
          }}
        >
          {t.player.storyBeginHeadline.replace("{name}", char.name.split(" ").pop() || char.name)}
        </p>

        {/* Feature list */}
        <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
          {storyFeatures.map((feat, i) => (
            <div
              key={i}
              className="flex items-start gap-3"
              style={{
                opacity: visible ? 1 : 0,
                transform: visible ? "translateX(0)" : "translateX(-8px)",
                transition: `opacity 0.45s ease ${0.45 + i * 0.08}s, transform 0.45s ease ${0.45 + i * 0.08}s`,
              }}
            >
              <div
                style={{
                  flexShrink: 0,
                  marginTop: "3px",
                  width: "16px",
                  height: "16px",
                  borderRadius: "50%",
                  background: "rgba(232,168,124,0.12)",
                  border: "1px solid rgba(232,168,124,0.35)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <div
                  style={{
                    width: "5px",
                    height: "5px",
                    borderRadius: "50%",
                    background: "#E8A87C",
                  }}
                />
              </div>
              <p
                className="font-sans"
                style={{
                  color: "rgba(245,240,235,0.65)",
                  fontSize: "13px",
                  lineHeight: "1.55",
                }}
              >
                {feat}
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* ── CTA Button ── */}
      <div
        style={{
          padding: "24px 20px",
          paddingBottom: "max(24px, env(safe-area-inset-bottom, 24px))",
          opacity: visible ? 1 : 0,
          transform: visible ? "translateY(0)" : "translateY(12px)",
          transition: "opacity 0.5s ease 0.6s, transform 0.5s ease 0.6s",
        }}
      >
        <button
          onClick={onConfirm}
          className="w-full font-sans active:scale-95 transition-transform duration-150"
          style={{
            padding: "16px",
            borderRadius: "16px",
            background: "linear-gradient(135deg, #E8A87C 0%, #C2185B 100%)",
            border: "none",
            cursor: "pointer",
            color: "#fff",
            fontSize: "16px",
            fontWeight: "700",
            letterSpacing: "0.02em",
            boxShadow:
              "0 0 32px rgba(232,168,124,0.4), 0 0 64px rgba(194,24,91,0.2), 0 4px 16px rgba(0,0,0,0.4)",
          }}
        >
          {t.player.beginStory}
        </button>

        {/* Hint */}
        <p
          className="font-sans text-center"
          style={{
            color: "rgba(245,240,235,0.25)",
            fontSize: "11px",
            marginTop: "10px",
          }}
        >
          {t.player.choiceHint}
        </p>
      </div>
    </div>
  );
};

// ─── Character Selection Panel ─────────────────────────────────────────────────

const CharacterPanel = ({ dramaId, characters, t, onSelect, onClose }) => (
  <>
    {/* Backdrop */}
    <div
      className="absolute inset-0 z-40"
      style={{ background: "rgba(0,0,0,0.5)" }}
      onClick={onClose}
    />
    {/* Panel */}
    <div
      className="absolute inset-x-0 bottom-0 z-50 rounded-t-3xl px-5 pt-4 pb-10"
      style={{
        background: "rgba(16,8,24,0.97)",
        backdropFilter: "blur(28px)",
        WebkitBackdropFilter: "blur(28px)",
        border: "1px solid rgba(232,168,124,0.15)",
        borderBottom: "none",
        boxShadow: "0 -24px 60px rgba(155,89,182,0.25)",
        animation: "slideUpPanel 0.38s cubic-bezier(0.34,1.4,0.64,1)",
        minHeight: "50vh",
      }}
    >
      {/* Handle */}
      <div className="mx-auto mb-4 rounded-full" style={{ width: "36px", height: "4px", background: "rgba(232,168,124,0.3)" }} />

      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="font-serif" style={{ color: "#F5F0EB", fontSize: "18px", fontWeight: "600" }}>
            {t.player.selectChar}
          </h3>
          <p className="font-sans mt-0.5" style={{ color: "rgba(245,240,235,0.4)", fontSize: "12px" }}>
            {t.player.startAiChat}
          </p>
        </div>
        <button
          onClick={onClose}
          className="w-9 h-9 rounded-full flex items-center justify-center"
          style={{ background: "rgba(255,255,255,0.07)", border: "1px solid rgba(255,255,255,0.1)" }}
        >
          <X size={16} style={{ color: "rgba(245,240,235,0.7)" }} />
        </button>
      </div>

      {/* Character cards */}
      <div className="flex gap-4 justify-around">
        {characters.map((char) => (
          <button
            key={char.id}
            onClick={() => onSelect(dramaId, char.id)}
            className="flex flex-col items-center gap-3 flex-1 py-4 px-2 rounded-2xl transition-all duration-200 active:scale-95"
            style={{
              background: "rgba(255,255,255,0.04)",
              border: "1px solid rgba(232,168,124,0.12)",
            }}
          >
            {/* Avatar */}
            <div className="relative">
              <img
                src={char.image}
                alt={char.name}
                className="mx-auto object-cover rounded-full"
                style={{
                  width: "68px",
                  height: "68px",
                  border: "2px solid rgba(232,168,124,0.55)",
                  boxShadow: "0 0 18px rgba(232,168,124,0.18), 0 4px 16px rgba(0,0,0,0.5)",
                }}
              />
              {/* Online dot */}
              <div
                className="absolute rounded-full"
                style={{
                  width: "13px", height: "13px",
                  background: "#43A047",
                  border: "2px solid #100818",
                  boxShadow: "0 0 6px rgba(67,160,71,0.7)",
                  bottom: "2px", right: "2px",
                }}
              />
            </div>
            <div className="text-center">
              <p className="font-sans" style={{ color: "#F5F0EB", fontSize: "13px", fontWeight: "500" }}>
                {char.name.split(" ")[0]}
              </p>
              <p className="font-sans mt-0.5" style={{ color: "#E8A87C", fontSize: "10px" }}>
                {char.role}
              </p>
            </div>
            {/* Chat CTA */}
            <div
              className="flex items-center gap-1 px-3 py-1 rounded-full"
              style={{ background: "rgba(232,168,124,0.12)", border: "1px solid rgba(232,168,124,0.25)" }}
            >
              <Sparkles size={9} style={{ color: "#E8A87C" }} />
              <span className="font-sans" style={{ color: "#E8A87C", fontSize: "10px" }}>{t.player.chat}</span>
            </div>
          </button>
        ))}
      </div>
    </div>
  </>
);

// ─── Main Player ───────────────────────────────────────────────────────────────

const Player = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const { isDrama } = useABVersion();
  const { t, dramas, locale, localePath: lp } = useLocale();

  const { VIDEO_MAP, DRAMA_ORDER, CHARACTERS, CHAR_BIO, STORY_FEATURES } = dramas;

  const dramaId = id || (DRAMA_ORDER[0] || 2).toString();
  const videoEntry = VIDEO_MAP[Number(dramaId)] || VIDEO_MAP[DRAMA_ORDER[0]] || Object.values(VIDEO_MAP)[0];
  const videoTitle = videoEntry.title;
  const videoCover = videoEntry.cover;
  const episodeList = videoEntry.episodes;

  const CALLER = CHARACTERS.find((c) => c.dramaId === dramaId) || CHARACTERS[0];

  const [currentEp, setCurrentEp] = useState(0);
  const videoSrc = episodeList[currentEp] || episodeList[0];

  const videoRef = useRef(null);
  const progressRef = useRef(null);
  const controlsTimerRef = useRef(null);
  const swipeWrapperRef = useRef(null);
  const isSeekingRef = useRef(false);
  const wasPlayingRef = useRef(false);
  const [isSeeking, setIsSeeking] = useState(false);

  const [isPlaying, setIsPlaying] = useState(true);
  const [showPlayBtn, setShowPlayBtn] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [isLiked, setIsLiked] = useState(false);
  const [showEpPanel, setShowEpPanel] = useState(false);

  // Overlay states
  const [showToast, setShowToast] = useState(false);
  const [showPostVideo, setShowPostVideo] = useState(false);
  const [showChatEntry, setShowChatEntry] = useState(false);
  const [callTriggered, setCallTriggered] = useState(false);
  const [postTriggered, setPostTriggered] = useState(false);

  // Onboarding overlay: { char, charId } | null
  const [onboardingChar, setOnboardingChar] = useState(null);

  // ── Intro black screen animation ──
  const [introStep, setIntroStep] = useState(0);
  const [typedText, setTypedText] = useState("");
  const [showSubText, setShowSubText] = useState(false);
  const [showIntroLine, setShowIntroLine] = useState(false);

  // Auto-hide play button after 3s when playing
  const scheduleHidePlayBtn = useCallback(() => {
    clearTimeout(controlsTimerRef.current);
    controlsTimerRef.current = setTimeout(() => setShowPlayBtn(false), 3000);
  }, []);

  useEffect(() => () => clearTimeout(controlsTimerRef.current), []);

  // Reset episode index when drama changes
  useEffect(() => {
    setCurrentEp(0);
    try {
      const raw = localStorage.getItem("watch_history");
      const hist = raw ? JSON.parse(raw) : [];
      const filtered = hist.filter((h) => !(h.dramaId === Number(dramaId) && h.ep === 0));
      filtered.unshift({ dramaId: Number(dramaId), ep: 0, time: Date.now() });
      localStorage.setItem("watch_history", JSON.stringify(filtered.slice(0, 50)));
    } catch (_) {}
    const key = `watched_eps_${dramaId}`;
    const prev = parseInt(localStorage.getItem(key) || "0", 10);
    if (prev < 1) localStorage.setItem(key, "1");
  }, [dramaId]);

  // Reload & play video whenever the source changes
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;
    setCurrentTime(0);
    setCallTriggered(false);
    setPostTriggered(false);
    setShowPostVideo(false);
    setShowToast(false);
    setIsPlaying(true);
    setShowPlayBtn(false);
    video.load();
    video.play().catch(() => {});
  }, [videoSrc]);

  const watchedCountRef = useRef(0);

  const writeWatchHistory = useCallback((epIdx) => {
    try {
      const raw = localStorage.getItem("watch_history");
      const hist = raw ? JSON.parse(raw) : [];
      const filtered = hist.filter((h) => !(h.dramaId === Number(dramaId) && h.ep === epIdx));
      filtered.unshift({ dramaId: Number(dramaId), ep: epIdx, time: Date.now() });
      localStorage.setItem("watch_history", JSON.stringify(filtered.slice(0, 50)));
    } catch (_) {}
  }, [dramaId]);

  const handleEpChange = useCallback((epIdx) => {
    if (epIdx === currentEp) return;
    trackABClick(isDrama ? "A" : "B", "click_episode", { dramaId, episode: epIdx + 1 });
    setCurrentEp(epIdx);
    const key = `watched_eps_${dramaId}`;
    const prev = parseInt(localStorage.getItem(key) || "0", 10);
    const next = Math.max(prev, epIdx + 1);
    localStorage.setItem(key, String(next));
    watchedCountRef.current = next;
    writeWatchHistory(epIdx);
  }, [currentEp, dramaId, writeWatchHistory]);

  // ── Intro black screen typewriter animation ──
  useEffect(() => {
    if (introStep !== 1) return;
    let idx = 0;
    const charName = onboardingChar?.char?.name?.split(" ")[0] || CHARACTERS[0]?.name || "";
    const fullText = t.player.introText.replace("{name}", charName);

    const startDelay = setTimeout(() => {
      const timer = setInterval(() => {
        idx += 1;
        setTypedText(fullText.slice(0, idx));
        if (idx >= fullText.length) {
          clearInterval(timer);
          setTimeout(() => setShowIntroLine(true), 300);
          setTimeout(() => setShowSubText(true), 600);
          setTimeout(() => setIntroStep(2), 2200);
        }
      }, 80);
    }, 400);

    return () => clearTimeout(startDelay);
  }, [introStep, onboardingChar]);

  // ── Swipe-to-switch-drama (TikTok-style) ──
  const SWIPE_THRESHOLD = 80;
  const touchStartYRef = useRef(null);
  const [swipeDelta, setSwipeDelta] = useState(0);
  const [swipeAnim, setSwipeAnim] = useState(null);
  const [showLastEpToast, setShowLastEpToast] = useState(false);
  const lastEpToastTimerRef = useRef(null);

  const dramaOrderIdx = DRAMA_ORDER.indexOf(Number(dramaId));

  const overlayOpenRef = useRef(false);
  useEffect(() => {
    overlayOpenRef.current = !!(showPostVideo || showEpPanel);
  }, [showPostVideo, showEpPanel]);

  const handleTouchStart = useCallback((e) => {
    if (overlayOpenRef.current) return;
    touchStartYRef.current = e.touches[0].clientY;
    setSwipeDelta(0);
  }, []);

  const handleTouchMove = useCallback((e) => {
    if (overlayOpenRef.current) return;
    if (touchStartYRef.current === null) return;
    const dy = e.touches[0].clientY - touchStartYRef.current;
    if (Math.abs(dy) > 10) e.preventDefault();
    setSwipeDelta(dy);
  }, []);

  useEffect(() => {
    const el = swipeWrapperRef.current;
    if (!el) return;
    el.addEventListener("touchmove", handleTouchMove, { passive: false });
    return () => el.removeEventListener("touchmove", handleTouchMove);
  }, [handleTouchMove]);

  const handleTouchEnd = useCallback(() => {
    if (touchStartYRef.current === null) return;
    const dy = swipeDelta;
    touchStartYRef.current = null;

    if (Math.abs(dy) < SWIPE_THRESHOLD) {
      setSwipeDelta(0);
      return;
    }

    if (dy < 0) {
      if (dramaOrderIdx >= DRAMA_ORDER.length - 1) {
        setSwipeDelta(0);
        clearTimeout(lastEpToastTimerRef.current);
        setShowLastEpToast(true);
        lastEpToastTimerRef.current = setTimeout(() => setShowLastEpToast(false), 2200);
        return;
      }
      setSwipeAnim("exit-up");
      setTimeout(() => {
        setSwipeDelta(0);
        setSwipeAnim("enter-down");
        setTimeout(() => {
          setSwipeAnim(null);
          navigate(lp(`/player/${DRAMA_ORDER[dramaOrderIdx + 1]}`));
        }, 350);
      }, 280);
    } else {
      if (dramaOrderIdx <= 0) {
        setSwipeDelta(0);
        return;
      }
      setSwipeAnim("exit-down");
      setTimeout(() => {
        setSwipeDelta(0);
        setSwipeAnim("enter-up");
        setTimeout(() => {
          setSwipeAnim(null);
          navigate(lp(`/player/${DRAMA_ORDER[dramaOrderIdx - 1]}`));
        }, 350);
      }, 280);
    }
  }, [swipeDelta, dramaOrderIdx, navigate, lp]);

  const swipeStyle = (() => {
    if (swipeAnim === "exit-up")
      return { animation: "swipeExitUp 0.28s cubic-bezier(0.4,0,0.2,1) forwards" };
    if (swipeAnim === "exit-down")
      return { animation: "swipeExitDown 0.28s cubic-bezier(0.4,0,0.2,1) forwards" };
    if (swipeAnim === "enter-down")
      return { animation: "swipeEnterFromBottom 0.32s cubic-bezier(0.2,0,0,1) forwards" };
    if (swipeAnim === "enter-up")
      return { animation: "swipeEnterFromTop 0.32s cubic-bezier(0.2,0,0,1) forwards" };
    if (swipeDelta !== 0)
      return { transform: `translateY(${swipeDelta}px)`, transition: "none" };
    return { transform: "translateY(0)", transition: "transform 0.22s cubic-bezier(0.4,0,0.2,1)" };
  })();

  const isCallEpisode = !isDrama && dramaId === "2" && currentEp === 1;

  const handleTimeUpdate = () => {
    const video = videoRef.current;
    if (!video) return;
    const tt = video.currentTime;
    setCurrentTime(tt);
    // Call episode auto-trigger removed
  };

  const handleLoadedMetadata = () => {
    if (videoRef.current) setDuration(videoRef.current.duration);
  };

  const handleVideoEnded = () => {
    setIsPlaying(false);
    setShowPlayBtn(true);
    clearTimeout(controlsTimerRef.current);
    // Last episode: show CTA popup
    if (currentEp === episodeList.length - 1) {
      setShowChatEntry(true);
    }
  };

  const togglePlay = useCallback((e) => {
    e && e.stopPropagation();
    const video = videoRef.current;
    if (!video) return;
    if (isPlaying) {
      video.pause();
      setIsPlaying(false);
      setShowPlayBtn(true);
      clearTimeout(controlsTimerRef.current);
    } else {
      video.play();
      setIsPlaying(true);
      setShowPlayBtn(true);
      scheduleHidePlayBtn();
    }
  }, [isPlaying, scheduleHidePlayBtn]);

  const handleVideoTap = useCallback(() => {
    if (showPostVideo) return;
    if (isPlaying) {
      setShowPlayBtn(true);
      scheduleHidePlayBtn();
    } else {
      setShowPlayBtn(true);
    }
  }, [isPlaying, showPostVideo, scheduleHidePlayBtn]);

  const handleProgressClick = (e) => {
    if (isSeekingRef.current) return;
    const bar = progressRef.current;
    if (!bar || !videoRef.current) return;
    const rect = bar.getBoundingClientRect();
    const padding = 16;
    const trackWidth = rect.width - padding * 2;
    const offsetX = e.clientX - rect.left - padding;
    const ratio = Math.max(0, Math.min(1, offsetX / trackWidth));
    videoRef.current.currentTime = ratio * duration;
  };

  const seekToClientX = (clientX) => {
    const bar = progressRef.current;
    if (!bar || !videoRef.current || !duration) return;
    const rect = bar.getBoundingClientRect();
    const padding = 16;
    const trackWidth = rect.width - padding * 2;
    const offsetX = clientX - rect.left - padding;
    const ratio = Math.max(0, Math.min(1, offsetX / trackWidth));
    videoRef.current.currentTime = ratio * duration;
  };

  const handleProgressPointerDown = (e) => {
    const video = videoRef.current;
    if (!video) return;
    isSeekingRef.current = true;
    setIsSeeking(true);
    wasPlayingRef.current = isPlaying;
    video.pause();
    const clientX = e.touches ? e.touches[0].clientX : e.clientX;
    seekToClientX(clientX);
  };

  useEffect(() => {
    const onMove = (e) => {
      if (!isSeekingRef.current) return;
      const clientX = e.touches ? e.touches[0].clientX : e.clientX;
      seekToClientX(clientX);
    };
    const onUp = () => {
      if (!isSeekingRef.current) return;
      isSeekingRef.current = false;
      setIsSeeking(false);
      if (wasPlayingRef.current && videoRef.current) {
        videoRef.current.play().catch(() => {});
        setIsPlaying(true);
      }
    };
    document.addEventListener("mousemove", onMove);
    document.addEventListener("touchmove", onMove, { passive: true });
    document.addEventListener("mouseup", onUp);
    document.addEventListener("touchend", onUp);
    return () => {
      document.removeEventListener("mousemove", onMove);
      document.removeEventListener("touchmove", onMove);
      document.removeEventListener("mouseup", onUp);
      document.removeEventListener("touchend", onUp);
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isPlaying, duration]);

  const formatTime = (s) => {
    const m = Math.floor(s / 60);
    const sec = Math.floor(s % 60);
    return `${m}:${sec.toString().padStart(2, "0")}`;
  };

  const progressPercent = duration > 0 ? (currentTime / duration) * 100 : 0;

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        background: "#000",
        overflow: "hidden",
        maxWidth: "480px",
        margin: "0 auto",
      }}
    >
      <style>{KEYFRAMES}</style>

      {/* ── FULL-SCREEN VIDEO (swipe wrapper) ── */}
      <div
        ref={swipeWrapperRef}
        className="absolute inset-0"
        style={{ zIndex: 0, overflow: "hidden", pointerEvents: (showPostVideo || showEpPanel) ? "none" : "auto" }}
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
      >
        <video
          ref={videoRef}
          src={videoSrc}
          className="absolute inset-0 w-full h-full object-cover"
          onTimeUpdate={handleTimeUpdate}
          onLoadedMetadata={handleLoadedMetadata}
          onEnded={handleVideoEnded}
          onClick={handleVideoTap}
          playsInline
          autoPlay
          preload="auto"
          style={{
            width: "100%",
            height: "100%",
            willChange: "transform",
            ...swipeStyle,
          }}
        />
        {episodeList[currentEp + 1] && (
          <video
            key={`preload-${currentEp + 1}`}
            src={episodeList[currentEp + 1]}
            preload="auto"
            playsInline
            muted
            style={{ display: "none" }}
          />
        )}

        </div>

      {/* ── Last episode toast ── */}
      {showLastEpToast && (
        <div
          className="absolute z-50 left-1/2"
          style={{
            top: "50%",
            transform: "translate(-50%, -50%)",
            background: "rgba(13,13,13,0.82)",
            backdropFilter: "blur(12px)",
            WebkitBackdropFilter: "blur(12px)",
            border: "1px solid rgba(232,168,124,0.3)",
            borderRadius: "20px",
            padding: "10px 22px",
            pointerEvents: "none",
            animation: "toastFade 2.2s ease forwards",
          }}
        >
          <span className="font-sans" style={{ color: "#E8A87C", fontSize: "13px", fontWeight: "600" }}>
            {t.player.endOfDrama}
          </span>
        </div>
      )}

      {/* Cinematic gradient vignette */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background:
            "linear-gradient(to bottom, rgba(0,0,0,0.55) 0%, transparent 22%, transparent 55%, rgba(0,0,0,0.75) 100%)",
          zIndex: 1,
        }}
      />

      {/* ── TOP-LEFT: Back arrow ── */}
      <div className="absolute z-10" style={{ top: "48px", left: "16px" }}>
        <button
          onClick={() => setShowChatEntry(true)}
          className="w-10 h-10 rounded-full flex items-center justify-center"
          style={{
            background: "rgba(0,0,0,0.45)",
            backdropFilter: "blur(10px)",
            WebkitBackdropFilter: "blur(10px)",
            border: "1px solid rgba(255,255,255,0.12)",
          }}
        >
          <ArrowLeft size={20} style={{ color: "#F5F0EB" }} />
        </button>
      </div>

      {/* ── TOP CENTER: Drama title + EP badge ── */}
      <div
        className="absolute z-10 flex items-center gap-2"
        style={{ top: "54px", left: "68px", right: "68px" }}
      >
        <p
          className="font-serif truncate"
          style={{
            color: "#F5F0EB",
            fontSize: "14px",
            fontWeight: "600",
            textShadow: "0 1px 8px rgba(0,0,0,0.8)",
          }}
        >
          {videoTitle}
        </p>
        <span
          className="font-sans flex-shrink-0 px-2 py-0.5 rounded-full"
          style={{
            background: "rgba(232,168,124,0.2)",
            border: "1px solid rgba(232,168,124,0.4)",
            color: "#E8A87C",
            fontSize: "10px",
            fontWeight: "600",
          }}
        >
          {t.player.episodePrefix.replace("{n}", String(currentEp + 1))}
        </span>
      </div>

      {/* ── RIGHT SIDE: Vertical action buttons ── */}
      <div
        className="absolute z-10 flex flex-col gap-5"
        style={{
          right: "14px",
          top: "50%",
          transform: "translateY(-50%)",
        }}
      >
        {/* Play Story */}
        {!isDrama && (
        <button
          onClick={() => {
            trackABClick("B", "click_start_story", { dramaId });
            const matched = CHARACTERS.find((c) => c.dramaId === dramaId) || CHARACTERS[0];
            if (videoRef.current) {
              videoRef.current.pause();
              setIsPlaying(false);
            }
            setOnboardingChar({ char: matched, charId: matched.charId ?? matched.id });
            setIntroStep(1);
          }}
          className="flex flex-col items-center gap-1.5"
        >
          <div
            className="w-11 h-11 rounded-full flex items-center justify-center"
            style={{
              background: "linear-gradient(135deg, rgba(232,168,124,0.25), rgba(155,89,182,0.25))",
              backdropFilter: "blur(10px)",
              WebkitBackdropFilter: "blur(10px)",
              border: "1.5px solid rgba(232,168,124,0.5)",
              boxShadow: "0 0 16px rgba(232,168,124,0.25)",
            }}
          >
            <Sparkles size={18} style={{ color: "#E8A87C" }} />
          </div>
          <span className="font-sans" style={{ color: "#F5F0EB", fontSize: "10px", textShadow: "0 1px 4px rgba(0,0,0,0.8)" }}>
            {t.player.startStory}
          </span>
        </button>
        )}

        {/* Heart */}
        <button
          onClick={() => setIsLiked(v => !v)}
          className="flex flex-col items-center gap-1.5"
        >
          <div
            className="w-11 h-11 rounded-full flex items-center justify-center"
            style={{
              background: isLiked ? "rgba(232,168,124,0.2)" : "rgba(0,0,0,0.4)",
              backdropFilter: "blur(10px)",
              WebkitBackdropFilter: "blur(10px)",
              border: `1.5px solid ${isLiked ? "rgba(232,168,124,0.6)" : "rgba(255,255,255,0.15)"}`,
              boxShadow: isLiked ? "0 0 16px rgba(232,168,124,0.35)" : "none",
            }}
          >
            <Heart
              size={18}
              fill={isLiked ? "#E8A87C" : "none"}
              style={{ color: isLiked ? "#E8A87C" : "#F5F0EB" }}
            />
          </div>
          <span className="font-sans" style={{ color: "#F5F0EB", fontSize: "10px", textShadow: "0 1px 4px rgba(0,0,0,0.8)" }}>
            28K
          </span>
        </button>

        {/* Comment */}
        <button className="flex flex-col items-center gap-1.5">
          <div
            className="w-11 h-11 rounded-full flex items-center justify-center"
            style={{
              background: "rgba(0,0,0,0.4)",
              backdropFilter: "blur(10px)",
              WebkitBackdropFilter: "blur(10px)",
              border: "1.5px solid rgba(255,255,255,0.15)",
            }}
          >
            <MessageCircle size={18} style={{ color: "#F5F0EB" }} />
          </div>
          <span className="font-sans" style={{ color: "#F5F0EB", fontSize: "10px", textShadow: "0 1px 4px rgba(0,0,0,0.8)" }}>
            4.2K
          </span>
        </button>

        {/* Share */}
        <button className="flex flex-col items-center gap-1.5">
          <div
            className="w-11 h-11 rounded-full flex items-center justify-center"
            style={{
              background: "rgba(0,0,0,0.4)",
              backdropFilter: "blur(10px)",
              WebkitBackdropFilter: "blur(10px)",
              border: "1.5px solid rgba(255,255,255,0.15)",
            }}
          >
            <Share2 size={18} style={{ color: "#F5F0EB" }} />
          </div>
          <span className="font-sans" style={{ color: "#F5F0EB", fontSize: "10px", textShadow: "0 1px 4px rgba(0,0,0,0.8)" }}>
            {t.player.share}
          </span>
        </button>

        {/* Episodes */}
        <button
          onClick={() => setShowEpPanel(true)}
          className="flex flex-col items-center gap-1.5"
        >
          <div
            className="w-11 h-11 rounded-full flex items-center justify-center"
            style={{
              background: "rgba(0,0,0,0.4)",
              backdropFilter: "blur(10px)",
              WebkitBackdropFilter: "blur(10px)",
              border: "1.5px solid rgba(255,255,255,0.15)",
            }}
          >
            <List size={18} style={{ color: "#F5F0EB" }} />
          </div>
          <span className="font-sans" style={{ color: "#F5F0EB", fontSize: "10px", textShadow: "0 1px 4px rgba(0,0,0,0.8)" }}>
            {t.player.episodePanel}
          </span>
        </button>
      </div>

      {/* ── Episode Panel (bottom sheet) ── */}
      {showEpPanel && (
        <div
          className="absolute inset-0 z-40 flex flex-col justify-end"
          style={{ background: "rgba(0,0,0,0.6)" }}
          onClick={() => setShowEpPanel(false)}
        >
          <div
            className="rounded-t-3xl overflow-hidden"
            style={{ background: "#111018", maxHeight: "72vh", display: "flex", flexDirection: "column" }}
            onClick={e => e.stopPropagation()}
          >
            {/* Handle bar */}
            <div className="flex justify-center pt-3 pb-2 flex-shrink-0">
              <div className="w-9 h-1 rounded-full" style={{ background: "rgba(255,255,255,0.18)" }} />
            </div>

            {/* Drama info header */}
            <div className="flex items-center gap-3 px-4 pb-4 flex-shrink-0">
              <div className="flex-shrink-0 rounded-xl overflow-hidden" style={{ width: "56px", height: "74px" }}>
                <img
                  src={videoCover}
                  alt={videoTitle}
                  className="mx-auto object-cover w-full h-full"
                />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <div className="w-1 h-4 rounded-full flex-shrink-0" style={{ background: "#E8A87C" }} />
                  <p
                    className="font-serif truncate"
                    style={{ color: "#F5F0EB", fontSize: "15px", fontWeight: "700" }}
                  >
                    {videoTitle}
                  </p>
                </div>
                <p className="font-sans" style={{ color: "rgba(245,240,235,0.5)", fontSize: "12px" }}>
                  {t.player.episodeCount.replace("{n}", String(episodeList.length))}
                </p>
              </div>
              <button
                onClick={() => setShowEpPanel(false)}
                className="flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center"
                style={{ background: "rgba(255,255,255,0.1)" }}
              >
                <X size={15} style={{ color: "#F5F0EB" }} />
              </button>
            </div>

            {/* Range label */}
            <div className="px-4 pb-3 flex-shrink-0">
              <div className="flex items-center gap-2">
                <span className="font-sans font-bold" style={{ color: "#F5F0EB", fontSize: "15px" }}>
                  {t.player.epRange.replace("{n}", String(episodeList.length))}
                </span>
                <div style={{ height: "2px", width: "28px", background: "#E8A87C", borderRadius: "2px" }} />
              </div>
            </div>

            {/* Episode grid */}
            <div className="overflow-y-auto px-4 pb-8 flex-1">
              <div className="grid gap-2.5" style={{ gridTemplateColumns: "repeat(6, 1fr)" }}>
                {episodeList.map((_, idx) => {
                  const isActive = idx === currentEp;
                  return (
                    <button
                      key={idx}
                      onClick={() => { handleEpChange(idx); setShowEpPanel(false); }}
                      className="relative flex items-center justify-center rounded-xl active:scale-90 transition-transform duration-150"
                      style={{
                        aspectRatio: "1",
                        background: isActive
                          ? "linear-gradient(135deg, rgba(232,168,124,0.35), rgba(194,24,91,0.35))"
                          : "rgba(255,255,255,0.07)",
                        border: isActive
                          ? "1.5px solid rgba(232,168,124,0.8)"
                          : "1.5px solid rgba(255,255,255,0.08)",
                        boxShadow: isActive ? "0 0 10px rgba(232,168,124,0.3)" : "none",
                      }}
                    >
                      {isActive && (
                        <div
                          className="absolute top-1 right-1 flex gap-px items-end"
                          style={{ height: "8px" }}
                        >
                          {[3, 5, 4].map((h, i) => (
                            <div
                              key={i}
                              className="rounded-sm"
                              style={{
                                width: "2px",
                                height: `${h}px`,
                                background: "#E8A87C",
                                animation: `epBarBounce${i} 0.6s ease-in-out infinite alternate`,
                              }}
                            />
                          ))}
                        </div>
                      )}
                      <span
                        className="font-sans"
                        style={{
                          color: isActive ? "#E8A87C" : "rgba(245,240,235,0.75)",
                          fontSize: "13px",
                          fontWeight: isActive ? "700" : "500",
                        }}
                      >
                        {idx + 1}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── CENTER: Play / Pause button (auto-hides) ── */}
      {showPlayBtn && (
        <div
          className="absolute z-10 flex items-center justify-center"
          style={{
            top: "50%", left: "50%",
            transform: "translate(-50%, -50%)",
            animation: "playBtnFadeIn 0.2s ease",
          }}
        >
          <button
            onClick={togglePlay}
            className="flex items-center justify-center rounded-full"
            style={{
              width: "68px",
              height: "68px",
              background: "rgba(0,0,0,0.45)",
              backdropFilter: "blur(12px)",
              WebkitBackdropFilter: "blur(12px)",
              border: "2px solid rgba(232,168,124,0.6)",
              boxShadow: "0 0 32px rgba(232,168,124,0.3), 0 0 64px rgba(232,168,124,0.1)",
            }}
          >
            {isPlaying
              ? <Pause size={28} fill="#E8A87C" style={{ color: "#E8A87C" }} />
              : <Play  size={28} fill="#E8A87C" style={{ color: "#E8A87C", marginLeft: "3px" }} />}
          </button>
        </div>
      )}

      {/* ── BOTTOM: Progress bar + time ── */}
      <div
        className="absolute z-10 inset-x-0"
        style={{ bottom: "28px" }}
      >
        <div className="flex items-center justify-between px-4 pb-1">
          <span className="font-sans" style={{ color: "rgba(245,240,235,0.75)", fontSize: "11px", textShadow: "0 1px 4px rgba(0,0,0,0.8)" }}>
            {formatTime(currentTime)}
          </span>
          <span className="font-sans" style={{ color: "rgba(245,240,235,0.45)", fontSize: "11px", textShadow: "0 1px 4px rgba(0,0,0,0.8)" }}>
            {formatTime(duration) || "2:30"}
          </span>
        </div>
        <div
          ref={progressRef}
          className="w-full cursor-pointer relative flex items-center"
          style={{ height: "28px", paddingLeft: "16px", paddingRight: "16px" }}
          onClick={handleProgressClick}
          onMouseDown={handleProgressPointerDown}
          onTouchStart={handleProgressPointerDown}
        >
          <div className="w-full relative" style={{ height: "3px", background: "rgba(255,255,255,0.2)", borderRadius: "2px" }}>
            <div
              className="h-full relative"
              style={{
                width: `${progressPercent}%`,
                background: "linear-gradient(90deg, #E8A87C, #C8906A)",
                borderRadius: "2px",
                transition: isSeeking ? "none" : "width 0.08s linear",
              }}
            >
              <div
                className="absolute rounded-full"
                style={{
                  width: isSeeking ? "18px" : "13px",
                  height: isSeeking ? "18px" : "13px",
                  background: "#E8A87C",
                  boxShadow: isSeeking
                    ? "0 0 14px rgba(232,168,124,1)"
                    : "0 0 8px rgba(232,168,124,0.9)",
                  top: "50%",
                  right: 0,
                  transform: "translateY(-50%) translateX(50%)",
                  transition: "width 0.15s ease, height 0.15s ease, box-shadow 0.15s ease",
                }}
              />
            </div>
          </div>
        </div>
      </div>

      {/* ── Post-Video Panel ── */}
      {!isDrama && showPostVideo && (
        <div className="absolute inset-0 z-30">
          <PostVideoPanel
            caller={CALLER}
            t={t}
            onContinue={() => setShowChatEntry(true)}
          />
        </div>
      )}

      {/* ── Missed Call Toast ── */}
      {showToast && <MissedCallToast name={CALLER.name} t={t} />}

      {/* ── Black Screen Cover (step 1=with text, step 2=pure black) ── */}
      {introStep >= 1 && (
        <div
          className="absolute inset-0 z-50 flex flex-col items-center justify-center"
          style={{ background: "#000" }}
        >
          {introStep === 1 && (
          <>
          {/* Top ambient glow */}
          <div
            className="absolute inset-x-0 top-0 pointer-events-none"
            style={{
              height: "40%",
              background: "radial-gradient(ellipse 80% 50% at 50% 0%, rgba(155,89,182,0.12) 0%, transparent 70%)",
            }}
          />

          {/* Main text area */}
          <div className="relative flex flex-col items-center px-8" style={{ maxWidth: "340px", width: "100%" }}>
            {/* Small tag */}
            <div
              className="flex items-center gap-2 mb-6"
              style={{ animation: "introFadeIn 0.5s ease 0.2s both" }}
            >
              <div style={{ width: "20px", height: "1px", background: "rgba(232,168,124,0.4)" }} />
              <span
                className="font-sans"
                style={{
                  color: "rgba(232,168,124,0.6)",
                  fontSize: "10px",
                  fontWeight: "700",
                  letterSpacing: "0.2em",
                  textTransform: "uppercase",
                }}
              >
                {t.player.interactiveStory}
              </span>
              <div style={{ width: "20px", height: "1px", background: "rgba(232,168,124,0.4)" }} />
            </div>

            {/* Typewriter text */}
            <div className="relative text-center mb-2">
              <h1
                className="font-serif"
                style={{
                  color: "#F5F0EB",
                  fontSize: "22px",
                  fontWeight: "700",
                  lineHeight: "1.5",
                  letterSpacing: "0.02em",
                  minHeight: "33px",
                }}
              >
                {typedText}
                <span
                  style={{
                    display: "inline-block",
                    width: "2px",
                    height: "20px",
                    background: "#E8A87C",
                    marginLeft: "2px",
                    verticalAlign: "middle",
                    animation: "introCursorBlink 0.8s ease-in-out infinite",
                  }}
                />
              </h1>
            </div>

            {/* Divider */}
            {showIntroLine && (
              <div
                style={{
                  height: "1px",
                  background: "linear-gradient(90deg, transparent, rgba(232,168,124,0.5), transparent)",
                  marginBottom: "16px",
                  animation: "introLineDraw 0.5s ease forwards",
                  width: "100%",
                }}
              />
            )}

            {/* Subtitle */}
            {showSubText && (
              <p
                className="font-sans text-center"
                style={{
                  color: "rgba(245,240,235,0.45)",
                  fontSize: "13px",
                  lineHeight: "1.7",
                  letterSpacing: "0.03em",
                  animation: "introSubFadeIn 0.5s ease both",
                }}
              >
                {t.player.introSub1}
                <br />
                <span style={{ color: "rgba(232,168,124,0.5)", fontSize: "11px" }}>
                  {t.player.introSub2}
                </span>
              </p>
            )}
          </div>

          {/* Bottom decoration */}
          <div
            className="absolute bottom-16 flex items-center gap-2"
            style={{ animation: "introFadeIn 0.5s ease 0.3s both" }}
          >
            {[0, 1, 2].map((i) => (
              <div
                key={i}
                style={{
                  width: i === 1 ? "20px" : "6px",
                  height: "2px",
                  borderRadius: "2px",
                  background: i === 1 ? "#E8A87C" : "rgba(232,168,124,0.3)",
                }}
              />
            ))}
          </div>
          </>
          )}
        </div>
      )}

      {/* ── Character Onboarding ── */}
      {!isDrama && introStep === 2 && onboardingChar && (
        <div className="absolute inset-0 z-[60]">
          <CharacterOnboarding
            char={onboardingChar.char}
            dramaId={dramaId}
            t={t}
            storyFeatures={STORY_FEATURES}
            onConfirm={() => {
              if (onboardingChar.charId === "kane" || dramaId === "5") {
                localStorage.setItem("en_drama_progress", String(currentEp + 1));
                navigate(lp(`/chat/${dramaId}/${onboardingChar.charId}`));
              } else {
                localStorage.setItem("xindongjinqu_progress", String(currentEp + 1));
                navigate(lp(`/chat/${dramaId}/${onboardingChar.charId}`));
              }
            }}
          />
        </div>
      )}
      <ChatEntryModal
        dramaId={dramaId}
        charId={CALLER.id}
        visible={showChatEntry}
        onClose={() => setShowChatEntry(false)}
        isEnding={showPostVideo}
      />

    </div>
  );
};

export default Player;
