/**
 * CreateHub.jsx — 创作中心
 * 统一入口：选择原创剧创作 或 二创剧创作
 */

import { useNavigate } from "react-router-dom";
import { ArrowLeft, Sparkles, Film, Play, ChevronRight, Wand2, Layers, Headphones } from "lucide-react";

const MODES = [
  {
    id: "original",
    title: "原创剧",
    subtitle: "AI 一键生成漫剧",
    desc: "输入创意，AI 自动生成剧本、分镜、画面，一键合成你的原创短剧。",
    tag: "AI 创作",
    tagColor: "#60A5FA",
    gradientFrom: "rgba(30, 58, 100, 0.7)",
    gradientTo: "rgba(15, 23, 42, 0.85)",
    borderColor: "rgba(96, 165, 250, 0.3)",
    accentColor: "#60A5FA",
    icon: Wand2,
    image: "https://afterline.meituan.com/photo/search?keyword=film,screenplay,creative&width=400&height=500",
    path: "/comic-demo",
    badge: "漫剧创作",
  },
  {
    id: "asmr",
    title: "ASMR 二创",
    subtitle: "AI 生成沉浸式 ASMR",
    desc: "选择剧情场景，AI 自动生成 ASMR 文本、语音、分镜画面，打造专属沉浸式音频体验。",
    tag: "ASMR",
    tagColor: "#F472B6",
    gradientFrom: "rgba(80, 20, 60, 0.7)",
    gradientTo: "rgba(20, 5, 25, 0.85)",
    borderColor: "rgba(244, 114, 182, 0.3)",
    accentColor: "#F472B6",
    icon: Headphones,
    image: "https://afterline.meituan.com/photo/search?keyword=asmr,whisper,intimate,night&width=400&height=500",
    path: "/asmr-create",
    badge: "ASMR 二创",
  },
  {
    id: "recreation",
    title: "二创剧",
    subtitle: "基于原剧生成互动影游",
    desc: "选择你最爱的剧情集数，AI 生成专属互动剧情树，配图配音一键到位。",
    tag: "互动影游",
    tagColor: "#E8A87C",
    gradientFrom: "rgba(100, 30, 60, 0.7)",
    gradientTo: "rgba(18, 8, 28, 0.85)",
    borderColor: "rgba(232, 168, 124, 0.3)",
    accentColor: "#E8A87C",
    icon: Layers,
    image: "https://afterline.meituan.com/photo/search?keyword=interactive,drama,romance&width=400&height=500",
    path: "/recreation-create",
    badge: "互动影游",
  },
];

