from __future__ import annotations

import argparse
import json
import math
import time
from datetime import datetime, timedelta, timezone
from pathlib import Path
from typing import Any


CN_TZ = timezone(timedelta(hours=8))
DEFAULT_SYMBOL = "002594"
DEFAULT_OUTPUT = Path(__file__).resolve().parents[1] / "data" / "stocks" / "byd.json"
DEFAULT_PROFILE = {
    "symbol": "002594",
    "code": "002594.SZ",
    "name": "比亚迪",
    "exchange": "SZSE",
    "currency": "CNY",
}

MINUTE_INTERVAL_CONFIGS: tuple[dict[str, Any], ...] = (
    {"key": "1m", "period": "1", "lookback_days": 7, "limit": 240},
    {"key": "5m", "period": "5", "lookback_days": 30, "limit": 240},
    {"key": "15m", "period": "15", "lookback_days": 90, "limit": 240},
    {"key": "30m", "period": "30", "lookback_days": 120, "limit": 240},
    {"key": "60m", "period": "60", "lookback_days": 240, "limit": 240},
)

PERIOD_INTERVAL_CONFIGS: tuple[dict[str, Any], ...] = (
    {"key": "1d", "period": "daily", "lookback_days": 720, "limit": 240},
    {"key": "1w", "period": "weekly", "lookback_days": 1800, "limit": 240},
    {"key": "1mo", "period": "monthly", "lookback_days": 4000, "limit": 180},
)


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description="Fetch A-share K-line data with AKShare.")
    parser.add_argument("--symbol", default=DEFAULT_SYMBOL, help="A-share symbol without exchange suffix.")
    parser.add_argument("--output", default=str(DEFAULT_OUTPUT), help="JSON output path.")
    parser.add_argument("--name", default=DEFAULT_PROFILE["name"], help="Display name written into the stock profile.")
    parser.add_argument("--code", default="", help="Display code with exchange suffix, for example 002594.SZ.")
    parser.add_argument("--exchange", default=DEFAULT_PROFILE["exchange"], help="Exchange label written into the stock profile.")
    parser.add_argument("--currency", default=DEFAULT_PROFILE["currency"], help="ISO currency code.")
    parser.add_argument("--target-points", type=int, default=160, help="Minimum points to keep per interval.")
    parser.add_argument("--minute-days", type=int, default=None, help="Override lookback days for every minute interval.")
    parser.add_argument("--daily-days", type=int, default=None, help="Override lookback days for day/week/month intervals.")
    parser.add_argument("--retries", type=int, default=3, help="Retry count for each AKShare interval request.")
    parser.add_argument("--request-delay", type=float, default=0.45, help="Seconds to wait between interval requests.")
    parser.add_argument("--min-valid-intervals", type=int, default=4, help="Minimum intervals with enough data before writing output.")
    return parser.parse_args()


def now_cn() -> datetime:
    return datetime.now(CN_TZ)


def safe_float(value: Any) -> float | None:
    if value is None:
        return None

    try:
        number = float(value)
    except (TypeError, ValueError):
        return None

    return number if math.isfinite(number) else None


def get_row_value(row: dict[str, Any], *names: str) -> Any:
    for name in names:
        if name in row:
            return row[name]
    return None


def normalize_time(value: Any, *, daily: bool) -> str | None:
    if value is None:
        return None

    text = str(value).strip()
    if not text:
        return None

    if daily:
        text = f"{text[:10]} 15:00:00"
    elif len(text) == 16:
        text = f"{text}:00"

    for pattern in ("%Y-%m-%d %H:%M:%S", "%Y-%m-%d", "%Y/%m/%d %H:%M:%S", "%Y/%m/%d"):
        try:
            parsed = datetime.strptime(text, pattern).replace(tzinfo=CN_TZ)
            return parsed.isoformat()
        except ValueError:
            continue

    return None


