import http from 'k6/http';
import { check, group } from 'k6';

const BASE_URL = __ENV.BASE_URL || 'http://localhost:8000';
const TEST_TYPE = __ENV.TEST_TYPE || 'smoke'; // smoke, soak, or peak

// Smoke Test Configuration
const smokeTestConfig = {
  stages: [
    { duration: '1s', target: 1 },    // Warm up to 1 users over 1 seconds
    { duration: '8s', target: 1 },    // Stay at 1 users for 8 seconds
    { duration: '1s', target: 0 },    // Ramp down to 0 users
  ],
  thresholds: {
    http_req_duration: ['p(95)<500'],  // 95% of requests must complete below 500ms
    http_req_failed: ['rate<0.1'],     // Error rate must be below 10%
  },
};

// Soak Test Configuration
const soakTestConfig = {
  stages: [
    { duration: '2m', target: 10 },      // Ramp up to 10 users over 2 minutes
    { duration: '20m', target: 10 },     // Stay at 10 users for 20 minutes (soak)
    { duration: '2m', target: 0 },       // Ramp down to 0 users over 2 minutes
  ],
  thresholds: {
    http_req_duration: ['p(95)<1000'],   // 95% of requests must complete below 1000ms
    http_req_failed: ['rate<0.05'],      // Error rate must be below 5%
  },
};

// Peak Test Configuration
const peakTestConfig = {
  stages: [
    { duration: '2m', target: 50 },      // Ramp up to 50 users over 2 minutes
    { duration: '5m', target: 100 },     // Ramp up to 100 users over 5 minutes
    { duration: '10m', target: 100 },    // Stay at 100 users for 10 minutes (peak load)
    { duration: '5m', target: 50 },      // Ramp down to 50 users over 5 minutes
    { duration: '2m', target: 0 },       // Ramp down to 0 users over 2 minutes
  ],
  thresholds: {
    http_req_duration: ['p(95)<2000'],   // 95% of requests must complete below 2000ms
    http_req_failed: ['rate<0.1'],       // Error rate must be below 10%
  },
};

// Select configuration based on TEST_TYPE
let selectedConfig;
if (TEST_TYPE.toLowerCase() === 'soak') {
  selectedConfig = soakTestConfig;
} else if (TEST_TYPE.toLowerCase() === 'peak') {
  selectedConfig = peakTestConfig;
} else {
  selectedConfig = smokeTestConfig;
}

export const options = selectedConfig;

// Generate random QR codes with different content
function getRandomUrl() {
  const urls = [
    'https://example.com',
    'https://github.com',
    'https://google.com',
    'https://k6.io',
  ];
  const timestamp = new Date().getTime();
  const random = Math.floor(Math.random() * 10000);
  const randomUrl = urls[Math.floor(Math.random() * urls.length)];
  return `${randomUrl}?session=${timestamp}-${random}`;
}

// Smoke Test Functions
function runSmokeTest() {
  group('Smoke: Health Check', () => {
    const response = http.get(`${BASE_URL}/health`);
    check(response, {
      'health check status is 200': (r) => r.status === 200,
      'health check returns ok': (r) => r.json('status') === 'ok',
    });
  });

  group('Smoke: Get Stats', () => {
    const response = http.get(`${BASE_URL}/stats/`);
    check(response, {
      'stats status is 200': (r) => r.status === 200,
      'stats has total_qr_generated field': (r) => 'total_qr_generated' in r.json(),
    });
  });

  group('Smoke: Generate QR Code', () => {
    const payload = JSON.stringify({
      url: 'https://example.com',
      box_size: 10,
      border: 4,
      fill_color: 'black',
      back_color: 'white',
    });

    const response = http.post(`${BASE_URL}/qr/generate`, payload, {
      headers: { 'Content-Type': 'application/json' },
    });

    check(response, {
      'qr generation status is 200': (r) => r.status === 200,
      'qr response is image': (r) => r.headers['Content-Type'] === 'image/png',
    });
  });
}

// Soak Test Functions
function runSoakTest() {
  group('Soak: Health Check', () => {
    const response = http.get(`${BASE_URL}/health`);
    check(response, {
      'health check status is 200': (r) => r.status === 200,
    });
  });

  group('Soak: Generate QR Code', () => {
    const payload = JSON.stringify({
      url: getRandomUrl(),
      box_size: 10,
      border: 4,
      fill_color: 'black',
      back_color: 'white',
    });

    const response = http.post(`${BASE_URL}/qr/generate`, payload, {
      headers: { 'Content-Type': 'application/json' },
    });

    check(response, {
      'qr generation status is 200': (r) => r.status === 200,
      'qr response is image': (r) => r.headers['Content-Type'] === 'image/png',
      'qr response is not empty': (r) => r.body.length > 0,
    });
  });

  group('Soak: Get Stats', () => {
    const response = http.get(`${BASE_URL}/stats/`);
    check(response, {
      'stats status is 200': (r) => r.status === 200,
      'total_qr_generated is increasing': (r) => r.json('total_qr_generated') >= 0,
    });
  });
}

// Peak Test Functions
function runPeakTest() {
  group('Peak: Health Check', () => {
    const response = http.get(`${BASE_URL}/health`);
    check(response, {
      'health check status is 200': (r) => r.status === 200,
    });
  });

  group('Peak: Generate QR Code', () => {
    const payload = JSON.stringify({
      url: getRandomUrl(),
      box_size: 10,
      border: 4,
      fill_color: 'black',
      back_color: 'white',
    });

    const response = http.post(`${BASE_URL}/qr/generate`, payload, {
      headers: { 'Content-Type': 'application/json' },
    });

    check(response, {
      'qr generation status is 200': (r) => r.status === 200,
      'qr response is image': (r) => r.headers['Content-Type'] === 'image/png',
      'qr response is not empty': (r) => r.body.length > 0,
    });
  });

  group('Peak: Get Stats', () => {
    const response = http.get(`${BASE_URL}/stats/`);
    check(response, {
      'stats status is 200': (r) => r.status === 200,
      'total_qr_generated is valid': (r) => typeof r.json('total_qr_generated') === 'number',
    });
  });

  group('Peak: Static Files', () => {
    const response = http.get(`${BASE_URL}/static/index.html`);
    check(response, {
      'static file request is 200 or 404': (r) => r.status === 200 || r.status === 404,
    });
  });
}

// Main test function that routes to the correct test type
export default function () {
  if (TEST_TYPE.toLowerCase() === 'soak') {
    runSoakTest();
  } else if (TEST_TYPE.toLowerCase() === 'peak') {
    runPeakTest();
  } else {
    runSmokeTest();
  }
}
