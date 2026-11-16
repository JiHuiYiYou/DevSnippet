"""DevSnippet 本地启动引导。

职责：挑选可用的 Python 解释器 -> 创建 .venv -> 安装后端依赖 -> 启动服务。
被 start.bat / start.sh 调用，也可直接执行：python scripts/bootstrap.py
"""

import os
import platform
import shutil
import subprocess
import sys
import threading
import time
import webbrowser
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
VENV_DIR = ROOT / ".venv"
BACKEND_DIR = ROOT / "backend"
REQUIREMENTS = BACKEND_DIR / "requirements.txt"
DIST_INDEX = ROOT / "frontend" / "dist" / "index.html"
PORT = os.environ.get("PORT", "8000")
URL = f"http://localhost:{PORT}"

DEP_MODULES = ("fastapi", "uvicorn", "sqlalchemy", "bcrypt", "multipart")


def log(msg):
    print(msg, flush=True)


def host_is_windows() -> bool:
    """宿主是不是 Windows。

    不能只看 os.name：bootstrap 自身可能就跑在 MSYS2/Cygwin 的 Python 下
    （那里 os.name == 'posix'），判断错会导致 Windows 版 Python 被误拒。
    """
    return (
        os.name == "nt"
        or sys.platform in ("win32", "cygwin")
        or platform.system().startswith(("Windows", "MSYS_NT", "MINGW"))
    )


def find_venv_python(base: Path):
    """定位虚拟环境里的解释器：Windows 是 Scripts/，POSIX 是 bin/。"""
    for parts in (("Scripts", "python.exe"), ("bin", "python"), ("bin", "python3")):
        p = base.joinpath(*parts)
        if p.exists():
            return p
    return None


def probe(cmd):
    """返回 (ok, 描述)。检查解释器版本与平台标签是否支持 PyPI 预编译 wheel。"""
    code = (
        "import os,sys,sysconfig;"
        "v=sys.version_info;"
        "print('%d.%d'%(v[0],v[1]));"
        "print(sysconfig.get_platform());"
        "print(os.name)"
    )
    try:
        r = subprocess.run(
            cmd + ["-c", code], capture_output=True, text=True, timeout=30
        )
    except (OSError, subprocess.SubprocessError):
        return False, ""
    if r.returncode != 0:
        return False, ""
    lines = r.stdout.strip().splitlines()
    if len(lines) < 3:
        return False, ""
    version, plat, os_name = (x.strip() for x in lines[:3])
    if tuple(int(x) for x in version.split(".")) < (3, 10):
        return False, version
    if host_is_windows() and not (os_name == "nt" and plat.startswith("win")):
        # MinGW/MSYS2/Cygwin 版 Python：PyPI 只有 win_amd64 wheel，装不上 C 扩展依赖；
        # MSYS2 版的 venv 连 ensurepip 都跑不起来，venv 直接建不出来
        return False, version
    return True, version


def home_dirs():
    """用户主目录候选。

    MSYS2 下 Path.home() 是 /home/xxx，装在 Windows 侧的 miniconda 找不到，
    得再拿 USERPROFILE 兜一层。
    """
    dirs = [Path.home()]
    userprofile = os.environ.get("USERPROFILE")
    if userprofile:
        dirs.append(Path(userprofile.replace("\\", "/")))
    return dirs


def candidate_interpreters():
    """按优先级列出候选解释器命令。"""
    cands = []
    launcher = shutil.which("py")
    if launcher:
        cands.append([launcher, "-3"])
    for name in ("python", "python3"):
        found = shutil.which(name)
        if found:
            cands.append([found])
    for home in home_dirs():
        for name in ("miniconda3", "anaconda3"):
            for rel in (("python.exe",), ("bin", "python")):
                exe = home.joinpath(name, *rel)
                if exe.exists():
                    cands.append([str(exe)])
    if host_is_windows():
        local = os.environ.get("LOCALAPPDATA", "").replace("\\", "/")
        base = Path(local) / "Programs" / "Python"
        if base.is_dir():
            for d in sorted(base.glob("Python3*"), reverse=True):
                exe = d / "python.exe"
                if exe.exists():
                    cands.append([str(exe)])
    seen, unique = set(), []
    for c in cands:
        key = tuple(os.path.normpath(x) for x in c)
        if key not in seen:
            seen.add(key)
            unique.append(c)
    return unique


def select_interpreter():
    for cmd in candidate_interpreters():
        ok, version = probe(cmd)
        if ok:
            return cmd, version
    return None, ""


def deps_installed(py: Path):
    try:
        r = subprocess.run(
            [str(py), "-c", "import " + ",".join(DEP_MODULES)],
            capture_output=True,
            timeout=60,
        )
        return r.returncode == 0
    except (OSError, subprocess.SubprocessError):
        return False


def build_frontend():
    if DIST_INDEX.exists():
        return True
    npm = shutil.which("npm")
    if not npm:
        log("[错误] 未找到前端构建产物，且系统没有 npm，无法构建。")
        return False
    log("[3/3] 未找到前端构建产物，开始构建 ...")
    frontend = ROOT / "frontend"
    r = subprocess.run([npm, "install"], cwd=str(frontend))
    if r.returncode != 0:
        return False
    return subprocess.run([npm, "run", "build"], cwd=str(frontend)).returncode == 0


def main():
    os.chdir(ROOT)

    py = find_venv_python(VENV_DIR)
    if py and deps_installed(py):
        log("[1/3] 复用已有虚拟环境 .venv")
    else:
        cmd, version = select_interpreter()
        if not cmd:
            log("")
            log("[错误] 未找到可用的 Python 解释器。")
            log("需要标准版 Python 3.10+（python.org 或 miniconda），")
            log("MSYS2/MinGW 版 Python 无法安装 PyPI 预编译依赖。")
            return 1
        log(f"[1/3] 使用 Python {version}：{cmd[0]}")
        if VENV_DIR.exists():
            shutil.rmtree(VENV_DIR, ignore_errors=True)
        r = subprocess.run(cmd + ["-m", "venv", str(VENV_DIR)])
        py = find_venv_python(VENV_DIR)
        if r.returncode != 0 or not py:
            log("[错误] 创建虚拟环境失败。")
            return 1
        log("[2/3] 安装后端依赖 ...")
        r = subprocess.run(
            [
                str(py),
                "-m",
                "pip",
                "install",
                "--disable-pip-version-check",
                "-q",
                "-r",
                str(REQUIREMENTS),
            ]
        )
        if r.returncode != 0:
            log("[错误] 依赖安装失败，请检查网络连接。")
            return 1

    if not build_frontend():
        log("[错误] 前端构建失败。")
        return 1

    log("")
    log(f"  DevSnippet 已启动：{URL}")
    log("  按 Ctrl+C 停止服务。")
    log("")

    def open_browser():
        time.sleep(2.5)
        webbrowser.open(URL)

    threading.Thread(target=open_browser, daemon=True).start()
    r = subprocess.run(
        [
            str(py),
            "-m",
            "uvicorn",
            "main:app",
            "--host",
            "127.0.0.1",
            "--port",
            PORT,
        ],
        cwd=str(BACKEND_DIR),
    )
    return r.returncode


if __name__ == "__main__":
    sys.exit(main())
