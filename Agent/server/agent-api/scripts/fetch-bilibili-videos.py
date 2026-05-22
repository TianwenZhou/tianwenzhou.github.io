from __future__ import annotations

import argparse
from concurrent.futures import ThreadPoolExecutor, as_completed
import html
import json
import random
import re
import sys
import time
from datetime import datetime, timedelta, timezone
from pathlib import Path
from typing import Any
from urllib import parse, request


CN_TZ = timezone(timedelta(hours=8))
DEFAULT_OUTPUT = Path(__file__).resolve().parents[1] / "data" / "bilibili-videos.json"
SEARCH_API = "https://api.bilibili.com/x/web-interface/search/type"
UP_ARCHIVE_API = "https://api.bilibili.com/x/space/arc/search"
DEFAULT_KEYWORD = "电影解说"
DEFAULT_TAGS = (
  "电影解说",
  "高分电影解说",
  "悬疑电影解说",
  "科幻电影解说",
  "犯罪电影解说",
)
DEFAULT_SEARCH_ORDERS = ("totalrank", "click", "stow", "pubdate")


def parse_args() -> argparse.Namespace:
  parser = argparse.ArgumentParser(description="Fetch Bilibili video recommendations for the home page.")
  parser.add_argument("--keyword", default=DEFAULT_KEYWORD, help="Bilibili search keyword.")
  parser.add_argument(
    "--tag",
    action="append",
    default=[],
    help="Search tag/query phrase. Can be passed multiple times. Defaults to the built-in movie commentary tags.",
  )
  parser.add_argument(
    "--order",
    action="append",
    default=[],
    help="Bilibili search order. Useful values: totalrank, click, stow, dm, pubdate.",
  )
  parser.add_argument("--output", default=str(DEFAULT_OUTPUT), help="JSON output path.")
  parser.add_argument("--limit", type=int, default=8, help="Maximum videos to write.")
  parser.add_argument("--pages", type=int, default=3, help="Search result pages to scan for every tag/order pair.")
  parser.add_argument("--pool-size", type=int, default=80, help="Maximum scored candidate videos before final trim.")
  parser.add_argument("--history-size", type=int, default=240, help="Recent BVIDs to avoid when sampling recommendations.")
  parser.add_argument("--workers", type=int, default=8, help="Concurrent Bilibili requests.")
  parser.add_argument(
    "--up-mid",
    action="append",
    default=[],
    help="Followed UP mid to include. Can be passed multiple times.",
  )
  parser.add_argument("--timeout", type=float, default=12, help="Network timeout in seconds.")
  return parser.parse_args()


def now_cn() -> str:
  return datetime.now(CN_TZ).isoformat(timespec="seconds")


def clean_text(value: Any) -> str:
  text = html.unescape(str(value or ""))
  text = re.sub(r"<[^>]+>", "", text)
  return re.sub(r"\s+", " ", text).strip()


def parse_metric(value: Any) -> float:
  text = clean_text(value)
  if not text or text in {"-", "--"}:
    return 0

  multiplier = 1
  if text.endswith("万"):
    multiplier = 10000
    text = text[:-1]
  elif text.endswith("亿"):
    multiplier = 100000000
    text = text[:-1]

  try:
    return max(0, float(text.replace(",", "")) * multiplier)
  except ValueError:
    return 0


def normalize_tags(value: Any) -> list[str]:
  text = clean_text(value)
  if not text:
    return []

  tags = re.split(r"[,，/｜|、\s]+", text)
  return [tag for tag in (clean_text(tag) for tag in tags) if tag]


def get_published_timestamp(video: dict[str, Any]) -> float:
  timestamp = parse_metric(video.get("publishedAt"))
  if timestamp > 100000000000:
    return timestamp / 1000
  return timestamp


def get_recency_bonus(video: dict[str, Any]) -> float:
  timestamp = get_published_timestamp(video)
  if timestamp <= 0:
    return 0

  age_days = (datetime.now(CN_TZ).timestamp() - timestamp) / 86400
  if age_days < 0:
    return 0
  if age_days <= 7:
    return 42
  if age_days <= 30:
    return 34
  if age_days <= 90:
    return 24
  if age_days <= 365:
    return 14
  if age_days <= 1095:
    return 5
  return -10


