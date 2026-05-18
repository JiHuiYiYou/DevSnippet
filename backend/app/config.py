import os

DATABASE_URL = os.getenv("DATABASE_URL", "sqlite:///./devsnippet.db")
BASE_URL = os.getenv("BASE_URL", "http://localhost:8000")
