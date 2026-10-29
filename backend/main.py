from pathlib import Path

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse, HTMLResponse
from fastapi.staticfiles import StaticFiles
from starlette.exceptions import HTTPException as StarletteHTTPException

from app.models import init_db
from app.routes.share import router as share_router
from app.routes.upload import router as upload_router

ROOT = Path(__file__).resolve().parent.parent
DIST_DIR = ROOT / "frontend" / "dist"
DATA_DIR = ROOT / "data"

app = FastAPI(title="DevSnippet API", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",
        "http://localhost:8000",
        "http://127.0.0.1:8000",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(share_router)
app.include_router(upload_router)

init_db()


@app.get("/api/health")
async def health_check():
    return {"status": "ok", "version": "1.0.0"}


class SPAStaticFiles(StaticFiles):
    """Serve the built SPA; unknown routes fall back to index.html."""

    async def get_response(self, path: str, scope):
        try:
            return await super().get_response(path, scope)
        except StarletteHTTPException as exc:
            # Client-side routes (e.g. /share/<token>) have no file on disk.
            if exc.status_code == 404 and "." not in path.rsplit("/", 1)[-1]:
                return await super().get_response("index.html", scope)
            raise


@app.get("/", include_in_schema=False)
async def index():
    if not (DIST_DIR / "index.html").exists():
        return HTMLResponse(
            "<h3>DevSnippet</h3><p>前端尚未构建，请先运行 <code>npm install && npm run build</code>。</p>",
            status_code=503,
        )
    return FileResponse(DIST_DIR / "index.html")


# Runtime uploads — served outside the build output so they never end up in the bundle.
_images_dir = DATA_DIR / "images"
_images_dir.mkdir(parents=True, exist_ok=True)
app.mount("/images", StaticFiles(directory=str(_images_dir)), name="images")

# Built SPA — mounted last so API routes take precedence.
if DIST_DIR.exists():
    app.mount("/", SPAStaticFiles(directory=str(DIST_DIR), html=True), name="app")
