import Landing from "./pages/Landing.jsx";
import Index from "./pages/Index.jsx";
import Discover from "./pages/Discover.jsx";
import Crave from "./pages/Crave.jsx";
import Profile from "./pages/Profile.jsx";
import Player from "./pages/Player.jsx";
import Chat from "./pages/Chat.jsx";
import Gallery from "./pages/Gallery.jsx";
import Call from "./pages/Call.jsx";
import VideoCreate from "./pages/VideoCreate.jsx";
import VideoPreview from "./pages/VideoPreview.jsx";
import InteractivePlayer from "./pages/InteractivePlayer.jsx";
import ComicDemo from "./pages/ComicDemo.jsx";
import RecreationPlayer from "./pages/RecreationPlayer.jsx";
import RecreationCreate from "./pages/RecreationCreate.jsx";
import CreateHub from "./pages/CreateHub.jsx";
import ASMRCreate from "./pages/ASMRCreate.jsx";
import HotspringGame from "./pages/HotspringGame.jsx";
import Community from "./pages/Community.jsx";

/**
 * Central place for defining the navigation items. Used for navigation components and routing.
 *
 * AB 版本路由设计：
 * - /            → 展示页（落地页）
 * - /drama       → A 版（短剧版）直接进入心动禁区播放器
 * - /full        → B 版（完整版，含互动）首页
 */
export const navItems = [
  // ── 展示页 ──
  {
    title: "展示页",
    to: "/",
    page: <Landing />,
  },

  // ── A 版：短剧版（直接进入播放器） ──
  {
    title: "短剧版",
    to: "/drama",
    page: <Player />,
  },

  // ── B 版：完整版（含互动） ──
  {
    title: "完整版首页",
    to: "/full",
    page: <Index />,
  },
  {
    title: "追剧",
    to: "/discover",
    page: <Discover />,
  },
  {
    title: "圈子",
    to: "/crave",
    page: <Crave />,
  },
  {
    title: "圈子",
    to: "/community",
    page: <Community />,
  },
  {
    title: "我的",
    to: "/profile",
    page: <Profile />,
  },
  {
    title: "Player",
    to: "/player/:id",
    page: <Player />,
  },
  {
    title: "Chat",
    to: "/chat/:dramaId/:charId",
    page: <Chat />,
  },
  {
    title: "Gallery",
    to: "/gallery/:dramaId",
    page: <Gallery />,
  },
  {
    title: "Call",
    to: "/call/:dramaId",
    page: <Call />,
  },
  {
    title: "VideoCreate",
    to: "/video-create/:dramaId/:ep",
    page: <VideoCreate />,
  },
  {
    title: "VideoPreview",
    to: "/video-preview/:dramaId/:ep",
    page: <VideoPreview />,
  },
  {
    title: "InteractivePlayer",
    to: "/interactive-player",
    page: <InteractivePlayer />,
  },
  {
    title: "漫剧Demo",
    to: "/comic-demo",
    page: <ComicDemo />,
  },
  {
    title: "互动影游",
    to: "/recreation",
    page: <RecreationPlayer />,
  },
  {
    title: "影游编辑器",
    to: "/recreation-create",
    page: <RecreationCreate />,
  },
  {
    title: "创作中心",
    to: "/create-hub",
    page: <CreateHub />,
  },
  {
    title: "ASMR Create",
    to: "/asmr-create",
    page: <ASMRCreate />,
  },
  {
    title: "温泉危机",
    to: "/hotspring",
    page: <HotspringGame />,
  },
  // ── English Drama ──
  // English chat is handled via /en/chat/:dramaId/:charId route in App.jsx
];
