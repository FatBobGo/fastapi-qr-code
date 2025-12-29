import http from 'k6/http';
import { check, group } from 'k6';

export const options = {
  stages: [
    { duration: '30s', target: 5 },    // Warm up to 5 users over 30 seconds
    { duration: '30s', target: 5 },    // Stay at 5 users for 30 seconds
    { duration: '20s', target: 0 },    // Ramp down to 0 users
  ],
  thresholds: {
    http_req_duration: ['p(95)<500'],  // 95% of requests must complete below 500ms
    http_req_failed: ['rate<0.1'],     // Error rate must be below 10%
  },
};

const BASE_URL = __ENV.BASE_URL || 'http://localhost:8000';

export default function () {
  group('Health Check', () => {
    const response = http.get(`${BASE_URL}/health`);
    check(response, {
      'health check status is 200': (r) => r.status === 200,
      'health check returns ok': (r) => r.json('status') === 'ok',
    });
  });

  group('Get Stats', () => {
    const response = http.get(`${BASE_URL}/stats/`);
    check(response, {
      'stats status is 200': (r) => r.status === 200,
      'stats has total_qr_generated field': (r) => 'total_qr_generated' in r.json(),
    });
  });

  group('Generate QR Code', () => {
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
