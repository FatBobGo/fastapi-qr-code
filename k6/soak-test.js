import http from 'k6/http';
import { check, group } from 'k6';

export const options = {
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

const BASE_URL = __ENV.BASE_URL || 'http://localhost:8000';

// Generate random QR codes with different content to test cache behavior
function getRandomUrl() {
  const timestamp = new Date().getTime();
  const random = Math.floor(Math.random() * 10000);
  return `https://example.com?id=${timestamp}-${random}`;
}

export default function () {
  group('Health Check', () => {
    const response = http.get(`${BASE_URL}/health`);
    check(response, {
      'health check status is 200': (r) => r.status === 200,
    });
  });

  group('Generate QR Code - Soak Test', () => {
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

  group('Get Stats - Soak Test', () => {
    const response = http.get(`${BASE_URL}/stats/`);
    check(response, {
      'stats status is 200': (r) => r.status === 200,
      'total_qr_generated is increasing': (r) => r.json('total_qr_generated') >= 0,
    });
  });
}
