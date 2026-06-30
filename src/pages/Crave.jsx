import { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { useNavigate } from "react-router-dom";
import { useLocale } from "@/i18n";
import {
  Home, Play, Heart, User, Plus, X, ChevronRight,
  Sparkles, Clock, Upload, Trash2, PlayCircle, MessageCircle,
  Share2, ThumbsUp,
} from "lucide-react";

// ─── Keyframes ────────────────────────────────────────────────────────────────

const STYLES = `
  @keyframes craveSlideUp {
    from { opacity: 0; transform: translateY(100%); }
    to   { opacity: 1; transform: translateY(0); }
  }
  @keyframes craveFadeIn {
    from { opacity: 0; transform: translateY(12px); }
    to   { opacity: 1; transform: translateY(0); }
  }
  @keyframes pulseRing {
    0%, 100% { box-shadow: 0 0 0 0 rgba(232,168,124,0.3); }
    50% { box-shadow: 0 0 0 8px rgba(232,168,124,0); }
  }
`;

// ─── Data ─────────────────────────────────────────────────────────────────────

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

// 默认种子帖子工厂函数（每次加载合并，保证圈子不空）
function buildSeedPosts(t) {
  const c = t?.crave;
  return [
    {
      id: "seed_1",
      title: c.seed1Title,
      promoText: c.seed1Promo,
      dramaTitle: c.seed1Drama,
      coverImage: "https://s3plus.meituan.net/mcopilot-pub/nocode-task/chenyanbo/ujnj6kjw27ro1feytk76v2lr4ztv2r/ep1_60s.jpg",
      charNames: c.user1Name,
      nodeCount: 8,
      _route: "/interactive-player",
      publishedAt: Date.now() - 180000,
      _isSeed: true,
    },
    {
      id: "seed_2",
      title: c.seed2Title,
      promoText: c.seed2Promo,
      dramaTitle: c.seed2Drama,
      coverImage: "https://s.coze.cn/image/8HM4YhUq6Ug/",
      charNames: c.user1Name,
      nodeCount: 12,
      _route: "/hotspring",
      publishedAt: Date.now() - 60000,
      _isSeed: true,
    },
  ];
}

// 清理 localStorage 里可能残留的旧种子帖数据（id 以 seed_ 开头的，或 title 与种子重名的）
function cleanStaleSeedData(seedIds) {
  try {
    const raw = localStorage.getItem(PUBLISHED_KEY);
    if (!raw) return;
    const list = JSON.parse(raw);
    const cleaned = list.filter(
      (item) => !seedIds.has(item.id)
    );
    if (cleaned.length !== list.length) {
      localStorage.setItem(PUBLISHED_KEY, JSON.stringify(cleaned));
    }
  } catch (_) {}
}

// 合并：用户发布 + 种子帖子，去重
function buildDisplayList(t) {
  const seedPosts = buildSeedPosts(t);
  const userPosts = getPublishedList();
  const userSeedIds = new Set(userPosts.map((p) => p.id));
  const seeds = seedPosts.filter(
    (s) => !userSeedIds.has(s.id)
  );
  return [...userPosts, ...seeds];
}

function timeAgo(ts, t) {
  const diff = Date.now() - ts;
  const c = t?.crave;
  if (diff < 60000) return c?.justNow ?? "刚刚";
  if (diff < 3600000) return (c?.minutesAgo ?? "{n} 分钟前").replace("{n}", String(Math.floor(diff / 60000)));
  if (diff < 86400000) return (c?.hoursAgo ?? "{n} 小时前").replace("{n}", String(Math.floor(diff / 3600000)));
  return (c?.daysAgo ?? "{n} 天前").replace("{n}", String(Math.floor(diff / 86400000)));
}

// 随机用户名池 + 头像 emoji
function getUserPool(t) {
  const c = t?.crave;
  return [
    { name: c.user1Name, emoji: "🍊" },
    { name: c.user2Name, emoji: "🐟" },
    { name: c.user3Name, emoji: "🎬" },
    { name: c.user4Name, emoji: "🔥" },
    { name: c.user5Name, emoji: "🐾" },
    { name: c.user6Name, emoji: "🦉" },
    { name: c.user7Name, emoji: "🍬" },
  ];
}

// 用 id 的 hash 来稳定分配用户
function getUserForId(id, t) {
  const pool = getUserPool(t);
  const idx = Math.abs(id.charCodeAt(4) || 0) % pool.length;
  return pool[idx];
}

// ─── Bottom Nav ───────────────────────────────────────────────────────────────

const BottomNav = ({ active, onNavigate }) => {
const navigate = useNavigate();
const { t, locale, localePath } = useLocale();
const watchDramaId = locale === "en" ? 5 : 2;
const tabs = [
{ id: "home",  label: t.index.tabs.home,  icon: Home,  path: localePath("/full") },
{ id: "watch", label: t.index.tabs.watch, icon: Play,  path: localePath(`/player/${watchDramaId}`) },
{ id: "crave", label: t.index.tabs.crave, icon: Heart, path: localePath("/crave") },
{ id: "me",    label: t.index.tabs.me,    icon: User,  path: localePath("/profile") },
];
  const midIdx = Math.floor(tabs.length / 2);
  const leftTabs = tabs.slice(0, midIdx);
  const rightTabs = tabs.slice(midIdx);

  return createPortal(
    <div
      className="fixed bottom-0 left-0 right-0 z-50"
      style={{
        background: "rgba(13,13,13,0.96)",
        backdropFilter: "blur(20px)",
        WebkitBackdropFilter: "blur(20px)",
        borderTop: "1px solid rgba(255,255,255,0.06)",
        paddingBottom: "env(safe-area-inset-bottom, 0px)",
      }}
    >
      <div className="flex items-center justify-around px-2 py-2">
        {leftTabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = active === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => onNavigate(tab.path)}
              className="flex flex-col items-center gap-1"
              style={{ minWidth: "60px" }}
            >
              <div className="relative">
                <Icon size={22} style={{ color: isActive ? "#E8A87C" : "rgba(245,240,235,0.35)", transition: "color 0.2s" }} />
                {isActive && <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full" style={{ background: "#E8A87C" }} />}
              </div>
              <span className="font-sans" style={{ fontSize: "9px", color: isActive ? "#E8A87C" : "rgba(245,240,235,0.35)", letterSpacing: "0.02em", transition: "color 0.2s" }}>
                {tab.label}
              </span>
            </button>
          );
        })}
        {/* 中间 + 创作按钮 */}
        <button
          onClick={() => navigate('/create-hub')}
          style={{
            width: '48px', height: '48px', borderRadius: '50%', border: 'none',
            background: 'linear-gradient(135deg, #E8A87C, #C2185B)',
            boxShadow: '0 4px 16px rgba(232,168,124,0.35)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            cursor: 'pointer', flexShrink: 0,
            marginTop: '-8px',
            transition: 'transform 0.15s ease',
          }}
          onPointerDown={(e) => (e.currentTarget.style.transform = 'scale(0.92)')}
          onPointerUp={(e) => (e.currentTarget.style.transform = 'scale(1)')}
          onPointerLeave={(e) => (e.currentTarget.style.transform = 'scale(1)')}
        >
          <Plus size={22} style={{ color: '#fff' }} />
        </button>

        {/* 右半部分 tabs */}
        {rightTabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = active === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => onNavigate(tab.path)}
              className="flex flex-col items-center gap-1"
              style={{ minWidth: "60px" }}
            >
              <div className="relative">
                <Icon size={22} style={{ color: isActive ? "#E8A87C" : "rgba(245,240,235,0.35)", transition: "color 0.2s" }} />
                {isActive && <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full" style={{ background: "#E8A87C" }} />}
              </div>
              <span className="font-sans" style={{ fontSize: "9px", color: isActive ? "#E8A87C" : "rgba(245,240,235,0.35)", letterSpacing: "0.02em", transition: "color 0.2s" }}>
                {tab.label}
              </span>
            </button>
          );
        })}
      </div>
    </div>,
    document.body
  );
};

