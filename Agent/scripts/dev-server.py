from __future__ import annotations

import json
import os
import re
import subprocess
import sys
from http import HTTPStatus
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path
from urllib.parse import parse_qs, unquote, urlparse


ROOT = Path(__file__).resolve().parents[1]
DEFAULT_PORT = 4173
WINDOWS_STOCK_PYTHON = Path(r"D:\pyenvs\stock\python.exe")
STOCK_NAME_CACHE = ROOT / "data" / "stocks" / "a-share-code-name.json"

STOCKS = {
    "byd": {
        "symbol": "002594",
        "name": "比亚迪",
        "code": "002594.SZ",
        "exchange": "SZSE",
        "output": ROOT / "data" / "stocks" / "byd.json",
    },
    "moutai": {
        "symbol": "600519",
        "name": "贵州茅台",
        "code": "600519.SH",
        "exchange": "SSE",
        "output": ROOT / "data" / "stocks" / "moutai.json",
    },
    "catl": {
        "symbol": "300750",
        "name": "宁德时代",
        "code": "300750.SZ",
        "exchange": "SZSE",
        "output": ROOT / "data" / "stocks" / "catl.json",
    },
    "pingan": {
        "symbol": "601318",
        "name": "中国平安",
        "code": "601318.SH",
        "exchange": "SSE",
        "output": ROOT / "data" / "stocks" / "pingan.json",
    },
}


def normalize_stock_symbol(value: object) -> str:
    text = "".join(char for char in str(value or "") if char.isdigit())
    return text if len(text) == 6 else ""


def infer_stock_exchange(symbol: str) -> str:
    return "SSE" if symbol.startswith("6") else "SZSE"


def infer_stock_code(symbol: str, exchange: str) -> str:
    return f"{symbol}.{'SH' if exchange == 'SSE' else 'SZ'}"


def read_stock_name_cache(symbol: str) -> dict | None:
    try:
        cache = json.loads(STOCK_NAME_CACHE.read_text(encoding="utf-8"))
        stock = cache.get("stocks", {}).get(symbol)
    except Exception:
        return None

    if not isinstance(stock, dict) or not stock.get("name"):
        return None

    exchange = stock.get("exchange") if stock.get("exchange") in {"SSE", "SZSE"} else infer_stock_exchange(symbol)
    return {
        "symbol": symbol,
        "name": str(stock.get("name")).strip()[:18],
        "code": stock.get("code") or infer_stock_code(symbol, exchange),
        "exchange": exchange,
        "found": True,
        "source": "local-cache",
    }


def get_stock_python() -> str:
    configured = os.environ.get("STOCK_PYTHON")
    if configured:
        return configured

    if WINDOWS_STOCK_PYTHON.exists():
        return str(WINDOWS_STOCK_PYTHON)

    return sys.executable


def get_stock_env() -> dict[str, str]:
    env = os.environ.copy()
    if env.get("STOCK_USE_PROXY", "").lower() not in {"1", "true", "yes"}:
        for key in ("HTTP_PROXY", "HTTPS_PROXY", "ALL_PROXY", "http_proxy", "https_proxy", "all_proxy"):
            env.pop(key, None)
        env["NO_PROXY"] = "*"
        env["no_proxy"] = "*"
    return env


