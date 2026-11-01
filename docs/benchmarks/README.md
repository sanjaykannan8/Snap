# Routing mini benchmark

This is a small synthetic smoke test, not a production accuracy or throughput claim. Results were measured on 2026-11-01; [raw per-call results](routing-results.json) and [versioned fixtures](../../mcp-service/routing-fixtures.json) are included.

| Skills | In-scope top-1 match | Correct no-match | MCP p50 | MCP p95 | Errors |
| ---: | ---: | ---: | ---: | ---: | ---: |
| 10 | 16/16 (100%) | 8/8 (100%) | 372 ms | 583 ms | 0 |
| 30 | 16/16 (100%) | 8/8 (100%) | 495 ms | 612 ms | 0 |
| 64 | 16/16 (100%) | 6/8 (75%) | 553 ms | 713 ms | 0 |

## Setup and method

- Python 3.11.4 on Windows build 26200; Docker Engine 28.3.3 via Docker Desktop, with local DynamoDB and MinIO using the repository's Compose definitions. MCP runs as a separate local Python process on a temporary loopback port.
- Inference uses a remote LAN System One-compatible endpoint requested as `Cloudflare/clef-flash`, not the hosted Workers AI API. The inference host's hardware and immutable model revision were not recorded. Results should not be used to predict Workers AI latency or compare model providers.
- Catalog sizes are exactly 10, 30 and 64. All contain the eight target skills; larger catalogs add distinct synthetic software/content skills, including related categories such as PDF creation, Stripe Checkout and database migrations. Every fixture has an object-backed Markdown body. These are evaluation records, not real user libraries.
- Eight in-scope prompts and four out-of-scope prompts are each run twice per size: 24 measured calls per size, 72 total. Repeated prompts are not independent test cases. Seed `20261101` determines task order; DynamoDB determines catalog return order. One full MCP warm-up per size is excluded. Calls are sequential, without retries in the benchmark client.
- Production matching instructions and threshold `0.42` are used. In-scope accuracy is the fraction returning the expected skill after thresholding; abstentions and errors count as misses. Correct no-match is reported separately. Both false matches at 64 skills were “What is the capital of Portugal?” returning `translation` at confidence ≈0.456; see the raw report.
- Timing uses `time.perf_counter()` around the HTTP `tools/call` round trip. It includes API-key validation, catalog lookup, live model inference, the matched object's read, URL signing and MCP serialization. No-match requests skip object retrieval. The p50/p95 columns pool all 24 successful requests per size. p50 is the median; p95 uses the nearest-rank method. No request errors occurred.
- Timing excludes startup, MCP initialization, the per-size warm-up, agent reasoning and a separate signed-URL download. Connections/caches may be warm. No concurrency, cold-start or sustained-load testing is claimed.

These numbers do not establish a general ~1-second target, reliable out-of-scope rejection, accuracy on held-out tasks, or a context-savings break-even point. The 64-skill false matches are a reminder that thresholding is weaker than an explicit “none applies” choice.

## Reproduce

Start Docker, then from the repository root:

```bash
docker compose up -d dynamodb minio
cd mcp-service
uv sync
uv run python evaluate_routing.py --model-url http://YOUR_MODEL_HOST:30000/v1/systemone --model Cloudflare/clef-flash --repeats 2
```

If the model requires a key, set `BENCHMARK_MODEL_KEY` in the process environment before running. Otherwise the script sends `local`. Only the public fixture tasks and skill metadata are sent to the chosen endpoint. The report omits endpoint addresses, keys and signed URLs.

The script requires the example local database/storage ports and MinIO credentials. It creates a unique disposable table, bucket and API key, runs the real `server.py` with those resources, writes `routing-results.json`, then removes its own server process and fixtures in `finally`. It does not edit existing user records. Docker services remain running; stop them with `docker compose stop dynamodb minio` if they are not otherwise needed.

For another output path, pass `--output path/to/report.json`. The report records the fixture SHA-256, configuration, per-call latency, selected skill, returned confidence and summary counts. Keep new runs in separate files when comparing changes.

[Back to Snap](../../README.md)