// ─── Game Card (帖子内嵌) ─────────────────────────────────────────────────────

const GameCard = ({ item, onPlay, t }) => (
  <button
    onClick={onPlay}
    className="w-full flex items-center gap-3 mt-3 px-3 py-3 rounded-2xl text-left transition-all duration-200 active:scale-98"
    style={{
      background: "rgba(255,255,255,0.04)",
      border: "1px solid rgba(232,168,124,0.12)",
    }}
  >
    {/* Play icon */}
    <div
      className="flex-shrink-0 flex items-center justify-center rounded-full"
      style={{
        width: "44px", height: "44px",
        background: "rgba(232,168,124,0.15)",
        border: "1px solid rgba(232,168,124,0.3)",
        animation: "pulseRing 2.5s ease infinite",
      }}
    >
      <PlayCircle size={22} style={{ color: "#E8A87C" }} />
    </div>

    {/* Info */}
    <div className="flex-1 min-w-0">
      <p
        className="font-serif truncate"
        style={{ color: "#F5F0EB", fontSize: "14px", fontWeight: "600" }}
      >
        {item.title}
      </p>
      <p
        className="font-sans mt-0.5"
        style={{ color: "rgba(232,168,124,0.6)", fontSize: "11px" }}
      >
        {t?.crave?.gameTag ?? "互动影游 · 点击进入"}
      </p>
    </div>

    {/* Cover thumbnail */}
    {item.coverImage && (
      <img
        src={item.coverImage}
        alt=""
        className="object-cover rounded-xl flex-shrink-0"
        style={{ width: "52px", height: "52px", filter: "brightness(0.85)" }}
      />
    )}
  </button>
);

