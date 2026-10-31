import sys
sys.path.insert(0, r"d:\TCS AI\backend")
from app.main import app
print("Testing with TestClient...", flush=True)
try:
    from starlette.testclient import TestClient
    with TestClient(app) as c:
        print("TestClient context entered, making get(/)...", flush=True)
        r = c.get("/")
        print("Status:", r.status_code, flush=True)
except Exception as e:
    print("Caught exception:", type(e), e, flush=True)