class AgentDevHandler(SimpleHTTPRequestHandler):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, directory=str(ROOT), **kwargs)

    def end_headers(self) -> None:
        self.send_header("Cache-Control", "no-store")
        super().end_headers()

    def send_json(self, status: HTTPStatus, payload: dict) -> None:
        body = json.dumps(payload, ensure_ascii=False).encode("utf-8")
        self.send_response(status)
        self.send_header("Content-Type", "application/json; charset=utf-8")
        self.send_header("Content-Length", str(len(body)))
        self.end_headers()
        self.wfile.write(body)

    def read_json_body(self) -> dict:
        length = int(self.headers.get("Content-Length") or 0)
        if length <= 0:
            return {}

        try:
            return json.loads(self.rfile.read(length).decode("utf-8"))
        except Exception:
            return {}

    def do_POST(self) -> None:
        parsed = urlparse(self.path)
        parts = [unquote(part) for part in parsed.path.strip("/").split("/") if part]
        if len(parts) == 4 and parts[:2] == ["api", "stocks"] and parts[3] == "refresh":
            self.refresh_stock(parts[2], self.read_json_body())
            return

        self.send_json(HTTPStatus.NOT_FOUND, {"ok": False, "error": "Unknown API endpoint"})

    def do_GET(self) -> None:
        parsed = urlparse(self.path)
        if parsed.path == "/api/stocks/lookup":
            self.lookup_stock(parsed)
            return

        if parsed.path.startswith("/api/"):
            self.send_json(HTTPStatus.NOT_FOUND, {"ok": False, "error": "Unknown API endpoint"})
            return

        requested = ROOT / parsed.path.lstrip("/")
        if parsed.path not in {"/", ""} and not requested.exists():
            self.path = "/index.html"

        super().do_GET()

    def lookup_stock(self, parsed) -> None:
        params = parse_qs(parsed.query)
        symbol = normalize_stock_symbol(params.get("symbol", [""])[0])
        if not symbol:
            self.send_json(HTTPStatus.BAD_REQUEST, {"ok": False, "error": "Missing stock symbol"})
            return

        exchange = infer_stock_exchange(symbol)
        code = infer_stock_code(symbol, exchange)
        cached_stock = read_stock_name_cache(symbol)
        if cached_stock:
            self.send_json(HTTPStatus.OK, {"ok": True, "stock": cached_stock})
            return

        for stock in STOCKS.values():
            if stock["symbol"] == symbol:
                self.send_json(
                    HTTPStatus.OK,
                    {
                        "ok": True,
                        "stock": {
                            "symbol": symbol,
                            "name": stock["name"],
                            "code": stock["code"],
                            "exchange": stock["exchange"],
                            "found": True,
                        },
                    },
                )
                return

        lookup_script = r"""
import json
import sys

symbol = sys.argv[1]
payload = {"symbol": symbol, "found": False}

try:
    import akshare as ak

    for getter, code_key, name_key in (
        (ak.stock_info_a_code_name, "code", "name"),
        (ak.stock_zh_a_spot_em, "代码", "名称"),
    ):
        frame = getter()
        if frame is None or frame.empty or code_key not in frame.columns:
            continue

        codes = frame[code_key].astype(str).str.zfill(6)
        match = frame[codes == symbol]
        if match.empty:
            continue

        row = match.iloc[0].to_dict()
        name = str(
            row.get(name_key)
            or row.get("name")
            or row.get("名称")
            or row.get("股票简称")
            or row.get("简称")
            or ""
        ).strip()
        if name:
            payload.update({"name": name, "found": True})
            break
except Exception as error:
    payload["error"] = str(error)

print(json.dumps(payload, ensure_ascii=True))
"""

        try:
            result = subprocess.run(
                [get_stock_python(), "-c", lookup_script, symbol],
                cwd=ROOT,
                env=get_stock_env(),
                capture_output=True,
                text=True,
                encoding="utf-8",
                errors="replace",
                timeout=60,
                check=False,
            )
            payload = {}
            for match in re.findall(r"\{[^\r\n]*\}", result.stdout):
                payload = json.loads(match)
        except Exception as error:
            payload = {"symbol": symbol, "found": False, "error": str(error)}

        name = str(payload.get("name") or code).strip()[:18] or code
        self.send_json(
            HTTPStatus.OK,
            {
                "ok": True,
                "stock": {
                    "symbol": symbol,
                    "name": name,
                    "code": code,
                    "exchange": exchange,
                    "found": bool(payload.get("found")),
                },
            },
        )

    def get_stock_config(self, stock_key: str, payload: dict) -> dict | None:
        stock = STOCKS.get(stock_key)
        if stock:
            return stock

        stock_payload = payload.get("stock") if isinstance(payload, dict) else {}
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
            "output": ROOT / "data" / "stocks" / f"custom-{symbol}.json",
        }

    def refresh_stock(self, stock_key: str, payload: dict) -> None:
        stock = self.get_stock_config(stock_key, payload)
        if not stock:
            self.send_json(HTTPStatus.NOT_FOUND, {"ok": False, "error": f"Unknown stock: {stock_key}"})
            return

        command = [
            get_stock_python(),
            str(ROOT / "scripts" / "fetch-stock-data.py"),
            "--symbol",
            stock["symbol"],
            "--name",
            stock["name"],
            "--code",
            stock["code"],
            "--exchange",
            stock["exchange"],
            "--output",
            str(stock["output"]),
            "--retries",
            "2",
            "--request-delay",
            "0.2",
            "--min-valid-intervals",
            "4",
        ]

        try:
            result = subprocess.run(
                command,
                cwd=ROOT,
                env=get_stock_env(),
                capture_output=True,
                text=True,
                encoding="utf-8",
                timeout=180,
                check=False,
            )
        except Exception as error:
            self.send_json(HTTPStatus.INTERNAL_SERVER_ERROR, {"ok": False, "error": str(error)})
            return

        if result.returncode != 0:
            self.send_json(
                HTTPStatus.BAD_GATEWAY,
                {
                    "ok": False,
                    "error": result.stderr.strip() or result.stdout.strip() or "Stock refresh failed",
                },
            )
            return

        try:
            data = json.loads(Path(stock["output"]).read_text(encoding="utf-8"))
        except Exception as error:
            self.send_json(HTTPStatus.INTERNAL_SERVER_ERROR, {"ok": False, "error": str(error)})
            return

        self.send_json(
            HTTPStatus.OK,
            {
                "ok": True,
                "stock": stock_key,
                "generatedAt": data.get("generatedAt"),
                "quote": data.get("quote"),
                "data": data,
            },
        )


def main() -> None:
    port = int(sys.argv[1]) if len(sys.argv) > 1 else DEFAULT_PORT
    server = ThreadingHTTPServer(("0.0.0.0", port), AgentDevHandler)
    print(f"Serving Agent dashboard on http://localhost:{port}/")
    print("Stock refresh endpoint enabled. Use STOCK_PYTHON to override the Python environment.")
    server.serve_forever()


if __name__ == "__main__":
    main()