// ─── Post Card (帖子) ─────────────────────────────────────────────────────────

const PostCard = ({ item, index, onPlay, onDelete, t }) => {
  const [liked, setLiked] = useState(false);
  const [likeCount, setLikeCount] = useState(Math.floor(Math.random() * 300) + 20);
  const commentCount = Math.floor(Math.random() * 50) + 5;
  const user = getUserForId(item.id, t);

  const handleLike = (e) => {
    e.stopPropagation();
    setLiked(!liked);
    setLikeCount((c) => liked ? c - 1 : c + 1);
  };

  return (
    <div
      className="w-full px-5 py-4"
      style={{
        borderBottom: "1px solid rgba(255,255,255,0.05)",
        animation: `craveFadeIn 0.4s ease both`,
        animationDelay: `${index * 0.06}s`,
      }}
    >
      {/* User row */}
      <div className="flex items-center gap-3 mb-3">
        {/* Avatar */}
        <div
          className="flex-shrink-0 flex items-center justify-center rounded-full"
          style={{
            width: "36px", height: "36px",
            background: "linear-gradient(135deg, rgba(232,168,124,0.25), rgba(194,24,91,0.15))",
            border: "1px solid rgba(232,168,124,0.3)",
            fontSize: "16px",
          }}
        >
          {user.emoji}
        </div>
        <div className="flex-1 min-w-0">
          <p
            className="font-sans truncate"
            style={{ color: "#F5F0EB", fontSize: "13px", fontWeight: "600" }}
          >
            {user.name}
          </p>
          <p className="font-sans" style={{ color: "rgba(245,240,235,0.25)", fontSize: "10px" }}>
            {timeAgo(item.publishedAt, t)}
          </p>
        </div>
        {/* Follow button */}
        <button
          onClick={(e) => e.stopPropagation()}
          className="flex-shrink-0 px-3 py-1 rounded-full"
          style={{
            background: "rgba(232,168,124,0.1)",
            border: "1px solid rgba(232,168,124,0.3)",
            color: "#E8A87C", fontSize: "10px", fontWeight: "600",
            cursor: "pointer",
          }}
        >
          {t?.crave?.followBtn ?? "+ 关注"}
        </button>
      </div>

      {/* Post text */}
      {item.promoText && (
        <p
          className="font-sans mb-2"
          style={{ color: "rgba(245,240,235,0.75)", fontSize: "13px", lineHeight: "1.7" }}
        >
          {item.promoText}
        </p>
      )}

      {/* Embedded game card */}
      <GameCard item={item} onPlay={onPlay} t={t} />

      {/* Related drama */}
      {item.dramaTitle && (
        <div className="flex items-center gap-1.5 mt-2" style={{ marginLeft: "2px" }}>
          <span style={{ fontSize: "10px", color: "rgba(245,240,235,0.3)" }}>{t?.crave?.relatedDrama ?? "关联剧"}</span>
          <span
            style={{
              fontSize: "10px", fontWeight: "600", color: "#E8A87C",
              background: "rgba(232,168,124,0.08)",
              border: "1px solid rgba(232,168,124,0.15)",
              padding: "1px 6px",
              borderRadius: "4px",
            }}
          >
            《{item.dramaTitle}》
          </span>
        </div>
      )}

      {/* Action row */}
      <div className="flex items-center gap-5 mt-3">
        <button
          onClick={handleLike}
          className="flex items-center gap-1.5"
          style={{ background: "none", border: "none", cursor: "pointer", padding: 0 }}
        >
          <Heart
            size={14}
            fill={liked ? "#E8A87C" : "none"}
            style={{ color: liked ? "#E8A87C" : "rgba(245,240,235,0.3)", transition: "all 0.2s" }}
          />
          <span style={{ color: liked ? "#E8A87C" : "rgba(245,240,235,0.3)", fontSize: "11px", fontWeight: "500" }}>
            {likeCount}
          </span>
        </button>
        <button
          className="flex items-center gap-1.5"
          style={{ background: "none", border: "none", cursor: "pointer", padding: 0 }}
        >
          <MessageCircle size={14} style={{ color: "rgba(245,240,235,0.3)" }} />
          <span style={{ color: "rgba(245,240,235,0.3)", fontSize: "11px", fontWeight: "500" }}>
            {commentCount}
          </span>
        </button>
        <button
          className="flex items-center gap-1.5"
          style={{ background: "none", border: "none", cursor: "pointer", padding: 0 }}
        >
          <Share2 size={14} style={{ color: "rgba(245,240,235,0.3)" }} />
          <span style={{ color: "rgba(245,240,235,0.3)", fontSize: "11px", fontWeight: "500" }}>
            {t?.crave?.forwardBtn ?? "转发"}
          </span>
        </button>
        <div className="flex-1" />
        <button
          onClick={(e) => { e.stopPropagation(); onDelete(item.id); }}
          style={{
            background: "none", border: "none", cursor: "pointer", padding: 0,
          }}
        >
          <Trash2 size={12} style={{ color: "rgba(245,240,235,0.15)" }} />
        </button>
      </div>
    </div>
  );
};