def normalize_cover(value: Any) -> str:
  url = str(value or "").strip()
  if url.startswith("//"):
    return f"https:{url}"
  return url


def normalize_link(value: Any) -> str:
  url = str(value or "").strip()
  if url.startswith("//"):
    return f"https:{url}"
  if url.startswith("http://"):
    return f"https://{url.removeprefix('http://')}"
  return url


def build_url(base: str, params: dict[str, Any]) -> str:
  return f"{base}?{parse.urlencode(params)}"


def request_json(url: str, timeout: float) -> dict[str, Any]:
  req = request.Request(
    url,
    headers={
      "User-Agent": (
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) "
        "AppleWebKit/537.36 (KHTML, like Gecko) "
        "Chrome/125.0 Safari/537.36"
      ),
      "Referer": "https://www.bilibili.com/",
      "Accept": "application/json,text/plain,*/*",
    },
  )
  with request.urlopen(req, timeout=timeout) as response:
    return json.loads(response.read().decode("utf-8", errors="replace"))


def normalize_search_item(item: dict[str, Any], keyword: str, query: str, order: str) -> dict[str, Any] | None:
  title = clean_text(item.get("title"))
  bvid = clean_text(item.get("bvid"))
  url = normalize_link(clean_text(item.get("arcurl"))) or (f"https://www.bilibili.com/video/{bvid}" if bvid else "")

  if not title or not url:
    return None

  tags = normalize_tags(item.get("tag"))
  play = parse_metric(item.get("play"))
  favorites = parse_metric(item.get("favorites"))
  danmaku = parse_metric(item.get("video_review") or item.get("review"))
  description = clean_text(item.get("description"))

  return {
    "title": title,
    "upName": clean_text(item.get("author")) or "Bilibili",
    "cover": normalize_cover(item.get("pic")),
    "url": url,
    "bvid": bvid,
    "keyword": keyword,
    "query": query,
    "tags": tags,
    "source": "search",
    "searchOrder": order,
    "publishedAt": item.get("pubdate") or "",
    "stats": {
      "play": round(play),
      "favorites": round(favorites),
      "danmaku": round(danmaku),
    },
    "description": description,
  }


def normalize_up_item(item: dict[str, Any], mid: str, keyword: str) -> dict[str, Any] | None:
  title = clean_text(item.get("title"))
  bvid = clean_text(item.get("bvid"))
  url = f"https://www.bilibili.com/video/{bvid}" if bvid else ""

  if not title or not url:
    return None

  return {
    "title": title,
    "upName": clean_text(item.get("author")) or clean_text(item.get("owner", {}).get("name")) or f"UP {mid}",
    "cover": normalize_cover(item.get("pic")),
    "url": url,
    "bvid": bvid,
    "keyword": keyword,
    "query": keyword,
    "tags": normalize_tags(item.get("tag")),
    "source": "up",
    "upMid": mid,
    "publishedAt": item.get("created") or "",
    "stats": {
      "play": round(parse_metric(item.get("play"))),
      "favorites": round(parse_metric(item.get("favorites"))),
      "danmaku": round(parse_metric(item.get("video_review") or item.get("comment"))),
    },
  }


def get_video_key(video: dict[str, Any]) -> str:
  return str(video.get("bvid") or video.get("url") or video.get("title") or "").strip()


def fetch_search(keyword: str, query: str, order: str, page: int, limit: int, timeout: float) -> list[dict[str, Any]]:
  url = build_url(
    SEARCH_API,
    {
      "search_type": "video",
      "keyword": query,
      "order": order,
      "page": page,
    },
  )
  payload = request_json(url, timeout)
  results = payload.get("data", {}).get("result", [])
  if not isinstance(results, list):
    return []

  videos: list[dict[str, Any]] = []
  for item in results:
    if not isinstance(item, dict):
      continue
    video = normalize_search_item(item, keyword, query, order)
    if video:
      videos.append(video)
    if len(videos) >= limit:
      break
  return videos


