import http from 'k6/http';
import { check, group } from 'k6';

export const options = {
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

const BASE_URL = __ENV.BASE_URL || 'http://localhost:8000';

// Generate random QR codes to simulate realistic load
function getRandomUrl() {
  const urls = [
    'https://example.com',
    'https://github.com',
    'https://google.com',
    'https://k6.io',
  ];
  const timestamp = new Date().getTime();
  const randomUrl = urls[Math.floor(Math.random() * urls.length)];
  return `${randomUrl}?session=${timestamp}`;
}

export default function () {
  group('Health Check', () => {
    const response = http.get(`${BASE_URL}/health`);
    check(response, {
      'health check status is 200': (r) => r.status === 200,
    });
  });

  group('Generate QR Code - Peak Load', () => {
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

  group('Get Stats - Peak Load', () => {
    const response = http.get(`${BASE_URL}/stats/`);
    check(response, {
      'stats status is 200': (r) => r.status === 200,
      'total_qr_generated is valid': (r) => typeof r.json('total_qr_generated') === 'number',
    });
  });

  // Simulate browser-like behavior with static asset requests
  group('Static Files - Peak Load', () => {
    const response = http.get(`${BASE_URL}/static/index.html`);
    check(response, {
      'static file request is 200 or 404': (r) => r.status === 200 || r.status === 404,
    });
  });
}