def normalize_frame(frame: Any, *, daily: bool, limit: int) -> list[dict[str, Any]]:
    rows = frame.to_dict("records")
    candles: list[dict[str, Any]] = []
    previous_close: float | None = None

    for row in rows:
        time_value = normalize_time(get_row_value(row, "时间", "日期", "date", "time", "day"), daily=daily)
        close = safe_float(get_row_value(row, "收盘", "close"))
        if not time_value or close is None:
            continue

        open_value = safe_float(get_row_value(row, "开盘", "open"))
        high = safe_float(get_row_value(row, "最高", "high"))
        low = safe_float(get_row_value(row, "最低", "low"))
        volume = safe_float(get_row_value(row, "成交量", "volume"))
        amount = safe_float(get_row_value(row, "成交额", "amount"))

        if open_value is None or open_value <= 0:
            open_value = previous_close if previous_close is not None else close
        if high is None or high <= 0:
            high = max(open_value, close)
        if low is None or low <= 0:
            low = min(open_value, close)

        candles.append(
            {
                "time": time_value,
                "open": round(open_value, 3),
                "high": round(max(high, open_value, close), 3),
                "low": round(min(low, open_value, close), 3),
                "close": round(close, 3),
                "volume": volume,
                "amount": amount,
            }
        )
        previous_close = close

    candles.sort(key=lambda item: item["time"])
    return candles[-limit:]


def get_sina_symbol(symbol: str) -> str:
    clean_symbol = "".join(char for char in symbol if char.isdigit())
    prefix = "sh" if clean_symbol.startswith(("5", "6", "9")) else "sz"
    return f"{prefix}{clean_symbol}"


def fetch_sina_minute_bars(ak: Any, symbol: str, period: str, limit: int) -> list[dict[str, Any]]:
    frame = ak.stock_zh_a_minute(symbol=get_sina_symbol(symbol), period=period, adjust="")
    candles = normalize_frame(frame, daily=False, limit=limit)
    if not candles:
        raise RuntimeError("sina minute returned no rows")
    return candles


def fetch_sina_daily_bars(ak: Any, symbol: str, lookback_days: int, limit: int) -> list[dict[str, Any]]:
    end = now_cn()
    start = end - timedelta(days=lookback_days)
    frame = ak.stock_zh_a_daily(
        symbol=get_sina_symbol(symbol),
        start_date=start.strftime("%Y%m%d"),
        end_date=end.strftime("%Y%m%d"),
        adjust="qfq",
    )
    candles = normalize_frame(frame, daily=True, limit=limit)
    if not candles:
        raise RuntimeError("sina daily returned no rows")
    return candles


def parse_candle_time(candle: dict[str, Any]) -> datetime:
    return datetime.fromisoformat(str(candle["time"]))


def sum_optional(values: list[float | None]) -> float | None:
    finite_values = [value for value in values if value is not None and math.isfinite(value)]
    return round(sum(finite_values), 3) if finite_values else None


def aggregate_daily_candles(candles: list[dict[str, Any]], period: str, limit: int) -> list[dict[str, Any]]:
    if period == "daily":
        return candles[-limit:]

    buckets: dict[tuple[int, int], list[dict[str, Any]]] = {}
    for candle in sorted(candles, key=lambda item: item["time"]):
        candle_date = parse_candle_time(candle)
        if period == "weekly":
            year, week, _ = candle_date.isocalendar()
            key = (year, week)
        elif period == "monthly":
            key = (candle_date.year, candle_date.month)
        else:
            raise ValueError(f"Unsupported aggregate period: {period}")

        buckets.setdefault(key, []).append(candle)

    aggregated: list[dict[str, Any]] = []
    for bucket_candles in buckets.values():
        ordered = sorted(bucket_candles, key=lambda item: item["time"])
        aggregated.append(
            {
                "time": ordered[-1]["time"],
                "open": ordered[0]["open"],
                "high": round(max(item["high"] for item in ordered), 3),
                "low": round(min(item["low"] for item in ordered), 3),
                "close": ordered[-1]["close"],
                "volume": sum_optional([item.get("volume") for item in ordered]),
                "amount": sum_optional([item.get("amount") for item in ordered]),
            }
        )

    aggregated.sort(key=lambda item: item["time"])
    return aggregated[-limit:]