const CreateHub = () => {
  const navigate = useNavigate();

  return (
    <div style={{
      minHeight: "100vh",
      background: "linear-gradient(180deg, #0D0D0D 0%, #100818 100%)",
      display: "flex",
      flexDirection: "column",
      position: "relative",
      overflow: "hidden",
    }}>
      {/* 背景光晕装饰 */}
      <div style={{
        position: "absolute", top: "-80px", left: "-60px",
        width: "300px", height: "300px", borderRadius: "50%",
        background: "radial-gradient(circle, rgba(96,165,250,0.07) 0%, transparent 70%)",
        pointerEvents: "none",
      }} />
      <div style={{
        position: "absolute", bottom: "100px", right: "-80px",
        width: "320px", height: "320px", borderRadius: "50%",
        background: "radial-gradient(circle, rgba(232,168,124,0.07) 0%, transparent 70%)",
        pointerEvents: "none",
      }} />

      {/* 顶部导航 */}
      <div style={{
        display: "flex", alignItems: "center", gap: "12px",
        padding: "56px 20px 16px",
        position: "relative", zIndex: 1,
      }}>
        <button
          onClick={() => navigate(-1)}
          style={{
            width: "36px", height: "36px", borderRadius: "50%",
            background: "rgba(255,255,255,0.06)",
            border: "1px solid rgba(255,255,255,0.1)",
            display: "flex", alignItems: "center", justifyContent: "center",
            cursor: "pointer", flexShrink: 0,
          }}
        >
          <ArrowLeft size={16} style={{ color: "rgba(245,240,235,0.7)" }} />
        </button>
        <div>
          <h1 style={{
            color: "#F5F0EB", fontSize: "20px", fontWeight: "700",
            fontFamily: "serif", letterSpacing: "0.02em", marginBottom: "2px",
          }}>创作中心</h1>
          <p style={{ color: "rgba(255,255,255,0.35)", fontSize: "12px" }}>
            选择你的创作方式
          </p>
        </div>
        <Sparkles size={18} style={{ color: "rgba(232,168,124,0.5)", marginLeft: "auto" }} />
      </div>

      {/* 主内容 */}
      <div style={{
        flex: 1, padding: "8px 20px 40px",
        display: "flex", flexDirection: "column", gap: "16px",
        position: "relative", zIndex: 1,
      }}>

        {MODES.map((mode) => {
          const Icon = mode.icon;
          return (
            <button
              key={mode.id}
              onClick={() => navigate(mode.path)}
              style={{
                display: "block", width: "100%", textAlign: "left",
                borderRadius: "20px", overflow: "hidden",
                border: `1px solid ${mode.borderColor}`,
                background: "transparent",
                cursor: "pointer",
                position: "relative",
                transition: "transform 0.15s ease, box-shadow 0.15s ease",
                boxShadow: `0 4px 32px rgba(0,0,0,0.3)`,
              }}
              onPointerDown={(e) => (e.currentTarget.style.transform = "scale(0.98)")}
              onPointerUp={(e) => (e.currentTarget.style.transform = "scale(1)")}
              onPointerLeave={(e) => (e.currentTarget.style.transform = "scale(1)")}
            >
              {/* 背景图 */}
              <div style={{ position: "relative", height: "200px", overflow: "hidden" }}>
                <img
                  src={mode.image}
                  alt={mode.title}
                  className="mx-auto object-cover"
                  style={{
                    width: "100%", height: "100%",
                    objectFit: "cover", objectPosition: "center",
                  }}
                />
                {/* 渐变遮罩 */}
                <div style={{
                  position: "absolute", inset: 0,
                  background: `linear-gradient(180deg, ${mode.gradientFrom} 0%, ${mode.gradientTo} 100%)`,
                }} />

                {/* 顶部 badge */}
                <div style={{
                  position: "absolute", top: "14px", left: "14px",
                  display: "flex", alignItems: "center", gap: "6px",
                }}>
                  <div style={{
                    padding: "4px 10px", borderRadius: "20px",
                    background: `${mode.accentColor}20`,
                    border: `1px solid ${mode.accentColor}50`,
                    color: mode.accentColor, fontSize: "11px", fontWeight: "600",
                  }}>
                    {mode.badge}
                  </div>
                </div>

                {/* 标题区 */}
                <div style={{
                  position: "absolute", bottom: "16px", left: "16px", right: "16px",
                  display: "flex", alignItems: "flex-end", justifyContent: "space-between",
                }}>
                  <div>
                    <div style={{
                      display: "flex", alignItems: "center", gap: "8px", marginBottom: "4px",
                    }}>
                      <Icon size={18} style={{ color: mode.accentColor }} />
                      <h2 style={{
                        color: "#F5F0EB", fontSize: "22px", fontWeight: "800",
                        fontFamily: "serif", letterSpacing: "0.02em",
                      }}>{mode.title}</h2>
                    </div>
                    <p style={{ color: mode.accentColor, fontSize: "12px", fontWeight: "600" }}>
                      {mode.subtitle}
                    </p>
                  </div>
                  <div style={{
                    width: "40px", height: "40px", borderRadius: "50%",
                    background: `${mode.accentColor}20`,
                    border: `1px solid ${mode.accentColor}40`,
                    display: "flex", alignItems: "center", justifyContent: "center",
                    flexShrink: 0,
                  }}>
                    <ChevronRight size={18} style={{ color: mode.accentColor }} />
                  </div>
                </div>
              </div>

              {/* 描述区 */}
              <div style={{
                padding: "14px 16px 16px",
                background: `linear-gradient(180deg, ${mode.gradientTo} 0%, rgba(10,5,18,0.95) 100%)`,
              }}>
                <p style={{
                  color: "rgba(245,240,235,0.6)", fontSize: "13px",
                  lineHeight: "1.7",
                }}>
                  {mode.desc}
                </p>
                <div style={{
                  marginTop: "12px", padding: "10px 14px",
                  borderRadius: "10px", textAlign: "center",
                  background: `${mode.accentColor}15`,
                  border: `1px solid ${mode.accentColor}30`,
                  color: mode.accentColor, fontSize: "13px", fontWeight: "700",
                  letterSpacing: "0.04em",
                }}>
                  开始创作 →
                </div>
              </div>
            </button>
          );
        })}

        {/* 底部说明 */}
        <p style={{
          textAlign: "center",
          color: "rgba(255,255,255,0.2)", fontSize: "11px",
          lineHeight: "1.6", paddingTop: "4px",
        }}>
          AI 驱动创作 · 内容由你掌控
        </p>
      </div>
    </div>
  );
};

export default CreateHub;
