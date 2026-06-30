/**
 * contentAdapter.js
 *
 * 把后端 /api/content/all 的扁平文档结构，还原成前端组件期望的静态 i18n 结构
 * （dramas.VIDEO_MAP / chat.EPISODE_OPENINGS 等），使得渐进式切换对组件透明。
 *
 * 设计红线：
 * - 还原结构必须与 src/i18n/<locale>/dramas.js、chat.js 的 default export 完全一致。
 * - 带完整度校验：API 数据不达标时返回 null，调用方回落静态数据，绝不让线上退化。
 */

const API_BASE = '';

/** 把 content_drama 文档数组还原成 VIDEO_MAP: { [drama_id]: {title, cover, episodes} } */
function buildVideoMap(dramas) {
  const map = {};
  for (const d of dramas || []) {
    map[d.drama_id] = { title: d.title, cover: d.cover, episodes: d.episodes || [] };
  }
  return map;
}

/** 把 content_episode 文档数组还原成 EPISODE_SUMMARIES / EPISODE_OPENINGS */
function buildEpisodeMaps(episodes) {
  const summaries = {};
  const openings = {};
  for (const e of episodes || []) {
    if (e.summary) summaries[e.ep] = e.summary;
    if (e.opening) openings[e.ep] = e.opening;
  }
  return { summaries, openings };
}

/**
 * 将 API 响应适配成 { dramas, chat } 两个对象，结构与静态 i18n 一致。
 * 校验不通过时返回 null。
 *
 * @param {object} api  /api/content/all 的响应
 * @param {object} staticData  对应 locale 的静态 { dramas, chat }，用于完整度对比
 */
export function adaptContent(api, staticData) {
  if (!api || !api.meta) return null;

  const meta = api.meta;
  const videoMap = buildVideoMap(api.dramas);
  const { summaries, openings } = buildEpisodeMaps(api.episodes);

  const dramas = {
    VIDEO_MAP: videoMap,
    DRAMA_ORDER: meta.drama_order || [],
    CHARACTERS: meta.characters || [],
    FEATURED_ROLES: meta.featured_roles || [],
    TRENDING: meta.trending || [],
    CALLER_INFO: meta.caller_info || null,
    CHAR_BIO: meta.char_bio || {},
    STORY_FEATURES: meta.story_features || [],
  };

  const chat = {
    CHARACTERS: api.chat_chars || {},
    EPISODE_SUMMARIES: summaries,
    EPISODE_OPENINGS: openings,
    FIXED_BRANCHES: {},
    STORY_SCENES: api.scene_sets || {},
  };

  // ---- 完整度校验：API 数据不得少于静态数据，否则视为不可信，回落 ----
  if (staticData) {
    const sD = staticData.dramas || {};
    const sC = staticData.chat || {};
    const apiDramaCount = Object.keys(videoMap).length;
    const staticDramaCount = Object.keys(sD.VIDEO_MAP || {}).length;
    const apiEpCount = Object.keys(openings).length;
    const staticEpCount = Object.keys(sC.EPISODE_OPENINGS || {}).length;
    const apiSceneChars = Object.keys(chat.STORY_SCENES).length;
    const staticSceneChars = Object.keys(sC.STORY_SCENES || {}).length;

    if (
      apiDramaCount < staticDramaCount ||
      apiEpCount < staticEpCount ||
      apiSceneChars < staticSceneChars
    ) {
      // eslint-disable-next-line no-console
      console.warn(
        `[contentAdapter] API 数据不完整，回落静态: dramas ${apiDramaCount}/${staticDramaCount}, ` +
          `episodes ${apiEpCount}/${staticEpCount}, sceneChars ${apiSceneChars}/${staticSceneChars}`
      );
      return null;
    }
  }

  return { dramas, chat };
}

/** 拉取并适配某 locale 的内容；任何失败返回 null（调用方回落静态）。 */
export async function fetchContent(locale, staticData) {
  try {
    const resp = await fetch(`${API_BASE}/api/content/all?locale=${encodeURIComponent(locale)}`);
    if (!resp.ok) throw new Error(`content/all ${resp.status}`);
    const api = await resp.json();
    return adaptContent(api, staticData);
  } catch (err) {
    // eslint-disable-next-line no-console
    console.warn('[contentAdapter] fetch 失败，回落静态:', err.message);
    return null;
  }
}
