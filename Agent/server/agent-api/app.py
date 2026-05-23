from __future__ import annotations

import json
import hashlib
import os
import re
import subprocess
import sys
import time
from datetime import datetime, timedelta
from pathlib import Path
from typing import Any, Dict, List, Optional
from zoneinfo import ZoneInfo

import requests
from fastapi import BackgroundTasks, FastAPI, HTTPException, Request
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field

try:
    from dotenv import load_dotenv
except Exception:  # pragma: no cover - optional in tiny deployments
    load_dotenv = None


ROOT = Path(__file__).resolve().parent
if load_dotenv:
    load_dotenv(ROOT / ".env")

DATA_DIR = Path(os.environ.get("AGENT_DATA_DIR", ROOT / "data"))
SCRIPTS_DIR = Path(os.environ.get("AGENT_SCRIPTS_DIR", ROOT / "scripts"))
STOCK_DATA_DIR = DATA_DIR / "stocks"
WEATHER_CACHE_DIR = DATA_DIR / "weather"
BILIBILI_DATA_DIR = DATA_DIR / "bilibili"
STOCK_NAME_CACHE = STOCK_DATA_DIR / "a-share-code-name.json"
BILIBILI_DATA = DATA_DIR / "bilibili-videos.json"
BILIBILI_SCRIPT = SCRIPTS_DIR / "fetch-bilibili-videos.py"
STOCK_SCRIPT = SCRIPTS_DIR / "fetch-stock-data.py"
QWEATHER_HOST = os.environ.get("QWEATHER_HOST", "").strip().replace("https://", "").replace("http://", "").rstrip("/")
QWEATHER_KEY = os.environ.get("QWEATHER_KEY", "").strip()
QWEATHER_JWT = os.environ.get("QWEATHER_JWT", "").strip()
WEATHER_CACHE_SECONDS = int(os.environ.get("AGENT_WEATHER_CACHE_SECONDS", "600"))
STOCK_CACHE_SECONDS = int(os.environ.get("AGENT_STOCK_CACHE_SECONDS", "60"))
STOCK_OFF_HOURS_CACHE_SECONDS = int(os.environ.get("AGENT_STOCK_OFF_HOURS_CACHE_SECONDS", "1800"))
BILIBILI_CACHE_SECONDS = int(os.environ.get("AGENT_BILIBILI_CACHE_SECONDS", "21600"))
BILIBILI_POOL_SIZE = int(os.environ.get("AGENT_BILIBILI_POOL_SIZE", "160"))
BILIBILI_HISTORY_SIZE = int(os.environ.get("AGENT_BILIBILI_HISTORY_SIZE", "500"))
BILIBILI_PAGES = int(os.environ.get("AGENT_BILIBILI_PAGES", "4"))
BILIBILI_WORKERS = int(os.environ.get("AGENT_BILIBILI_WORKERS", "8"))
DEFAULT_BILIBILI_KEYWORD = "\u7535\u5f71\u89e3\u8bf4"
DEEPSEEK_API_KEY = os.environ.get("DEEPSEEK_API_KEY", "").strip()
DEEPSEEK_API_BASE = os.environ.get("DEEPSEEK_API_BASE", "https://api.deepseek.com").strip().rstrip("/")
DEEPSEEK_MODEL = os.environ.get("DEEPSEEK_MODEL", "deepseek-chat").strip()
DEEPSEEK_TIMEOUT_SECONDS = int(os.environ.get("DEEPSEEK_TIMEOUT_SECONDS", "24"))


app = FastAPI(title="Agent API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=os.environ.get("AGENT_CORS_ORIGINS", "*").split(","),
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
)


STOCKS: dict[str, dict[str, Any]] = {
    "byd": {
        "symbol": "002594",
        "name": "比亚迪",
        "code": "002594.SZ",
        "exchange": "SZSE",
        "output": STOCK_DATA_DIR / "byd.json",
    },
    "moutai": {
        "symbol": "600519",
        "name": "贵州茅台",
        "code": "600519.SH",
        "exchange": "SSE",
        "output": STOCK_DATA_DIR / "moutai.json",
    },
    "catl": {
        "symbol": "300750",
        "name": "宁德时代",
        "code": "300750.SZ",
        "exchange": "SZSE",
        "output": STOCK_DATA_DIR / "catl.json",
    },
    "pingan": {
        "symbol": "601318",
        "name": "中国平安",
        "code": "601318.SH",
        "exchange": "SSE",
        "output": STOCK_DATA_DIR / "pingan.json",
    },
    "gold-au9999": {
        "symbol": "Au99.99",
        "name": "黄金现货",
        "code": "Au99.99",
        "exchange": "SGE",
        "asset_type": "sge-spot",
        "unit": "/g",
        "output": STOCK_DATA_DIR / "gold-au9999.json",
    },
    "silver-ag9999": {
        "symbol": "Ag99.99",
        "name": "白银现货",
        "code": "Ag99.99",
        "exchange": "SGE",
        "asset_type": "sge-spot",
        "unit": "/g",
        "price_scale": 0.001,
        "output": STOCK_DATA_DIR / "silver-ag9999.json",
    },
}


def normalize_stock_symbol(value: object) -> str:
    text = "".join(char for char in str(value or "") if char.isdigit())
    return text if len(text) == 6 else ""


def infer_stock_exchange(symbol: str) -> str:
    return "SSE" if symbol.startswith(("5", "6", "9")) else "SZSE"


def infer_stock_code(symbol: str, exchange: str) -> str:
    return f"{symbol}.{'SH' if exchange == 'SSE' else 'SZ'}"


def read_json(path: Path) -> dict[str, Any]:
    return json.loads(path.read_text(encoding="utf-8"))