def fetch_minute_bars(ak: Any, symbol: str, period: str, lookback_days: int, limit: int) -> list[dict[str, Any]]:
    end = now_cn() + timedelta(days=1)
    start = now_cn() - timedelta(days=lookback_days)
    eastmoney_error: Exception | None = None

    try:
        frame = ak.stock_zh_a_hist_min_em(
            symbol=symbol,
            start_date=start.strftime("%Y-%m-%d %H:%M:%S"),
            end_date=end.strftime("%Y-%m-%d %H:%M:%S"),
            period=period,
            adjust="",
        )
        candles = normalize_frame(frame, daily=False, limit=limit)
        if candles:
            return candles
        eastmoney_error = RuntimeError("eastmoney minute returned no rows")
    except Exception as error:
        eastmoney_error = error

    try:
        return fetch_sina_minute_bars(ak, symbol, period, limit)
    except Exception as sina_error:
        raise RuntimeError(f"eastmoney minute failed: {eastmoney_error}; sina minute failed: {sina_error}") from sina_error


def fetch_period_bars(ak: Any, symbol: str, period: str, lookback_days: int, limit: int) -> list[dict[str, Any]]:
    end = now_cn()
    start = end - timedelta(days=lookback_days)
    eastmoney_error: Exception | None = None

    try:
        frame = ak.stock_zh_a_hist(
            symbol=symbol,
            period=period,
            start_date=start.strftime("%Y%m%d"),
            end_date=end.strftime("%Y%m%d"),
            adjust="qfq",
        )
        candles = normalize_frame(frame, daily=True, limit=limit)
        if candles:
            return candles
        eastmoney_error = RuntimeError("eastmoney period returned no rows")
    except Exception as error:
        eastmoney_error = error

    try:
        daily_limit = limit
        if period == "weekly":
            daily_limit = max(limit * 7, limit)
        elif period == "monthly":
            daily_limit = max(limit * 31, limit)

        daily_candles = fetch_sina_daily_bars(ak, symbol, lookback_days, daily_limit)
        return aggregate_daily_candles(daily_candles, period, limit)
    except Exception as sina_error:
        raise RuntimeError(f"eastmoney period failed: {eastmoney_error}; sina daily failed: {sina_error}") from sina_error


def infer_profile_code(symbol: str, code: str, exchange: str) -> str:
    if code:
        return code

    suffix = "SH" if exchange.upper() in {"SSE", "SH", "SHSE"} else "SZ"
    return f"{symbol}.{suffix}"


def find_previous_daily_close(intervals: dict[str, list[dict[str, Any]]], latest: dict[str, Any]) -> float | None:
    latest_date = str(latest.get("time") or "")[:10]
    daily_candles = intervals.get("1d") or []

    if latest_date:
        for candle in reversed(daily_candles):
            candle_date = str(candle.get("time") or "")[:10]
            if candle_date and candle_date < latest_date:
                close = safe_float(candle.get("close"))
                if close is not None:
                    return close

    if len(daily_candles) >= 2:
        return safe_float(daily_candles[-2].get("close"))

    return None


def fetch_with_retries(label: str, retries: int, fetcher: Any) -> list[dict[str, Any]]:
    last_error: Exception | None = None
    attempts = max(1, retries)

    for attempt in range(attempts):
        try:
            return fetcher()
        except Exception as error:  # AKShare/Eastmoney may close idle or proxied connections.
            last_error = error
            if attempt < attempts - 1:
                time.sleep(0.8 * (attempt + 1))

    raise RuntimeError(f"{label}: {last_error}") from last_error


