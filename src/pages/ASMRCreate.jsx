/**
 * ASMRCreate.jsx — ASMR 二创页面
 * 生成 ASMR 文本 → 语音 → 分镜图片
 */

import { useState, useRef, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import {
  ArrowLeft, Sparkles, Loader, CheckCircle, Mic,
  ImageIcon, FileText, Play, Pause, Trash2, RefreshCw,
} from "lucide-react";
import { useLocale } from "@/i18n";
import { runASMRPipeline } from "@/lib/asmr/asmrPipeline";
import { REFERENCE_IMAGES } from "@/lib/recreation/assetGenerator";

// ─── Constants ────────────────────────────────────────────────────────────────

const STEPS = [
  { id: "text", label: "文本", icon: FileText },
  { id: "voice", label: "语音", icon: Mic },
  { id: "images", label: "分镜", icon: ImageIcon },
  { id: "done", label: "完成", icon: CheckCircle },
];

const PRESET_TAGS = ["深夜耳语", "雨夜独白", "晨间温柔", "办公室暧昧", "电话撩拨"];

const ACCENT = "#E8A87C";
const BG_DARK = "#1A0E08";
const BG_CARD = "rgba(255,255,255,0.04)";
const BORDER = "rgba(255,255,255,0.08)";

// ─── StepBar ──────────────────────────────────────────────────────────────────

const StepBar = ({ currentStep }) => {
  const stepOrder = STEPS.map((s) => s.id);
  const currentIdx = stepOrder.indexOf(currentStep);

  return (
    <div style={{ display: "flex", alignItems: "center", gap: "0", padding: "0 4px" }}>
      {STEPS.map((step, i) => {
        const done = i < currentIdx;
        const active = i === currentIdx;
        const Icon = step.icon;
        return (
          <div key={step.id} style={{ display: "flex", alignItems: "center", flex: i < STEPS.length - 1 ? "1" : "0" }}>
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "4px" }}>
              <div style={{
                width: "28px", height: "28px", borderRadius: "50%",
                display: "flex", alignItems: "center", justifyContent: "center",
                flexShrink: 0,
                background: done ? ACCENT : active ? `${ACCENT}33` : "rgba(255,255,255,0.06)",
                border: active ? `1.5px solid ${ACCENT}` : done ? "none" : "1.5px solid rgba(255,255,255,0.12)",
                color: done ? BG_DARK : active ? ACCENT : "rgba(255,255,255,0.3)",
              }}>
                {done ? <CheckCircle size={13} /> : <Icon size={13} />}
              </div>
              <span style={{
                fontSize: "9px", whiteSpace: "nowrap",
                color: active ? ACCENT : done ? `${ACCENT}99` : "rgba(255,255,255,0.25)",
              }}>
                {step.label}
              </span>
            </div>
            {i < STEPS.length - 1 && (
              <div style={{
                flex: 1, height: "1px", margin: "0 6px", marginBottom: "14px",
                background: done ? `${ACCENT}80` : "rgba(255,255,255,0.08)",
              }} />
            )}
          </div>
        );
      })}
    </div>
  );
};

// ─── Rendered ASMR Text (with emotion highlights) ─────────────────────────────