// ─── Empty State ──────────────────────────────────────────────────────────────

const EmptyState = ({ onNavigate, t }) => (
  <div className="flex flex-col items-center justify-center px-8" style={{ paddingTop: "80px" }}>
    <div style={{
      width: "72px", height: "72px", borderRadius: "20px",
      background: "rgba(232,168,124,0.08)",
      border: "1px solid rgba(232,168,124,0.15)",
      display: "flex", alignItems: "center", justifyContent: "center",
      marginBottom: "20px",
    }}>
      <Upload size={28} style={{ color: "rgba(232,168,124,0.35)" }} />
    </div>
    <h3 style={{ color: "#F5F0EB", fontSize: "17px", fontWeight: "600", marginBottom: "8px" }}>
      {t?.crave?.emptyTitle ?? "圈子还是空的"}
    </h3>
    <p style={{
      color: "rgba(255,255,255,0.35)", fontSize: "13px",
      textAlign: "center", lineHeight: "1.8", maxWidth: "260px", marginBottom: "28px",
      whiteSpace: "pre-line",
    }}>
      {t?.crave?.emptySubtitle ?? "创作一部互动影游并发布，\n让其他玩家也能体验你的故事吧！"}
    </p>
    <button
      onClick={onNavigate}
      style={{
        padding: "12px 28px", borderRadius: "50px",
        background: "linear-gradient(135deg, #E8A87C, #C8906A)",
        color: "#1A0E08", fontSize: "14px", fontWeight: "700",
        border: "none", cursor: "pointer",
        boxShadow: "0 8px 32px rgba(232,168,124,0.3)",
        display: "flex", alignItems: "center", gap: "8px",
      }}
    >
      <Sparkles size={15} />
      {t?.crave?.emptyBtn ?? "去创作"}
    </button>
  </div>
);

