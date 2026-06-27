import { useState, useRef, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Heart, RotateCcw, Play, Upload, X, Share2 } from "lucide-react";

// ─── Demo Game Data ──────────────────────────────────────────────────────────

const DEMO_GAME_DATA = null;


// ─── Motion Helper ───────────────────────────────────────────────────────────

function drawSceneWithMotion(ctx, img, progress, motion, canvasW, canvasH) {
  if (!img || !img.complete) return;
  const iw = img.naturalWidth || canvasW;
  const ih = img.naturalHeight || canvasH;

  // cover fit
  const scale = Math.max(canvasW / iw, canvasH / ih);
  const dw = iw * scale;
  const dh = ih * scale;

  let extraScale = 1;
  let tx = 0;
  let ty = 0;

  const ease = progress < 0.5 ? 2 * progress * progress : -1 + (4 - 2 * progress) * progress;

  switch (motion) {
    case "zoom_in":
      extraScale = 1 + 0.12 * ease;
      break;
    case "zoom_out":
      extraScale = 1.12 - 0.12 * ease;
      break;
    case "pan_right":
      tx = -0.06 * ease * canvasW;
      break;
    case "pan_left":
      tx = 0.06 * ease * canvasW;
      break;
    case "static":
    default:
      break;
  }

  const fw = dw * extraScale;
  const fh = dh * extraScale;
  const ox = (canvasW - fw) / 2 + tx;
  const oy = (canvasH - fh) / 2 + ty;

  ctx.drawImage(img, ox, oy, fw, fh);
}

// Ken Burns 动画类名池（节点挂载时随机选一个）
const KB_ANIMS = ["tnpKbZoomIn", "tnpKbPanRight", "tnpKbPanUp", "tnpKbZoomSlow"];
function pickKbAnim() {
  return KB_ANIMS[Math.floor(Math.random() * KB_ANIMS.length)];
}

// ─── Tree Node Player（hotspring 风格：点击推进 + 逐条追加文字 + Ken Burns 背景）──

