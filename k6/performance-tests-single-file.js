import http from 'k6/http';
import { check, group, sleep } from 'k6';
import { Rate, Trend, Gauge, Counter } from 'k6/metrics';

// Custom metrics
const errorRate = new Rate('errors');
const generateQRDuration = new Trend('qr_generate_duration');
const statsRequestDuration = new Trend('stats_request_duration');
const healthCheckDuration = new Trend('health_check_duration');
const qrGeneratedCount = new Counter('qr_codes_generated');
const activeUsers = new Gauge('active_users');

// Base URL configuration
const BASE_URL = __ENV.BASE_URL || 'http://localhost:8000';

// Different scenarios with different options
export const options = {
  scenarios: {
    // Smoke Test: Basic sanity check with minimal load
    smoke: {
      executor: 'constant-vus',
      vus: 1,
      duration: '10s',
      exec: 'smokeSuite',
      startTime: '0s',
    },
    // Soak Test: Medium load over extended period to find memory leaks
    soak: {
      executor: 'ramping-vus',
      startVUs: 0,
      stages: [
        { duration: '5m', target: 10 }, // Ramp up to 10 users
        { duration: '10m', target: 10 }, // Stay at 10 users for 10 minutes
        { duration: '5m', target: 0 }, // Ramp down
      ],
      exec: 'soakSuite',
      startTime: '0s',
    },
    // Peak Test: High load to test system limits
    peak: {
      executor: 'ramping-vus',
      startVUs: 0,
      stages: [
        { duration: '2m', target: 50 }, // Ramp up to 50 users
        { duration: '5m', target: 100 }, // Ramp up to 100 users
        { duration: '5m', target: 100 }, // Stay at peak load
        { duration: '2m', target: 0 }, // Ramp down
      ],
      exec: 'peakSuite',
      startTime: '0s',
    },
  },
  thresholds: {
    'http_req_duration': ['p(95)<500', 'p(99)<1000'],
    'http_req_failed': ['rate<0.1'],
    'errors': ['rate<0.05'],
  },
};

// Add this logic right before the options export if you want to filter via ENV
// with these codes, you can run specific scenarios like so:
// SCENARIO=smoke k6 run k6/performance-tests-single-file.js
// SCENARIO=soak k6 run k6/performance-tests-single-file.js
// SCENARIO=peak k6 run k6/performance-tests-single-file.js
if (__ENV.SCENARIO) {
  options.scenarios = { [__ENV.SCENARIO]: options.scenarios[__ENV.SCENARIO] };
}

// ============================================
// SMOKE TEST SUITE
// ============================================
export function smokeSuite() {
  activeUsers.add(1);

  group('Smoke Test - Health Check', () => {
    const res = http.get(`${BASE_URL}/health`);
    healthCheckDuration.add(res.timings.duration);
    check(res, {
      'health check status is 200': (r) => r.status === 200,
      'health check response has status field': (r) => r.json('status') === 'ok',
    }) || errorRate.add(1);
  });

  sleep(1);

  group('Smoke Test - Get Stats', () => {
    const res = http.get(`${BASE_URL}/stats/`);
    statsRequestDuration.add(res.timings.duration);
    check(res, {
      'stats endpoint status is 200': (r) => r.status === 200,
      'stats response has total_qr_generated field': (r) => r.json('total_qr_generated') !== undefined,
    }) || errorRate.add(1);
  });

  sleep(1);

  group('Smoke Test - Generate QR Code', () => {
    const payload = JSON.stringify({
      url: 'https://example.com/smoke-test',
    });

    const res = http.post(`${BASE_URL}/qr/generate`, payload, {
      headers: {
        'Content-Type': 'application/json',
      },
    });

    generateQRDuration.add(res.timings.duration);
    check(res, {
      'QR generate status is 200': (r) => r.status === 200,
      'QR response is an image': (r) => r.headers['Content-Type'].includes('image/png'),
    }) || errorRate.add(1);

    if (res.status === 200) {
      qrGeneratedCount.add(1);
    }
  });

  sleep(1);

  activeUsers.add(-1);
}

// ============================================
// SOAK TEST SUITE
// ============================================
export function soakSuite() {
  activeUsers.add(1);

  // Simulate realistic user behavior patterns
  const testSequence = Math.random();

  if (testSequence < 0.7) {
    // 70% of users generate QR codes
    group('Soak Test - Generate QR Code', () => {
      const payload = JSON.stringify({
        url: `https://example.com/soak-test-${Math.random()}`,
      });

      const res = http.post(`${BASE_URL}/qr/generate`, payload, {
        headers: {
          'Content-Type': 'application/json',
        },
      });

      generateQRDuration.add(res.timings.duration);
      check(res, {
        'QR generate status is 200 or 201': (r) => r.status === 200 || r.status === 201,
        'QR response is an image': (r) => r.headers['Content-Type']?.includes('image/png'),
      }) || errorRate.add(1);

      if (res.status === 200 || res.status === 201) {
        qrGeneratedCount.add(1);
      }
    });
  } else {
    // 30% of users check stats
    group('Soak Test - Check Stats', () => {
      const res = http.get(`${BASE_URL}/stats/`);
      statsRequestDuration.add(res.timings.duration);
      check(res, {
        'stats endpoint status is 200': (r) => r.status === 200,
        'stats response is valid': (r) => r.json('total_qr_generated') >= 0,
      }) || errorRate.add(1);
    });
  }

  // Periodic health checks
  if (testSequence < 0.1) {
    group('Soak Test - Health Check', () => {
      const res = http.get(`${BASE_URL}/health`);
      healthCheckDuration.add(res.timings.duration);
      check(res, {
        'health check status is 200': (r) => r.status === 200,
      }) || errorRate.add(1);
    });
  }

  sleep(Math.random() * 5); // Random sleep between 0-5 seconds
  activeUsers.add(-1);
}

// ============================================
// PEAK TEST SUITE
// ============================================
export function peakSuite() {
  activeUsers.add(1);

  // Aggressive test pattern for peak load
  group('Peak Test - QR Code Generation', () => {
    const payload = JSON.stringify({
      url: `https://example.com/peak-test-${Math.random()}-${Date.now()}`,
    });

    const res = http.post(`${BASE_URL}/qr/generate`, payload, {
      headers: {
        'Content-Type': 'application/json',
      },
    });

    generateQRDuration.add(res.timings.duration);
    check(res, {
      'QR generate status is 200': (r) => r.status === 200,
      'QR response is an image': (r) => r.headers['Content-Type']?.includes('image/png'),
    }) || errorRate.add(1);

    if (res.status === 200) {
      qrGeneratedCount.add(1);
    }
  });

  // Concurrent stats checks
  if (Math.random() < 0.3) {
    group('Peak Test - Stats Check', () => {
      const res = http.get(`${BASE_URL}/stats/`);
      statsRequestDuration.add(res.timings.duration);
      check(res, {
        'stats endpoint status is 200': (r) => r.status === 200,
      }) || errorRate.add(1);
    });
  }

  sleep(Math.random() * 2); // Random sleep between 0-2 seconds
  activeUsers.add(-1);
}
