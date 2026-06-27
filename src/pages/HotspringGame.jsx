/**
 * HotspringGame.jsx — 温泉危机·互动影游
 * 完整实现：视频过场 + 图片帧过场 + 蒸汽粒子 + Bokeh光斑 + 心跳脉冲 + 打字机字幕
 */

import { useState, useEffect, useRef, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, RotateCcw } from "lucide-react";

// ─── 游戏数据 ──────────────────────────────────────────────────────────────────

const VIDEO_URL = "/videos/hotspring_onsen.mp4";

const GAME_DATA = {
  rootNodeId: "node_1",
  nodes: {
    node_1: {
      id: "node_1", title: "温泉邀请",
      bg: "https://s.coze.cn/image/8HM4YhUq6Ug/",
      texts: [
        { type: "narration", content: "放学铃响，你刚松了口气，沈彦希就出现在课桌旁。" },
        { type: "dialogue", speaker: "沈彦希", content: "「周末温泉，去不去？」" },
        { type: "narration", content: "希辰在一旁起哄。你心跳漏了一拍——温泉，那意味着……你下意识攥紧了校服下摆。" },
        { type: "dialogue", speaker: "沈彦希", content: "「就我们三个，别想多了。」" },
        { type: "narration", content: "他语气平淡，但嘴角微扬。你不确定他是不是在试探什么。" },
      ],
      branch: {
        question: "你的心跳在加速……",
        options: [
          { id: "opt_excuse", label: "找借口推脱", description: "「我…身体不舒服，就不去了。」", targetNodeId: "node_2" },
          { id: "opt_go", label: "硬着头皮答应", description: "「…好啊，走。」反正总有办法的对吧？", targetNodeId: "node_3" },
        ],
      },
      ending: null,
    },
    node_2: {
      id: "node_2", title: "走廊独白",
      bg: "https://s.coze.cn/image/zVdZWsVhS8M/",
      texts: [
        { type: "narration", content: "你找了个蹩脚的借口溜回宿舍。刚松了口气，门被轻轻敲响。" },
        { type: "narration", content: "沈彦希站在走廊里，手插在口袋中，逆光看不清表情。" },
        { type: "dialogue", speaker: "沈彦希", content: "「真的不舒服？」" },
        { type: "narration", content: "他的声音比平时低了半度。你不敢抬头——因为你看他的眼神，已经不像\"室友\"了。" },
      ],
      cinematic: {
        type: "frames",
        frames: [
          { image: "https://s.coze.cn/image/eELLXewisRw/", kb: "kbZoomIn", duration: 3500, heartbeat: false, bokeh: false },
          { image: "https://s.coze.cn/image/eELLXewisRw/", kb: "kbZoomSlow", duration: 4000, heartbeat: true, bokeh: false,
            speaker: "沈彦希", dialogue: "「你每次撒谎，耳朵都会红。」" },
        ],
        afterTextIndex: 3,
      },
      cinematicTexts: [
        { type: "dialogue", speaker: "沈彦希", content: "「你每次撒谎，耳朵都会红。」" },
        { type: "narration", content: "你下意识摸了摸耳朵。烫的。" },
      ],
      branch: {
        question: "他的目光让你无法回避……",
        options: [
          { id: "opt_confess", label: "试着坦白", description: "「我只是…不想让你看到我不一样的一面。」", targetNodeId: "node_5" },
          { id: "opt_deny", label: "继续隐瞒", description: "「没什么，就是不想去。你别多想。」", targetNodeId: "node_4" },
        ],
      },
      ending: null,
    },
    node_3: {
      id: "node_3", title: "温泉迷雾",
      bg: "https://s.coze.cn/image/6Tw2mvLXH0w/",
      texts: [
        { type: "narration", content: "你还是来了。雾气模糊了视线，你把毛巾裹了又裹，恨不得缩进石头缝里。" },
        { type: "narration", content: "沈彦希从雾气中走来，白浴袍松松地搭在肩上。" },
        { type: "narration", content: "你猛地别过脸。心跳声大得你怀疑他能听到。" },
      ],
      // ★ 核心视频过场
      cinematic: {
        type: "video",
        videoUrl: VIDEO_URL,
        holdLastFrame: 3000,
        subtitles: [
          { time: 3000, speaker: "沈彦希", text: "「你耳朵红了。」" },
        ],
        afterTextIndex: 2,
      },
      cinematicTexts: [
        { type: "narration", content: "他靠近了一步。水波晃动，倒影破碎。你的秘密摇摇欲坠。" },
      ],
      branch: {
        question: "温泉的雾气快遮不住你的慌张了……",
        options: [
          { id: "opt_flee", label: "趁他转身溜走", description: "不行，再待一秒就要暴露了——", targetNodeId: "node_4" },
          { id: "opt_brave", label: "深呼吸，走下水", description: "既然来了，就…拼了吧。", targetNodeId: "node_5" },
        ],
      },
      ending: null,
    },
    node_4: {
      id: "node_4", title: "遗憾结局",
      bg: "https://s.coze.cn/image/_FjiYeW-xV8/",
      texts: [
        { type: "narration", content: "你终究没有说出真相。" },
        { type: "narration", content: "后来的日子，你们之间多了一层看不见的膜——他不再随意靠近，你也不敢再让他靠近。" },
        { type: "narration", content: "某个深夜，你翻到手机里那张温泉的邀请截图。群聊早已解散，他的头像变成了灰色的圆。" },
        { type: "narration", content: "有些秘密，保守了就成了距离。而有些距离，一旦拉开就再也走不近了。" },
      ],
      branch: null,
      ending: { id: "ending_sad", title: "隐瞒的距离", type: "sad", description: "你选择了安全，却也选择了孤独。那个本可以靠近的瞬间，像指间流走的雾气，再也抓不回来。" },
    },
    node_5: {
      id: "node_5", title: "甜蜜结局",
      bg: "https://s.coze.cn/image/WJJ8nwVnrwA/",
      texts: [
        { type: "narration", content: "「我……我其实是女生。」" },
        { type: "narration", content: "你闭上眼等着他的反应。沉默了三秒——比一个世纪还长。" },
        { type: "narration", content: "然后你感到一条毛巾搭上了你的肩。" },
        { type: "dialogue", speaker: "沈彦希", content: "「我知道。」" },
      ],
      cinematic: {
        type: "frames",
        frames: [
          { image: "https://s.coze.cn/image/kp45L4XfCV4/", kb: "kbPanUp", duration: 3500, heartbeat: false, bokeh: true,
            speaker: "沈彦希", dialogue: "「从你第一天搬进来，我就知道了。」" },
          { image: "https://s.coze.cn/image/QP9Al8g4rzs/", kb: "kbZoomSlow", duration: 4500, heartbeat: true, bokeh: true,
            speaker: "沈彦希", dialogue: "「因为我想看你自己什么时候愿意告诉我。」" },
        ],
        afterTextIndex: 3,
      },
      cinematicTexts: [
        { type: "narration", content: "你睁大眼。他的目光温柔得像月光落水。" },
        { type: "narration", content: "他的手指轻轻碰了碰你发红的耳尖。温泉的热气升腾，分不清是雾还是心跳。" },
      ],
      branch: null,
      ending: { id: "ending_sweet", title: "他一直在等你", type: "sweet", description: "你以为自己在独自伪装，其实他一直在门外守着。从第一天起，他的温柔就不是给\"室友\"的。" },
    },
  },
};