// ─── Crave Page (= 圈子) ─────────────────────────────────────────────────────

const Crave = () => {
  const navigate = useNavigate();
  const { t } = useLocale();
  const [publishedList, setPublishedList] = useState([]);

  useEffect(() => {
    const seedPosts = buildSeedPosts(t);
    const seedIds = new Set(seedPosts.map((s) => s.id));
    cleanStaleSeedData(seedIds);
    setPublishedList(buildDisplayList(t));
  }, [t]);

  const handlePlay = (item) => {
    // 种子帖子有固定路由，直接跳转
    if (item._route) {
      navigate(item._route);
      return;
    }
    // 用户发布的二创，通过 sessionStorage 传数据
    sessionStorage.setItem("recreation_game_data", JSON.stringify(item.gameData));
    navigate("/recreation");
  };

  const handleDelete = (id) => {
    // 从 localStorage 删除用户发布的内容
    const stored = getPublishedList();
    const updated = stored.filter((item) => item.id !== id);
    savePublishedList(updated);
    // 重新构建展示列表（种子帖子不受影响，除非用户主动删除则从视图移除）
    setPublishedList(buildDisplayList(t).filter((item) => item.id !== id));
  };

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        background: "#0D0D0D",
        maxWidth: "480px",
        margin: "0 auto",
        display: "flex",
        flexDirection: "column",
        overflow: "hidden",
      }}
    >
      <style>{STYLES}</style>

      {/* ── Header ── */}
      <div
        className="flex-shrink-0 px-5"
        style={{
          paddingTop: "calc(env(safe-area-inset-top, 0px) + 20px)",
          paddingBottom: "16px",
          borderBottom: "1px solid rgba(255,255,255,0.06)",
        }}
      >
        <div className="flex items-start justify-between">
          <div>
            <h1
              className="font-serif"
              style={{
                color: "#F5F0EB",
                fontSize: "26px",
                fontWeight: "700",
                letterSpacing: "-0.02em",
                lineHeight: "1.2",
              }}
            >
              {t?.crave?.title ?? "圈子"}
            </h1>
            <p
              className="font-sans mt-1"
              style={{ color: "rgba(245,240,235,0.4)", fontSize: "13px" }}
            >
              {t?.crave?.subtitle ?? "发现玩家创作的互动影游"}
            </p>
          </div>
        </div>
      </div>

      {/* ── Feed / Empty ── */}
      <div
        className="flex-1 overflow-y-auto"
        style={{ scrollbarWidth: "none", paddingBottom: "100px" }}
      >
        {publishedList.length === 0 ? (
          <EmptyState onNavigate={() => navigate("/recreation-create")} t={t} />
        ) : (
          publishedList.map((item, i) => (
            <PostCard
              key={item.id}
              item={item}
              index={i}
              onPlay={() => handlePlay(item)}
              onDelete={handleDelete}
              t={t}
            />
          ))
        )}

        {publishedList.length > 0 && (
          <div className="px-5 pt-4 pb-2">
            <p
              className="font-sans text-center"
              style={{
                color: "rgba(245,240,235,0.2)",
                fontSize: "10px",
                letterSpacing: "0.1em",
              }}
            >
              {t?.crave?.footerHint ?? "更多精彩影游，等你来创作"}
            </p>
          </div>
        )}
      </div>

      <BottomNav active="crave" onNavigate={(path) => navigate(path)} />
    </div>
  );
};

export default Crave;