def fetch_up_latest(mid: str, keyword: str, limit: int, timeout: float) -> list[dict[str, Any]]:
  url = build_url(
    UP_ARCHIVE_API,
    {
      "mid": mid,
      "pn": 1,
      "ps": min(limit, 10),
      "order": "pubdate",
      "jsonp": "jsonp",
    },
  )
  payload = request_json(url, timeout)
  vlist = payload.get("data", {}).get("list", {}).get("vlist", [])
  if not isinstance(vlist, list):
    return []

  videos: list[dict[str, Any]] = []
  for item in vlist:
    if not isinstance(item, dict):
      continue
    video = normalize_up_item(item, mid, keyword)
    if video:
      videos.append(video)
  return videos


def score_video(video: dict[str, Any], keyword: str, tags: list[str]) -> float:
  title = clean_text(video.get("title")).lower()
  description = clean_text(video.get("description")).lower()
  item_tags = [clean_text(tag).lower() for tag in video.get("tags") or []]
  query = clean_text(video.get("query")).lower()
  stats = video.get("stats") if isinstance(video.get("stats"), dict) else {}
  play = parse_metric(stats.get("play"))
  favorites = parse_metric(stats.get("favorites"))
  danmaku = parse_metric(stats.get("danmaku"))

  score = 0.0
  score += min(38, parse_metric(play) ** 0.25 * 2.4)
  score += min(22, parse_metric(favorites) ** 0.32 * 1.45)
  score += min(14, parse_metric(danmaku) ** 0.3)
  score += get_recency_bonus(video)

  searchable = f"{title} {description} {' '.join(item_tags)}"
  matched_specific_tag = False
  for index, tag in enumerate([keyword, *tags]):
    normalized_tag = clean_text(tag).lower()
    if not normalized_tag:
      continue
    tag_weight = max(4, 18 - index * 1.6)
    if normalized_tag in title:
      score += tag_weight
      if index > 0:
        matched_specific_tag = True
    elif normalized_tag in searchable:
      score += tag_weight * 0.55
      if index > 0:
        matched_specific_tag = True
    elif normalized_tag == query and index > 0:
      score += 2

  if tags and not matched_specific_tag:
    score -= 12

  order = video.get("searchOrder")
  if order == "totalrank":
    score += 8
  elif order == "click":
    score += 6
  elif order == "stow":
    score += 5
  elif order == "pubdate":
    score += 5

  if video.get("source") == "up":
    score += 16

  return round(score, 3)


def rank_videos(videos: list[dict[str, Any]], keyword: str, tags: list[str], pool_size: int) -> list[dict[str, Any]]:
  for video in videos:
    score = score_video(video, keyword, tags)
    video["qualityScore"] = score
    video["recencyScore"] = get_recency_bonus(video)
    video["description"] = clean_text(video.get("description"))[:140]

  return sorted(
    videos,
    key=lambda video: (
      parse_metric(video.get("qualityScore")),
      parse_metric(video.get("stats", {}).get("play") if isinstance(video.get("stats"), dict) else 0),
      parse_metric(video.get("publishedAt")),
    ),
    reverse=True,
  )[:pool_size]


def dedupe_videos(videos: list[dict[str, Any]], limit: int | None = None) -> list[dict[str, Any]]:
  seen: set[str] = set()
  unique: list[dict[str, Any]] = []

  for video in videos:
    key = get_video_key(video)
    if not key or key in seen:
      continue
    seen.add(key)
    unique.append(video)
    if limit is not None and len(unique) >= limit:
      break

  return unique


def load_recent_bvids(existing: dict[str, Any] | None, history_size: int) -> list[str]:
  if not existing:
    return []

  recent: list[str] = []
  for value in existing.get("recentBvids") or []:
    key = str(value or "").strip()
    if key and key not in recent:
      recent.append(key)

  for item in existing.get("items") or []:
    if isinstance(item, dict):
      key = get_video_key(item)
      if key and key not in recent:
        recent.insert(0, key)

  return recent[:history_size]


def build_weighted_key(video: dict[str, Any], rank_index: int) -> float:
  score = max(1, parse_metric(video.get("qualityScore")))
  play = parse_metric(video.get("stats", {}).get("play") if isinstance(video.get("stats"), dict) else 0)
  rank_bonus = max(1, 24 - rank_index * 0.18)
  weight = max(1, score * 1.4 + min(32, play ** 0.18) + rank_bonus)
  return random.random() ** (1 / weight)


