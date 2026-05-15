from __future__ import annotations

import argparse
import json
from datetime import datetime, timedelta, timezone
from pathlib import Path
from typing import Any


CN_TZ = timezone(timedelta(hours=8))
DEFAULT_OUTPUT = Path(__file__).resolve().parents[1] / "data" / "stocks" / "a-share-code-name.json"


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description="Build a local A-share code/name cache with AKShare.")
    parser.add_argument("--output", default=str(DEFAULT_OUTPUT), help="JSON output path.")
    return parser.parse_args()


def infer_exchange(symbol: str) -> str:
    return "SSE" if symbol.startswith("6") else "SZSE"


def infer_code(symbol: str, exchange: str) -> str:
    return f"{symbol}.{'SH' if exchange == 'SSE' else 'SZ'}"


def normalize_symbol(value: Any) -> str:
    text = "".join(char for char in str(value or "") if char.isdigit())
    return text.zfill(6) if 1 <= len(text) <= 6 else ""


def first_value(row: dict[str, Any], *keys: str) -> Any:
    for key in keys:
        if key in row:
            return row[key]
    return None


def add_stock(stocks: dict[str, dict[str, str]], symbol: str, name: str) -> None:
    if not symbol or not name:
        return

    exchange = infer_exchange(symbol)
    stocks[symbol] = {
        "symbol": symbol,
        "name": name,
        "code": infer_code(symbol, exchange),
        "exchange": exchange,
    }


def merge_frame(stocks: dict[str, dict[str, str]], frame: Any) -> int:
    added = 0
    if frame is None or getattr(frame, "empty", True):
        return added

    for row in frame.to_dict("records"):
        symbol = normalize_symbol(first_value(row, "代码", "code"))
        name = str(first_value(row, "名称", "name") or "").strip()
        if not symbol or not name:
            continue

        before = stocks.get(symbol)
        add_stock(stocks, symbol, name)
        added += 0 if before else 1

    return added


def build_cache() -> dict[str, Any]:
    import akshare as ak

    stocks: dict[str, dict[str, str]] = {}
    sources: list[str] = []
    errors: dict[str, str] = {}

    for source_name, getter in (
        ("stock_zh_a_spot_em", ak.stock_zh_a_spot_em),
        ("stock_info_a_code_name", ak.stock_info_a_code_name),
    ):
        try:
            added = merge_frame(stocks, getter())
            sources.append(f"{source_name}:{added}")
        except Exception as error:
            errors[source_name] = str(error)

    if not stocks:
        raise RuntimeError(f"No stock names fetched: {errors}")

    return {
        "generatedAt": datetime.now(CN_TZ).isoformat(timespec="seconds"),
        "source": "AKShare",
        "sources": sources,
        "errors": errors,
        "count": len(stocks),
        "stocks": stocks,
    }


def main() -> None:
    args = parse_args()
    output = Path(args.output)
    output.parent.mkdir(parents=True, exist_ok=True)
    output.write_text(json.dumps(build_cache(), ensure_ascii=False, indent=2), encoding="utf-8")
    print(f"Wrote {output}")


if __name__ == "__main__":
    main()
