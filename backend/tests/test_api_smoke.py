import sys
sys.path.insert(0, r"d:\TCS AI\backend")
from app.main import app
from fastapi.testclient import TestClient

client = TestClient(app)

print("1. Testing GET / ...", flush=True)
r = client.get("/")
assert r.status_code == 200, f"Root failed: {r.status_code}"
print("   Response:", r.json()["system"], flush=True)

print("2. Testing GET /api/v1/dashboard/summary ...", flush=True)
r = client.get("/api/v1/dashboard/summary")
assert r.status_code == 200, f"Dashboard failed: {r.status_code}"
data = r.json()
print(f"   Stores: {data['total_stores']}, SKUs: {data['total_skus']}, Stockout Risks: {data['stockout_risk_skus']}", flush=True)

print("3. Testing GET /api/v1/forecasts/predict/ST001/SKU0001 ...", flush=True)
r = client.get("/api/v1/forecasts/predict/ST001/SKU0001?horizon_days=7")
assert r.status_code == 200
print(f"   Model: {r.json()['model_name']}, Forecast Points: {len(r.json()['forecasts'])}", flush=True)

print("4. Testing GET /api/v1/decisions/ ...", flush=True)
r = client.get("/api/v1/decisions/?limit=5")
assert r.status_code == 200
decs = r.json()["decisions"]
print(f"   Generated decisions: {len(decs)}, First action: {decs[0]['action']} (Qty: {decs[0]['recommended_quantity']})", flush=True)

print("5. Testing GET /api/v1/scenarios/ ...", flush=True)
r = client.get("/api/v1/scenarios/")
assert r.status_code == 200
print(f"   Available surprise scenarios: {len(r.json())}", flush=True)

print("6. Testing POST /api/v1/scenarios/run (SC002: Tomato Demand Spike) ...", flush=True)
r = client.post("/api/v1/scenarios/run", json={"scenario_id": "SC002"})
assert r.status_code == 200
print(f"   Scenario {r.json()['scenario_id']} triggered: {r.json()['scenario_type']}", flush=True)

print("7. Testing GET /api/v1/evaluation/kpis ...", flush=True)
r = client.get("/api/v1/evaluation/kpis")
assert r.status_code == 200
print("   Evaluation macro KPIs loaded successfully.", flush=True)

print("\n=== ALL 7 SYSTEM SMOKE TESTS PASSED! ===", flush=True)
