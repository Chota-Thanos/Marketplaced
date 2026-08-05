/**
 * k6 load test.
 *
 *   k6 run load-test.js
 *   k6 run -e WEB_URL=https://staging.bazaarx.in -e API_URL=https://api.bazaarx.in/api/v1 load-test.js
 *
 * Exercises the two tiers separately: Next.js renders pages, the Laravel API
 * serves data. The previous version hit `/api/products?q=` on the web origin —
 * a route removed during the Laravel migration — so every check passed against
 * a 404 and the run proved nothing.
 */
import http from 'k6/http';
import { check, group, sleep } from 'k6';
import { Rate } from 'k6/metrics';

const WEB_URL = __ENV.WEB_URL || 'http://localhost:3000';
const API_URL = __ENV.API_URL || 'http://127.0.0.1:8000/api/v1';

const failures = new Rate('failed_requests');

export const options = {
  stages: [
    { duration: '30s', target: 50 },
    { duration: '1m', target: 200 },
    { duration: '30s', target: 0 },
  ],
  thresholds: {
    http_req_duration: ['p(95)<500'],
    failed_requests: ['rate<0.01'],
    checks: ['rate>0.99'],
  },
};

const SEARCH_TERMS = ['saree', 'headphones', 'shoes', 'lamp', 'anarkali', 'oil'];

export function setup() {
  // Grab a real product id so the PDP leg exercises a page that exists.
  const res = http.get(`${API_URL}/products`);
  const products = res.json('data') || [];
  return { productId: products.length ? products[0].id : null };
}

export default function (data) {
  group('storefront', () => {
    const home = http.get(`${WEB_URL}/`);
    failures.add(home.status !== 200);
    check(home, { 'home 200': r => r.status === 200 });
    sleep(1);
  });

  group('api: catalogue', () => {
    const list = http.get(`${API_URL}/products`);
    failures.add(list.status !== 200);
    check(list, {
      'products 200': r => r.status === 200,
      'products payload': r => Array.isArray(r.json('data')),
    });

    const term = SEARCH_TERMS[Math.floor(Math.random() * SEARCH_TERMS.length)];
    const search = http.get(`${API_URL}/products?search=${term}`);
    failures.add(search.status !== 200);
    check(search, { 'search 200': r => r.status === 200 });
    sleep(1);
  });

  if (data.productId) {
    group('api: pdp', () => {
      const pdp = http.get(`${API_URL}/products/${data.productId}`);
      failures.add(pdp.status !== 200);
      check(pdp, { 'product detail 200': r => r.status === 200 });

      const reviews = http.get(`${API_URL}/products/${data.productId}/reviews`);
      check(reviews, { 'reviews 200': r => r.status === 200 });
      sleep(1);
    });
  }

  group('api: discovery', () => {
    const trending = http.get(`${API_URL}/recommendations/trending`);
    failures.add(trending.status !== 200);
    check(trending, { 'trending 200': r => r.status === 200 });
    sleep(1);
  });
}