def build_quote(intervals: dict[str, list[dict[str, Any]]]) -> dict[str, Any]:
    for key in ("1m", "5m", "15m", "30m", "60m", "1d"):
        candles = intervals.get(key) or []
        if len(candles) < 2:
            continue

        latest = candles[-1]
        price = safe_float(latest.get("close"))
        if price is None:
            continue

        reference = find_previous_daily_close(intervals, latest)
        if reference is None:
            reference = safe_float(candles[-2].get("close")) or safe_float(candles[-2].get("open"))

        change = price - reference if reference else None
        percent = (change / reference * 100) if change is not None and reference else None
        return {
            "price": round(price, 3),
            "change": round(change, 3) if change is not None else None,
            "percent": round(percent, 3) if percent is not None else None,
            "time": latest.get("time"),
            "sourceInterval": key,
        }

    return {}


def main() -> None:
    args = parse_args()
    target_points = max(args.target_points, 34)

    try:
        import akshare as ak
    except ImportError as error:
        raise SystemExit("AKShare is not installed. Run: pip install -r requirements-stock.txt") from error

    errors: dict[str, str] = {}
    interval_keys = [config["key"] for config in (*MINUTE_INTERVAL_CONFIGS, *PERIOD_INTERVAL_CONFIGS)]
    intervals: dict[str, list[dict[str, Any]]] = {key: [] for key in interval_keys}
    interval_meta: dict[str, dict[str, int | str]] = {}

    for config in MINUTE_INTERVAL_CONFIGS:
        key = str(config["key"])
        lookback_days = int(args.minute_days or config["lookback_days"])
        limit = max(target_points, int(config["limit"]))
        interval_meta[key] = {"period": str(config["period"]), "lookbackDays": lookback_days, "limit": limit}
        try:
            intervals[key] = fetch_with_retries(
                key,
                args.retries,
                lambda config=config, lookback_days=lookback_days, limit=limit: fetch_minute_bars(
                    ak,
                    args.symbol,
                    str(config["period"]),
                    lookback_days,
                    limit,
                ),
            )
        except Exception as error:  # AKShare upstream data occasionally changes shape.
            errors[key] = str(error)
        time.sleep(max(0, args.request_delay))

    for config in PERIOD_INTERVAL_CONFIGS:
        key = str(config["key"])
        lookback_days = int(args.daily_days or config["lookback_days"])
        limit = max(target_points, int(config["limit"]))
        interval_meta[key] = {"period": str(config["period"]), "lookbackDays": lookback_days, "limit": limit}
        try:
            intervals[key] = fetch_with_retries(
                key,
                args.retries,
                lambda config=config, lookback_days=lookback_days, limit=limit: fetch_period_bars(
                    ak,
                    args.symbol,
                    str(config["period"]),
                    lookback_days,
                    limit,
                ),
            )
        except Exception as error:
            errors[key] = str(error)
        time.sleep(max(0, args.request_delay))

    profile = {
        "symbol": args.symbol,
        "code": infer_profile_code(args.symbol, args.code, args.exchange),
        "name": args.name,
        "exchange": args.exchange,
        "currency": args.currency,
    }

    valid_intervals = [key for key, candles in intervals.items() if len(candles) >= target_points]
    if len(valid_intervals) < args.min_valid_intervals:
        error_summary = "; ".join(f"{key}: {message}" for key, message in errors.items())
        raise SystemExit(
            f"Only {len(valid_intervals)} valid intervals fetched ({', '.join(valid_intervals) or 'none'}); "
            f"output was not changed. {error_summary}"
        )

    payload = {
        "profile": profile,
        "source": "AKShare: Eastmoney primary, Sina fallback",
        "generatedAt": now_cn().isoformat(timespec="seconds"),
        "quote": build_quote(intervals),
        "intervalMeta": interval_meta,
        "intervals": intervals,
        "errors": errors,
    }

    output_path = Path(args.output)
    output_path.parent.mkdir(parents=True, exist_ok=True)
    output_path.write_text(json.dumps(payload, ensure_ascii=False, indent=2), encoding="utf-8")
    print(f"Wrote {output_path}")


if __name__ == "__main__":
    main()