const ASMRTextDisplay = ({ text }) => {
  if (!text) return null;

  // 把文本按括号和喘息标记分段渲染
  const parts = [];
  const regex = /(（[^）]*）|\([^)]*\)|\{\*[^}]*\*\})/g;
  let lastIndex = 0;
  let match;

  while ((match = regex.exec(text)) !== null) {
    if (match.index > lastIndex) {
      parts.push({ type: "text", content: text.slice(lastIndex, match.index) });
    }
    const token = match[0];
    if (token.startsWith("{*")) {
      parts.push({ type: "breath", content: token });
    } else {
      parts.push({ type: "emotion", content: token });
    }
    lastIndex = regex.lastIndex;
  }
  if (lastIndex < text.length) {
    parts.push({ type: "text", content: text.slice(lastIndex) });
  }

  return (
    <div style={{
      background: BG_CARD, borderRadius: "12px", padding: "16px",
      border: `1px solid ${BORDER}`, lineHeight: "1.9", fontSize: "14px",
      color: "rgba(245,240,235,0.85)", whiteSpace: "pre-wrap",
      maxHeight: "300px", overflowY: "auto",
    }}>
      {parts.map((p, i) => {
        if (p.type === "emotion") {
          return (
            <span key={i} style={{ color: "#A78BFA", fontStyle: "italic", fontSize: "12px" }}>
              {p.content}
            </span>
          );
        }
        if (p.type === "breath") {
          return (
            <span key={i} style={{
              color: "#F472B6", fontWeight: "600", fontSize: "12px",
              background: "rgba(244,114,182,0.1)", padding: "1px 4px", borderRadius: "4px",
            }}>
              {p.content}
            </span>
          );
        }
        return <span key={i}>{p.content}</span>;
      })}
    </div>
  );
};

// ─── Main Component ───────────────────────────────────────────────────────────

