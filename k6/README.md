# K6 Performance Testing Guide

This directory contains k6 performance testing scripts for the FastAPI QR Code application. K6 is a modern load testing tool designed for testing the performance and reliability of APIs and web services.

## Prerequisites

### Install K6

K6 requires Node.js 18+ or can be installed directly:

**macOS (using Homebrew):**
```bash
brew install k6
```

**Linux (Ubuntu/Debian):**
```bash
sudo apt-get install k6
```

**Windows (using Chocolatey):**
```bash
choco install k6
```

**Docker:**
```bash
docker run -i grafana/k6 run - <script.js
```

### Verify Installation

```bash
k6 version
```

## Test Scripts Overview

### 1. Smoke Test (`smoke-test.js`)

A quick, lightweight test to verify the application is responding correctly.

**Duration:** ~80 seconds  
**User Load:** Ramps from 0 to 5 concurrent users  
**Purpose:** Basic health check and endpoint validation

**Run:**
```bash
k6 run k6/smoke-test.js
```

**With custom base URL:**
```bash
k6 run --env BASE_URL=http://example.com k6/smoke-test.js
```

**What it tests:**
- Health check endpoint (`GET /health`)
- Get statistics endpoint (`GET /stats/`)
- QR code generation (`POST /qr/generate`)

---

### 2. Soak Test (`soak-test.js`)

A sustained load test that runs for an extended period to identify memory leaks, resource exhaustion, and long-term stability issues.

**Duration:** ~24 minutes  
**User Load:** Ramps up to 10 users and stays constant for 20 minutes  
**Purpose:** Verify application stability under sustained load

**Run:**
```bash
k6 run k6/soak-test.js
```

**With custom base URL:**
```bash
k6 run --env BASE_URL=http://example.com k6/soak-test.js
```

**What it tests:**
- Sustained QR code generation with varying URLs
- Memory stability over time
- Connection pooling and resource cleanup
- Gradual performance degradation (if any)

---

### 3. Peak Test (`peak-test.js`)

A high-load test that simulates realistic peak traffic conditions.

**Duration:** ~24 minutes  
**User Load:** Ramps from 50 to 100 concurrent users over 7 minutes, sustains for 10 minutes, then ramps down  
**Purpose:** Test application performance under peak load conditions

**Run:**
```bash
k6 run k6/peak-test.js
```

**With custom base URL:**
```bash
k6 run --env BASE_URL=http://example.com k6/peak-test.js
```

**What it tests:**
- QR code generation under high load
- Statistics endpoint under load
- Static file serving
- Response time degradation at peak capacity

---

## Running Tests

### Basic Execution

```bash
cd /Users/bob/dev/python/fastapi-qr-code
k6 run k6/smoke-test.js
```

### With Environment Variables

```bash
k6 run --env BASE_URL=http://localhost:8000 k6/smoke-test.js
k6 run --env BASE_URL=http://localhost:8000 k6/soak-test.js
k6 run --env BASE_URL=http://localhost:8000 k6/peak-test.js
```

### Run All Tests Sequentially

```bash
#!/bin/bash
echo "Starting Smoke Test..."
k6 run k6/smoke-test.js

echo "Starting Soak Test..."
k6 run k6/soak-test.js

echo "Starting Peak Test..."
k6 run k6/peak-test.js
```

### Output to JSON for Analysis

```bash
k6 run --out json=results.json k6/smoke-test.js
```

## Test Configuration Details

### Smoke Test Thresholds
- **Response Time:** 95th percentile < 500ms
- **Error Rate:** < 10%

### Soak Test Thresholds
- **Response Time:** 95th percentile < 1000ms
- **Error Rate:** < 5%

### Peak Test Thresholds
- **Response Time:** 95th percentile < 2000ms
- **Error Rate:** < 10%

## Interpreting Results

K6 outputs metrics in the console. Key metrics to monitor:

