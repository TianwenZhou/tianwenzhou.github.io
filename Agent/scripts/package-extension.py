from __future__ import annotations

import shutil
import zipfile
from pathlib import Path


ROOT = Path(__file__).resolve().parents[1]
DIST_ROOT = ROOT / "dist"
EXTENSION_DIR = DIST_ROOT / "agent-dashboard-extension"
ZIP_PATH = DIST_ROOT / "agent-dashboard-extension.zip"

ROOT_FILES = [
    "manifest.json",
    "index.html",
    "app.js",
    "styles.css",
    "chat-config.js",
    "weather-config.js",
    "bg_day.png",
    "bg_day.webp",
    "bg_night.png",
    "bg_night.webp",
]

ROOT_DIRS = ["assets", "data", "src"]
SKIP_DIRS = {"__pycache__", ".git", ".github", "dist", "scripts"}
SKIP_SUFFIXES = {".pyc", ".pyo", ".map"}


def should_skip(path: Path) -> bool:
    if any(part in SKIP_DIRS for part in path.parts):
        return True
    if path.parts[:2] == ("vendor", "model-viewer") or path.parts[:3] == ("assets", "vendor", "model-viewer"):
        return True
    if path.name.startswith(".DS_Store"):
        return True
    return path.suffix.lower() in SKIP_SUFFIXES


def copy_tree(source: Path, target: Path) -> None:
    for path in source.rglob("*"):
        relative = path.relative_to(source)
        if should_skip(relative):
            continue
        destination = target / relative
        if path.is_dir():
            destination.mkdir(parents=True, exist_ok=True)
        else:
            destination.parent.mkdir(parents=True, exist_ok=True)
            shutil.copy2(path, destination)


def build_extension_dir() -> None:
    if EXTENSION_DIR.exists():
        shutil.rmtree(EXTENSION_DIR)
    EXTENSION_DIR.mkdir(parents=True, exist_ok=True)

    for file_name in ROOT_FILES:
        source = ROOT / file_name
        if not source.exists():
            raise FileNotFoundError(source)
        shutil.copy2(source, EXTENSION_DIR / file_name)

    for dir_name in ROOT_DIRS:
        source = ROOT / dir_name
        if not source.exists():
            raise FileNotFoundError(source)
        copy_tree(source, EXTENSION_DIR / dir_name)


def zip_extension_dir() -> None:
    if ZIP_PATH.exists():
        ZIP_PATH.unlink()
    with zipfile.ZipFile(ZIP_PATH, "w", compression=zipfile.ZIP_DEFLATED) as archive:
        for path in EXTENSION_DIR.rglob("*"):
            if path.is_file():
                archive.write(path, path.relative_to(EXTENSION_DIR))


def main() -> None:
    build_extension_dir()
    zip_extension_dir()
    print(f"Extension directory: {EXTENSION_DIR}")
    print(f"Extension zip: {ZIP_PATH}")


if __name__ == "__main__":
    main()