const TreeNodePlayer = ({ node, onComplete, onBranchReady, branchActive }) => {
  const [visible, setVisible] = useState(false);
  const [imgLoaded, setImgLoaded] = useState(false);
  const [kbAnim] = useState(pickKbAnim); // 固定本节点的 KB 动画
  const [shownTexts, setShownTexts] = useState([]); // 已显示的文字条目
  const [textIndex, setTextIndex] = useState(0);    // 下一条要显示的索引
  const [allShown, setAllShown] = useState(false);  // 所有文字已显示完
  const inputLocked = useRef(false);
  const audioRef = useRef(null);
  const audioStarted = useRef(false); // TTS 是否已随第一次点击触发
  const textListRef = useRef(null);

  // 将 prose（字符串数组）+ dialogue（对话对象数组）合并为统一的 texts 列表
  const textItems = useCallback(() => {
    const items = [];
    const proseList = Array.isArray(node?.prose) ? node.prose : [];
    const dialogueList = Array.isArray(node?.dialogue) ? node.dialogue : [];
    // 旁白
    proseList.forEach((p) => items.push({ type: "narration", content: p }));
    // 对话
    dialogueList.forEach((d) => {
      if (typeof d === "string") items.push({ type: "dialogue", speaker: "", content: d });
      else items.push({ type: "dialogue", speaker: d.speaker || d.name || "", content: d.content || d.text || d });
    });
    return items;
  }, [node]);

  const items = textItems();
  const totalItems = items.length;

  // 淡入背景
  useEffect(() => {
    const t = setTimeout(() => setVisible(true), 50);
    return () => clearTimeout(t);
  }, []);

  // 自动滚动到底部
  useEffect(() => {
    if (textListRef.current) {
      textListRef.current.scrollTop = textListRef.current.scrollHeight;
    }
  }, [shownTexts]);

  // 预加载 TTS 音频（但不自动播放，等第一次点击触发）
  useEffect(() => {
    const ttsUrl = node?.audio?.ttsUrl;
    audioStarted.current = false;
    if (!ttsUrl) return;
    try {
      const audio = new Audio(ttsUrl);
      audio.preload = "auto";
      audioRef.current = audio;
    } catch (_) {}
    return () => {
      if (audioRef.current) { audioRef.current.pause(); audioRef.current = null; }
      audioStarted.current = false;
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [node?.audio?.ttsUrl]);

  // 无文字内容时：3s 后完成
  useEffect(() => {
    if (totalItems > 0) return;
    const t = setTimeout(() => onComplete?.(), 3000);
    return () => clearTimeout(t);
  }, [totalItems, onComplete]);

  // 点击推进一条文字
  const handleTap = useCallback(() => {
    if (inputLocked.current) return;
    // 第一次点击时启动 TTS 播放
    if (!audioStarted.current && audioRef.current) {
      audioStarted.current = true;
      audioRef.current.play().catch(() => {});
    }
    if (allShown) return; // 已全部显示，等待 onBranchReady 处理
    if (textIndex >= totalItems) {
      setAllShown(true);
      // 无分支节点：自动 complete
      if (!node?.branch) setTimeout(() => onComplete?.(), 600);
      else onBranchReady?.();
      return;
    }
    setShownTexts((prev) => [...prev, items[textIndex]]);
    setTextIndex((i) => i + 1);
    // 显示最后一条后检查
    if (textIndex === totalItems - 1) {
      inputLocked.current = true;
      setTimeout(() => {
        inputLocked.current = false;
        setAllShown(true);
        if (!node?.branch) setTimeout(() => onComplete?.(), 600);
        else onBranchReady?.();
      }, 400);
    }
  }, [allShown, textIndex, totalItems, items, node, onComplete, onBranchReady]);

  return (
    <div
      style={{
        position: "absolute", inset: 0, overflow: "hidden",
        opacity: visible ? 1 : 0, transition: "opacity 0.8s ease",
        background: "#0d0d0d",
      }}
      onClick={handleTap}
    >
      {/* 背景图容器 — Ken Burns 动画包裹层 */}
      {node?.imageUrl && (
        <div style={{
          position: "absolute", inset: 0, overflow: "hidden",
        }}>
          <img
            src={node.imageUrl}
            onLoad={() => setImgLoaded(true)}
            style={{
              position: "absolute", inset: 0, width: "100%", height: "100%",
              objectFit: "cover",
              opacity: imgLoaded ? 1 : 0,
              transition: "opacity 0.8s ease",
              // Ken Burns 动画：图片加载完成后启动
              animation: imgLoaded ? `${kbAnim} 8s ease-out forwards` : "none",
              transformOrigin: "center center",
            }}
            alt=""
          />
        </div>
      )}
      {/* 无图时纯黑渐变背景 */}
      {!node?.imageUrl && (
        <div style={{
          position: "absolute", inset: 0,
          background: "linear-gradient(180deg, #1a0a18 0%, #0d0d0d 100%)",
        }} />
      )}

      {/* 底部渐变遮罩（比之前更深，字幕区可读性更好）*/}
      <div style={{
        position: "absolute", bottom: 0, left: 0, right: 0, height: "65%",
        background: "linear-gradient(0deg, rgba(0,0,0,0.95) 0%, rgba(0,0,0,0.6) 50%, transparent 100%)",
        pointerEvents: "none",
      }} />

      {/* 字幕栏：底部固定区域，逐条追加；branchActive 时上移给选项面板让路 */}
      <div style={{
        position: "absolute", bottom: 0, left: 0, right: 0,
        padding: `16px 20px ${branchActive ? "280px" : "52px"}`,
        transition: "padding-bottom 0.4s cubic-bezier(0.16,1,0.3,1)",
      }}>
        <div
          ref={textListRef}
          style={{
            maxHeight: "48vh", overflowY: "auto",
            display: "flex", flexDirection: "column", gap: "8px",
            scrollbarWidth: "none", msOverflowStyle: "none",
          }}
        >
          {shownTexts.map((t, i) => (
            <div key={i} style={{ animation: "subtitleFadeIn 0.4s ease both" }}>
              {t.type === "dialogue" ? (
                // 对话：左侧橙金竖线 + 说话人标签
                <div style={{
                  paddingLeft: "12px",
                  borderLeft: "2px solid #E8A87C",
                }}>
                  {t.speaker && (
                    <span style={{
                      color: "#E8A87C", fontSize: "11px",
                      display: "block", marginBottom: "2px", letterSpacing: "0.04em",
                    }}>
                      {t.speaker}
                    </span>
                  )}
                  <span style={{
                    fontSize: "15px", lineHeight: "1.75", color: "#fff",
                    textShadow: "0 1px 6px rgba(0,0,0,0.8)",
                  }}>
                    {t.content}
                  </span>
                </div>
              ) : (
                // 旁白：小号灰色，带文字阴影
                <div style={{
                  fontSize: "13px", lineHeight: "1.9",
                  color: "rgba(245,240,235,0.78)",
                  textShadow: "0 1px 4px rgba(0,0,0,0.8)",
                  letterSpacing: "0.02em",
                }}>
                  {t.content}
                </div>
              )}
            </div>
          ))}
        </div>

        {/* 轻触提示 */}
        {!allShown && shownTexts.length < totalItems && (
          <div style={{
            marginTop: "10px",
            fontSize: "11px", color: "rgba(255,255,255,0.3)",
            textAlign: "center",
            animation: "tapBlink 2s ease-in-out infinite",
            pointerEvents: "none",
          }}>
            轻触继续
          </div>
        )}
      </div>
    </div>
  );
};

// ─── Slideshow Player ────────────────────────────────────────────────────────

const SlideshowPlayer = ({ slides, onComplete }) => {
  const canvasRef = useRef(null);
  const rafRef = useRef(null);
  const slideIndexRef = useRef(0);
  const slideStartRef = useRef(null);
  const imagesRef = useRef([]);
  const [subtitle, setSubtitle] = useState("");
  const [fadeIn, setFadeIn] = useState(true);

  const loadImages = useCallback(() => {
    return slides.map((slide) => {
      const img = new Image();
      img.crossOrigin = "anonymous";
      img.src = slide.imageUrl;
      return img;
    });
  }, [slides]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    const ctx = canvas.getContext("2d");
    imagesRef.current = loadImages();
    slideIndexRef.current = 0;
    slideStartRef.current = null;

    let running = true;

    const animate = (now) => {
      if (!running) return;
      if (slideStartRef.current === null) slideStartRef.current = now;

      const idx = slideIndexRef.current;
      if (idx >= slides.length) {
        onComplete && onComplete();
        return;
      }

      const slide = slides[idx];
      const elapsed = now - slideStartRef.current;
      const progress = Math.min(elapsed / slide.duration, 1);
      const img = imagesRef.current[idx];

      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.fillStyle = "#000";
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // crossfade between slides
      if (idx < slides.length - 1 && progress > 0.85 && imagesRef.current[idx + 1]) {
        const blend = (progress - 0.85) / 0.15;
        ctx.globalAlpha = 1 - blend;
        drawSceneWithMotion(ctx, img, progress, slide.motion, canvas.width, canvas.height);
        ctx.globalAlpha = blend;
        drawSceneWithMotion(ctx, imagesRef.current[idx + 1], 0, slides[idx + 1].motion, canvas.width, canvas.height);
        ctx.globalAlpha = 1;
      } else {
        drawSceneWithMotion(ctx, img, progress, slide.motion, canvas.width, canvas.height);
      }

      if (progress >= 1) {
        slideIndexRef.current++;
        slideStartRef.current = null;
        setSubtitle(slides[slideIndexRef.current]?.subtitle || "");
        setFadeIn(true);
      }

      rafRef.current = requestAnimationFrame(animate);
    };

    setSubtitle(slides[0]?.subtitle || "");
    setFadeIn(true);
    rafRef.current = requestAnimationFrame(animate);

    return () => {
      running = false;
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, [slides]);

  return (
    <div style={{ position: "absolute", inset: 0 }}>
      <canvas
        ref={canvasRef}
        style={{ width: "100%", height: "100%", display: "block" }}
      />
      {/* Subtitle overlay */}
      {subtitle && (
        <div style={{
          position: "absolute", bottom: "120px", left: 0, right: 0,
          padding: "0 24px",
          animation: fadeIn ? "subtitleFadeIn 0.4s ease both" : "none",
        }}>
          <div style={{
            background: "rgba(0,0,0,0.65)",
            backdropFilter: "blur(4px)",
            borderRadius: "12px",
            padding: "12px 16px",
            color: "rgba(255,255,255,0.92)",
            fontSize: "14px",
            lineHeight: "1.8",
            whiteSpace: "pre-wrap",
            textAlign: "center",
          }}>
            {subtitle}
          </div>
        </div>
      )}
    </div>
  );
};

// ─── Video Player (double-buffer crossfade placeholder) ───────────────────────

const VideoPlayer = ({ videoUrl, onComplete }) => {
  const vidRef = useRef(null);

  useEffect(() => {
    const v = vidRef.current;
    if (!v) return;
    v.src = videoUrl || "";
    v.play().catch(() => {});
    const onEnd = () => onComplete && onComplete();
    v.addEventListener("ended", onEnd);
    return () => v.removeEventListener("ended", onEnd);
  }, [videoUrl]);

  if (!videoUrl) {
    // Placeholder: simulate a 3s video
    useEffect(() => {
      const t = setTimeout(() => onComplete && onComplete(), 3000);
      return () => clearTimeout(t);
    }, []);
    return (
      <div style={{
        position: "absolute", inset: 0,
        background: "linear-gradient(180deg, #1a0a00 0%, #0d0d0d 100%)",
        display: "flex", alignItems: "center", justifyContent: "center",
      }}>
        <div style={{ color: "rgba(255,255,255,0.3)", fontSize: "13px" }}>
          [视频占位 · 自动跳过]
        </div>
      </div>
    );
  }

  return (
    <video
      ref={vidRef}
      style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover" }}
      playsInline
      autoPlay
    />
  );
};

// ─── Branch Panel ─────────────────────────────────────────────────────────────

const BranchPanel = ({ branch, affinity, onSelect }) => {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => setVisible(true), 100);
    return () => clearTimeout(t);
  }, []);

  return (
    <div style={{
      position: "absolute", bottom: 0, left: 0, right: 0,
      padding: "0 16px 40px",
      background: "linear-gradient(0deg, rgba(0,0,0,0.95) 0%, rgba(0,0,0,0.7) 60%, transparent 100%)",
      transform: visible ? "translateY(0)" : "translateY(100%)",
      transition: "transform 0.5s cubic-bezier(0.16,1,0.3,1)",
    }}>
      <p style={{
        color: "rgba(255,255,255,0.6)", fontSize: "12px",
        textAlign: "center", marginBottom: "14px", letterSpacing: "0.08em",
      }}>
        {branch.question || branch.prompt}
      </p>
      <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
        {branch.options.map((opt) => {
          const locked = opt.unlockCondition
            && opt.unlockCondition.type === "affinity"
            && affinity < opt.unlockCondition.minValue;
          return (
            <button
              key={opt.id}
              onClick={() => !locked && onSelect(opt)}
              style={{
                width: "100%", padding: "14px 18px",
                borderRadius: "14px", border: "none",
                background: locked
                  ? "rgba(255,255,255,0.04)"
                  : "rgba(255,255,255,0.09)",
                backdropFilter: "blur(8px)",
                color: locked ? "rgba(255,255,255,0.25)" : "rgba(255,255,255,0.88)",
                fontSize: "14px", fontWeight: "600",
                cursor: locked ? "not-allowed" : "pointer",
                textAlign: "left",
                display: "flex", alignItems: "center", gap: "10px",
                transition: "all 0.15s ease",
                boxShadow: locked ? "none" : "inset 0 0 0 1px rgba(255,255,255,0.12)",
              }}
            >
              {opt.emoji && <span style={{ fontSize: "18px", flexShrink: 0 }}>{opt.emoji}</span>}
              <span style={{ flex: 1 }}>{opt.label || opt.text}</span>
              {locked && (
                <span style={{ fontSize: "11px", color: "rgba(255,100,100,0.6)", whiteSpace: "nowrap" }}>
                  🔒 {opt.lockedHint}
                </span>
              )}
              {!locked && opt.affinityChange > 0 && (
                <span style={{ fontSize: "11px", color: "#E8A87C", whiteSpace: "nowrap" }}>
                  +{opt.affinityChange} 💗
                </span>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
};

// ─── Ending Card ─────────────────────────────────────────────────────────────

const EndingCard = ({ ending, affinity, onRestart, onNavigateCreate, onPublish }) => {
  const [visible, setVisible] = useState(false);
  useEffect(() => { const t = setTimeout(() => setVisible(true), 600); return () => clearTimeout(t); }, []);

  const endingTitle = ending.title || ending.description || "故事结局";
  const isSweet = endingTitle.includes("甜蜜") || ending.type === "sweet";

  return (
    <div style={{
      position: "absolute", inset: 0,
      background: isSweet
        ? "linear-gradient(180deg, rgba(80,20,0,0.85) 0%, rgba(0,0,0,0.95) 100%)"
        : "linear-gradient(180deg, rgba(10,10,30,0.9) 0%, rgba(0,0,0,0.97) 100%)",
      display: "flex", flexDirection: "column",
      alignItems: "center", justifyContent: "center",
      padding: "40px 24px",
      opacity: visible ? 1 : 0,
      transition: "opacity 0.8s ease",
    }}>
      <div style={{
        fontSize: "11px", letterSpacing: "0.3em",
        color: "rgba(255,255,255,0.4)", marginBottom: "20px",
        textTransform: "uppercase",
      }}>
        THE END
      </div>
      <h2 style={{
        color: isSweet ? "#E8A87C" : "rgba(255,255,255,0.7)",
        fontSize: "22px", fontWeight: "700",
        textAlign: "center", lineHeight: "1.4",
        marginBottom: "16px",
      }}>
        {endingTitle}
      </h2>
      <p style={{
        color: "rgba(255,255,255,0.55)", fontSize: "13px",
        lineHeight: "1.9", textAlign: "center",
        maxWidth: "300px", marginBottom: "32px",
        whiteSpace: "pre-wrap",
      }}>
        {ending.description}
      </p>

      {/* Affinity display */}
      <div style={{
        display: "flex", alignItems: "center", gap: "8px",
        background: "rgba(232,168,124,0.1)",
        border: "1px solid rgba(232,168,124,0.2)",
        borderRadius: "24px", padding: "8px 20px",
        marginBottom: "32px",
      }}>
        <Heart size={14} fill="#E8A87C" style={{ color: "#E8A87C" }} />
        <span style={{ color: "#E8A87C", fontSize: "13px", fontWeight: "700" }}>
          最终心动值 {affinity}
        </span>
      </div>

      <button
        onClick={onRestart}
        style={{
          display: "flex", alignItems: "center", gap: "8px",
          padding: "14px 32px", borderRadius: "50px", border: "none",
          background: "rgba(255,255,255,0.08)",
          color: "rgba(255,255,255,0.7)",
          fontSize: "14px", fontWeight: "600", cursor: "pointer",
          boxShadow: "inset 0 0 0 1px rgba(255,255,255,0.15)",
        }}
      >
        <RotateCcw size={15} />
        重新开始
      </button>
      {onPublish && (
        <button
          onClick={onPublish}
          style={{
            display: "flex", alignItems: "center", gap: "8px",
            padding: "14px 32px", borderRadius: "50px", border: "none",
            background: "linear-gradient(135deg, #E8A87C, #C8906A)",
            color: "#1A0E08",
            fontSize: "14px", fontWeight: "700", cursor: "pointer",
            boxShadow: "0 8px 32px rgba(232,168,124,0.35)",
            marginTop: "12px",
          }}
        >
          <Upload size={15} />
          发布到圈子
        </button>
      )}
      <button
        onClick={onNavigateCreate}
        style={{
          background: "none", border: "none",
          color: "rgba(255,255,255,0.3)", fontSize: "12px",
          cursor: "pointer", marginTop: "8px",
          display: "flex", alignItems: "center", gap: "5px",
          padding: "6px 16px",
        }}
      >
        <ArrowLeft size={12} />
        返回编辑页面
      </button>
    </div>
  );
};

// ─── Publish Helpers ──────────────────────────────────────────────────────────

const PUBLISHED_KEY = "afterline_published_recreations";

function getPublishedList() {
  try {
    const raw = localStorage.getItem(PUBLISHED_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch (_) {
    return [];
  }
}

function savePublishedList(list) {
  localStorage.setItem(PUBLISHED_KEY, JSON.stringify(list));
}

function publishRecreation(gameData, promoText) {
  const list = getPublishedList();
  // 生成一个唯一 ID
  const id = `pub_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
  // 提取封面图：从根节点或第一个有 imageUrl 的节点取
  const nodes = gameData.nodes || {};
  let coverImage = "";
  const rootNode = nodes[gameData.rootNodeId];
  if (rootNode?.imageUrl) {
    coverImage = rootNode.imageUrl;
  } else {
    for (const n of Object.values(nodes)) {
      if (n.imageUrl) { coverImage = n.imageUrl; break; }
    }
  }
  // 提取角色名
  const characters = gameData.characters || [];
  const charNames = characters.map((c) => c.name || c).join("、");
  // 节点数
  const nodeCount = Object.keys(nodes).length;

  const entry = {
    id,
    title: gameData.title || "互动影游",
    promoText: promoText || "",
    coverImage,
    charNames,
    nodeCount,
    gameData: JSON.parse(JSON.stringify(gameData)),
    publishedAt: Date.now(),
    dramaTitle: "心动禁区",
  };
  list.unshift(entry);
  savePublishedList(list);
  return entry;
}

// ─── Publish Modal ──────────────────────────────────────────────────────────

const PublishModal = ({ gameTitle, onPublish, onClose }) => {
  const [promoText, setPromoText] = useState("");
  const [published, setPublished] = useState(false);

  const handlePublish = () => {
    onPublish(promoText);
    setPublished(true);
  };

  return (
    <div style={{
      position: "fixed", inset: 0, zIndex: 100,
      display: "flex", alignItems: "flex-end", justifyContent: "center",
    }}>
      {/* Backdrop */}
      <div
        style={{ position: "absolute", inset: 0, background: "rgba(0,0,0,0.65)", backdropFilter: "blur(4px)" }}
        onClick={onClose}
      />
      {/* Sheet */}
      <div style={{
        position: "relative", width: "100%", maxWidth: "480px",
        background: "rgba(16,8,24,0.98)",
        backdropFilter: "blur(28px)",
        borderRadius: "24px 24px 0 0",
        border: "1px solid rgba(232,168,124,0.12)",
        borderBottom: "none",
        boxShadow: "0 -24px 60px rgba(155,89,182,0.2)",
        padding: "24px 20px calc(env(safe-area-inset-bottom, 0px) + 32px)",
        animation: "craveSlideUp 0.38s cubic-bezier(0.34,1.2,0.64,1)",
      }}>
        <style>{`
          @keyframes craveSlideUp {
            from { opacity: 0; transform: translateY(100%); }
            to   { opacity: 1; transform: translateY(0); }
          }
        `}</style>
        {/* Handle */}
        <div style={{ display: "flex", justifyContent: "center", marginBottom: "16px" }}>
          <div style={{ width: "36px", height: "4px", borderRadius: "2px", background: "rgba(232,168,124,0.25)" }} />
        </div>
        {/* Close */}
        <button onClick={onClose} style={{
          position: "absolute", top: "16px", right: "16px",
          width: "32px", height: "32px", borderRadius: "50%",
          background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.1)",
          display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer",
        }}>
          <X size={14} style={{ color: "rgba(245,240,235,0.6)" }} />
        </button>

        {published ? (
          <div style={{ textAlign: "center", padding: "24px 0" }}>
            <div style={{
              width: "56px", height: "56px", borderRadius: "50%",
              background: "rgba(232,168,124,0.15)", border: "1px solid rgba(232,168,124,0.3)",
              display: "flex", alignItems: "center", justifyContent: "center",
              margin: "0 auto 16px",
            }}>
              <Share2 size={24} style={{ color: "#E8A87C" }} />
            </div>
            <h3 style={{ color: "#F5F0EB", fontSize: "18px", fontWeight: "700", marginBottom: "8px" }}>
              发布成功
            </h3>
            <p style={{ color: "rgba(255,255,255,0.45)", fontSize: "13px", lineHeight: "1.7" }}>
              你的影游已发布到圈子，其他玩家可以看到并体验啦！
            </p>
            <button onClick={onClose} style={{
              marginTop: "24px", padding: "12px 32px", borderRadius: "50px",
              background: "linear-gradient(135deg, #E8A87C, #C8906A)",
              color: "#1A0E08", fontSize: "14px", fontWeight: "700",
              border: "none", cursor: "pointer",
            }}>
              好的
            </button>
          </div>
        ) : (
          <>
            <div style={{ marginBottom: "20px" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "8px" }}>
                <Upload size={18} style={{ color: "#E8A87C" }} />
                <h3 style={{ color: "#F5F0EB", fontSize: "18px", fontWeight: "700" }}>
                  发布到圈子
                </h3>
              </div>
              <p style={{ color: "rgba(255,255,255,0.4)", fontSize: "12px", lineHeight: "1.6" }}>
                将「{gameTitle}」分享给其他玩家
              </p>
            </div>

            <label style={{
              display: "block", color: "rgba(245,240,235,0.6)", fontSize: "12px",
              fontWeight: "600", marginBottom: "8px", letterSpacing: "0.02em",
            }}>
              推广文字 <span style={{ color: "rgba(255,255,255,0.25)" }}>（选填，为你的影游写句推荐语）</span>
            </label>
            <textarea
              value={promoText}
              onChange={(e) => setPromoText(e.target.value)}
              placeholder="快来体验我的自制影游！你的每个选择都会改变故事走向…"
              maxLength={200}
              style={{
                width: "100%", minHeight: "80px", padding: "12px 14px",
                borderRadius: "12px",
                background: "rgba(255,255,255,0.04)",
                border: "1px solid rgba(232,168,124,0.15)",
                color: "#F5F0EB", fontSize: "14px", lineHeight: "1.6",
                resize: "none", outline: "none",
                fontFamily: "inherit",
              }}
            />
            <div style={{ textAlign: "right", marginTop: "4px" }}>
              <span style={{ color: "rgba(255,255,255,0.2)", fontSize: "11px" }}>
                {promoText.length}/200
              </span>
            </div>

            <button onClick={handlePublish} style={{
              width: "100%", marginTop: "16px",
              padding: "14px", borderRadius: "50px", border: "none",
              background: "linear-gradient(135deg, #E8A87C, #C8906A)",
              color: "#1A0E08", fontSize: "15px", fontWeight: "700",
              cursor: "pointer",
              boxShadow: "0 8px 32px rgba(232,168,124,0.35)",
              display: "flex", alignItems: "center", justifyContent: "center", gap: "8px",
            }}>
              <Upload size={16} />
              立即发布
            </button>
          </>
        )}
      </div>
    </div>
  );
};

// ─── Main RecreationPlayer ────────────────────────────────────────────────────

const RecreationPlayer = ({ gameData: propGameData, onBack }) => {
  const navigate = useNavigate();
  const storedData = (() => {
    try {
      const raw = sessionStorage.getItem("recreation_game_data");
      return raw ? JSON.parse(raw) : null;
    } catch (_) {
      return null;
    }
  })();
  const gameData = propGameData || storedData || DEMO_GAME_DATA;

  // 无数据时显示提示页
  if (!gameData) {
    return (
      <div style={{
        position: "fixed", inset: 0, background: "#0D0D0D",
        display: "flex", flexDirection: "column",
        alignItems: "center", justifyContent: "center",
        padding: "32px 24px", gap: "20px",
      }}>
        <Heart size={40} style={{ color: "rgba(232,168,124,0.4)" }} />
        <p style={{
          color: "rgba(255,255,255,0.55)", fontSize: "15px",
          textAlign: "center", lineHeight: "1.8", maxWidth: "260px",
        }}>
          请先在创作页面生成故事树，再来试玩～
        </p>
        <button
          onClick={() => window.history.back()}
          style={{
            padding: "12px 32px", borderRadius: "50px",
            background: "rgba(232,168,124,0.15)",
            border: "1px solid rgba(232,168,124,0.3)",
            color: "#E8A87C", fontSize: "14px", fontWeight: "600",
            cursor: "pointer",
          }}
        >
          返回创作页面
        </button>
      </div>
    );
  }

  const [currentNodeId, setCurrentNodeId] = useState(null);
  const [phase, setPhase] = useState("intro"); // intro | playing | branching | ending
  const [affinity, setAffinity] = useState(10);
  const [showBranch, setShowBranch] = useState(false);
  const [history, setHistory] = useState([]);
  const [nodeKey, setNodeKey] = useState(0); // 强制重新挂载 TreeNodePlayer
  const [showPublish, setShowPublish] = useState(false); // 发布弹窗

  const currentNode = currentNodeId ? gameData.nodes?.[currentNodeId] : null;

  // Start
  const startGame = useCallback(() => {
    setCurrentNodeId(gameData.rootNodeId);
    setPhase("playing");
    setAffinity(10);
    setHistory([]);
    setShowBranch(false);
    setNodeKey((k) => k + 1);
  }, [gameData.rootNodeId]);

  // Node complete callback
  const handleNodeComplete = useCallback(() => {
    if (!currentNode) return;
    if (currentNode.ending) {
      setPhase("ending");
      return;
    }
    if (currentNode.branch) {
      setShowBranch(true);
      setPhase("branching");
      return;
    }
    if (currentNode.nextNodeId) {
      setHistory((h) => [...h, currentNodeId]);
      setCurrentNodeId(currentNode.nextNodeId);
      setPhase("playing");
    }
  }, [currentNode, currentNodeId]);

  // Branch select
  const handleBranchSelect = useCallback((option) => {
    setAffinity((a) => a + (option.affinityChange || 0));
    setShowBranch(false);
    setHistory((h) => [...h, currentNodeId]);
    setCurrentNodeId(option.targetNodeId || option.nextNodeId);
    setNodeKey((k) => k + 1);
    setPhase("playing");
  }, [currentNodeId]);

  // Restart
  const handleRestart = useCallback(() => {
    setPhase("intro");
    setCurrentNodeId(null);
    setAffinity(10);
    setHistory([]);
    setShowBranch(false);
    setNodeKey((k) => k + 1);
  }, []);

  // Affinity bar width (0-100, cap at 100)
  const affinityPct = Math.min(100, Math.max(0, affinity));

  return (
    <div style={{
      position: "fixed", inset: 0,
      background: "#000",
      fontFamily: "-apple-system, BlinkMacSystemFont, 'PingFang SC', sans-serif",
      overflow: "hidden",
      userSelect: "none",
    }}>
      <style>{`
        @keyframes subtitleFadeIn {
          from { opacity: 0; transform: translateY(8px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes heartbeat {
          0%, 100% { transform: scale(1); }
          50% { transform: scale(1.2); }
        }
        @keyframes tapBlink {
          0%, 100% { opacity: 0.35; }
          50% { opacity: 0.75; }
        }
        @keyframes tnpKbZoomIn {
          0% { transform: scale(1); }
          100% { transform: scale(1.12); }
        }
        @keyframes tnpKbPanRight {
          0% { transform: scale(1.08) translateX(-3%); }
          100% { transform: scale(1.08) translateX(3%); }
        }
        @keyframes tnpKbPanUp {
          0% { transform: scale(1.12) translateY(3%); }
          100% { transform: scale(1.12) translateY(-2%); }
        }
        @keyframes tnpKbZoomSlow {
          0% { transform: scale(1.04); }
          100% { transform: scale(1.14); }
        }
      `}</style>

      {/* ── Intro Screen ── */}
      {phase === "intro" && (
        <div style={{
          position: "absolute", inset: 0,
          background: "linear-gradient(180deg, #1a0500 0%, #0d0d0d 100%)",
          display: "flex", flexDirection: "column",
          alignItems: "center", justifyContent: "center",
          padding: "40px 24px",
          animation: "fadeIn 0.6s ease both",
        }}>
          <div style={{
            width: "72px", height: "72px", borderRadius: "20px",
            background: "rgba(232,168,124,0.15)",
            border: "1px solid rgba(232,168,124,0.3)",
            display: "flex", alignItems: "center", justifyContent: "center",
            marginBottom: "24px",
          }}>
            <Heart size={32} fill="#E8A87C" style={{ color: "#E8A87C" }} />
          </div>
          <h1 style={{
            color: "#F5F0EB", fontSize: "22px", fontWeight: "700",
            textAlign: "center", lineHeight: "1.4", marginBottom: "8px",
          }}>
            {gameData?.title || "互动影游"}
          </h1>
          <p style={{
            color: "rgba(255,255,255,0.4)", fontSize: "12px",
            letterSpacing: "0.1em", marginBottom: "8px",
          }}>
            共 {Object.keys(gameData?.nodes || {}).length} 个节点
          </p>
          <p style={{
            color: "rgba(255,255,255,0.35)", fontSize: "13px",
            textAlign: "center", lineHeight: "1.8",
            maxWidth: "280px", marginBottom: "48px",
          }}>
            你的每一个选择，都将改变与他之间的故事走向。
          </p>
          <button
            onClick={startGame}
            style={{
              display: "flex", alignItems: "center", gap: "10px",
              padding: "16px 40px", borderRadius: "50px", border: "none",
              background: "linear-gradient(135deg, #E8A87C, #C8906A)",
              color: "#1A0E08", fontSize: "15px", fontWeight: "700",
              cursor: "pointer",
              boxShadow: "0 8px 32px rgba(232,168,124,0.35)",
            }}
          >
            <Play size={16} fill="#1A0E08" style={{ color: "#1A0E08" }} />
            开始互动
          </button>
          <button
            onClick={() => navigate('/recreation-create')}
            style={{
              display: "flex", alignItems: "center", gap: "6px",
              background: "none", border: "none",
              color: "rgba(255,255,255,0.35)", fontSize: "12px",
              cursor: "pointer", padding: "8px 16px",
            }}
          >
            <ArrowLeft size={13} />
            返回编辑
          </button>
          <button
            onClick={() => setShowPublish(true)}
            style={{
              display: "flex", alignItems: "center", gap: "6px",
              background: "none", border: "none",
              color: "rgba(255,255,255,0.35)", fontSize: "12px",
              cursor: "pointer", padding: "8px 16px",
            }}
          >
            <Upload size={13} />
            发布到圈子
          </button>
        </div>
      )}

      {/* ── Playing / Branching ── */}
      {(phase === "playing" || phase === "branching") && currentNode && (
        <div style={{ position: "absolute", inset: 0 }}>
          {/* Content */}
          {currentNode.type === "video" && (
            <VideoPlayer
              videoUrl={currentNode.videoUrl}
              onComplete={handleNodeComplete}
            />
          )}
          {(currentNode.type === "slideshow" || currentNode.type === "mixed") && (
            <SlideshowPlayer
              key={currentNodeId}
              slides={currentNode.slides}
              onComplete={handleNodeComplete}
            />
          )}
          {/* 故事树节点：无 type 字段或为 tree 类型 —— 使用 TreeNodePlayer（tap-to-advance 模式）*/}
          {currentNode.type !== "video" && currentNode.type !== "slideshow" && currentNode.type !== "mixed" && (
            <TreeNodePlayer
              key={`treenode-${currentNodeId}-${nodeKey}`}
              node={currentNode}
              onComplete={handleNodeComplete}
              branchActive={showBranch}
              onBranchReady={() => {
                setShowBranch(true);
                setPhase("branching");
              }}
            />
          )}

          {/* Top gradient overlay */}
          <div style={{
            position: "absolute", top: 0, left: 0, right: 0, height: "120px",
            background: "linear-gradient(180deg, rgba(0,0,0,0.7) 0%, transparent 100%)",
            pointerEvents: "none",
          }} />

          {/* Header */}
          <div style={{
            position: "absolute", top: 0, left: 0, right: 0,
            padding: "48px 16px 16px",
            display: "flex", alignItems: "center", justifyContent: "space-between",
          }}>
            <button
              onClick={onBack ? onBack : () => navigate('/recreation-create')}
              style={{
                width: "36px", height: "36px", borderRadius: "50%",
                background: "rgba(0,0,0,0.4)", border: "1px solid rgba(255,255,255,0.15)",
                display: "flex", alignItems: "center", justifyContent: "center",
                cursor: "pointer",
              }}
            >
              <ArrowLeft size={16} style={{ color: "#fff" }} />
            </button>
            <span style={{
              color: "rgba(255,255,255,0.7)", fontSize: "13px",
              fontWeight: "600", letterSpacing: "0.04em",
            }}>
              心动禁区 · 互动影游
            </span>
            <button
              onClick={() => setShowPublish(true)}
              style={{
                width: "36px", height: "36px", borderRadius: "50%",
                background: "rgba(0,0,0,0.4)", border: "1px solid rgba(255,255,255,0.15)",
                display: "flex", alignItems: "center", justifyContent: "center",
                cursor: "pointer",
              }}
            >
              <Upload size={16} style={{ color: "#E8A87C" }} />
            </button>
          </div>

          {/* Affinity indicator (bottom bar)：只在没有 tap-to-advance 内容时显示 */}
          {!showBranch && (currentNode.type === "video" || currentNode.type === "slideshow" || currentNode.type === "mixed") && (
            <div style={{
              position: "absolute", bottom: "24px", left: "24px", right: "24px",
            }}>
              <div style={{
                display: "flex", alignItems: "center", gap: "8px", marginBottom: "6px",
              }}>
                <Heart
                  size={13}
                  fill="#E8A87C"
                  style={{ color: "#E8A87C", animation: "heartbeat 1.5s ease infinite" }}
                />
                <span style={{ color: "#E8A87C", fontSize: "11px", fontWeight: "600" }}>
                  心动值 {affinity}
                </span>
              </div>
              <div style={{
                height: "3px", borderRadius: "2px",
                background: "rgba(255,255,255,0.1)", overflow: "hidden",
              }}>
                <div style={{
                  height: "100%", borderRadius: "2px",
                  width: `${affinityPct}%`,
                  background: "linear-gradient(90deg, #E8A87C, #C2185B)",
                  transition: "width 0.6s ease",
                }} />
              </div>
            </div>
          )}

          {/* Branch Panel */}
          {showBranch && currentNode.branch && (
            <BranchPanel
              branch={currentNode.branch}
              affinity={affinity}
              onSelect={handleBranchSelect}
            />
          )}
        </div>
      )}

      {/* ── Ending ── */}
      {phase === "ending" && currentNode && currentNode.ending && (
        <div style={{ position: "absolute", inset: 0 }}>
          {/* 背景层：有 slides 用 SlideshowPlayer，没有用 imageUrl 图或纯黑 */}
          {Array.isArray(currentNode.slides) && currentNode.slides.length > 0 ? (
            <SlideshowPlayer
              key={`${currentNodeId}-end`}
              slides={currentNode.slides}
              onComplete={() => {}}
            />
          ) : currentNode.imageUrl ? (
            <img
              src={currentNode.imageUrl}
              style={{
                position: "absolute", inset: 0, width: "100%", height: "100%",
                objectFit: "cover", filter: "brightness(0.45)",
              }}
              alt=""
            />
          ) : (
            <div style={{
              position: "absolute", inset: 0,
              background: "linear-gradient(180deg, #1a0a18 0%, #0d0d0d 100%)",
            }} />
          )}
          <EndingCard
            ending={currentNode.ending}
            affinity={affinity}
            onRestart={handleRestart}
            onNavigateCreate={() => navigate('/recreation-create')}
            onPublish={() => setShowPublish(true)}
          />
        </div>
      )}

      {/* ── Publish Modal ── */}
      {showPublish && (
        <PublishModal
          gameTitle={gameData?.title || "互动影游"}
          onPublish={(promoText) => {
            publishRecreation(gameData, promoText);
          }}
          onClose={() => setShowPublish(false)}
        />
      )}
    </div>
  );
};

export default RecreationPlayer;
