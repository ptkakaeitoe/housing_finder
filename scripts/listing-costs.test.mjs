import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { listingCostPayload, utilitySummary, utilities } from '../src/lib/listingCosts.js';

const en = JSON.parse(readFileSync(fileURLToPath(new URL('../src/lib/i18n/dictionaries/en.json', import.meta.url)), 'utf8'));
function t(key, vars) {
  const entry = key.split('.').reduce((node, part) => node?.[part], en);
  if (entry === undefined) return key;
  const text = typeof entry === 'object' ? (vars?.count === 1 ? entry.one : entry.other) : entry;
  return vars ? text.replace(/\{\{(\w+)\}\}/g, (m, name) => (vars[name] !== undefined ? String(vars[name]) : m)) : text;
}

function form(values) { const f = new FormData(); for (const [key, value] of Object.entries(values)) f.set(key, value); return f; }
test('blank deposit differs from zero; stale included rates and unavailable van notes are cleared', () => {
  assert.equal(listingCostPayload(form({}), t).security_deposit, null);
  const payload = listingCostPayload(form({ security_deposit: '0', electricity_billing: 'included', electricity_rate: '8', van_service: 'unavailable', van_details: 'old route' }), t);
  assert.equal(payload.security_deposit, 0);
  assert.equal(payload.electricity_rate, null);
  assert.equal(payload.van_details, '');
  assert.equal(utilitySummary(payload, utilities[0], t), 'Included in rent');
});
test('metered and monthly billing require a valid rate', () => {
  assert.throws(() => listingCostPayload(form({ electricity_billing: 'metered' }), t), /rate/);
  assert.throws(() => listingCostPayload(form({ electricity_billing: 'metered', electricity_rate: '-1' }), t), /amount/);
  assert.throws(() => listingCostPayload(form({ security_deposit: 'NaN' }), t), /amount/);
  assert.throws(() => listingCostPayload(form({ internet_billing: 'metered', internet_rate: '3' }), t), /billing/);
  const payload = listingCostPayload(form({ water_billing: 'metered', water_rate: '18.5', internet_billing: 'monthly', internet_rate: '0', van_service: 'paid', van_details: 'Campus gate · 20 THB per trip' }), t);
  assert.equal(utilitySummary(payload, utilities[1], t), '฿18.5 / m³');
  assert.equal(utilitySummary(payload, utilities[2], t), '฿0 / month');
  assert.equal(payload.van_details, 'Campus gate · 20 THB per trip');
});
