import json
from datetime import datetime
from pathlib import Path

from fastapi import FastAPI, Request, Depends
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import HTMLResponse
from fastapi.staticfiles import StaticFiles
from sqlalchemy.orm import Session

from app.database import get_db
from app.models import ShareLink, init_db
from app.routes.share import router as share_router
from app.routes.upload import router as upload_router

app = FastAPI(title="DevSnippet API", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(share_router)
app.include_router(upload_router)


@app.get("/api/health")
async def health_check():
    return {"status": "ok", "version": "1.0.0"}


@app.get("/share/{token}", response_class=HTMLResponse)
async def view_share(token: str, request: Request, db: Session = Depends(get_db)):
    """Standalone HTML page for viewing shared content."""
    link = db.query(ShareLink).filter(ShareLink.token == token).first()

    if not link:
        return HTMLResponse("<h2>Share link not found (404)</h2>", status_code=404)
    if link.expires_at and link.expires_at < datetime.utcnow():
        return HTMLResponse("<h2>This share link has expired (410)</h2>", status_code=410)

    needs_password = bool(link.password_hash)
    is_readonly = bool(link.readonly)
    readonly_css = "pre, #content { user-select: none; -webkit-user-select: none; -moz-user-select: none; }" if is_readonly else ""
    readonly_badge = '<span class="badge badge-readonly">Read-only</span>' if is_readonly else ""

    try:
        entity_data = json.loads(link.entity_data)
    except json.JSONDecodeError:
        entity_data = str(link.entity_data)

    content_text = json.dumps(entity_data, indent=2, ensure_ascii=False)

    html = f"""<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>DevSnippet - Shared Content</title>
<style>
  body {{
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
    max-width: 900px;
    margin: 0 auto;
    padding: 24px;
    background: #f8fafc;
    color: #1e293b;
  }}
  pre {{
    background: #1e293b;
    color: #e2e8f0;
    padding: 16px;
    border-radius: 8px;
    overflow-x: auto;
    font-size: 14px;
    line-height: 1.6;
  }}
  {readonly_css}
  .header {{
    display: flex;
    align-items: center;
    gap: 12px;
    margin-bottom: 24px;
    padding-bottom: 12px;
    border-bottom: 1px solid #e2e8f0;
  }}
  .badge {{
    font-size: 12px;
    padding: 2px 8px;
    border-radius: 4px;
    background: #eff6ff;
    color: #3b82f6;
  }}
  .badge-readonly {{
    background: #fef3c7;
    color: #d97706;
  }}
  .password-form {{
    max-width: 400px;
    margin: 80px auto;
    text-align: center;
  }}
  .password-form input {{
    padding: 8px 12px;
    border: 1px solid #e2e8f0;
    border-radius: 6px;
    font-size: 14px;
    width: 100%;
    margin-bottom: 8px;
  }}
  .password-form button {{
    padding: 8px 16px;
    background: #3b82f6;
    color: white;
    border: none;
    border-radius: 6px;
    font-size: 14px;
    cursor: pointer;
  }}
</style>
</head>
<body>
<div class="header">
  <h1 style="font-size:20px;margin:0;">DevSnippet</h1>
  <span class="badge">{link.entity_type}</span>
  {readonly_badge}
</div>
<pre id="content">{"" if needs_password else content_text}</pre>
"""

    if needs_password:
        html += f"""<div class="password-form" id="password-box">
  <h3>This content is password-protected</h3>
  <input type="password" id="pw" placeholder="Enter password">
  <button onclick="checkPassword()">View</button>
  <p id="error" style="color:red;font-size:13px;display:none;">Invalid password</p>
</div>
<script>
async function checkPassword() {{
  const pw = document.getElementById('pw').value;
  const resp = await fetch('/api/share/{token}?password=' + encodeURIComponent(pw));
  if (resp.ok) {{
    const data = await resp.json();
    document.getElementById('content').textContent = JSON.stringify(data.entity_data, null, 2);
    document.getElementById('password-box').style.display = 'none';
  }} else {{
    document.getElementById('error').style.display = 'block';
  }}
}}
</script>"""

    html += """
</body>
</html>"""

    return HTMLResponse(html)


# Mount frontend/public as static files — must be last so API routes take precedence.
# Uploaded images are accessible at http://localhost:8000/images/xxx.jpg
_public_dir = Path(__file__).resolve().parent.parent / "frontend" / "public"
if _public_dir.exists():
    app.mount("/", StaticFiles(directory=str(_public_dir)), name="public")
