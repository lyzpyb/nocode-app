import { useState, useCallback, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  ArrowLeft, Play, Loader, CheckCircle, AlertCircle,
  Sparkles, ImageIcon, Mic, Film, Headphones,
  Type, Video, Volume2, Send, RotateCcw,
  ChevronDown, ChevronUp,
} from "lucide-react";
import {
  generateStoryTree,
  DEFAULT_CHARACTERS,
} from "@/lib/recreation/treeGenerator";
import { generateAllAssets, pollVideoTask, REFERENCE_IMAGES, IMAGE_MODELS } from "@/lib/recreation/assetGenerator";

// ─── Format options ────────────────────────────────────────────────────────

const FORMAT_OPTIONS = [
  {
    id: "graphic",
    label: "图文",
    desc: "分镜画面 + 旁白对话，沉浸式阅读",
    icon: Type,
    color: "#60A5FA",
    bg: "rgba(96,165,250,0.08)",
    border: "rgba(96,165,250,0.25)",
    hints: ["雨天躲进同一个屋檐下", "停电夜他突然靠近", "他喝醉了说喜欢我", "温泉旅行的意外"],
  },
  {
    id: "video",
    label: "视频",
    desc: "画面 + 语音配音，自动合成动态影游",
    icon: Video,
    color: "#F472B6",
    bg: "rgba(244,114,182,0.08)",
    border: "rgba(244,114,182,0.25)",
    hints: ["午夜来电，对面传来他的声音", "他突然出现在我身后", "雨夜，一把伞两个人", "深夜便利店偶遇"],
  },
  {
    id: "asmr",
    label: "ASMR 语音",
    desc: "沉浸式语音叙事，戴上耳机感受心动",
    icon: Headphones,
    color: "#9B59B6",
    bg: "rgba(155,89,182,0.08)",
    border: "rgba(155,89,182,0.25)",
    hints: ["霸道哄睡", "温柔情话", "耳边的低语", "深夜电台他的告白"],
  },
];

// ─── NodeCard (tree editor) ────────────────────────────────────────────────

const NODE_COLORS = { start: "#22C55E", branch: "#9B59B6", ending: "#E8A87C", default: "#60A5FA" };