| Metric | Description |
|--------|-------------|
| `http_req_duration` | Response time (milliseconds) |
| `http_req_failed` | Percentage of failed requests |
| `http_reqs` | Total number of requests |
| `vus` | Virtual Users currently active |
| `vus_max` | Maximum Virtual Users configured |

### Example Output
```
checks...................: 96.67% 290 out of 300
duration...............: 1m20s
http_req_duration.......: avg=150ms, p(95)=350ms, p(99)=400ms
http_req_failed.........: 0.00%
http_reqs...............: 300
vus......................: 0
vus_max.................: 5
```

## Advanced Usage

### Run with More Verbosity

```bash
k6 run --vus 10 --duration 30s k6/smoke-test.js
```

### Specify VUs and Duration (Override Script Settings)

```bash
k6 run --vus 20 --duration 2m k6/soak-test.js
```

### Run with Custom Metrics Threshold

```bash
k6 run --summary-export=summary.json k6/smoke-test.js
```

### Cloud Execution (Grafana Cloud)

If you have a Grafana Cloud account:

```bash
k6 login cloud
k6 cloud k6/smoke-test.js
```

### Web Dashboard (Real-time Metrics)

K6 provides a web dashboard for real-time monitoring during test execution:

```bash
K6_WEB_DASHBOARD=true k6 run k6/smoke-test.js
K6_WEB_DASHBOARD=true k6 run --env TEST_TYPE=smoke k6/performance-tests.js
K6_WEB_DASHBOARD=true k6 run --env TEST_TYPE=peak k6/performance-tests.js
```

Another single file sample:

```bash
K6_WEB_DASHBOARD=true SCENARIO=smoke k6 run k6/performance-tests-single-file.js       
```

The dashboard will be available at `http://localhost:5565` and displays:
- Real-time VU count and iteration progress
- Live metrics (response time, throughput, errors)
- Charts for trends
- Detailed request breakdown

**Alternative:** Run with both JSON output and dashboard:
```bash
k6 run --out json=results.json --out web k6/performance-tests.js
```

## Performance Testing Best Practices

1. **Baseline First:** Run a smoke test first to establish a baseline
2. **Isolate Variables:** Run tests when the system is at steady state
3. **Realistic Load:** Use realistic URLs and request patterns
4. **Monitor System:** Monitor server CPU, memory, and disk during tests
5. **Review Logs:** Check application logs for errors or warnings during tests
6. **Repeat Tests:** Run tests multiple times to ensure consistency
7. **Document Results:** Keep records of test results for trend analysis

## Troubleshooting

### Connection Refused
- Ensure the application is running: `uvicorn src.app.main:app --reload`
- Check the BASE_URL environment variable
- Verify firewall settings

### High Error Rate
- Check application logs
- Verify database connectivity
- Check system resource availability
- Reduce virtual users and try again

### Slow Response Times
- Profile the application code
- Check database query performance
- Monitor CPU and memory usage on the server
- Review network latency

## Integration with CI/CD

For CI/CD pipeline integration, you can fail the build if thresholds aren't met:

```bash
k6 run --summary-export=summary.json k6/smoke-test.js
if [ $? -ne 0 ]; then exit 1; fi
```

## Further Reading

- [K6 Official Documentation](https://k6.io/docs/)
- [K6 API Reference](https://k6.io/docs/javascript-api/)
- [K6 Examples](https://k6.io/docs/examples/)

## Notes

- Ensure proper load testing permissions are obtained before testing production systems
- The FastAPI application should be configured to handle the expected concurrent load
- Database should be adequately provisioned for the test workload


## single test script

Run smoke test (default):
k6 run k6/performance-tests.js

Run soak test:
k6 run --env TEST_TYPE=soak k6/performance-tests.js

Run peak test:
k6 run --env TEST_TYPE=peak k6/performance-tests.js

With custom base URL:

k6 run --env BASE_URL=http://example.com --env TEST_TYPE=peak k6/performance-tests.js