// ─── 动画 keyframes ────────────────────────────────────────────────────────────

const ANIM_STYLE = `
@keyframes kbZoomIn { 0% { transform: scale(1); } 100% { transform: scale(1.15); } }
@keyframes kbPanRight { 0% { transform: scale(1.1) translateX(-3%); } 100% { transform: scale(1.1) translateX(3%); } }
@keyframes kbPanUp { 0% { transform: scale(1.15) translateY(3%); } 100% { transform: scale(1.15) translateY(-2%); } }
@keyframes kbZoomSlow { 0% { transform: scale(1.05); } 100% { transform: scale(1.2); } }
@keyframes steamRise {
  0% { transform: translateY(0) scale(0.5); opacity: 0; }
  20% { opacity: 0.6; }
  100% { transform: translateY(-120vh) scale(2); opacity: 0; }
}
@keyframes bokehFloat {
  0%, 100% { transform: translateY(0) scale(1); opacity: 0.3; }
  50% { transform: translateY(-20px) scale(1.1); opacity: 0.5; }
}
@keyframes heartPulse {
  0% { box-shadow: inset 0 0 80px rgba(232,168,124,0); }
  30% { box-shadow: inset 0 0 120px rgba(232,168,124,0.35); }
  50% { box-shadow: inset 0 0 60px rgba(232,168,124,0.12); }
  70% { box-shadow: inset 0 0 100px rgba(232,168,124,0.28); }
  100% { box-shadow: inset 0 0 80px rgba(232,168,124,0); }
}
@keyframes tapBlink { 0%, 100% { opacity: 0.35; } 50% { opacity: 0.75; } }
@keyframes textFadeIn { from { opacity: 0; transform: translateY(8px); } to { opacity: 1; transform: translateY(0); } }
@keyframes titleFade { 0% { opacity:0; } 20% { opacity:1; } 80% { opacity:1; } 100% { opacity:0; } }
`;

// ─── 打字机 Hook ───────────────────────────────────────────────────────────────