const NodeCard = ({ node, index, expanded, onToggle, onProseChange }) => {
  const color = NODE_COLORS[node.type] || NODE_COLORS.default;
  return (
    <div style={{
      borderRadius: "12px", marginBottom: "8px", overflow: "hidden",
      background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.07)",
    }}>
      {/* Header */}
      <button onClick={onToggle} style={{
        width: "100%", display: "flex", alignItems: "center", justifyContent: "space-between",
        padding: "12px 14px", background: "none", border: "none", cursor: "pointer",
        textAlign: "left",
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: "8px", flex: 1, minWidth: 0 }}>
          <span style={{
            background: color + "22", color, fontSize: "10px",
            fontWeight: "700", padding: "2px 7px", borderRadius: "6px", flexShrink: 0,
          }}>
            {node.type?.toUpperCase() || "NODE"}
          </span>
          <span style={{
            color: "rgba(245,240,235,0.8)", fontSize: "13px", fontWeight: "600",
            overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
          }}>
            {node.title || node.id}
          </span>
          {node.ending && (
            <span style={{
              background: "rgba(232,168,124,0.15)", color: "#E8A87C",
              fontSize: "10px", padding: "2px 6px", borderRadius: "5px", flexShrink: 0,
            }}>
              {node.ending.type === "sweet" ? "💗结局" : "🌙结局"}
            </span>
          )}
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: "6px", flexShrink: 0 }}>
          {node.branch && (
            <span style={{ color: "rgba(255,255,255,0.3)", fontSize: "10px" }}>
              {node.branch.options?.length || 0}分支
            </span>
          )}
          {expanded
            ? <ChevronUp size={14} style={{ color: "rgba(255,255,255,0.4)" }} />
            : <ChevronDown size={14} style={{ color: "rgba(255,255,255,0.4)" }} />}
        </div>
      </button>

      {/* Expanded content */}
      {expanded && (
        <div style={{ padding: "0 14px 14px", borderTop: "1px solid rgba(255,255,255,0.05)" }}>
          {/* Visual Meta — 支持数组（5镜头）或单对象 */}
          {node.visualMeta && (() => {
            const metaArray = Array.isArray(node.visualMeta) ? node.visualMeta : [node.visualMeta];
            return (
              <div style={{
                padding: "10px 0", borderBottom: "1px solid rgba(255,255,255,0.05)",
                marginBottom: "10px",
              }}>
                {metaArray.map((meta, mi) => (
                  <div key={mi} style={{
                    display: "flex", flexWrap: "wrap", gap: "6px",
                    marginBottom: mi < metaArray.length - 1 ? "6px" : 0,
                  }}>
                    {metaArray.length > 1 && (
                      <span style={{
                        background: "rgba(96,165,250,0.12)", borderRadius: "6px",
                        padding: "3px 8px", fontSize: "10px", color: "#60A5FA", fontWeight: "700",
                      }}>
                        镜头{mi + 1}
                      </span>
                    )}
                    {Object.entries(meta).map(([k, v]) => v && (
                      <span key={k} style={{
                        background: "rgba(255,255,255,0.04)", borderRadius: "6px",
                        padding: "3px 8px", fontSize: "10px", color: "rgba(245,240,235,0.5)",
                      }}>
                        <span style={{ color: "rgba(255,255,255,0.25)" }}>{k}: </span>{v}
                      </span>
                    ))}
                  </div>
                ))}
              </div>
            );
          })()}

          {/* Prose edit */}
          {Array.isArray(node.prose) && (
            <div style={{ marginBottom: "10px" }}>
              <p style={{ color: "rgba(255,255,255,0.3)", fontSize: "10px", marginBottom: "6px" }}>旁白（可编辑）</p>
              {node.prose.map((para, pi) => (
                <textarea
                  key={pi}
                  value={para}
                  onChange={(e) => onProseChange(pi, e.target.value)}
                  style={{
                    width: "100%", padding: "8px 10px", marginBottom: "6px",
                    borderRadius: "8px", background: "rgba(0,0,0,0.3)",
                    border: "1px solid rgba(255,255,255,0.08)",
                    color: "rgba(245,240,235,0.75)", fontSize: "12px",
                    lineHeight: "1.7", resize: "vertical", outline: "none",
                    minHeight: "60px",
                  }}
                />
              ))}
            </div>
          )}

          {/* Dialogue */}
          {Array.isArray(node.dialogue) && node.dialogue.length > 0 && (
            <div style={{ marginBottom: "10px" }}>
              <p style={{ color: "rgba(255,255,255,0.3)", fontSize: "10px", marginBottom: "6px" }}>对话</p>
              {node.dialogue.map((d, di) => (
                <div key={di} style={{
                  display: "flex", gap: "8px", marginBottom: "6px",
                  padding: "8px 10px", borderRadius: "8px",
                  background: "rgba(232,168,124,0.04)",
                  border: "1px solid rgba(232,168,124,0.1)",
                }}>
                  <span style={{ color: "#E8A87C", fontSize: "11px", fontWeight: "700", flexShrink: 0, paddingTop: "1px" }}>
                    {d.speaker}
                  </span>
                  <span style={{ color: "rgba(245,240,235,0.65)", fontSize: "12px", lineHeight: "1.6" }}>
                    {d.text}
                  </span>
                </div>
              ))}
            </div>
          )}

          {/* Branch options */}
          {node.branch && (
            <div>
              <p style={{ color: "rgba(255,255,255,0.3)", fontSize: "10px", marginBottom: "6px" }}>
                分支：{node.branch.question}
              </p>
              {node.branch.options?.map((opt) => (
                <div key={opt.id} style={{
                  display: "flex", alignItems: "center", gap: "8px",
                  padding: "7px 10px", borderRadius: "8px", marginBottom: "5px",
                  background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.07)",
                }}>
                  <span style={{ color: "rgba(245,240,235,0.7)", fontSize: "12px", flex: 1 }}>{opt.label}</span>
                  <span style={{ color: "rgba(255,255,255,0.25)", fontSize: "10px" }}>→ {opt.targetNodeId}</span>
                  {opt.affinityChange !== 0 && (
                    <span style={{ color: opt.affinityChange > 0 ? "#E8A87C" : "#F472B6", fontSize: "10px" }}>
                      {opt.affinityChange > 0 ? "+" : ""}{opt.affinityChange}💗
                    </span>
                  )}
                </div>
              ))}
            </div>
          )}

          {/* Ending */}
          {node.ending && (
            <div style={{
              padding: "10px 12px", borderRadius: "8px",
              background: "rgba(232,168,124,0.06)",
              border: "1px solid rgba(232,168,124,0.15)",
            }}>
              <p style={{ color: "#E8A87C", fontSize: "12px", fontWeight: "700", marginBottom: "4px" }}>
                {node.ending.title}
              </p>
              <p style={{ color: "rgba(245,240,235,0.55)", fontSize: "11px", lineHeight: "1.6" }}>
                {node.ending.description}
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

// ─── Main Page ────────────────────────────────────────────────────────────

const RecreationCreate = () => {
  const navigate = useNavigate();

  // Flow: input+format → [writing → editing → assetGen] | [autoGenerating] → done
  const [flowStep, setFlowStep] = useState("input"); // input | writing | editing | assetGen | autoGenerating | done
  const [userInput, setUserInput] = useState("");
  const [selectedFormat, setSelectedFormat] = useState(FORMAT_OPTIONS[0]);

  // Voice
  const [isListening, setIsListening] = useState(false);
  const recognitionRef = useRef(null);

  // Generation
  const [generating, setGenerating] = useState(false);
  const [genError, setGenError] = useState(null);
  const [gameData, setGameData] = useState(null);

  // Step editing (tree nodes)
  const [expandedNodes, setExpandedNodes] = useState({});

  // Asset generation
  const [assetProgress, setAssetProgress] = useState({ current: 0, total: 0, nodeId: "", type: "", description: "", estimatedMs: 0, totalEstimatedMs: 0, elapsedMs: 0, phase: "" });
  const [assetResult, setAssetResult] = useState(null);
  const [countdown, setCountdown] = useState(0);
  const countdownRef = useRef(null);
  const [imageModel, setImageModel] = useState("doubao");

  // Full generation pipeline status
  const [pipelineStatus, setPipelineStatus] = useState(""); // "writing" | "painting" | "voicing" | "compositing"

  const bottomRef = useRef(null);
  const inputRef = useRef(null);

  useEffect(() => {
    if (flowStep === "input" && inputRef.current) {
      inputRef.current.focus();
    }
  }, [flowStep]);

  // Cleanup timers and speech recognition on unmount
  useEffect(() => {
    return () => {
      if (countdownRef.current) clearInterval(countdownRef.current);
      if (recognitionRef.current) {
        try { recognitionRef.current.stop(); } catch (_) {}
      }
    };
  }, []);

  // 恢复未完成的视频任务
  useEffect(() => {
    let cancelled = false;

    (async () => {
      try {
        const raw = localStorage.getItem("afterline_pending_task");
        if (!raw) return;
        const pending = JSON.parse(raw);

        // ── 统一过期检查：30分钟内有效 ──
        if (pending.createdAt && Date.now() - pending.createdAt > 30 * 60 * 1000) {
          try { localStorage.removeItem("afterline_pending_task"); } catch (_) {}
          return;
        }

        // ── 已完成：直接恢复到 done 页面 ──
        if (pending.status === "done" && pending.videoUrl) {
          if (cancelled) return;
          const minimalGameData = {
            title: pending.title || "你的专属故事",
            nodes: { node_recovered: { id: "node_recovered", videoUrl: pending.videoUrl } },
          };
          setGameData(minimalGameData);
          setSelectedFormat(FORMAT_OPTIONS.find((f) => f.id === "video") || FORMAT_OPTIONS[0]);
          setFlowStep("done");
          return;
        }

        // ── 轮询中：恢复轮询 ──
        if (pending.status === "polling" && pending.videoTaskId) {
          if (cancelled) return;
          const restoredGameData = pending.gameData || {
            title: "你的专属故事",
            nodes: { node_recovered: { id: "node_recovered" } },
          };
          setGameData(restoredGameData);
          setSelectedFormat(FORMAT_OPTIONS.find((f) => f.id === "video") || FORMAT_OPTIONS[0]);
          setFlowStep("autoGenerating");
          setGenerating(true);
          setPipelineStatus("compositing");

          try {
            const videoUrl = await pollVideoTask(pending.videoTaskId, {
              pollIntervalMs: 10000,
              maxPollAttempts: 120,
              onPollStatus: (attempt, status) => {
                if (cancelled) return;
                const statusMap = { queued: "排队中", processing: "生成中", running: "生成中", submitted: "已提交" };
                const statusText = statusMap[status] || status;
                const elapsed = attempt * 10;
                setAssetProgress((prev) => ({
                  ...prev,
                  description: `视频：${statusText}（已等待 ${elapsed}s）`,
                  phase: "polling",
                }));
              },
            });

            if (cancelled) return;

            const nodes = restoredGameData.nodes || {};
            const firstNodeId = Object.keys(nodes)[0];
            if (firstNodeId) nodes[firstNodeId].videoUrl = videoUrl;
            setGameData({ ...restoredGameData, nodes });

            try {
              localStorage.setItem("afterline_pending_task", JSON.stringify({
                ...pending,
                status: "done",
                videoUrl,
              }));
            } catch (_) {}

            setFlowStep("done");
          } catch (err) {
            if (cancelled) return;
            try { localStorage.removeItem("afterline_pending_task"); } catch (_) {}
            setGenError(err?.message || "视频恢复失败，请重新生成");
            setFlowStep("input");
          } finally {
            if (!cancelled) setGenerating(false);
          }
          return;
        }

        // ── 生成中（已提交但未拿到 taskId）：重新跑 generateAllAssets ──
        if (pending.status === "generating" && pending.gameData) {
          if (cancelled) return;
          const restoredGameData = pending.gameData;
          setGameData(restoredGameData);
          setSelectedFormat(FORMAT_OPTIONS.find((f) => f.id === "video") || FORMAT_OPTIONS[0]);
          setFlowStep("autoGenerating");
          setGenerating(true);
          setPipelineStatus("compositing");

          try {
            const assetRes = await generateAllAssets(restoredGameData, {
              concurrency: 2,
              mode: "video",
              mainCharacter: "沈彦希和林夏",
              referenceImages: null,
              imageModel: "doubao",
              singleImagePerNode: true,
              onVideoTaskId: (taskId) => {
                try {
                  const p = JSON.parse(localStorage.getItem("afterline_pending_task") || "{}");
                  p.videoTaskId = taskId;
                  p.status = "polling";
                  localStorage.setItem("afterline_pending_task", JSON.stringify(p));
                } catch (_) {}
              },
              onProgress: (current, total, nodeId, type, extra) => {
                if (cancelled) return;
                setAssetProgress({ current, total, nodeId, type, ...(extra || {}) });
                if (extra?.phase === "polling") {
                  if (countdownRef.current) clearInterval(countdownRef.current);
                  setCountdown(0);
                }
              },
            });

            if (cancelled) return;

            const finishedVideoUrl = Object.values(restoredGameData.nodes || {})
              .map((n) => n.videoUrl).find(Boolean);

            try {
              const p = JSON.parse(localStorage.getItem("afterline_pending_task") || "{}");
              p.status = "done";
              p.videoUrl = finishedVideoUrl || null;
              delete p.gameData;
              localStorage.setItem("afterline_pending_task", JSON.stringify(p));
            } catch (_) {}

            setAssetResult(assetRes);
            setFlowStep("done");
          } catch (err) {
            if (cancelled) return;
            try { localStorage.removeItem("afterline_pending_task"); } catch (_) {}
            setGenError(err?.message || "视频恢复失败，请重新生成");
            setFlowStep("input");
          } finally {
            if (!cancelled) setGenerating(false);
          }
          return;
        }

        // ── 兜底：未知状态，清除 ──
        try { localStorage.removeItem("afterline_pending_task"); } catch (_) {}

      } catch (_) {
        // JSON.parse 或其他异常，静默忽略
      }
    })();

    return () => { cancelled = true; };
  }, []);

  // Derive nodeEntries from gameData
  const nodeEntries = gameData ? Object.entries(gameData.nodes) : [];

  // ── Voice input ──
  const toggleVoice = useCallback(() => {
    if (isListening) {
      recognitionRef.current?.stop();
      setIsListening(false);
      return;
    }

    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      alert("您的浏览器不支持语音输入");
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.lang = "zh-CN";
    recognition.continuous = false;
    recognition.interimResults = true;

    recognition.onresult = (event) => {
      let transcript = "";
      for (let i = 0; i < event.results.length; i++) {
        transcript += event.results[i][0].transcript;
      }
      setUserInput(transcript);
    };

    recognition.onend = () => setIsListening(false);
    recognition.onerror = () => setIsListening(false);

    recognitionRef.current = recognition;
    recognition.start();
    setIsListening(true);
  }, [isListening]);

  // ── Submit: start generation based on format ──
  const handleSubmit = () => {
    if (!userInput.trim()) return;
    setGenError(null);
    handleSelectFormat(selectedFormat);
  };

  // ── Generate story tree ──
  const doGenerateTree = useCallback(async () => {
    setGenerating(true);
    setGenError(null);
    setGameData(null);
    setPipelineStatus("writing");

    const treeResult = await generateStoryTree(
      {
        characters: DEFAULT_CHARACTERS,
        episodeSummary: userInput.trim(),
        startingScene: userInput.trim(),
        keyDialogues: [],
        emotionalArc: userInput.trim(),
        totalNodes: 5,
        branchPoints: 2,
        endings: 2,
      },
      { variant: "A" }
    );

    setPipelineStatus("");
    setGenerating(false);

    if (!treeResult.success) {
      setGenError(treeResult.error || "故事生成失败，请重试");
      return null;
    }

    setGameData(treeResult.data);
    return treeResult.data;
  }, [userInput]);

  // ── Select format ──
  const handleSelectFormat = useCallback(async (format) => {
    setSelectedFormat(format);
    setGenError(null);
    setAssetResult(null);
    setAssetProgress({ current: 0, total: 0, nodeId: "", type: "" });
    setExpandedNodes({});

    if (format.id === "graphic") {
      // 图文: go to writing → editing → assetGen flow
      setFlowStep("writing");
      const tree = await doGenerateTree();
      if (tree) {
        setFlowStep("editing");
      } else {
        setFlowStep("input");
      }
    } else {
      // 视频/ASMR: auto pipeline
      setFlowStep("autoGenerating");
      setGenerating(true);

      try {
        setPipelineStatus("writing");
        const treeResult = await generateStoryTree(
          {
            characters: DEFAULT_CHARACTERS,
            episodeSummary: userInput.trim(),
            startingScene: userInput.trim(),
            keyDialogues: [],
            emotionalArc: userInput.trim(),
            totalNodes: 5,
            branchPoints: 2,
            endings: 2,
          },
          { variant: "A" }
        );

        if (!treeResult.success) {
          setGenerating(false);
          setPipelineStatus("");
          setFlowStep("input");
          setGenError(treeResult.error || "故事生成失败，请重试");
          return;
        }

        setGameData(treeResult.data);

        // Phase 2: Generate assets
        const assetMode = format.id === "video" ? "video" : format.id === "asmr" ? "asmr" : "image";
        setPipelineStatus("compositing");

        if (format.id !== "graphic") {
          // 视频模式：持久化任务状态到 localStorage
          if (format.id === "video") {
            try {
              localStorage.setItem("afterline_pending_task", JSON.stringify({
                status: "generating",
                format: format.id,
                title: treeResult.data.title,
                gameData: treeResult.data,
                createdAt: Date.now(),
              }));
            } catch (_) {}
          }

          const assetRes = await generateAllAssets(treeResult.data, {
            concurrency: 2,
            mode: assetMode,
            mainCharacter: "沈彦希和林夏",
            referenceImages: REFERENCE_IMAGES[1] || null,
            imageModel: "doubao",
            singleImagePerNode: true,
            onVideoTaskId: (taskId) => {
              try {
                const pending = JSON.parse(localStorage.getItem("afterline_pending_task") || "{}");
                pending.videoTaskId = taskId;
                pending.status = "polling";
                localStorage.setItem("afterline_pending_task", JSON.stringify(pending));
              } catch (_) {}
            },
            onProgress: (current, total, nodeId, type, extra) => {
              setAssetProgress({ current, total, nodeId, type, ...(extra || {}) });
              if (extra?.phase === 'start' && extra.estimatedMs > 0) {
                if (countdownRef.current) clearInterval(countdownRef.current);
                setCountdown(Math.ceil(extra.estimatedMs / 1000));
                countdownRef.current = setInterval(() => {
                  setCountdown((c) => (c > 1 ? c - 1 : 0));
                }, 1000);
              }
              if (extra?.phase === 'polling') {
                if (countdownRef.current) clearInterval(countdownRef.current);
                setCountdown(0);
              }
              if (extra?.phase === 'done') {
                if (countdownRef.current) clearInterval(countdownRef.current);
                setCountdown(0);
              }
            },
          });

          if (countdownRef.current) clearInterval(countdownRef.current);
          setAssetResult(assetRes);

          // 视频模式：生成完成后更新 localStorage 为 done
          if (format.id === "video") {
            try {
              const finishedVideoUrl = Object.values(treeResult.data.nodes || {})
                .map((n) => n.videoUrl)
                .find(Boolean);
              const pending = JSON.parse(localStorage.getItem("afterline_pending_task") || "{}");
              pending.status = "done";
              pending.videoUrl = finishedVideoUrl || null;
              delete pending.gameData;
              localStorage.setItem("afterline_pending_task", JSON.stringify(pending));
            } catch (_) {}
          }
        }

        setPipelineStatus("");
        setGenerating(false);
        setFlowStep("done");
      } catch (err) {
        if (countdownRef.current) clearInterval(countdownRef.current);
        setGenerating(false);
        setPipelineStatus("");
        setFlowStep("input");
        setGenError(err?.message || "生成过程出现异常，请重试");
      }
    }
  }, [userInput, doGenerateTree]);

  // ── Tree editing helpers ──
  const toggleNode = (nodeId) => {
    setExpandedNodes((prev) => ({ ...prev, [nodeId]: !prev[nodeId] }));
  };

  const handleProseChange = (nodeId, pi, val) => {
    setGameData((prev) => {
      const next = JSON.parse(JSON.stringify(prev));
      next.nodes[nodeId].prose[pi] = val;
      return next;
    });
  };

  // ── Go from editing to asset generation ──
  const handleGoAssetGen = () => {
    setFlowStep("assetGen");
  };

  // ── Start asset generation (graphic format) ──
  const [assetGenRunning, setAssetGenRunning] = useState(false);

  const handleStartAssetGen = useCallback(async () => {
    setAssetGenRunning(true);
    setPipelineStatus("compositing");

    try {
      const assetRes = await generateAllAssets(gameData, {
        concurrency: 2,
        mainCharacter: "沈彦希和林夏",
        referenceImages: REFERENCE_IMAGES[1] || null,
        imageModel,
        skipImage: false,
        skipTTS: false,
        singleImagePerNode: true,
        onProgress: (current, total, nodeId, type, extra) => {
          setAssetProgress({ current, total, nodeId, type, ...(extra || {}) });
          if (extra?.phase === 'start' && extra.estimatedMs > 0) {
            if (countdownRef.current) clearInterval(countdownRef.current);
            setCountdown(Math.ceil(extra.estimatedMs / 1000));
            countdownRef.current = setInterval(() => {
              setCountdown((c) => (c > 1 ? c - 1 : 0));
            }, 1000);
          }
          if (extra?.phase === 'polling') {
            if (countdownRef.current) clearInterval(countdownRef.current);
            setCountdown(0);
          }
          if (extra?.phase === 'done') {
            if (countdownRef.current) clearInterval(countdownRef.current);
            setCountdown(0);
          }
        },
      });

      if (countdownRef.current) clearInterval(countdownRef.current);
      setAssetResult(assetRes);
      setPipelineStatus("");
      setAssetGenRunning(false);
      setFlowStep("done");
    } catch (err) {
      if (countdownRef.current) clearInterval(countdownRef.current);
      setPipelineStatus("");
      setAssetGenRunning(false);
      setFlowStep("input");
      setGenError(err?.message || "素材生成出现异常，请重试");
    }
  }, [gameData, imageModel]);

  // ── Retry ──
  const handleRetry = () => {
    try { localStorage.removeItem("afterline_pending_task"); } catch (_) {}
    setFlowStep("input");
    setGenError(null);
    setGameData(null);
    setAssetResult(null);
    setGenerating(false);
    setAssetGenRunning(false);
    setSelectedFormat(FORMAT_OPTIONS[0]);
    setPipelineStatus("");
    setExpandedNodes({});
  };

  // ── Play ──
  const handlePlay = () => {
    try {
      sessionStorage.setItem("recreation_game_data", JSON.stringify(gameData));
      navigate("/recreation");
    } catch (err) {
      alert("数据过大，无法保存到本地存储，请减少场景数量后重试");
    }
  };

  // ── Pipeline progress ──
  const progressPct = assetProgress.total > 0
    ? Math.round((assetProgress.current / assetProgress.total) * 100)
    : 0;

  const pipelineSteps = [
    { key: "writing", label: "构思剧情", icon: Sparkles },
    { key: "compositing", label: selectedFormat?.id === "asmr" ? "生成音频" : "合成视频", icon: Film },
  ];

  const activePipelineIdx = pipelineSteps.findIndex((s) => s.key === pipelineStatus);

  // ── Back handler ──
  const handleBack = () => {
    if (flowStep === "input") {
      navigate(-1);
    } else if (flowStep === "editing") {
      // Back to input
      setFlowStep("input");
      setGameData(null);
    } else if (flowStep === "assetGen") {
      setFlowStep("editing");
      setAssetProgress({ current: 0, total: 0, nodeId: "", type: "" });
      setAssetResult(null);
    } else if (flowStep === "autoGenerating") {
      navigate(-1);
    } else {
      handleRetry();
    }
  };

  const formatColor = selectedFormat?.color || "#E8A87C";

  return (
    <div style={{
      background: "#0D0D0D", minHeight: "100vh",
      maxWidth: "480px", margin: "0 auto",
      fontFamily: "-apple-system, BlinkMacSystemFont, 'PingFang SC', sans-serif",
    }}>
      <style>{`
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
        @keyframes fadeIn { from { opacity: 0; transform: translateY(12px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes fadeInUp { from { opacity: 0; transform: translateY(20px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes pulse { 0%,100% { opacity:0.4; } 50% { opacity:1; } }
        @keyframes breathe { 0%,100% { transform: scale(1); } 50% { transform: scale(1.03); } }
        @keyframes shimmer { 0% { background-position: -200% 0; } 100% { background-position: 200% 0; } }
        @keyframes micPulse { 0%,100% { box-shadow: 0 0 0 0 rgba(232,168,124,0.4); } 50% { box-shadow: 0 0 0 8px rgba(232,168,124,0); } }
        @keyframes dotBounce { 0%,80%,100% { transform: translateY(0); } 40% { transform: translateY(-6px); } }
        .input-area::placeholder { color: rgba(255,255,255,0.2); }
        .format-card:hover { transform: translateY(-2px); }
        .format-card { transition: all 0.2s ease; }
      `}</style>

      {/* Header */}
      <div style={{
        position: "sticky", top: 0, zIndex: 50,
        background: "rgba(13,13,13,0.96)", backdropFilter: "blur(12px)",
        borderBottom: "1px solid rgba(255,255,255,0.05)",
        padding: "14px 16px 10px",
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
          <button
            onClick={handleBack}
            style={{
              width: "32px", height: "32px", borderRadius: "50%", flexShrink: 0,
              background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.1)",
              display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer",
            }}
          >
            <ArrowLeft size={14} style={{ color: "rgba(255,255,255,0.6)" }} />
          </button>
          <div>
            <span style={{ color: "#F5F0EB", fontSize: "15px", fontWeight: "700" }}>我的二创</span>
            <span style={{
              marginLeft: "8px", color: "rgba(255,255,255,0.3)", fontSize: "11px",
            }}>
              心动禁区
            </span>
          </div>
        </div>
      </div>

      {/* Content */}
      <div style={{ padding: "16px" }}>

        {/* ── Step: Input + Format (combined) ── */}
        {flowStep === "input" && (() => {
          const hints = selectedFormat?.hints || [];
          const placeholder = {
            graphic: "比如：停电夜，他突然靠近我，说了一个秘密…",
            video: "比如：午夜来电，对面传来他低沉的声音…",
            asmr: "比如：霸道哄睡、温柔情话…",
          }[selectedFormat?.id] || "描述你想创作的故事…";
          return (
            <div style={{ animation: "fadeIn 0.4s ease both" }}>
              {/* Hero */}
              <div style={{ textAlign: "center", padding: "24px 0 16px" }}>
                <h2 style={{ color: "#F5F0EB", fontSize: "18px", fontWeight: "700", marginBottom: "6px" }}>
                  描述你想创作的故事
                </h2>
                <p style={{ color: "rgba(255,255,255,0.35)", fontSize: "12px", lineHeight: "1.6" }}>
                  说出你的幻想，AI帮你实现
                </p>
              </div>

              {/* Format tabs (horizontal pill selector) */}
              <div style={{
                display: "flex", gap: "8px", marginBottom: "16px",
                padding: "4px", borderRadius: "12px",
                background: "rgba(255,255,255,0.03)",
                border: "1px solid rgba(255,255,255,0.06)",
              }}>
                {FORMAT_OPTIONS.map((opt) => {
                  const Icon = opt.icon;
                  const isActive = selectedFormat?.id === opt.id;
                  return (
                    <button
                      key={opt.id}
                      onClick={() => { setSelectedFormat(opt); }}
                      style={{
                        flex: 1, padding: "10px 8px", borderRadius: "10px",
                        border: "none", cursor: "pointer",
                        background: isActive ? `${opt.color}18` : "transparent",
                        display: "flex", alignItems: "center", justifyContent: "center", gap: "6px",
                        transition: "all 0.2s ease",
                      }}
                    >
                      <Icon size={14} style={{ color: isActive ? opt.color : "rgba(255,255,255,0.35)" }} />
                      <span style={{
                        color: isActive ? opt.color : "rgba(255,255,255,0.4)",
                        fontSize: "12px", fontWeight: isActive ? "700" : "500",
                      }}>
                        {opt.label}
                      </span>
                    </button>
                  );
                })}
              </div>

              {/* Format desc */}
              <p style={{
                color: `${selectedFormat?.color || "#E8A87C"}88`,
                fontSize: "11px", textAlign: "center",
                marginBottom: "14px",
              }}>
                {selectedFormat?.desc}
              </p>

              {/* Input area */}
              <div style={{
                borderRadius: "14px",
                background: "rgba(255,255,255,0.04)",
                border: `1.5px solid ${selectedFormat?.color || "#E8A87C"}30`,
                padding: "14px",
                marginBottom: "12px",
                transition: "border-color 0.2s ease",
              }}>
                <textarea
                  ref={inputRef}
                  value={userInput}
                  onChange={(e) => setUserInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && !e.shiftKey) {
                      e.preventDefault();
                      handleSubmit();
                    }
                  }}
                  placeholder={placeholder}
                  rows={4}
                  className="input-area"
                  style={{
                    width: "100%", padding: "0", background: "transparent",
                    border: "none", outline: "none", resize: "none",
                    color: "rgba(245,240,235,0.9)", fontSize: "14px",
                    lineHeight: "1.7", fontFamily: "inherit",
                  }}
                />
                <div style={{
                  display: "flex", alignItems: "center", justifyContent: "space-between",
                  marginTop: "8px", paddingTop: "8px",
                  borderTop: "1px solid rgba(255,255,255,0.06)",
                }}>
                  <span style={{ color: "rgba(255,255,255,0.2)", fontSize: "11px" }}>
                    {userInput.length > 0 ? `${userInput.length} 字` : "打字或语音输入"}
                  </span>
                  <div style={{ display: "flex", gap: "8px" }}>
                    <button
                      onClick={toggleVoice}
                      style={{
                        width: "36px", height: "36px", borderRadius: "50%",
                        background: isListening ? "rgba(232,168,124,0.15)" : "rgba(255,255,255,0.06)",
                        border: isListening ? "1.5px solid #E8A87C" : "1px solid rgba(255,255,255,0.1)",
                        display: "flex", alignItems: "center", justifyContent: "center",
                        cursor: "pointer", transition: "all 0.2s ease",
                        animation: isListening ? "micPulse 1.5s ease infinite" : "none",
                      }}
                    >
                      <Mic size={15} style={{ color: isListening ? "#E8A87C" : "rgba(255,255,255,0.4)" }} />
                    </button>
                    <button
                      onClick={handleSubmit}
                      disabled={!userInput.trim()}
                      style={{
                        width: "36px", height: "36px", borderRadius: "50%",
                        background: userInput.trim()
                          ? `linear-gradient(135deg, ${selectedFormat?.color || "#E8A87C"}, ${selectedFormat?.color || "#C8906A"}CC)`
                          : "rgba(255,255,255,0.05)",
                        border: "none",
                        display: "flex", alignItems: "center", justifyContent: "center",
                        cursor: userInput.trim() ? "pointer" : "not-allowed",
                        transition: "all 0.2s ease",
                      }}
                    >
                      <Send size={15} style={{ color: userInput.trim() ? "#1A0E08" : "rgba(255,255,255,0.2)" }} />
                    </button>
                  </div>
                </div>
              </div>

              {/* Quick prompts (format-specific) */}
              <div style={{ display: "flex", flexWrap: "wrap", gap: "6px" }}>
                {hints.map((hint) => (
                  <button
                    key={hint}
                    onClick={() => setUserInput(hint)}
                    style={{
                      padding: "6px 12px", borderRadius: "20px",
                      background: `${selectedFormat?.color || "#E8A87C"}08`,
                      border: `1px solid ${selectedFormat?.color || "#E8A87C"}20`,
                      color: `${selectedFormat?.color || "rgba(245,240,235,0.5)"}AA`,
                      fontSize: "11px",
                      cursor: "pointer", transition: "all 0.15s ease",
                    }}
                  >
                    {hint}
                  </button>
                ))}
              </div>
            </div>
          );
        })()}

        {/* ── Step: Writing (loading tree) ── */}
        {flowStep === "writing" && (
          <div style={{ animation: "fadeIn 0.4s ease both", textAlign: "center", padding: "48px 0" }}>
            <div style={{
              width: "72px", height: "72px", borderRadius: "20px",
              background: "rgba(96,165,250,0.08)",
              border: "1px solid rgba(96,165,250,0.2)",
              display: "flex", alignItems: "center", justifyContent: "center",
              margin: "0 auto 20px",
              animation: "breathe 2s ease-in-out infinite",
            }}>
              <Sparkles size={28} style={{ color: "#60A5FA" }} />
            </div>
            <h2 style={{ color: "#F5F0EB", fontSize: "18px", fontWeight: "700", marginBottom: "8px" }}>
              AI 正在构思剧情分支
            </h2>
            <p style={{ color: "rgba(255,255,255,0.35)", fontSize: "13px", lineHeight: "1.7" }}>
              根据你的灵感，生成多分支互动剧情…
            </p>
            <div style={{ display: "flex", justifyContent: "center", gap: "6px", marginTop: "24px" }}>
              {[0, 1, 2].map((i) => (
                <div key={i} style={{
                  width: "6px", height: "6px", borderRadius: "50%",
                  background: "#60A5FA",
                  animation: `dotBounce 1.2s ${i * 0.2}s ease infinite`,
                  opacity: 0.6,
                }} />
              ))}
            </div>
          </div>
        )}

        {/* ── Step: Editing (tree nodes) ── */}
        {flowStep === "editing" && gameData && (
          <div style={{ animation: "fadeIn 0.4s ease both" }}>
            <div style={{
              display: "flex", alignItems: "center", justifyContent: "space-between",
              marginBottom: "14px",
            }}>
              <p style={{ color: "rgba(255,255,255,0.4)", fontSize: "12px" }}>
                共 {nodeEntries.length} 个节点，点击展开编辑
              </p>
              <button
                onClick={() => {
                  const allIds = nodeEntries.map(([id]) => id);
                  const allExpanded = allIds.every((id) => expandedNodes[id]);
                  const next = {};
                  allIds.forEach((id) => { next[id] = !allExpanded; });
                  setExpandedNodes(next);
                }}
                style={{
                  background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.1)",
                  borderRadius: "8px", padding: "5px 10px", cursor: "pointer",
                  color: "rgba(255,255,255,0.5)", fontSize: "11px",
                }}
              >
                全部{nodeEntries.every(([id]) => expandedNodes[id]) ? "折叠" : "展开"}
              </button>
            </div>

            {nodeEntries.map(([nodeId, node], idx) => (
              <NodeCard
                key={nodeId}
                node={node}
                index={idx}
                expanded={!!expandedNodes[nodeId]}
                onToggle={() => toggleNode(nodeId)}
                onProseChange={(pi, val) => handleProseChange(nodeId, pi, val)}
              />
            ))}

            <button
              onClick={handleGoAssetGen}
              style={{
                width: "100%", padding: "14px", borderRadius: "12px", border: "none",
                background: "linear-gradient(135deg, #60A5FA, #3B82F6)",
                color: "#fff", fontSize: "14px", fontWeight: "700", cursor: "pointer",
                display: "flex", alignItems: "center", justifyContent: "center", gap: "8px",
                marginTop: "8px",
              }}
            >
              <ImageIcon size={16} />
              下一步：生成图片和语音 →
            </button>
          </div>
        )}

        {/* ── Step: Asset Generation (graphic format) ── */}
        {flowStep === "assetGen" && (
          <div style={{ animation: "fadeIn 0.4s ease both" }}>
            <p style={{ color: "rgba(255,255,255,0.4)", fontSize: "12px", marginBottom: "16px", lineHeight: "1.6" }}>
              为每个场景节点生成配套图片和语音（TTS），生成后可直接试玩。
            </p>

            {/* Image model selection */}
            <div style={{ marginBottom: "16px" }}>
              <label style={{
                display: "block",
                color: "rgba(255,255,255,0.45)", fontSize: "11px",
                marginBottom: "8px", letterSpacing: "0.04em",
              }}>
                图片模型
              </label>
              <div style={{ display: "flex", gap: "8px" }}>
                {Object.values(IMAGE_MODELS).map((m) => {
                  const isSelected = imageModel === m.value;
                  const accentColor = m.value === "doubao" ? "#22C55E" : "#E8A87C";
                  return (
                    <button
                      key={m.value}
                      onClick={() => setImageModel(m.value)}
                      disabled={assetGenRunning}
                      style={{
                        flex: 1, padding: "10px 10px", borderRadius: "10px", cursor: assetGenRunning ? "not-allowed" : "pointer",
                        background: isSelected ? `${accentColor}12` : "rgba(255,255,255,0.03)",
                        border: `1px solid ${isSelected ? accentColor : "rgba(255,255,255,0.08)"}`,
                        textAlign: "left", transition: "all 0.15s ease",
                      }}
                    >
                      <div style={{
                        color: isSelected ? accentColor : "rgba(255,255,255,0.65)",
                        fontSize: "12px", fontWeight: "600", marginBottom: "3px",
                      }}>
                        {m.label}
                      </div>
                      <div style={{ color: "rgba(255,255,255,0.3)", fontSize: "10px" }}>
                        {m.supportRefImage ? "支持参考图" : "纯文生图"}
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Reference image preview */}
            {(() => {
              const refs = REFERENCE_IMAGES[1] || [];
              if (!refs.length) return null;
              return (
                <div style={{ marginBottom: "16px" }}>
                  <label style={{
                    display: "block",
                    color: "rgba(255,255,255,0.45)", fontSize: "11px",
                    marginBottom: "8px", letterSpacing: "0.04em",
                  }}>
                    参考图（{refs.length} 张）
                  </label>
                  <div style={{
                    display: "flex", gap: "6px", overflowX: "auto",
                    paddingBottom: "4px",
                  }}>
                    {refs.map((url, i) => (
                      <a key={i} href={url} target="_blank" rel="noreferrer" style={{ flexShrink: 0 }}>
                        <img
                          src={url}
                          alt={`参考图${i + 1}`}
                          style={{
                            width: "60px", height: "90px",
                            objectFit: "cover", borderRadius: "6px",
                            border: "1px solid rgba(255,255,255,0.1)",
                            display: "block",
                          }}
                          onError={(e) => { e.currentTarget.style.display = "none"; }}
                        />
                      </a>
                    ))}
                  </div>
                </div>
              );
            })()}

            {/* Stats */}
            <div style={{ display: "flex", gap: "10px", marginBottom: "16px" }}>
              {[
                { icon: ImageIcon, label: "图片", color: "#60A5FA", count: nodeEntries.reduce((sum, [, n]) => {
                  if (Array.isArray(n.slides) && n.slides.length > 0) return sum + n.slides.length;
                  // 图文格式每个节点只生成1张图，不计 visualMeta 数组长度
                  if (n.visualMeta) return sum + 1;
                  return sum;
                }, 0) },
                { icon: Mic, label: "TTS 音频", color: "#9B59B6", count: nodeEntries.filter(([, n]) =>
                  (Array.isArray(n.prose) && n.prose.length > 0) ||
                  (Array.isArray(n.dialogue) && n.dialogue.length > 0) ||
                  (Array.isArray(n.slides) && n.slides.some((s) => s.subtitle || s.ttsText))
                ).length },
              ].map(({ icon: Icon, label, color, count }) => (
                <div key={label} style={{
                  flex: 1, padding: "12px", borderRadius: "10px",
                  background: `${color}08`, border: `1px solid ${color}18`,
                }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "6px", marginBottom: "6px" }}>
                    <Icon size={14} style={{ color }} />
                    <span style={{ color: "rgba(255,255,255,0.45)", fontSize: "11px" }}>{label}</span>
                  </div>
                  <span style={{ color, fontSize: "20px", fontWeight: "700" }}>{count}</span>
                </div>
              ))}
            </div>

            {/* Start button or progress */}
            {!assetGenRunning ? (
              <button
                onClick={handleStartAssetGen}
                style={{
                  width: "100%", padding: "14px", borderRadius: "12px", border: "none",
                  background: "linear-gradient(135deg, #60A5FA, #3B82F6)",
                  color: "#fff", fontSize: "14px", fontWeight: "700", cursor: "pointer",
                  display: "flex", alignItems: "center", justifyContent: "center", gap: "8px",
                }}
              >
                <Sparkles size={16} />
                开始生成图片和语音
              </button>
            ) : (
              <div style={{ textAlign: "center", padding: "20px 0" }}>
                <div style={{
                  width: "56px", height: "56px", borderRadius: "16px",
                  background: "rgba(96,165,250,0.1)",
                  border: "1px solid rgba(96,165,250,0.2)",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  margin: "0 auto 16px",
                  animation: "breathe 2s ease-in-out infinite",
                }}>
                  <Loader size={24} style={{ color: "#60A5FA", animation: "spin 1s linear infinite" }} />
                </div>
                <h3 style={{ color: "#F5F0EB", fontSize: "16px", fontWeight: "700", marginBottom: "6px" }}>
                  正在生成素材…
                </h3>

                {/* Progress bar */}
                {assetProgress.total > 0 && (
                  <div style={{ maxWidth: "280px", margin: "12px auto 0" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "6px" }}>
                      <span style={{ color: "rgba(255,255,255,0.4)", fontSize: "11px" }}>
                        {assetProgress.description || `素材生成 ${assetProgress.current}/${assetProgress.total}`}
                      </span>
                      <span style={{ color: "rgba(255,255,255,0.3)", fontSize: "11px" }}>
                        {countdown > 0 ? `预计 ${countdown}s` : `${progressPct}%`}
                      </span>
                    </div>
                    <div style={{
                      height: "4px", borderRadius: "2px",
                      background: "rgba(255,255,255,0.08)", overflow: "hidden",
                    }}>
                      <div style={{
                        height: "100%", borderRadius: "2px",
                        width: `${progressPct}%`,
                        background: "linear-gradient(90deg, #60A5FA, #3B82F6)",
                        transition: "width 0.4s ease",
                      }} />
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* ── Step: Auto Generating (video/asmr) ── */}
        {flowStep === "autoGenerating" && selectedFormat && (
          <div style={{ animation: "fadeIn 0.4s ease both", textAlign: "center", padding: "32px 0" }}>
            <div style={{
              width: "72px", height: "72px", borderRadius: "20px",
              background: `${selectedFormat.color}12`,
              border: `1px solid ${selectedFormat.color}30`,
              display: "flex", alignItems: "center", justifyContent: "center",
              margin: "0 auto 20px",
              animation: "breathe 2s ease-in-out infinite",
            }}>
              {(() => {
                const Icon = selectedFormat.icon;
                return <Icon size={28} style={{ color: selectedFormat.color }} />;
              })()}
            </div>

            <h2 style={{ color: "#F5F0EB", fontSize: "18px", fontWeight: "700", marginBottom: "6px" }}>
              AI 正在创作中
            </h2>
            <p style={{ color: "rgba(255,255,255,0.35)", fontSize: "13px", marginBottom: selectedFormat?.id === "video" ? "8px" : "24px" }}>
              {userInput.length > 20 ? userInput.slice(0, 20) + "…" : userInput}
            </p>
            {selectedFormat?.id === "video" && (
              <p style={{ color: "rgba(255,255,255,0.25)", fontSize: "11px", marginBottom: "24px" }}>
                视频生成预计需要 5-10 分钟，请耐心等待
              </p>
            )}

            {/* Pipeline progress */}
            <div style={{
              display: "flex", alignItems: "center", justifyContent: "center",
              gap: "4px", marginBottom: "20px", padding: "0 16px",
            }}>
              {pipelineSteps.map((step, i) => {
                const StepIcon = step.icon;
                const isActive = step.key === pipelineStatus;
                const isDone = activePipelineIdx > i;
                return (
                  <div key={step.key} style={{ display: "flex", alignItems: "center", gap: "4px" }}>
                    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "4px" }}>
                      <div style={{
                        width: "28px", height: "28px", borderRadius: "8px",
                        background: isDone ? "rgba(34,197,94,0.15)" : isActive ? `${selectedFormat.color}18` : "rgba(255,255,255,0.04)",
                        border: `1px solid ${isDone ? "rgba(34,197,94,0.3)" : isActive ? `${selectedFormat.color}40` : "rgba(255,255,255,0.08)"}`,
                        display: "flex", alignItems: "center", justifyContent: "center",
                      }}>
                        {isDone ? (
                          <CheckCircle size={13} style={{ color: "#22C55E" }} />
                        ) : isActive ? (
                          <Loader size={13} style={{ color: selectedFormat.color, animation: "spin 1s linear infinite" }} />
                        ) : (
                          <StepIcon size={12} style={{ color: "rgba(255,255,255,0.2)" }} />
                        )}
                      </div>
                      <span style={{
                        fontSize: "9px", whiteSpace: "nowrap",
                        color: isDone ? "rgba(34,197,94,0.7)" : isActive ? selectedFormat.color : "rgba(255,255,255,0.2)",
                      }}>
                        {step.label}
                      </span>
                    </div>
                    {i < pipelineSteps.length - 1 && (
                      <div style={{
                        width: "20px", height: "1px", marginBottom: "14px",
                        background: isDone ? "rgba(34,197,94,0.4)" : "rgba(255,255,255,0.08)",
                      }} />
                    )}
                  </div>
                );
              })}
            </div>

            {/* Asset progress bar */}
            {assetProgress.total > 0 && (
              <div style={{ maxWidth: "280px", margin: "0 auto 16px" }}>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "6px" }}>
                  <span style={{ color: "rgba(255,255,255,0.4)", fontSize: "11px" }}>
                    {assetProgress.description || `素材生成 ${assetProgress.current}/${assetProgress.total}`}
                  </span>
                  <span style={{ color: "rgba(255,255,255,0.3)", fontSize: "11px" }}>
                    {countdown > 0 ? `预计 ${countdown}s` : `${progressPct}%`}
                  </span>
                </div>
                <div style={{
                  height: "4px", borderRadius: "2px",
                  background: "rgba(255,255,255,0.08)", overflow: "hidden",
                }}>
                  <div style={{
                    height: "100%", borderRadius: "2px",
                    width: `${progressPct}%`,
                    background: `linear-gradient(90deg, ${selectedFormat.color}, #C2185B)`,
                    transition: "width 0.4s ease",
                  }} />
                </div>
              </div>
            )}

            <div style={{ display: "flex", justifyContent: "center", gap: "6px", marginTop: "8px" }}>
              {[0, 1, 2].map((i) => (
                <div key={i} style={{
                  width: "6px", height: "6px", borderRadius: "50%",
                  background: selectedFormat.color,
                  animation: `dotBounce 1.2s ${i * 0.2}s ease infinite`,
                  opacity: 0.6,
                }} />
              ))}
            </div>
          </div>
        )}

        {/* ── Step: Error ── */}
        {genError && (
          <div style={{ animation: "fadeIn 0.4s ease both", textAlign: "center", padding: "32px 0" }}>
            <div style={{
              width: "56px", height: "56px", borderRadius: "16px",
              background: "rgba(244,63,94,0.1)",
              border: "1px solid rgba(244,63,94,0.2)",
              display: "flex", alignItems: "center", justifyContent: "center",
              margin: "0 auto 16px",
            }}>
              <AlertCircle size={24} style={{ color: "#F43F5E" }} />
            </div>
            <h2 style={{ color: "#F5F0EB", fontSize: "17px", fontWeight: "700", marginBottom: "6px" }}>
              生成遇到问题
            </h2>
            <p style={{ color: "rgba(244,63,94,0.7)", fontSize: "12px", lineHeight: "1.6", marginBottom: "20px" }}>
              {genError}
            </p>
            <button
              onClick={handleRetry}
              style={{
                padding: "12px 32px", borderRadius: "12px", border: "none",
                background: "linear-gradient(135deg, #E8A87C, #C8906A)",
                color: "#1A0E08", fontSize: "14px", fontWeight: "700",
                cursor: "pointer", display: "inline-flex", alignItems: "center", gap: "8px",
              }}
            >
              <RotateCcw size={15} />
              重新开始
            </button>
          </div>
        )}

        {/* ── Step: Done ── */}
        {flowStep === "done" && gameData && selectedFormat && (() => {
          const videoUrl = selectedFormat.id === "video"
            ? (Object.values(gameData.nodes).find((n) => n.videoUrl) || {}).videoUrl
            : null;
          const asmrNode = selectedFormat.id === "asmr"
            ? Object.values(gameData.nodes).find((n) => n.imageUrl || n.audio?.ttsUrl)
            : null;

          // ── 视频模式 ──
          if (selectedFormat.id === "video") {
            return (
              <div style={{ animation: "fadeIn 0.5s ease both", padding: "20px 0" }}>
                <h2 style={{ color: "#F5F0EB", fontSize: "20px", fontWeight: "700", marginBottom: "6px", textAlign: "center" }}>
                  视频已生成
                </h2>
                <p style={{ color: "rgba(255,255,255,0.4)", fontSize: "13px", textAlign: "center", marginBottom: "20px" }}>
                  {gameData.title || "你的专属故事"}
                </p>

                {!videoUrl ? (
                  <div style={{
                    padding: "32px", borderRadius: "14px", textAlign: "center",
                    background: "rgba(244,114,182,0.06)", border: "1px solid rgba(244,114,182,0.15)",
                    color: "rgba(255,255,255,0.35)", fontSize: "13px", marginBottom: "20px",
                  }}>
                    暂无视频，素材生成可能遇到了问题
                  </div>
                ) : (
                  <div style={{ borderRadius: "14px", overflow: "hidden", background: "#000", marginBottom: "24px" }}>
                    <video
                      src={videoUrl}
                      controls
                      autoPlay
                      muted
                      playsInline
                      style={{ width: "100%", display: "block", maxHeight: "480px", objectFit: "contain" }}
                    />
                  </div>
                )}

                <button
                  onClick={handleRetry}
                  style={{
                    width: "100%", padding: "13px", borderRadius: "12px",
                    background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.12)",
                    color: "rgba(255,255,255,0.6)", fontSize: "14px", cursor: "pointer",
                    display: "flex", alignItems: "center", justifyContent: "center", gap: "6px",
                  }}
                >
                  <RotateCcw size={14} />
                  重新创作
                </button>
              </div>
            );
          }

          // ── ASMR 模式 ──
          if (selectedFormat.id === "asmr") {
            return (
              <div style={{ animation: "fadeIn 0.5s ease both", padding: "20px 0" }}>
                <h2 style={{ color: "#F5F0EB", fontSize: "20px", fontWeight: "700", marginBottom: "6px", textAlign: "center" }}>
                  ASMR 音频已生成
                </h2>
                <p style={{ color: "rgba(255,255,255,0.4)", fontSize: "13px", textAlign: "center", marginBottom: "20px" }}>
                  {gameData.title || "你的专属故事"}
                </p>

                {asmrNode?.imageUrl && (
                  <div style={{ borderRadius: "16px", overflow: "hidden", marginBottom: "16px" }}>
                    <img
                      src={asmrNode.imageUrl}
                      alt="ASMR 封面"
                      style={{ width: "100%", display: "block", maxHeight: "340px", objectFit: "cover" }}
                    />
                  </div>
                )}

                {asmrNode?.audio?.ttsUrl ? (
                  <div style={{
                    padding: "16px", borderRadius: "14px", marginBottom: "16px",
                    background: "rgba(155,89,182,0.06)", border: "1px solid rgba(155,89,182,0.2)",
                  }}>
                    <div style={{
                      display: "flex", alignItems: "center", gap: "8px",
                      color: "rgba(255,255,255,0.5)", fontSize: "12px", marginBottom: "12px",
                    }}>
                      <Headphones size={14} style={{ color: "#9B59B6" }} />
                      建议戴上耳机，沉浸体验
                    </div>
                    <audio
                      src={asmrNode.audio.ttsUrl}
                      controls
                      autoPlay
                      style={{ width: "100%", accentColor: "#9B59B6" }}
                    />
                  </div>
                ) : (
                  <div style={{
                    padding: "24px", borderRadius: "14px", textAlign: "center",
                    background: "rgba(155,89,182,0.06)", border: "1px solid rgba(155,89,182,0.15)",
                    color: "rgba(255,255,255,0.35)", fontSize: "13px", marginBottom: "16px",
                  }}>
                    暂无音频，素材生成可能遇到了问题
                  </div>
                )}

                <button
                  onClick={handleRetry}
                  style={{
                    width: "100%", padding: "13px", borderRadius: "12px",
                    background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.12)",
                    color: "rgba(255,255,255,0.6)", fontSize: "14px", cursor: "pointer",
                    display: "flex", alignItems: "center", justifyContent: "center", gap: "6px",
                  }}
                >
                  <RotateCcw size={14} />
                  重新创作
                </button>
              </div>
            );
          }

          // ── 图文模式（默认） ──
          return (
            <div style={{ animation: "fadeIn 0.5s ease both", textAlign: "center", padding: "20px 0" }}>
              <div style={{
                width: "72px", height: "72px", borderRadius: "20px",
                background: `${selectedFormat.color}12`,
                border: `1px solid ${selectedFormat.color}30`,
                display: "flex", alignItems: "center", justifyContent: "center",
                margin: "0 auto 20px",
              }}>
                {(() => {
                  const Icon = selectedFormat.icon;
                  return <Icon size={30} style={{ color: selectedFormat.color }} />;
                })()}
              </div>
              <h2 style={{ color: "#F5F0EB", fontSize: "20px", fontWeight: "700", marginBottom: "8px" }}>
                互动影游已就绪
              </h2>
              <p style={{ color: "rgba(255,255,255,0.4)", fontSize: "13px", lineHeight: "1.7", marginBottom: "6px" }}>
                {gameData.title || "你的专属故事"}
              </p>

              {/* Stats */}
              <div style={{
                display: "flex", justifyContent: "center", gap: "20px",
                marginBottom: "24px",
              }}>
                {[
                  { label: "场景", val: Object.keys(gameData.nodes).length },
                  { label: "分支", val: Object.values(gameData.nodes).filter((n) => n.branch).length },
                  { label: "结局", val: Object.values(gameData.nodes).filter((n) => n.ending).length },
                ].map(({ label, val }) => (
                  <div key={label} style={{ textAlign: "center" }}>
                    <div style={{ color: selectedFormat.color, fontSize: "22px", fontWeight: "700" }}>{val}</div>
                    <div style={{ color: "rgba(255,255,255,0.35)", fontSize: "11px" }}>{label}</div>
                  </div>
                ))}
              </div>

              {/* Asset result badge */}
              {assetResult && (
                <div style={{
                  display: "inline-flex", alignItems: "center", gap: "6px",
                  padding: "6px 14px", borderRadius: "20px", marginBottom: "24px",
                  background: assetResult.failed === 0 ? "rgba(34,197,94,0.08)" : "rgba(232,168,124,0.08)",
                  border: `1px solid ${assetResult.failed === 0 ? "rgba(34,197,94,0.2)" : "rgba(232,168,124,0.2)"}`,
                }}>
                  <CheckCircle size={12} style={{ color: assetResult.failed === 0 ? "#22C55E" : "#E8A87C" }} />
                  <span style={{
                    color: assetResult.failed === 0 ? "rgba(34,197,94,0.8)" : "rgba(232,168,124,0.8)",
                    fontSize: "11px",
                  }}>
                    {assetResult.success} 个素材已生成
                    {assetResult.failed > 0 && `，${assetResult.failed} 个失败`}
                  </span>
                </div>
              )}

              {/* Action buttons */}
              <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                <button
                  onClick={handlePlay}
                  style={{
                    width: "100%", padding: "15px", borderRadius: "12px", border: "none",
                    background: `linear-gradient(135deg, ${selectedFormat.color}, ${selectedFormat.color}CC)`,
                    color: "#1A0E08", fontSize: "15px", fontWeight: "700", cursor: "pointer",
                    display: "flex", alignItems: "center", justifyContent: "center", gap: "8px",
                    boxShadow: `0 8px 32px ${selectedFormat.color}40`,
                  }}
                >
                  <Play size={17} fill="#1A0E08" style={{ color: "#1A0E08" }} />
                  立即试玩
                </button>
                <button
                  onClick={handleRetry}
                  style={{
                    width: "100%", padding: "12px", borderRadius: "12px",
                    background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.1)",
                    color: "rgba(255,255,255,0.5)", fontSize: "13px", cursor: "pointer",
                    display: "flex", alignItems: "center", justifyContent: "center", gap: "6px",
                  }}
                >
                  <RotateCcw size={14} />
                  重新创作
                </button>
              </div>
            </div>
          );
        })()}
      </div>

      <div ref={bottomRef} />
    </div>
  );
};

export default RecreationCreate;