def sample_recommendations(
  candidates: list[dict[str, Any]],
  limit: int,
  recent_bvids: list[str],
) -> list[dict[str, Any]]:
  recent = set(recent_bvids)
  fresh = [video for video in candidates if get_video_key(video) not in recent]
  source = fresh if len(fresh) >= limit else [*fresh, *[video for video in candidates if get_video_key(video) in recent]]

  weighted = sorted(
    enumerate(source),
    key=lambda item: build_weighted_key(item[1], item[0]),
    reverse=True,
  )
  selected: list[dict[str, Any]] = []

  for _, video in weighted:
    selected.append(video)
    if len(selected) >= limit:
      break

  return selected


def merge_recent_bvids(selected: list[dict[str, Any]], recent_bvids: list[str], history_size: int) -> list[str]:
  merged: list[str] = []
  for video in selected:
    key = get_video_key(video)
    if key and key not in merged:
      merged.append(key)

  for key in recent_bvids:
    if key and key not in merged:
      merged.append(key)

  return merged[:history_size]


def build_payload(
  keyword: str,
  tags: list[str],
  orders: list[str],
  up_mids: list[str],
  items: list[dict[str, Any]],
  candidate_pool: list[dict[str, Any]],
  recent_bvids: list[str],
  error: str = "",
) -> dict[str, Any]:
  search_url = f"https://search.bilibili.com/all?keyword={parse.quote(keyword)}"
  payload: dict[str, Any] = {
    "generatedAt": now_cn(),
    "keyword": keyword,
    "tags": tags,
    "searchOrders": orders,
    "recommendMode": "quality-tag-pool",
    "searchUrl": search_url,
    "followedUps": up_mids,
    "items": items,
    "candidatePool": candidate_pool,
    "candidateCount": len(candidate_pool),
    "recentBvids": recent_bvids,
  }
  if error:
    payload["error"] = error
  return payload


def load_existing(path: Path) -> dict[str, Any] | None:
  try:
    return json.loads(path.read_text(encoding="utf-8"))
  except (OSError, json.JSONDecodeError):
    return None


def write_payload(path: Path, payload: dict[str, Any]) -> None:
  path.parent.mkdir(parents=True, exist_ok=True)
  path.write_text(json.dumps(payload, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")


def main() -> int:
  args = parse_args()
  output = Path(args.output)
  existing = load_existing(output)
  videos: list[dict[str, Any]] = []
  errors: list[str] = []
  tags = [clean_text(tag) for tag in args.tag if clean_text(tag)] or list(DEFAULT_TAGS)
  orders = [clean_text(order) for order in args.order if clean_text(order)] or list(DEFAULT_SEARCH_ORDERS)
  page_count = max(1, min(5, args.pages))
  recent_bvids = load_recent_bvids(existing, args.history_size)
  worker_count = max(1, min(12, args.workers))

  with ThreadPoolExecutor(max_workers=worker_count) as executor:
    futures = {}
    for tag in tags:
      for order in orders:
        for page in range(1, page_count + 1):
          future = executor.submit(fetch_search, args.keyword, tag, order, page, max(args.limit, 12), args.timeout)
          futures[future] = f"search {tag}/{order}/p{page}"

    for mid in args.up_mid:
      future = executor.submit(fetch_up_latest, mid, args.keyword, args.limit, args.timeout)
      futures[future] = f"up {mid}"

    for future in as_completed(futures):
      label = futures[future]
      try:
        videos.extend(future.result())
      except Exception as exc:
        errors.append(f"{label}: {exc}")

  candidate_pool = rank_videos(dedupe_videos(videos), args.keyword, tags, args.pool_size)
  videos = sample_recommendations(candidate_pool, args.limit, recent_bvids)
  recent_bvids = merge_recent_bvids(videos, recent_bvids, args.history_size)

  if not videos:
    if existing and existing.get("items"):
      existing["error"] = "; ".join(errors) or "No Bilibili items fetched."
      write_payload(output, existing)
      print("No new Bilibili videos fetched; kept existing items.")
      return 1

  payload = build_payload(args.keyword, tags, orders, args.up_mid, videos, candidate_pool, recent_bvids, "; ".join(errors))
  write_payload(output, payload)
  print(f"Wrote {len(videos)} Bilibili videos to {output}")
  return 0 if videos else 1


if __name__ == "__main__":
  sys.exit(main())