function useTypewriter() {
  const [display, setDisplay] = useState("");
  const timerRef = useRef(null);

  const type = useCallback((text, speed = 55) => {
    if (timerRef.current) clearTimeout(timerRef.current);
    setDisplay("");
    let i = 0;
    const tick = () => {
      if (i < text.length) {
        setDisplay(text.slice(0, i + 1));
        i++;
        timerRef.current = setTimeout(tick, speed);
      }
    };
    tick();
  }, []);

  const clear = useCallback(() => {
    if (timerRef.current) clearTimeout(timerRef.current);
    setDisplay("");
  }, []);

  useEffect(() => () => { if (timerRef.current) clearTimeout(timerRef.current); }, []);

  return { display, type, clear };
}

// ─── 主组件 ────────────────────────────────────────────────────────────────────

import { useLocale } from "@/i18n";

const HotspringGame = () => {
  const navigate = useNavigate();
  const { t } = useLocale();

  const [phase, setPhase] = useState("start");
  const [currentNodeId, setCurrentNodeId] = useState(null);
  const [shownTexts, setShownTexts] = useState([]);
  const [textIndex, setTextIndex] = useState(0);
  const [showTapHint, setShowTapHint] = useState(true);
  const [bg, setBg] = useState(GAME_DATA.nodes[GAME_DATA.rootNodeId].bg);
  const [bgFade, setBgFade] = useState(false);
  const [sceneTitle, setSceneTitle] = useState("");
  const [showSceneTitle, setShowSceneTitle] = useState(false);
  const [ending, setEnding] = useState(null);

  // ── 过场通用状态 ──
  const [cinematicActive, setCinematicActive] = useState(false);

  // ── 图片帧过场状态 ──
  const [frameData, setFrameData] = useState(null); // { image, kb, speaker, dialogue, heartbeat, bokeh }
  const [frameSpeakerVisible, setFrameSpeakerVisible] = useState(false);
  const [frameHeartbeat, setFrameHeartbeat] = useState(false);
  const [steamParticles, setSteamParticles] = useState([]);
  const [bokehItems, setBokehItems] = useState([]);
  const frameTwDialogue = useTypewriter();

  // ── 视频过场状态 ──
  const [videoActive, setVideoActive] = useState(false);
  const [videoBgFrame, setVideoBgFrame] = useState(null); // 视频最后一帧 dataURL
  const videoSubSpeaker = useTypewriter();
  const videoSubText = useTypewriter();
  const [videoSubSpeakerLabel, setVideoSubSpeakerLabel] = useState("");

  const videoRef = useRef(null);
  const inputLocked = useRef(false);
  const cinematicPlayedRef = useRef({});
  const cinematicTimers = useRef([]);
  const videoSubTimers = useRef([]);
  const steamIntervalRef = useRef(null);
  const steamIdRef = useRef(0);
  const textListRef = useRef(null);
  const videoCallbackRef = useRef(null);

  // 注入动画样式
  useEffect(() => {
    const style = document.createElement("style");
    style.textContent = ANIM_STYLE;
    document.head.appendChild(style);
    return () => document.head.removeChild(style);
  }, []);

  // 自动滚动到底部
  useEffect(() => {
    if (textListRef.current) {
      textListRef.current.scrollTop = textListRef.current.scrollHeight;
    }
  }, [shownTexts]);

  // ── 工具：切换背景 ──
  const switchBg = useCallback((url) => {
    setBgFade(true);
    setTimeout(() => { setBg(url); setBgFade(false); }, 400);
  }, []);

  // ── 工具：场景标题 ──
  const showTitle = useCallback((title) => {
    setSceneTitle(title);
    setShowSceneTitle(true);
    setTimeout(() => setShowSceneTitle(false), 1800);
  }, []);

  // ── 工具：追加一条文字 ──
  const appendText = useCallback((textObj) => {
    setShownTexts(prev => [...prev, textObj]);
  }, []);

  // ── 蒸汽粒子 ──
  const startSteam = useCallback(() => {
    if (steamIntervalRef.current) return;
    steamIntervalRef.current = setInterval(() => {
      const id = ++steamIdRef.current;
      const size = 80 + Math.random() * 100;
      const particle = {
        id, left: Math.random() * 100, size,
        duration: 4 + Math.random() * 4,
      };
      setSteamParticles(prev => [...prev, particle]);
      setTimeout(() => setSteamParticles(prev => prev.filter(p => p.id !== id)), 8000);
    }, 350);
  }, []);

  const stopSteam = useCallback(() => {
    if (steamIntervalRef.current) { clearInterval(steamIntervalRef.current); steamIntervalRef.current = null; }
    setSteamParticles([]);
  }, []);

  // ── Bokeh 光斑 ──
  const addBokeh = useCallback(() => {
    const items = Array.from({ length: 4 }, (_, i) => {
      const size = 20 + Math.random() * 40;
      return {
        id: i, size,
        left: Math.random() * 80 + 10,
        top: Math.random() * 60 + 15,
        opacity: 0.15 + Math.random() * 0.15,
        delay: Math.random() * 3,
        animDur: 4 + Math.random() * 4,
      };
    });
    setBokehItems(items);
  }, []);

  const clearBokeh = useCallback(() => setBokehItems([]), []);

  // ── 截取视频最后一帧 ──
  const captureVideoFrame = useCallback((video) => {
    try {
      const canvas = document.createElement("canvas");
      canvas.width = video.videoWidth || 640;
      canvas.height = video.videoHeight || 1136;
      canvas.getContext("2d").drawImage(video, 0, 0, canvas.width, canvas.height);
      return canvas.toDataURL("image/jpeg", 0.85);
    } catch { return null; }
  }, []);

  // ── 结束视频过场 ──
  const endVideoCinematic = useCallback((callback) => {
    videoSubTimers.current.forEach(clearTimeout);
    videoSubTimers.current = [];
    stopSteam();
    const v = videoRef.current;
    if (v) { v.pause(); v.src = ""; }
    videoSubSpeaker.clear();
    videoSubText.clear();
    setVideoSubSpeakerLabel("");
    setVideoActive(false);
    setCinematicActive(false);
    inputLocked.current = false;
    setPhase("reading");
    if (callback) callback();
  }, [stopSteam, videoSubSpeaker, videoSubText]);

  // ── 图片帧过场 ──
  const playFramesCinematic = useCallback((config, onEnd) => {
    setCinematicActive(true);
    setVideoActive(false);
    inputLocked.current = true;
    cinematicTimers.current.forEach(clearTimeout);
    cinematicTimers.current = [];
    frameTwDialogue.clear();
    clearBokeh();
    stopSteam();

    let delay = 500;
    config.frames.forEach((f) => {
      cinematicTimers.current.push(setTimeout(() => {
        setFrameData({ ...f });
        setFrameSpeakerVisible(false);
        setFrameHeartbeat(false);
        frameTwDialogue.clear();
        clearBokeh();

        setTimeout(() => {
          if (f.bokeh) addBokeh();
          if (f.heartbeat) setFrameHeartbeat(true);
          if (f.speaker) {
            setTimeout(() => setFrameSpeakerVisible(true), 400);
          }
          if (f.dialogue) {
            setTimeout(() => frameTwDialogue.type(f.dialogue, 60), 700);
          }
        }, 200);
      }, delay));
      delay += f.duration;
    });

    cinematicTimers.current.push(setTimeout(() => {
      setCinematicActive(false);
      setFrameData(null);
      setFrameHeartbeat(false);
      setFrameSpeakerVisible(false);
      frameTwDialogue.clear();
      clearBokeh();
      stopSteam();
      inputLocked.current = false;
      setPhase("reading");
      onEnd?.();
    }, delay + 500));
  }, [frameTwDialogue, addBokeh, clearBokeh, stopSteam]);

  // ── 视频过场 ──
  const playVideoCinematic = useCallback((config, onEnd) => {
    // 先设好 callback 和 state
    videoCallbackRef.current = onEnd;
    videoSubTimers.current.forEach(clearTimeout);
    videoSubTimers.current = [];
    videoSubSpeaker.clear();
    videoSubText.clear();
    setVideoSubSpeakerLabel("");

    // 配置 video 元素（常驻 DOM，ref 始终有效）
    const v = videoRef.current;
    if (!v) return;
    v.src = config.videoUrl;
    v.currentTime = 0;
    v.muted = false;
    v.onended = null; // 先清旧的

    const holdDuration = config.holdLastFrame || 3000;
    v.onended = () => {
      const frame = captureVideoFrame(v);
      if (frame) setVideoBgFrame(frame);
      v.pause();
      videoSubTimers.current.push(setTimeout(() => {
        endVideoCinematic(videoCallbackRef.current);
      }, holdDuration));
    };

    // 字幕定时器
    if (config.subtitles) {
      config.subtitles.forEach((sub) => {
        if (sub.time > 0 && (sub.speaker || sub.text)) {
          videoSubTimers.current.push(setTimeout(() => {
            if (sub.speaker) setVideoSubSpeakerLabel(sub.speaker);
            if (sub.text) videoSubText.type(sub.text, 60);
          }, sub.time));
        }
      });
    }

    // 再激活过场 UI + 蒸汽
    setCinematicActive(true);
    setVideoActive(true);
    inputLocked.current = true;
    startSteam();

    // 延一帧再 play，确保 videoActive=true 已渲染（video 元素可见）
    requestAnimationFrame(() => {
      v.play().catch(() => { v.muted = true; v.play().catch(() => {}); });
    });
  }, [startSteam, videoSubSpeaker, videoSubText, captureVideoFrame, endVideoCinematic]);

  // ── 推进文字 ──
  const showNextText = useCallback(() => {
    const node = GAME_DATA.nodes[currentNodeId];
    if (!node) return;

    const cine = node.cinematic;
    if (cine && !cinematicPlayedRef.current[currentNodeId] && textIndex === cine.afterTextIndex) {
      cinematicPlayedRef.current[currentNodeId] = true;
      const afterCinematic = () => {
        (node.cinematicTexts || []).forEach(t => appendText(t));
        setTimeout(() => {
          if (node.branch) setPhase("choosing");
          else if (node.ending) { setPhase("ending"); setEnding(node.ending); }
        }, 800);
      };
      if (cine.type === "video") {
        playVideoCinematic(cine, afterCinematic);
      } else if (cine.type === "frames") {
        playFramesCinematic(cine, afterCinematic);
      }
      return;
    }

    if (textIndex >= node.texts.length) {
      if (node.branch) { setPhase("choosing"); setShowTapHint(false); }
      else if (node.ending) { setPhase("ending"); setEnding(node.ending); }
      return;
    }

    appendText(node.texts[textIndex]);
    setTextIndex(i => i + 1);
  }, [currentNodeId, textIndex, appendText, playVideoCinematic, playFramesCinematic]);

  // ── 跳过过场 ──
  const skipCinematic = useCallback((e) => {
    e.stopPropagation();
    // 清定时器
    cinematicTimers.current.forEach(clearTimeout);
    cinematicTimers.current = [];
    videoSubTimers.current.forEach(clearTimeout);
    videoSubTimers.current = [];
    stopSteam();
    clearBokeh();
    frameTwDialogue.clear();
    videoSubSpeaker.clear();
    videoSubText.clear();
    setVideoSubSpeakerLabel("");
    setFrameData(null);
    setFrameHeartbeat(false);
    setFrameSpeakerVisible(false);

    // 截帧
    const v = videoRef.current;
    if (v && videoActive) {
      const frame = captureVideoFrame(v);
      if (frame) setVideoBgFrame(frame);
      v.pause(); v.src = "";
    }

    setCinematicActive(false);
    setVideoActive(false);
    inputLocked.current = false;

    const n = GAME_DATA.nodes[currentNodeId];
    if (n) {
      (n.cinematicTexts || []).forEach(t => appendText(t));
      setTimeout(() => {
        if (n.branch) setPhase("choosing");
        else if (n.ending) { setPhase("ending"); setEnding(n.ending); }
        else setPhase("reading");
      }, 400);
    }
  }, [videoActive, currentNodeId, appendText, stopSteam, clearBokeh,
      frameTwDialogue, videoSubSpeaker, videoSubText, captureVideoFrame]);

  // ── 进入节点 ──
  const playNode = useCallback((nodeId) => {
    const node = GAME_DATA.nodes[nodeId];
    if (!node) return;
    inputLocked.current = true;
    setCurrentNodeId(nodeId);
    setShownTexts([]);
    setTextIndex(0);
    setShowTapHint(true);
    setVideoBgFrame(null);
    switchBg(node.bg);
    showTitle(node.title);
    setTimeout(() => {
      inputLocked.current = false;
      setPhase("reading");
    }, 1200);
  }, [switchBg, showTitle]);

  const handleTap = useCallback(() => {
    if (inputLocked.current) return;
    if (phase !== "reading") return;
    showNextText();
  }, [phase, showNextText]);

  const makeChoice = useCallback((option) => {
    if (inputLocked.current) return;
    inputLocked.current = true;
    setPhase("reading");
    setShownTexts([]);
    setTextIndex(0);
    setTimeout(() => { inputLocked.current = false; playNode(option.targetNodeId); }, 300);
  }, [playNode]);

  const startGame = useCallback(() => {
    cinematicPlayedRef.current = {};
    setVideoBgFrame(null);
    playNode(GAME_DATA.rootNodeId);
  }, [playNode]);

  const restartGame = useCallback(() => {
    cinematicPlayedRef.current = {};
    setEnding(null);
    setShownTexts([]);
    setTextIndex(0);
    setVideoBgFrame(null);
    playNode(GAME_DATA.rootNodeId);
  }, [playNode]);

  const node = currentNodeId ? GAME_DATA.nodes[currentNodeId] : null;

  // 有效背景：视频截帧 > 节点背景
  const activeBg = videoBgFrame || bg;

  return (
    <div style={{
      position: "fixed", inset: 0, background: "#000",
      fontFamily: '-apple-system, "PingFang SC", "Noto Sans SC", sans-serif',
      overflow: "hidden", userSelect: "none",
      display: "flex", flexDirection: "column", alignItems: "center",
    }}>
      <div style={{
        position: "relative", width: "100%", maxWidth: "430px",
        height: "100%", overflow: "hidden",
      }}
        onClick={handleTap}
      >
        {/* video 元素常驻 DOM，CSS 控制显示/隐藏，确保 ref 始终有效 */}
        <video
          ref={videoRef}
          playsInline
          style={{
            position: "absolute", inset: 0, width: "100%", height: "100%",
            objectFit: "cover", zIndex: 502,
            display: (cinematicActive && videoActive) ? "block" : "none",
            pointerEvents: "none",
          }}
        />
        {/* ── 背景 ── */}
        <div style={{
          position: "absolute", inset: 0,
          backgroundImage: `url('${activeBg}')`,
          backgroundSize: "cover", backgroundPosition: "center",
          opacity: bgFade ? 0 : 1, transition: "opacity 0.8s ease",
        }} />
        <div style={{
          position: "absolute", inset: 0, pointerEvents: "none",
          background: "linear-gradient(to top, rgba(0,0,0,0.88) 0%, rgba(0,0,0,0.4) 40%, rgba(0,0,0,0.12) 70%, transparent 100%)",
        }} />

        {/* ── 返回按钮 ── */}
        <button
          onClick={(e) => { e.stopPropagation(); navigate(-1); }}
          style={{
            position: "absolute", top: "52px", left: "16px",
            width: "36px", height: "36px", borderRadius: "50%",
            background: "rgba(0,0,0,0.45)",
            border: "1px solid rgba(255,255,255,0.15)",
            display: "flex", alignItems: "center", justifyContent: "center",
            cursor: "pointer", zIndex: 50,
          }}
        >
          <ArrowLeft size={16} style={{ color: "rgba(255,255,255,0.7)" }} />
        </button>

        {/* ── 场景标题 ── */}
        {showSceneTitle && (
          <div style={{
            position: "absolute", inset: 0, zIndex: 15,
            display: "flex", alignItems: "center", justifyContent: "center",
            background: "rgba(0,0,0,0.55)",
            animation: "titleFade 1.8s ease forwards",
            pointerEvents: "none",
          }}>
            <span style={{ fontSize: "20px", fontWeight: "600", letterSpacing: "4px", color: "#F5F0EB" }}>
              {sceneTitle}
            </span>
          </div>
        )}

        {/* ── 阅读文字区 ── */}
        {(phase === "reading" || phase === "choosing") && (
          <div style={{
            position: "absolute", bottom: 0, left: 0, right: 0,
            padding: `20px 20px ${phase === "choosing" ? "260px" : "32px"}`,
            transition: "padding-bottom 0.35s cubic-bezier(0.16,1,0.3,1)",
            zIndex: 5,
          }}>
            <div ref={textListRef} style={{
              maxHeight: "52vh", overflowY: "auto",
              display: "flex", flexDirection: "column", gap: "10px",
              marginBottom: "12px", scrollbarWidth: "none",
            }}>
              {shownTexts.map((t, i) => (
                <div key={i} style={{ animation: "textFadeIn 0.4s ease both" }}>
                  {t.type === "dialogue" ? (
                    <div style={{ fontSize: "15px", lineHeight: "1.75", color: "#fff", paddingLeft: "12px", borderLeft: "2px solid #E8A87C" }}>
                      <span style={{ color: "#E8A87C", fontSize: "12px", display: "block", marginBottom: "2px" }}>{t.speaker}</span>
                      {t.content}
                    </div>
                  ) : (
                    <div style={{ fontSize: "14px", lineHeight: "1.85", color: "rgba(245,240,235,0.88)", textShadow: "0 1px 4px rgba(0,0,0,0.6)" }}>
                      {t.content}
                    </div>
                  )}
                </div>
              ))}
            </div>
              {phase === "reading" && showTapHint && (
              <div style={{ fontSize: "11px", color: "rgba(255,255,255,0.38)", textAlign: "center", animation: "tapBlink 2s ease-in-out infinite" }}>
                {t.hotspringGame.tapHint}
              </div>
            )}
          </div>
        )}

        {/* ── 选项面板 ── */}
        {phase === "choosing" && node?.branch && (
          <div style={{
            position: "absolute", bottom: 0, left: 0, right: 0,
            padding: "20px 20px 40px",
            background: "linear-gradient(to top, rgba(0,0,0,0.95) 0%, rgba(0,0,0,0.6) 80%, transparent 100%)",
            zIndex: 100,
          }}
            onClick={(e) => e.stopPropagation()}
          >
            <p style={{ fontSize: "13px", color: "rgba(255,255,255,0.55)", textAlign: "center", marginBottom: "16px" }}>
              {node.branch.question}
            </p>
            <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
              {node.branch.options.map((opt) => (
                <button
                  key={opt.id}
                  onClick={(e) => { e.stopPropagation(); makeChoice(opt); }}
                  style={{
                    width: "100%", padding: "15px 18px", textAlign: "left",
                    background: "rgba(255,255,255,0.1)", border: "1px solid rgba(255,255,255,0.18)",
                    borderRadius: "14px", cursor: "pointer", WebkitTapHighlightColor: "transparent",
                  }}
                  onPointerDown={(e) => { e.currentTarget.style.background = "rgba(232,168,124,0.2)"; e.currentTarget.style.borderColor = "rgba(232,168,124,0.4)"; e.currentTarget.style.transform = "scale(0.97)"; }}
                  onPointerUp={(e) => { e.currentTarget.style.background = "rgba(255,255,255,0.1)"; e.currentTarget.style.borderColor = "rgba(255,255,255,0.18)"; e.currentTarget.style.transform = "scale(1)"; }}
                  onPointerLeave={(e) => { e.currentTarget.style.background = "rgba(255,255,255,0.1)"; e.currentTarget.style.borderColor = "rgba(255,255,255,0.18)"; e.currentTarget.style.transform = "scale(1)"; }}
                >
                  <div style={{ fontWeight: "600", color: "#F5F0EB", fontSize: "14px", marginBottom: "3px" }}>{opt.label}</div>
                  <div style={{ fontSize: "12px", color: "rgba(255,255,255,0.5)" }}>{opt.description}</div>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* ══════════════════════════════════
            过场层（图片帧 + 视频共用容器）
            ══════════════════════════════════ */}
        {cinematicActive && (
          <div style={{ position: "absolute", inset: 0, zIndex: 500, background: "#000", overflow: "hidden" }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* 电影宽银幕黑边 */}
            <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: "11%", background: "#000", zIndex: 510 }} />
            <div style={{ position: "absolute", bottom: 0, left: 0, right: 0, height: "11%", background: "#000", zIndex: 510 }} />

            {/* ── 图片帧层 ── */}
            {!videoActive && frameData && (
              <div style={{
                position: "absolute", inset: 0,
                backgroundImage: `url('${frameData.image}')`,
                backgroundSize: "cover", backgroundPosition: "center",
                animation: `${frameData.kb} 4.5s ease-out forwards`,
              }} />
            )}

            {/* video 层已常驻在过场层外，此处不再重复渲染 */}

            {/* 心跳脉冲 */}
            {(frameHeartbeat || videoActive) && (
              <div style={{
                position: "absolute", inset: 0, zIndex: 506, pointerEvents: "none",
                animation: "heartPulse 1.2s ease-in-out",
              }} />
            )}

            {/* 蒸汽粒子 */}
            {steamParticles.map((p) => (
              <div key={p.id} style={{
                position: "absolute", bottom: "-60px",
                left: `${p.left}%`,
                width: `${p.size}px`, height: `${p.size}px`,
                background: "radial-gradient(circle, rgba(255,255,255,0.07) 0%, transparent 70%)",
                borderRadius: "50%", zIndex: 505, pointerEvents: "none",
                animation: `steamRise ${p.duration}s linear forwards`,
              }} />
            ))}

            {/* Bokeh 光斑 */}
            {bokehItems.map((b) => (
              <div key={b.id} style={{
                position: "absolute",
                left: `${b.left}%`, top: `${b.top}%`,
                width: `${b.size}px`, height: `${b.size}px`,
                borderRadius: "50%", zIndex: 504, pointerEvents: "none",
                background: `radial-gradient(circle, rgba(255,200,150,${b.opacity}) 0%, transparent 70%)`,
                animation: `bokehFloat ${b.animDur}s ${b.delay}s ease-in-out infinite`,
              }} />
            ))}

            {/* 图片帧台词（打字机）*/}
            {!videoActive && frameData && (frameData.speaker || frameData.dialogue) && (
              <div style={{
                position: "absolute", bottom: "14%", left: 0, right: 0,
                zIndex: 520, textAlign: "center", padding: "0 30px",
              }}>
                {frameData.speaker && (
                  <div style={{
                    fontSize: "11px", color: "#E8A87C", letterSpacing: "2px", marginBottom: "6px",
                    opacity: frameSpeakerVisible ? 1 : 0, transition: "opacity 0.6s ease",
                  }}>
                    {frameData.speaker}
                  </div>
                )}
                <div style={{
                  fontSize: "17px", lineHeight: "1.8", color: "#fff",
                  textShadow: "0 2px 12px rgba(0,0,0,0.8)",
                  minHeight: "1.8em",
                }}>
                  {frameTwDialogue.display}
                </div>
              </div>
            )}

            {/* 视频字幕（打字机）*/}
            {videoActive && (videoSubSpeakerLabel || videoSubText.display) && (
              <div style={{
                position: "absolute", bottom: "14%", left: 0, right: 0,
                zIndex: 520, textAlign: "center", padding: "0 30px",
              }}>
                {videoSubSpeakerLabel && (
                  <div style={{ fontSize: "11px", color: "#E8A87C", letterSpacing: "2px", marginBottom: "6px" }}>
                    {videoSubSpeakerLabel}
                  </div>
                )}
                <div style={{
                  fontSize: "17px", lineHeight: "1.8", color: "#fff",
                  textShadow: "0 2px 12px rgba(0,0,0,0.8)",
                  minHeight: "1.8em",
                }}>
                  {videoSubText.display}
                </div>
              </div>
            )}

            {/* 跳过按钮 */}
            <button
              onClick={skipCinematic}
              style={{
                position: "absolute", top: "13%", right: "16px", zIndex: 530,
                padding: "6px 16px",
                background: "rgba(0,0,0,0.5)",
                border: "1px solid rgba(255,255,255,0.2)",
                borderRadius: "16px", color: "rgba(255,255,255,0.6)",
                fontSize: "12px", cursor: "pointer",
              }}
            >
              {t.hotspringGame.skip}
            </button>
          </div>
        )}

        {/* ── 结局卡 ── */}
        {phase === "ending" && ending && (
          <div style={{
            position: "absolute", inset: 0, zIndex: 200,
            display: "flex", flexDirection: "column",
            alignItems: "center", justifyContent: "center",
            background: "rgba(0,0,0,0.88)", backdropFilter: "blur(20px)",
            padding: "40px 30px",
          }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{
              fontSize: "12px", letterSpacing: "4px",
              color: ending.type === "sweet" ? "#E8A87C" : "#7eb8ff",
              marginBottom: "12px",
            }}>
              {ending.type === "sweet" ? t.hotspringGame.sweetEnding : t.hotspringGame.sadEnding}
            </div>
            <h2 style={{ fontSize: "24px", fontWeight: "700", color: "#F5F0EB", textAlign: "center", marginBottom: "20px" }}>
              {ending.title}
            </h2>
            <p style={{ fontSize: "14px", lineHeight: "1.85", color: "rgba(245,240,235,0.7)", textAlign: "center", maxWidth: "300px", marginBottom: "36px" }}>
              {ending.description}
            </p>
            <button
              onClick={() => restartGame()}
              style={{
                display: "flex", alignItems: "center", gap: "8px",
                padding: "12px 32px", borderRadius: "50px",
                background: "rgba(255,255,255,0.1)",
                border: "1px solid rgba(255,255,255,0.2)",
                color: "#F5F0EB", fontSize: "14px", cursor: "pointer", marginBottom: "10px",
              }}
            >
              <RotateCcw size={14} />{t.hotspringGame.restart}
            </button>
            <button
              onClick={() => navigate(-1)}
              style={{
                padding: "10px 24px", borderRadius: "50px",
                background: "transparent",
                border: "1px solid rgba(255,255,255,0.1)",
                color: "rgba(255,255,255,0.4)", fontSize: "13px", cursor: "pointer",
              }}
            >
              {t.hotspringGame.back}
            </button>
          </div>
        )}

        {/* ── 开始画面 ── */}
        {phase === "start" && (
          <div style={{
            position: "absolute", inset: 0, zIndex: 300,
            backgroundImage: `url('${GAME_DATA.nodes[GAME_DATA.rootNodeId].bg}')`,
            backgroundSize: "cover", backgroundPosition: "center",
            display: "flex", flexDirection: "column",
            alignItems: "center", justifyContent: "flex-end",
            padding: "40px 30px 72px",
          }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{
              position: "absolute", inset: 0, pointerEvents: "none",
              background: "linear-gradient(to top, rgba(0,0,0,0.82), rgba(0,0,0,0.22), transparent)",
            }} />
            <div style={{ position: "relative", zIndex: 1, textAlign: "center", width: "100%" }}>
              <div style={{
                display: "inline-block", padding: "4px 14px", borderRadius: "20px",
                background: "rgba(232,168,124,0.15)", border: "1px solid rgba(232,168,124,0.3)",
                color: "#E8A87C", fontSize: "11px", letterSpacing: "2px", marginBottom: "12px",
              }}>
                {t.hotspringGame.tag}
              </div>
              <h1 style={{ fontSize: "32px", fontWeight: "800", color: "#F5F0EB", fontFamily: "serif", letterSpacing: "0.04em", marginBottom: "10px" }}>
                {t.hotspringGame.title}
              </h1>
              <p style={{ fontSize: "13px", color: "rgba(255,255,255,0.5)", marginBottom: "36px" }}>
                {t.hotspringGame.subtitle}
              </p>
              <button
                onClick={startGame}
                style={{
                  width: "80%", maxWidth: "280px", padding: "15px",
                  background: "linear-gradient(135deg, #E8A87C, #C2185B)",
                  border: "none", borderRadius: "50px",
                  color: "#fff", fontSize: "16px", fontWeight: "700",
                  cursor: "pointer", boxShadow: "0 6px 24px rgba(232,168,124,0.4)",
                }}
              >
                {t.hotspringGame.start}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default HotspringGame;