def write_json(path: Path, payload: dict[str, Any]) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(json.dumps(payload, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")


def now_epoch() -> float:
    return time.time()


def now_cn() -> str:
    return datetime.now(ZoneInfo("Asia/Shanghai")).isoformat(timespec="seconds")


def file_age_seconds(path: Path) -> float:
    try:
        return max(0, now_epoch() - path.stat().st_mtime)
    except OSError:
        return float("inf")


def is_cache_fresh(path: Path, ttl_seconds: int) -> bool:
    return path.exists() and file_age_seconds(path) <= max(1, ttl_seconds)


def stable_hash(value: object, length: int = 16) -> str:
    raw = json.dumps(value, ensure_ascii=False, sort_keys=True, default=str)
    return hashlib.sha1(raw.encode("utf-8")).hexdigest()[:length]


def safe_cache_label(value: object, fallback: str = "cache") -> str:
    text = str(value or "").strip().lower()
    text = re.sub(r"[^0-9a-zA-Z\u4e00-\u9fff_-]+", "-", text).strip("-")
    return (text or fallback)[:32]


def cache_meta(path: Path, ttl_seconds: int) -> dict[str, Any]:
    age = file_age_seconds(path)
    return {
        "path": path.name,
        "ageSeconds": None if age == float("inf") else round(age, 1),
        "ttlSeconds": ttl_seconds,
        "fresh": is_cache_fresh(path, ttl_seconds),
    }


def should_start_background_refresh(lock_path: Path, cooldown_seconds: int = 90) -> bool:
    if is_cache_fresh(lock_path, cooldown_seconds):
        return False
    try:
        lock_path.parent.mkdir(parents=True, exist_ok=True)
        lock_path.write_text(str(now_epoch()), encoding="utf-8")
        return True
    except OSError:
        return False


def load_stock_name_cache() -> dict[str, Any]:
    try:
        payload = read_json(STOCK_NAME_CACHE)
        stocks = payload.get("stocks")
        return stocks if isinstance(stocks, dict) else {}
    except Exception:
        return {}


def stock_profile_from_cache(symbol: str) -> dict[str, Any] | None:
    cached = load_stock_name_cache().get(symbol)
    if not isinstance(cached, dict) or not cached.get("name"):
        return None

    exchange = cached.get("exchange") if cached.get("exchange") in {"SSE", "SZSE"} else infer_stock_exchange(symbol)
    return {
        "symbol": symbol,
        "name": str(cached.get("name")).strip()[:18],
        "code": cached.get("code") or infer_stock_code(symbol, exchange),
        "exchange": exchange,
        "found": True,
        "source": "local-cache",
    }


def stock_profile_from_builtin(symbol: str) -> dict[str, Any] | None:
    for stock in STOCKS.values():
        if stock["symbol"] == symbol:
            return {
                "symbol": symbol,
                "name": stock["name"],
                "code": stock["code"],
                "exchange": stock["exchange"],
                "found": True,
                "source": "builtin",
            }
    return None


def stock_profile_from_akshare(symbol: str) -> dict[str, Any] | None:
    script = r"""
import json
import sys

symbol = sys.argv[1]
payload = {"symbol": symbol, "found": False}

try:
    import akshare as ak

    sources = (
        (ak.stock_info_a_code_name, "code", "name"),
        (ak.stock_zh_a_spot_em, "代码", "名称"),
    )
    for getter, code_key, name_key in sources:
        frame = getter()
        if frame is None or frame.empty or code_key not in frame.columns:
            continue
        codes = frame[code_key].astype(str).str.zfill(6)
        match = frame[codes == symbol]
        if match.empty:
            continue
        row = match.iloc[0].to_dict()
        name = str(row.get(name_key) or row.get("name") or row.get("名称") or "").strip()
        if name:
            payload.update({"name": name, "found": True})
            break
except Exception as error:
    payload["error"] = str(error)

print(json.dumps(payload, ensure_ascii=False))
"""
    result = run_command([sys.executable, "-c", script, symbol], timeout=90, check=False)
    if result.returncode != 0:
        return None

    matches = re.findall(r"\{[^\r\n]*\}", result.stdout)
    if not matches:
        return None

    payload = json.loads(matches[-1])
    if not payload.get("found") or not payload.get("name"):
        return None

    exchange = infer_stock_exchange(symbol)
    return {
        "symbol": symbol,
        "name": str(payload["name"]).strip()[:18],
        "code": infer_stock_code(symbol, exchange),
        "exchange": exchange,
        "found": True,
        "source": "akshare",
    }


def update_stock_name_cache(profile: dict[str, Any]) -> None:
    symbol = str(profile.get("symbol") or "")
    if not normalize_stock_symbol(symbol):
        return

    try:
        payload = read_json(STOCK_NAME_CACHE)
    except Exception:
        payload = {"stocks": {}}

    stocks = payload.setdefault("stocks", {})
    if isinstance(stocks, dict):
        stocks[symbol] = {
            "symbol": symbol,
            "name": profile.get("name"),
            "code": profile.get("code"),
            "exchange": profile.get("exchange"),
        }
        payload["count"] = len(stocks)
        write_json(STOCK_NAME_CACHE, payload)


def run_command(command: list[str], *, timeout: int, check: bool = True) -> subprocess.CompletedProcess[str]:
    env = os.environ.copy()
    if env.get("AGENT_USE_PROXY", "").lower() not in {"1", "true", "yes"}:
        for key in ("HTTP_PROXY", "HTTPS_PROXY", "ALL_PROXY", "http_proxy", "https_proxy", "all_proxy"):
            env.pop(key, None)
        env["NO_PROXY"] = "*"
        env["no_proxy"] = "*"

    result = subprocess.run(
        command,
        cwd=ROOT,
        env=env,
        capture_output=True,
        text=True,
        encoding="utf-8",
        errors="replace",
        timeout=timeout,
        check=False,
    )
    if check and result.returncode != 0:
        detail = result.stderr.strip() or result.stdout.strip() or f"Command failed: {command[0]}"
        raise HTTPException(status_code=502, detail=detail)
    return result


async def read_request_json(request: Request) -> dict[str, Any]:
    try:
        payload = await request.json()
    except Exception:
        return {}
    return payload if isinstance(payload, dict) else {}


def get_stock_config(stock_key: str, payload: dict[str, Any]) -> dict[str, Any] | None:
    if stock_key in STOCKS:
        return STOCKS[stock_key]

    stock_payload = payload.get("stock") if isinstance(payload.get("stock"), dict) else {}
    symbol = normalize_stock_symbol(stock_payload.get("symbol") or stock_payload.get("code") or stock_key)
    if not symbol:
        return None

    exchange = stock_payload.get("exchange") if stock_payload.get("exchange") in {"SSE", "SZSE"} else infer_stock_exchange(symbol)
    code = stock_payload.get("code") or infer_stock_code(symbol, exchange)
    name = str(stock_payload.get("name") or code).strip()[:18] or code
    return {
        "symbol": symbol,
        "name": name,
        "code": code,
        "exchange": exchange,
        "output": STOCK_DATA_DIR / f"custom-{symbol}.json",
    }


def get_qweather_headers() -> dict[str, str]:
    if QWEATHER_JWT:
        return {"Authorization": f"Bearer {QWEATHER_JWT}"}
    if QWEATHER_KEY:
        return {"X-QW-Api-Key": QWEATHER_KEY}
    raise HTTPException(status_code=500, detail="QWeather backend key is not configured")


def qweather_get(path: str, params: dict[str, Any] | None = None, *, timeout: int = 6) -> dict[str, Any]:
    if not QWEATHER_HOST:
        raise HTTPException(status_code=500, detail="QWeather backend host is not configured")

    query = {"lang": "zh", "unit": "m"}
    if params:
        query.update({key: value for key, value in params.items() if value is not None and value != ""})

    try:
        response = requests.get(
            f"https://{QWEATHER_HOST}{path}",
            params=query,
            headers=get_qweather_headers(),
            timeout=timeout,
        )
    except requests.RequestException as error:
        raise HTTPException(status_code=502, detail=f"QWeather request failed: {error}") from error

    if response.status_code >= 400:
        raise HTTPException(status_code=502, detail=f"QWeather HTTP {response.status_code}")

    try:
        payload = response.json()
    except ValueError as error:
        raise HTTPException(status_code=502, detail="QWeather returned invalid JSON") from error

    code = str(payload.get("code") or "200")
    if code != "200":
        raise HTTPException(status_code=502, detail=f"QWeather {code}")

    return payload


def parse_float(value: Any) -> float | None:
    try:
        number = float(value)
    except (TypeError, ValueError):
        return None
    return number if number == number else None


def parse_coordinate_query(value: str) -> tuple[float, float] | None:
    parts = [part.strip() for part in str(value or "").split(",")]
    if len(parts) != 2:
        return None
    lon = parse_float(parts[0])
    lat = parse_float(parts[1])
    if lon is None or lat is None:
        return None
    return lon, lat


def parse_int(value: Any, default: int = 0) -> int:
    number = parse_float(value)
    return int(round(number)) if number is not None else default


def date_key_in_zone(value: datetime | None = None, timezone_name: str = "Asia/Shanghai") -> str:
    try:
        zone = ZoneInfo(timezone_name or "Asia/Shanghai")
    except Exception:
        zone = ZoneInfo("Asia/Shanghai")
    return (value or datetime.now(zone)).astimezone(zone).date().isoformat()


def shift_date_key(date_key: str, days: int) -> str:
    try:
        current = datetime.strptime(date_key, "%Y-%m-%d")
    except ValueError:
        current = datetime.now(ZoneInfo("Asia/Shanghai"))
    return (current + timedelta(days=days)).date().isoformat()


def qweather_icon_kind(icon: Any, text: Any = "") -> str:
    code = str(icon or "").strip()
    if re.match(r"^(100|150)$", code):
        return "clear"
    if re.match(r"^(101|102|103|104|151|152|153|154)$", code):
        return "cloudy"
    if re.match(r"^(300|301|302|303|304|305|306|307|308|309|310|311|312|313|314|315|316|317|318|350|351|399)$", code):
        return "rain"
    if re.match(r"^(400|401|402|403|404|405|406|407|408|409|410|456|457|499)$", code):
        return "snow"
    if re.match(r"^(500|501|502|503|504|507|508|509|510|511|512|513|514|515)$", code):
        return "fog"

    text_value = str(text or "")
    if "雷" in text_value:
        return "storm"
    if "雪" in text_value or "冰" in text_value:
        return "snow"
    if "雨" in text_value or "降水" in text_value:
        return "rain"
    if "雾" in text_value or "霾" in text_value or "沙" in text_value:
        return "fog"
    if "云" in text_value or "阴" in text_value:
        return "cloudy"
    return "clear"


def normalize_qweather_air_index(indexes: Any) -> dict[str, Any] | None:
    if not isinstance(indexes, list) or not indexes:
        return None
    preferred = next((item for item in indexes if isinstance(item, dict) and item.get("code") == "cn-mee"), None)
    if not preferred:
        preferred = next((item for item in indexes if isinstance(item, dict)), None)
    if not preferred:
        return None
    aqi = parse_float(preferred.get("aqi"))
    return {
        "aqi": aqi,
        "display": preferred.get("aqiDisplay") or preferred.get("aqi") or "",
        "category": preferred.get("category") or "",
    }


def normalize_qweather_daily_air(payload: dict[str, Any] | None) -> dict[str, dict[str, Any] | None]:
    result: dict[str, dict[str, Any] | None] = {}
    for day in payload.get("days", []) if isinstance(payload, dict) else []:
        if not isinstance(day, dict):
            continue
        key = str(day.get("forecastStartTime") or day.get("fxDate") or day.get("date") or "")[:10]
        if key:
            result[key] = normalize_qweather_air_index(day.get("indexes"))
    return result


def format_qweather_location_label(item: dict[str, Any] | None) -> str:
    if not item:
        return ""
    parts: list[str] = []
    for key in ("adm2", "name"):
        value = str(item.get(key) or "").strip()
        if value and value not in parts:
            parts.append(value)
    return " ".join(parts) or str(item.get("name") or item.get("adm2") or item.get("adm1") or "").strip()


def normalize_location_item(item: dict[str, Any]) -> dict[str, Any]:
    lat = parse_float(item.get("lat"))
    lon = parse_float(item.get("lon"))
    label = format_qweather_location_label(item)
    return {
        "label": label or item.get("name") or "已选地区",
        "buttonLabel": item.get("name") or label or "已选地区",
        "latitude": lat,
        "longitude": lon,
        "qweatherLocation": item.get("id") or (f"{lon},{lat}" if lon is not None and lat is not None else ""),
        "timezone": item.get("tz") or "Asia/Shanghai",
        "country": item.get("country") or "",
        "adm1": item.get("adm1") or "",
        "adm2": item.get("adm2") or "",
    }


def lookup_qweather_location(query: str, number: int = 1) -> list[dict[str, Any]]:
    payload = qweather_get(
        "/geo/v2/city/lookup",
        {"location": query, "number": str(max(1, min(number, 20)))},
        timeout=6,
    )
    locations = payload.get("location")
    return locations if isinstance(locations, list) else []


def resolve_weather_location(location: str, label: str = "", lat: float | None = None, lon: float | None = None) -> dict[str, Any]:
    query = location.strip() if isinstance(location, str) else ""
    if not query and lon is not None and lat is not None:
        query = f"{lon:.4f},{lat:.4f}"
    if not query:
        raise HTTPException(status_code=400, detail="Missing weather location")

    exact_coordinate = parse_coordinate_query(query)
    geo = lookup_qweather_location(query, 1)
    normalized = normalize_location_item(geo[0]) if geo else {}
    if exact_coordinate:
        normalized["longitude"] = exact_coordinate[0]
        normalized["latitude"] = exact_coordinate[1]
        normalized["qweatherLocation"] = f"{exact_coordinate[0]:.4f},{exact_coordinate[1]:.4f}"
    if lat is not None:
        normalized["latitude"] = lat
    if lon is not None:
        normalized["longitude"] = lon
    if exact_coordinate:
        normalized["qweatherLocation"] = f"{exact_coordinate[0]:.4f},{exact_coordinate[1]:.4f}"
    if label:
        normalized["label"] = label
        normalized["buttonLabel"] = label.split(" ")[-1] if " " in label else label
    normalized.setdefault("label", label or query)
    normalized.setdefault("buttonLabel", normalized["label"])
    normalized.setdefault("qweatherLocation", query)
    normalized.setdefault("timezone", "Asia/Shanghai")
    return normalized


def fetch_current_air(location: dict[str, Any]) -> dict[str, Any] | None:
    lat = parse_float(location.get("latitude"))
    lon = parse_float(location.get("longitude"))
    if lat is None or lon is None:
        return None
    payload = qweather_get(f"/airquality/v1/current/{lat:.4f}/{lon:.4f}", {}, timeout=5)
    return normalize_qweather_air_index(payload.get("indexes"))


def fetch_daily_air(location: dict[str, Any]) -> dict[str, dict[str, Any] | None]:
    lat = parse_float(location.get("latitude"))
    lon = parse_float(location.get("longitude"))
    if lat is None or lon is None:
        return {}
    payload = qweather_get(f"/airquality/v1/daily/{lat:.4f}/{lon:.4f}", {"localTime": "true"}, timeout=5)
    return normalize_qweather_daily_air(payload)


def fetch_historical_weather(location: dict[str, Any], date_key: str) -> dict[str, Any] | None:
    q_location = str(location.get("qweatherLocation") or "")
    if not q_location or "," in q_location:
        return None
    try:
        payload = qweather_get(
            "/v7/historical/weather",
            {"location": q_location, "date": date_key.replace("-", "")},
            timeout=5,
        )
    except HTTPException:
        return None

    daily = payload.get("weatherDaily") if isinstance(payload.get("weatherDaily"), dict) else {}
    hourly = payload.get("weatherHourly") if isinstance(payload.get("weatherHourly"), list) else []
    representative = next((item for item in hourly if isinstance(item, dict) and "12:" in str(item.get("time") or "")), None)
    if not isinstance(representative, dict):
        representative = hourly[len(hourly) // 2] if hourly else {}

    icon = daily.get("iconDay") or representative.get("icon") or ""
    text = daily.get("textDay") or representative.get("text") or "历史"
    temp_max = parse_float(daily.get("tempMax") or representative.get("temp"))
    temp_min = parse_float(daily.get("tempMin") or representative.get("temp"))
    if temp_max is None or temp_min is None:
        return None

    precip = parse_float(daily.get("precip")) or 0
    return {
        "date": date_key,
        "weatherCode": text,
        "icon": icon,
        "weatherKind": qweather_icon_kind(icon, text),
        "max": round(temp_max),
        "min": round(temp_min),
        "precipitationProbability": round(precip),
        "precipitationText": f"降水 {precip:g}mm",
        "airQuality": None,
    }


def normalize_qweather_weather(
    location: dict[str, Any],
    now_payload: dict[str, Any],
    hourly_payload: dict[str, Any],
    daily_payload: dict[str, Any],
    air_quality: dict[str, Any] | None,
    daily_air: dict[str, dict[str, Any] | None],
    historical_forecast: list[dict[str, Any] | None],
) -> dict[str, Any]:
    now = now_payload.get("now") if isinstance(now_payload.get("now"), dict) else {}
    daily = daily_payload.get("daily") if isinstance(daily_payload.get("daily"), list) else []
    timezone_name = str(location.get("timezone") or "Asia/Shanghai")
    today_key = date_key_in_zone(timezone_name=timezone_name)

    future_forecast: list[dict[str, Any]] = []
    for day in daily:
        if not isinstance(day, dict):
            continue
        icon = day.get("iconDay") or day.get("iconNight") or ""
        text = day.get("textDay") or day.get("textNight") or "更新中"
        fx_date = str(day.get("fxDate") or "")
        precip = parse_float(day.get("precip")) or 0
        future_forecast.append(
            {
                "date": fx_date,
                "weatherCode": text,
                "icon": icon,
                "weatherKind": qweather_icon_kind(icon, text),
                "max": parse_int(day.get("tempMax")),
                "min": parse_int(day.get("tempMin")),
                "uvIndex": parse_float(day.get("uvIndex")),
                "precipitationProbability": round(precip),
                "precipitationText": f"降水 {precip:g}mm",
                "airQuality": daily_air.get(fx_date) or (air_quality if fx_date == today_key else None),
            }
        )

    forecast_by_date: dict[str, dict[str, Any]] = {}
    for day in historical_forecast + future_forecast:
        if day and day.get("date"):
            forecast_by_date[str(day["date"])] = day
    forecast = [forecast_by_date[key] for key in sorted(forecast_by_date.keys())]
    today = future_forecast[0] if future_forecast else {
        "max": parse_int(now.get("temp")),
        "min": parse_int(now.get("temp")),
        "precipitationProbability": 0,
        "precipitationText": "降水 --",
    }

    now_icon = now.get("icon") or ""
    now_text = now.get("text") or ""
    return {
        "location": location.get("label") or "本地",
        "current": {
            "temperature": parse_int(now.get("temp"), today.get("max", 0)),
            "weatherCode": now_text or "更新中",
            "icon": now_icon,
            "weatherKind": qweather_icon_kind(now_icon, now_text),
            "obsTime": now.get("obsTime") or "",
            "feelsLike": parse_int(now.get("feelsLike"), parse_int(now.get("temp"), today.get("max", 0))),
            "humidity": parse_int(now.get("humidity"), -1),
            "windDir": now.get("windDir") or "",
            "windSpeed": parse_int(now.get("windSpeed")),
            "pressure": parse_int(now.get("pressure"), -1),
            "visibility": parse_int(now.get("vis"), -1),
            "precipitation": parse_float(now.get("precip")),
        },
        "today": today,
        "forecast": forecast,
        "hourly": [
            {
                "time": hour.get("fxTime"),
                "temperature": parse_int(hour.get("temp")),
                "weatherCode": hour.get("text") or "",
                "icon": hour.get("icon") or "",
                "weatherKind": qweather_icon_kind(hour.get("icon"), hour.get("text")),
                "precipitationProbability": parse_int(hour.get("pop")),
            }
            for hour in hourly_payload.get("hourly", [])
            if isinstance(hour, dict)
        ],
        "airQuality": air_quality,
    }


def fetch_weather_data(location: dict[str, Any]) -> dict[str, Any]:
    q_location = str(location.get("qweatherLocation") or "")
    if not q_location:
        lon = parse_float(location.get("longitude"))
        lat = parse_float(location.get("latitude"))
        if lon is None or lat is None:
            raise HTTPException(status_code=400, detail="Missing weather coordinates")
        q_location = f"{lon:.4f},{lat:.4f}"

    now_payload = qweather_get("/v7/weather/now", {"location": q_location}, timeout=6)
    hourly_payload = qweather_get("/v7/weather/24h", {"location": q_location}, timeout=6)
    daily_payload = qweather_get("/v7/weather/7d", {"location": q_location}, timeout=6)

    timezone_name = str(location.get("timezone") or "Asia/Shanghai")
    yesterday_key = shift_date_key(date_key_in_zone(timezone_name=timezone_name), -1)
    air_quality = None
    daily_air: dict[str, dict[str, Any] | None] = {}
    historical_day = None
    try:
        air_quality = fetch_current_air(location)
    except HTTPException:
        air_quality = None
    try:
        daily_air = fetch_daily_air(location)
    except HTTPException:
        daily_air = {}
    try:
        historical_day = fetch_historical_weather(location, yesterday_key)
    except HTTPException:
        historical_day = None

    return normalize_qweather_weather(
        location,
        now_payload,
        hourly_payload,
        daily_payload,
        air_quality,
        daily_air,
        [historical_day],
    )


def weather_cache_path(location: dict[str, Any]) -> Path:
    key = stable_hash(
        {
            "qweatherLocation": location.get("qweatherLocation"),
            "label": location.get("label"),
            "lat": round(parse_float(location.get("latitude")) or 0, 4),
            "lon": round(parse_float(location.get("longitude")) or 0, 4),
        }
    )
    label = safe_cache_label(location.get("label") or location.get("qweatherLocation"), "weather")
    return WEATHER_CACHE_DIR / f"{label}-{key}.json"


def refresh_weather_cache(location: dict[str, Any], cache_path: Path) -> dict[str, Any]:
    data = fetch_weather_data(location)
    payload = {
        "location": location,
        "data": data,
        "generatedAt": now_cn(),
    }
    write_json(cache_path, payload)
    return payload


def schedule_weather_refresh(background_tasks: BackgroundTasks, location: dict[str, Any], cache_path: Path) -> None:
    lock_path = cache_path.with_suffix(".lock")
    if should_start_background_refresh(lock_path, 120):
        background_tasks.add_task(refresh_weather_cache, location, cache_path)


class ChatMessage(BaseModel):
    role: str = Field(default="user", max_length=16)
    content: str = Field(default="", max_length=6000)


class ChatRequest(BaseModel):
    messages: List[ChatMessage] = Field(default_factory=list)
    context: Optional[Dict[str, Any]] = None


def normalize_chat_messages(messages: list[ChatMessage]) -> list[dict[str, str]]:
    normalized: list[dict[str, str]] = []
    for message in messages[-12:]:
        role = message.role if message.role in {"system", "user", "assistant"} else "user"
        content = str(message.content or "").strip()
        if not content:
            continue
        normalized.append({"role": role, "content": content[:6000]})

    if not any(item["role"] == "system" for item in normalized):
        normalized.insert(
            0,
            {
                "role": "system",
                "content": "你是用户 Home 仪表盘里的轻量 AI 小助手。用简短中文回复，亲切、自然，可以轻轻调侃，但不要太长。",
            },
        )
    return normalized


def request_deepseek_chat(messages: list[dict[str, str]]) -> dict[str, Any]:
    if not DEEPSEEK_API_KEY:
        raise HTTPException(status_code=503, detail="DEEPSEEK_API_KEY is not configured")
    if not DEEPSEEK_API_BASE or not DEEPSEEK_MODEL:
        raise HTTPException(status_code=503, detail="DeepSeek chat backend is not configured")

    try:
        response = requests.post(
            f"{DEEPSEEK_API_BASE}/chat/completions",
            headers={
                "Authorization": f"Bearer {DEEPSEEK_API_KEY}",
                "Content-Type": "application/json",
            },
            json={
                "model": DEEPSEEK_MODEL,
                "messages": messages,
                "temperature": 0.72,
                "max_tokens": 520,
            },
            timeout=DEEPSEEK_TIMEOUT_SECONDS,
        )
    except requests.RequestException as error:
        raise HTTPException(status_code=502, detail=f"DeepSeek request failed: {error}") from error

    if response.status_code >= 400:
        detail = response.text.strip()[:500] or f"DeepSeek HTTP {response.status_code}"
        raise HTTPException(status_code=502, detail=detail)

    try:
        payload = response.json()
    except ValueError as error:
        raise HTTPException(status_code=502, detail="DeepSeek returned invalid JSON") from error

    reply = str(payload.get("choices", [{}])[0].get("message", {}).get("content", "")).strip()
    if not reply:
        raise HTTPException(status_code=502, detail="DeepSeek returned an empty reply")
    return {"reply": reply, "raw": payload}


@app.get("/health")
def health() -> dict[str, Any]:
    return {
        "ok": True,
        "service": "agent-api",
        "dataDir": str(DATA_DIR),
        "scriptsDir": str(SCRIPTS_DIR),
        "chatConfigured": bool(DEEPSEEK_API_KEY),
    }


@app.post("/api/chat")
def chat(payload: ChatRequest) -> dict[str, Any]:
    messages = normalize_chat_messages(payload.messages)
    result = request_deepseek_chat(messages)
    return {
        "ok": True,
        "reply": result["reply"],
        "assistantName": os.environ.get("AGENT_ASSISTANT_NAME", "AI"),
        "model": DEEPSEEK_MODEL,
    }


@app.get("/api/weather/locations")
def search_weather_locations(q: str = "", query: str = "", number: int = 8) -> dict[str, Any]:
    keyword = (q or query).strip()
    if not keyword:
        return {"ok": True, "locations": []}
    locations = lookup_qweather_location(keyword, number)
    return {"ok": True, "locations": locations, "normalized": [normalize_location_item(item) for item in locations]}


@app.get("/api/weather")
def weather(
    background_tasks: BackgroundTasks,
    location: str = "",
    label: str = "",
    lat: float | None = None,
    lon: float | None = None,
    force: bool = False,
) -> dict[str, Any]:
    resolved_location = resolve_weather_location(location, label, lat, lon)
    cache_path = weather_cache_path(resolved_location)
    cached: dict[str, Any] | None = None

    if cache_path.exists():
        try:
            cached = read_json(cache_path)
        except Exception:
            cached = None

    if cached and not force:
        if not is_cache_fresh(cache_path, WEATHER_CACHE_SECONDS):
            schedule_weather_refresh(background_tasks, resolved_location, cache_path)
        return {
            "ok": True,
            "location": cached.get("location") or resolved_location,
            "data": cached.get("data"),
            "cache": cache_meta(cache_path, WEATHER_CACHE_SECONDS),
        }

    try:
        payload = refresh_weather_cache(resolved_location, cache_path)
    except Exception:
        if cached:
            return {
                "ok": True,
                "location": cached.get("location") or resolved_location,
                "data": cached.get("data"),
                "cache": {**cache_meta(cache_path, WEATHER_CACHE_SECONDS), "staleFallback": True},
            }
        raise

    return {
        "ok": True,
        "location": payload.get("location") or resolved_location,
        "data": payload.get("data"),
        "cache": cache_meta(cache_path, WEATHER_CACHE_SECONDS),
    }


@app.get("/api/stocks/lookup")
def lookup_stock(symbol: str = "", q: str = "") -> dict[str, Any]:
    query = (symbol or q).strip()
    clean_symbol = normalize_stock_symbol(query)

    if clean_symbol:
        profile = stock_profile_from_cache(clean_symbol) or stock_profile_from_builtin(clean_symbol) or stock_profile_from_akshare(clean_symbol)
        if profile:
            update_stock_name_cache(profile)
            return {"ok": True, "stock": profile}

        exchange = infer_stock_exchange(clean_symbol)
        return {
            "ok": True,
            "stock": {
                "symbol": clean_symbol,
                "name": infer_stock_code(clean_symbol, exchange),
                "code": infer_stock_code(clean_symbol, exchange),
                "exchange": exchange,
                "found": False,
            },
        }

    normalized_query = query.upper().replace(" ", "")
    results: list[dict[str, Any]] = []
    for item in load_stock_name_cache().values():
        if not isinstance(item, dict):
            continue
        searchable = f"{item.get('symbol', '')}{item.get('code', '')}{item.get('name', '')}".upper().replace(" ", "")
        if normalized_query and normalized_query in searchable:
            results.append(item)
        if len(results) >= 12:
            break

    return {"ok": True, "results": results}


def is_cn_market_window() -> bool:
    now = datetime.now(ZoneInfo("Asia/Shanghai"))
    if now.weekday() >= 5:
        return False
    minute = now.hour * 60 + now.minute
    return 9 * 60 <= minute <= 15 * 60 + 10


def stock_cache_ttl_seconds() -> int:
    return STOCK_CACHE_SECONDS if is_cn_market_window() else STOCK_OFF_HOURS_CACHE_SECONDS


def refresh_stock_data(stock: dict[str, Any]) -> dict[str, Any]:
    if not STOCK_SCRIPT.exists():
        raise HTTPException(status_code=500, detail=f"Missing script: {STOCK_SCRIPT}")

    command = [
        sys.executable,
        str(STOCK_SCRIPT),
        "--symbol",
        str(stock["symbol"]),
        "--name",
        str(stock["name"]),
        "--code",
        str(stock["code"]),
        "--exchange",
        str(stock["exchange"]),
        "--output",
        str(stock["output"]),
        "--target-points",
        "60",
        "--retries",
        "2",
        "--request-delay",
        "0.2",
        "--min-valid-intervals",
        "4",
    ]
    if stock.get("asset_type"):
        command.extend(["--asset-type", str(stock["asset_type"])])
    if stock.get("unit"):
        command.extend(["--unit", str(stock["unit"])])
    if stock.get("price_scale", 1) != 1:
        command.extend(["--price-scale", str(stock["price_scale"])])

    run_command(command, timeout=220)
    return read_json(Path(stock["output"]))


def schedule_stock_refresh(background_tasks: BackgroundTasks, stock: dict[str, Any]) -> None:
    output = Path(stock["output"])
    lock_path = output.with_suffix(".lock")
    if should_start_background_refresh(lock_path, max(60, stock_cache_ttl_seconds())):
        background_tasks.add_task(refresh_stock_data, stock)


@app.get("/api/stocks/{stock_key}")
def get_stock(background_tasks: BackgroundTasks, stock_key: str) -> dict[str, Any]:
    stock = get_stock_config(stock_key, {})
    if not stock:
        raise HTTPException(status_code=404, detail=f"Unknown stock: {stock_key}")

    output = Path(stock["output"])
    if not output.exists():
        raise HTTPException(status_code=404, detail=f"Stock data has not been generated: {stock_key}")

    ttl = stock_cache_ttl_seconds()
    if not is_cache_fresh(output, ttl):
        schedule_stock_refresh(background_tasks, stock)

    return {"ok": True, "stock": stock_key, "data": read_json(output), "cache": cache_meta(output, ttl)}


@app.post("/api/stocks/{stock_key}/refresh")
async def refresh_stock(stock_key: str, request: Request) -> dict[str, Any]:
    payload = await read_request_json(request)
    stock = get_stock_config(stock_key, payload)
    if not stock:
        raise HTTPException(status_code=404, detail=f"Unknown stock: {stock_key}")

    try:
        data = refresh_stock_data(stock)
    except Exception as error:
        raise HTTPException(status_code=500, detail=f"Stock data was not generated: {error}") from error

    return {
        "ok": True,
        "stock": stock_key,
        "generatedAt": data.get("generatedAt"),
        "quote": data.get("quote"),
        "data": data,
    }


def normalize_bilibili_keyword(value: object) -> str:
    text = str(value or "").strip()
    return text[:32] if text else DEFAULT_BILIBILI_KEYWORD


def normalize_bilibili_tags(value: object) -> list[str]:
    if isinstance(value, list):
        raw_tags = value
    else:
        normalized = str(value or "")
        for separator in ("\uff0c", "\uff5c", "\u3001", "/", "|"):
            normalized = normalized.replace(separator, ",")
        raw_tags = re.split(r"[,\s]+", normalized)

    tags: list[str] = []
    for tag in raw_tags:
        text = str(tag or "").strip()
        if text and text not in tags:
            tags.append(text[:32])
    return tags[:10]


def normalize_bilibili_up_mids(value: object) -> list[str]:
    if isinstance(value, list):
        raw_mids = value
    else:
        raw_mids = re.split(r"[,\s]+", str(value or ""))

    mids: list[str] = []
    for mid in raw_mids:
        text = re.sub(r"\D", "", str(mid or ""))
        if text and text not in mids:
            mids.append(text)
    return mids[:8]


def expand_bilibili_tags(tags: list[str]) -> list[str]:
    aliases = {
        "cs": ["CS2", "CSGO", "\u53cd\u6050\u7cbe\u82f1", "\u53cd\u6050\u7cbe\u82f12"],
        "cs2": ["CS2", "\u53cd\u6050\u7cbe\u82f12", "\u53cd\u6050\u7cbe\u82f1"],
        "csgo": ["CSGO", "\u53cd\u6050\u7cbe\u82f1"],
        "\u53cd\u6050\u7cbe\u82f1": ["\u53cd\u6050\u7cbe\u82f1", "CS2", "CSGO", "\u53cd\u6050\u7cbe\u82f12"],
    }
    expanded: list[str] = []
    for tag in tags:
        key = tag.strip().lower()
        candidates = aliases.get(key, [tag])
        for candidate in candidates:
            if candidate and candidate not in expanded:
                expanded.append(candidate[:32])
    return expanded[:12]


def bilibili_cache_path(keyword: str, tags: list[str] | None = None, up_mids: list[str] | None = None) -> Path:
    cache_tags = expand_bilibili_tags(tags or [])[:8]
    cache_up_mids = normalize_bilibili_up_mids(up_mids or [])
    cache_key = {"keyword": keyword, "tags": cache_tags, "upMids": cache_up_mids}
    label = safe_cache_label(keyword, "bilibili")
    if cache_tags:
        label = f"{label}-{safe_cache_label(cache_tags[0], 'tag')}"
    return BILIBILI_DATA_DIR / f"{label}-{stable_hash(cache_key, 12)}.json"


def run_bilibili_refresh(keyword: str, tags: list[str], output: Path, up_mids: list[str] | None = None) -> dict[str, Any]:
    if not BILIBILI_SCRIPT.exists():
        raise HTTPException(status_code=500, detail=f"Missing script: {BILIBILI_SCRIPT}")

    tags = expand_bilibili_tags(tags)
    command = [
        sys.executable,
        str(BILIBILI_SCRIPT),
        "--keyword",
        keyword,
        "--output",
        str(output),
        "--pages",
        str(max(1, min(5, BILIBILI_PAGES))),
        "--pool-size",
        str(max(40, BILIBILI_POOL_SIZE)),
        "--history-size",
        str(max(120, BILIBILI_HISTORY_SIZE)),
        "--workers",
        str(max(1, min(12, BILIBILI_WORKERS))),
    ]

    for tag in tags:
        command.extend(["--tag", tag])

    for mid in up_mids or []:
        mid_text = re.sub(r"\D", "", str(mid))
        if mid_text:
            command.extend(["--up-mid", mid_text])

    run_command(command, timeout=70)
    return read_json(output)


def schedule_bilibili_refresh(background_tasks: BackgroundTasks, keyword: str, tags: list[str], output: Path, up_mids: list[str] | None = None) -> None:
    lock_path = output.with_suffix(".lock")
    if should_start_background_refresh(lock_path, 600):
        background_tasks.add_task(run_bilibili_refresh, keyword, tags, output, up_mids or [])


@app.get("/api/bilibili")
def get_bilibili(background_tasks: BackgroundTasks, keyword: str = "", tags: str = "", upMids: str = "", refresh: bool = False) -> dict[str, Any]:
    normalized_keyword = normalize_bilibili_keyword(keyword)
    normalized_tags = normalize_bilibili_tags(tags)
    normalized_up_mids = normalize_bilibili_up_mids(upMids)
    output = bilibili_cache_path(normalized_keyword, normalized_tags, normalized_up_mids)

    if output.exists():
        data = read_json(output)
        if refresh or not is_cache_fresh(output, BILIBILI_CACHE_SECONDS):
            schedule_bilibili_refresh(background_tasks, normalized_keyword, normalized_tags, output, normalized_up_mids)
        return {"ok": True, "data": data, "cache": cache_meta(output, BILIBILI_CACHE_SECONDS)}

    if normalized_keyword == DEFAULT_BILIBILI_KEYWORD and BILIBILI_DATA.exists():
        data = read_json(BILIBILI_DATA)
        schedule_bilibili_refresh(background_tasks, normalized_keyword, normalized_tags, output, normalized_up_mids)
        return {
            "ok": True,
            "data": data,
            "cache": {**cache_meta(BILIBILI_DATA, BILIBILI_CACHE_SECONDS), "legacyFallback": True},
        }

    try:
        data = run_bilibili_refresh(normalized_keyword, normalized_tags, output, normalized_up_mids)
    except Exception as error:
        raise HTTPException(status_code=500, detail=f"Bilibili data was not generated: {error}") from error

    return {"ok": True, "data": data, "cache": cache_meta(output, BILIBILI_CACHE_SECONDS)}


@app.post("/api/bilibili/refresh")
async def refresh_bilibili(request: Request) -> dict[str, Any]:
    payload = await read_request_json(request)
    keyword = normalize_bilibili_keyword(payload.get("keyword"))
    tags = normalize_bilibili_tags(payload.get("tags"))
    up_mids = normalize_bilibili_up_mids(payload.get("upMids"))
    output = bilibili_cache_path(keyword, tags, up_mids)

    try:
        data = run_bilibili_refresh(keyword, tags, output, up_mids)
    except Exception as error:
        raise HTTPException(status_code=500, detail=f"Bilibili data was not generated: {error}") from error

    return {
        "ok": True,
        "generatedAt": data.get("generatedAt"),
        "data": data,
        "cache": cache_meta(output, BILIBILI_CACHE_SECONDS),
    }

    if not BILIBILI_SCRIPT.exists():
        raise HTTPException(status_code=500, detail=f"Missing script: {BILIBILI_SCRIPT}")

    payload = await read_request_json(request)
    keyword = str(payload.get("keyword") or "电影解说").strip()[:32] or "电影解说"
    command = [
        sys.executable,
        str(BILIBILI_SCRIPT),
        "--keyword",
        keyword,
        "--output",
        str(BILIBILI_DATA),
        "--pages",
        "3",
        "--pool-size",
        "80",
        "--history-size",
        "240",
        "--workers",
        "8",
    ]

    for tag in payload.get("tags") or []:
        tag_text = str(tag).strip()
        if tag_text:
            command.extend(["--tag", tag_text[:32]])

    for mid in payload.get("upMids") or []:
        mid_text = re.sub(r"\D", "", str(mid))
        if mid_text:
            command.extend(["--up-mid", mid_text])

    run_command(command, timeout=70)

    try:
        data = read_json(BILIBILI_DATA)
    except Exception as error:
        raise HTTPException(status_code=500, detail=f"Bilibili data was not generated: {error}") from error

    return {"ok": True, "generatedAt": data.get("generatedAt"), "data": data}
