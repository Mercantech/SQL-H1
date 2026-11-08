"""Package only explicitly listed student-lab sources, including required dotfiles."""
from pathlib import Path
import json
import zipfile

ROOT = Path(__file__).resolve().parents[1]
TARGET = ROOT / "web" / "public" / "downloads"
TARGET.mkdir(parents=True, exist_ok=True)

manifest = json.loads((ROOT / "scripts" / "lab-files.json").read_text(encoding="utf-8"))
for name, paths in manifest.items():
    folder = ROOT / "labs" / name
    output = TARGET / f"{name}-lab.zip"
    count = 0
    with zipfile.ZipFile(output, "w", compression=zipfile.ZIP_DEFLATED) as archive:
        for relative in sorted(set(paths)):
            source = folder / relative
            if not source.resolve().is_relative_to(folder.resolve()) or source.is_symlink():
                raise ValueError(f"Path outside lab or symlink: {relative}")
            if (source.name.startswith(".env") and source.name != ".env.example") or any(part in {"bin", "obj", "artifacts", "node_modules", ".git"} for part in source.relative_to(folder).parts):
                raise ValueError(f"Private/generated file in lab: {relative}")
            if not source.is_file():
                raise FileNotFoundError(source)
            info = zipfile.ZipInfo(source.relative_to(folder).as_posix(), date_time=(2026, 11, 8, 0, 0, 0))
            info.compress_type = zipfile.ZIP_DEFLATED
            info.external_attr = 0o644 << 16
            archive.writestr(info, source.read_bytes())
            count += 1
    print(f"{output.name}: {count} files, {output.stat().st_size} bytes")