const ASMRCreate = () => {
  const navigate = useNavigate();
  const { chat } = useLocale();
  const abortRef = useRef(null);
  const audioRef = useRef(null);

  // 剧集数据（dramaId=2 中文剧）
  const summaries = chat?.EPISODE_SUMMARIES || {};
  const episodes = Object.entries(summaries).map(([ep, summary]) => ({
    ep: Number(ep),
    summary,
  }));

  // ─── State ────────────────────────────────────────────────────────────────
  const [selectedEp, setSelectedEp] = useState(episodes.length > 0 ? episodes[0].ep : 1);
  const [selectedTag, setSelectedTag] = useState("深夜耳语");
  const [customRequest, setCustomRequest] = useState("");
  const [generating, setGenerating] = useState(false);
  const [currentStep, setCurrentStep] = useState(null); // null | 'text' | 'voice' | 'images' | 'done'
  const [progressPercent, setProgressPercent] = useState(0);
  const [progressMsg, setProgressMsg] = useState("");
  const [result, setResult] = useState(null); // { asmrText, audioUrl, storyboardPrompts, storyboardImages }
  const [error, setError] = useState(null);
  const [isPlaying, setIsPlaying] = useState(false);

  // ─── Handlers ─────────────────────────────────────────────────────────────

  const handleStart = useCallback(async () => {
    if (generating) return;

    setGenerating(true);
    setResult(null);
    setError(null);
    setCurrentStep("text");
    setProgressPercent(0);
    setProgressMsg("准备中...");

    const controller = new AbortController();
    abortRef.current = controller;

    const episodeSummary = summaries[selectedEp] || "";
    const userRequest = customRequest.trim() || selectedTag;

    // 角色参考图
    const refs = REFERENCE_IMAGES[selectedEp] || REFERENCE_IMAGES[1] || [];
    const characterCard = refs[0] || null;
    const styleReferences = refs.slice(1);

    try {
      const res = await runASMRPipeline({
        episodeSummary,
        userRequest,
        characterCard,
        styleReferences,
        voiceName: "苏打",   // 男声
        onProgress: (step, percent, msg) => {
          setCurrentStep(step);
          setProgressPercent(percent);
          setProgressMsg(msg);
        },
      }, controller.signal);

      setResult(res);
      setCurrentStep("done");
    } catch (err) {
      if (err.name === "AbortError") {
        setError("已取消生成");
      } else {
        setError(err.message || "生成失败");
      }
      setCurrentStep(null);
    } finally {
      setGenerating(false);
      abortRef.current = null;
    }
  }, [generating, selectedEp, selectedTag, customRequest, summaries]);

  const handleCancel = useCallback(() => {
    if (abortRef.current) {
      abortRef.current.abort();
    }
  }, []);

  const handleReset = useCallback(() => {
    setResult(null);
    setError(null);
    setCurrentStep(null);
    setProgressPercent(0);
    setProgressMsg("");
    setIsPlaying(false);
  }, []);

  const handleDeleteImage = useCallback((idx) => {
    if (!result) return;
    const newImages = [...result.storyboardImages];
    newImages[idx] = null;
    setResult({ ...result, storyboardImages: newImages });
  }, [result]);

  const toggleAudio = useCallback(() => {
    const audio = audioRef.current;
    if (!audio) return;
    if (isPlaying) {
      audio.pause();
    } else {
      audio.play();
    }
    setIsPlaying(!isPlaying);
  }, [isPlaying]);

  // ─── Render ───────────────────────────────────────────────────────────────

  return (
    <div style={{
      minHeight: "100vh",
      background: `linear-gradient(180deg, ${BG_DARK} 0%, #0D0611 100%)`,
      display: "flex", flexDirection: "column",
      fontFamily: "system-ui, -apple-system, sans-serif",
    }}>
      {/* Header */}
      <div style={{
        display: "flex", alignItems: "center", gap: "12px",
        padding: "56px 20px 12px",
      }}>
        <button
          onClick={() => navigate(-1)}
          style={{
            width: "36px", height: "36px", borderRadius: "50%",
            background: "rgba(255,255,255,0.06)",
            border: `1px solid ${BORDER}`,
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
          }}>
            ASMR 二创
          </h1>
          <p style={{ color: "rgba(255,255,255,0.35)", fontSize: "12px" }}>
            AI 生成沉浸式 ASMR 音频 + 分镜
          </p>
        </div>
        <Sparkles size={18} style={{ color: `${ACCENT}80`, marginLeft: "auto" }} />
      </div>

      {/* Content */}
      <div style={{ flex: 1, padding: "8px 20px 40px" }}>

        {/* ── 配置区 ─────────────────────────────────────────────── */}
        {!generating && !result && (
          <>
            {/* 剧集选择 */}
            <div style={{ marginBottom: "20px" }}>
              <label style={{ color: "rgba(245,240,235,0.6)", fontSize: "12px", fontWeight: "600", marginBottom: "8px", display: "block" }}>
                📺 选择剧集
              </label>
              <select
                value={selectedEp}
                onChange={(e) => setSelectedEp(Number(e.target.value))}
                style={{
                  width: "100%", padding: "12px 14px", borderRadius: "10px",
                  background: BG_CARD, border: `1px solid ${BORDER}`,
                  color: "#F5F0EB", fontSize: "13px",
                  outline: "none", appearance: "none",
                  WebkitAppearance: "none",
                  cursor: "pointer",
                }}
              >
                {episodes.map((ep) => (
                  <option key={ep.ep} value={ep.ep} style={{ background: "#1A0E08", color: "#F5F0EB" }}>
                    第 {ep.ep} 集 — {ep.summary.slice(0, 30)}...
                  </option>
                ))}
              </select>
            </div>

            {/* 场景诉求 - 预设标签 */}
            <div style={{ marginBottom: "12px" }}>
              <label style={{ color: "rgba(245,240,235,0.6)", fontSize: "12px", fontWeight: "600", marginBottom: "8px", display: "block" }}>
                🎭 场景氛围
              </label>
              <div style={{ display: "flex", flexWrap: "wrap", gap: "8px" }}>
                {PRESET_TAGS.map((tag) => (
                  <button
                    key={tag}
                    onClick={() => { setSelectedTag(tag); setCustomRequest(""); }}
                    style={{
                      padding: "6px 14px", borderRadius: "20px", cursor: "pointer",
                      fontSize: "12px", fontWeight: "600",
                      background: selectedTag === tag && !customRequest
                        ? `${ACCENT}25` : "rgba(255,255,255,0.04)",
                      border: `1px solid ${selectedTag === tag && !customRequest ? ACCENT : BORDER}`,
                      color: selectedTag === tag && !customRequest ? ACCENT : "rgba(245,240,235,0.5)",
                      transition: "all 0.15s ease",
                    }}
                  >
                    {tag}
                  </button>
                ))}
              </div>
            </div>

            {/* 自定义输入 */}
            <div style={{ marginBottom: "24px" }}>
              <input
                type="text"
                placeholder="或输入自定义场景..."
                value={customRequest}
                onChange={(e) => setCustomRequest(e.target.value)}
                style={{
                  width: "100%", padding: "12px 14px", borderRadius: "10px",
                  background: BG_CARD, border: `1px solid ${BORDER}`,
                  color: "#F5F0EB", fontSize: "13px",
                  outline: "none", boxSizing: "border-box",
                }}
              />
            </div>

            {/* 生成按钮 */}
            <button
              onClick={handleStart}
              style={{
                width: "100%", padding: "14px", borderRadius: "12px",
                background: `linear-gradient(135deg, ${ACCENT} 0%, #D4956A 100%)`,
                border: "none", cursor: "pointer",
                color: BG_DARK, fontSize: "15px", fontWeight: "700",
                letterSpacing: "0.04em",
                display: "flex", alignItems: "center", justifyContent: "center", gap: "8px",
              }}
            >
              <Sparkles size={16} />
              ✨ 开始生成
            </button>

            {error && (
              <p style={{ color: "#EF4444", fontSize: "12px", marginTop: "12px", textAlign: "center" }}>
                {error}
              </p>
            )}
          </>
        )}

        {/* ── 进度区 ─────────────────────────────────────────────── */}
        {generating && (
          <div style={{ marginTop: "8px" }}>
            <StepBar currentStep={currentStep} />

            <div style={{
              marginTop: "20px", padding: "20px",
              background: BG_CARD, borderRadius: "14px",
              border: `1px solid ${BORDER}`,
            }}>
              {/* 进度条 */}
              <div style={{
                height: "4px", borderRadius: "2px",
                background: "rgba(255,255,255,0.08)",
                overflow: "hidden", marginBottom: "14px",
              }}>
                <div style={{
                  height: "100%", borderRadius: "2px",
                  background: `linear-gradient(90deg, ${ACCENT} 0%, #F472B6 100%)`,
                  width: `${progressPercent}%`,
                  transition: "width 0.3s ease",
                }} />
              </div>

              {/* 状态 */}
              <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                <Loader size={16} style={{ color: ACCENT, animation: "spin 1s linear infinite" }} />
                <span style={{ color: "rgba(245,240,235,0.7)", fontSize: "13px" }}>
                  {progressMsg}
                </span>
              </div>

              {/* 取消按钮 */}
              <button
                onClick={handleCancel}
                style={{
                  marginTop: "16px", width: "100%", padding: "10px",
                  borderRadius: "8px", cursor: "pointer",
                  background: "rgba(239,68,68,0.1)",
                  border: "1px solid rgba(239,68,68,0.3)",
                  color: "#EF4444", fontSize: "12px", fontWeight: "600",
                }}
              >
                取消生成
              </button>
            </div>
          </div>
        )}

        {/* ── 结果预览区 ─────────────────────────────────────────── */}
        {result && !generating && (
          <div style={{ marginTop: "8px" }}>
            <StepBar currentStep="done" />

            {/* ASMR 文本 */}
            <div style={{ marginTop: "20px" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "10px" }}>
                <FileText size={14} style={{ color: ACCENT }} />
                <span style={{ color: "#F5F0EB", fontSize: "14px", fontWeight: "600" }}>ASMR 文本</span>
              </div>
              <ASMRTextDisplay text={result.asmrText} />
            </div>

            {/* 音频播放器 */}
            {result.audioUrl && (
              <div style={{ marginTop: "20px" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "10px" }}>
                  <Mic size={14} style={{ color: ACCENT }} />
                  <span style={{ color: "#F5F0EB", fontSize: "14px", fontWeight: "600" }}>语音</span>
                </div>
                <div style={{
                  background: BG_CARD, borderRadius: "12px", padding: "16px",
                  border: `1px solid ${BORDER}`,
                  display: "flex", alignItems: "center", gap: "12px",
                }}>
                  <button
                    onClick={toggleAudio}
                    style={{
                      width: "40px", height: "40px", borderRadius: "50%",
                      background: `${ACCENT}25`, border: `1px solid ${ACCENT}60`,
                      display: "flex", alignItems: "center", justifyContent: "center",
                      cursor: "pointer", flexShrink: 0,
                    }}
                  >
                    {isPlaying
                      ? <Pause size={16} style={{ color: ACCENT }} />
                      : <Play size={16} style={{ color: ACCENT, marginLeft: "2px" }} />
                    }
                  </button>
                  <audio
                    ref={audioRef}
                    src={result.audioUrl}
                    onEnded={() => setIsPlaying(false)}
                    style={{ flex: 1, height: "32px", width: "100%" }}
                    controls
                  />
                </div>
              </div>
            )}

            {/* 分镜图片 */}
            <div style={{ marginTop: "20px" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "10px" }}>
                <ImageIcon size={14} style={{ color: ACCENT }} />
                <span style={{ color: "#F5F0EB", fontSize: "14px", fontWeight: "600" }}>分镜画面</span>
              </div>
              <div style={{
                display: "grid", gridTemplateColumns: "1fr 1fr",
                gap: "10px",
              }}>
                {result.storyboardImages.map((url, i) => (
                  <div key={i} style={{
                    position: "relative", borderRadius: "10px",
                    overflow: "hidden", aspectRatio: "9/16",
                    background: "rgba(255,255,255,0.03)",
                    border: `1px solid ${BORDER}`,
                  }}>
                    {url ? (
                      <>
                        <img
                          src={url}
                          alt={`分镜 ${i + 1}`}
                          style={{ width: "100%", height: "100%", objectFit: "cover" }}
                        />
                        <button
                          onClick={() => handleDeleteImage(i)}
                          style={{
                            position: "absolute", top: "6px", right: "6px",
                            width: "24px", height: "24px", borderRadius: "50%",
                            background: "rgba(0,0,0,0.6)", border: "none",
                            display: "flex", alignItems: "center", justifyContent: "center",
                            cursor: "pointer",
                          }}
                        >
                          <Trash2 size={12} style={{ color: "#EF4444" }} />
                        </button>
                        <div style={{
                          position: "absolute", bottom: "6px", left: "6px",
                          background: "rgba(0,0,0,0.6)", padding: "2px 8px",
                          borderRadius: "6px", fontSize: "10px", color: "rgba(255,255,255,0.7)",
                        }}>
                          {i + 1}/5
                        </div>
                      </>
                    ) : (
                      <div style={{
                        width: "100%", height: "100%",
                        display: "flex", alignItems: "center", justifyContent: "center",
                        color: "rgba(255,255,255,0.2)", fontSize: "12px",
                      }}>
                        已删除
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* 重新生成按钮 */}
            <button
              onClick={handleReset}
              style={{
                marginTop: "20px", width: "100%", padding: "12px",
                borderRadius: "10px", cursor: "pointer",
                background: `${ACCENT}15`, border: `1px solid ${ACCENT}40`,
                color: ACCENT, fontSize: "13px", fontWeight: "600",
                display: "flex", alignItems: "center", justifyContent: "center", gap: "8px",
              }}
            >
              <RefreshCw size={14} />
              重新生成
            </button>

            {/* 底部预留按钮 */}
            <div style={{ marginTop: "16px", display: "flex", gap: "10px" }}>
              <button
                disabled
                style={{
                  flex: 1, padding: "12px", borderRadius: "10px",
                  background: "rgba(255,255,255,0.03)",
                  border: `1px solid ${BORDER}`,
                  color: "rgba(255,255,255,0.2)", fontSize: "12px", fontWeight: "600",
                  cursor: "not-allowed",
                }}
              >
                🎬 合成视频（即将推出）
              </button>
              <button
                disabled
                style={{
                  flex: 1, padding: "12px", borderRadius: "10px",
                  background: "rgba(255,255,255,0.03)",
                  border: `1px solid ${BORDER}`,
                  color: "rgba(255,255,255,0.2)", fontSize: "12px", fontWeight: "600",
                  cursor: "not-allowed",
                }}
              >
                📢 发布到圈子（即将推出）
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Spin keyframes (inline) */}
      <style>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
};

export default ASMRCreate;
