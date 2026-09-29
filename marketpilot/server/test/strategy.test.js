import { test } from 'node:test';
import assert from 'node:assert/strict';
import { buildPlan, evaluateListing, priceLadder, nextPrimeTime, applyCompletedAction } from '../src/strategy.js';

const DAY = 86400000;
const NOW = new Date('2026-10-07T19:00:00'); // Wednesday 19:00, inside a prime window
const ago = (days) => new Date(NOW.getTime() - days * DAY).toISOString();

const base = (over = {}) => ({
  id: 'l1',
  title: 'Vélo Trek FX 3',
  status: 'active',
  price: 300,
  floorPrice: 240,
  postedAt: ago(1),
  stats: { messages: 0, views: 100 },
  renewCount: 0,
  plan: buildPlan('balanced'),
  ...over,
});

const types = (actions) => actions.map((a) => a.type).sort();

test('fresh listing: nothing to do', () => {
  assert.deepEqual(evaluateListing(base(), NOW), []);
});

test('non-active listings are ignored', () => {
  assert.deepEqual(evaluateListing(base({ status: 'sold', postedAt: ago(40) }), NOW), []);
});

test('price drop after dropEveryDays with no messages, never below floor', () => {
  const actions = evaluateListing(base({ postedAt: ago(6) }), NOW);
  const drop = actions.find((a) => a.type === 'price_drop');
  assert.ok(drop);
  assert.equal(drop.payload.from, 300);
  assert.equal(drop.payload.to, 280); // 300 * 0.93 = 279 -> 280
  assert.equal(drop.requiresApproval, true);

  const near = evaluateListing(base({ postedAt: ago(6), price: 245 }), NOW).find((a) => a.type === 'price_drop');
  assert.equal(near.payload.to, 240, 'clamped to floor');

  assert.equal(evaluateListing(base({ postedAt: ago(6), price: 240 }), NOW).find((a) => a.type === 'price_drop'), undefined);
});

test('hot listing (many messages) keeps its price', () => {
  const actions = evaluateListing(base({ postedAt: ago(6), stats: { messages: 5, views: 300 } }), NOW);
  assert.ok(!actions.some((a) => a.type === 'price_drop'));
});

test('renew after renewEveryDays; auto-approved by default', () => {
  const actions = evaluateListing(base({ postedAt: ago(8), lastPriceChangeAt: ago(1) }), NOW);
  assert.deepEqual(types(actions), ['renew']);
  assert.equal(actions[0].requiresApproval, false);
});

test('relist replaces renew once the ad is old and was renewed', () => {
  const actions = evaluateListing(base({ postedAt: ago(25), lastRenewedAt: ago(10), renewCount: 2, lastPriceChangeAt: ago(1) }), NOW);
  assert.deepEqual(types(actions), ['relist']);
  assert.equal(actions[0].requiresApproval, true);
});

test('boost only when enabled, valuable and low traffic, with cooldown', () => {
  const plan = buildPlan('balanced', { boost: { enabled: true, minPrice: 100, dailyBudget: 4, days: 3 } });
  const listing = base({ plan, postedAt: ago(3), stats: { messages: 0, views: 12 } });
  const boost = evaluateListing(listing, NOW).find((a) => a.type === 'boost');
  assert.deepEqual(boost.payload, { dailyBudget: 4, days: 3, total: 12 });
  const cooled = evaluateListing({ ...listing, lastBoostAt: ago(2) }, NOW).find((a) => a.type === 'boost');
  assert.equal(cooled, undefined);
  const cheap = evaluateListing({ ...listing, price: 50, floorPrice: 40 }, NOW).find((a) => a.type === 'boost');
  assert.equal(cheap, undefined);
});

test('pending types are not proposed twice', () => {
  const actions = evaluateListing(base({ postedAt: ago(8) }), NOW, { pendingTypes: new Set(['renew', 'price_drop']) });
  assert.deepEqual(actions, []);
});

test('advice when stuck at floor', () => {
  const actions = evaluateListing(base({ postedAt: ago(12), price: 240, lastRenewedAt: ago(1) }), NOW);
  assert.deepEqual(types(actions), ['advice']);
});

test('priceLadder walks down to the floor', () => {
  const ladder = priceLadder(300, 240, buildPlan('fast'));
  assert.equal(ladder[0].price, 300);
  assert.equal(ladder.at(-1).price, 240);
  assert.ok(ladder.every((s, i) => i === 0 || s.price < ladder[i - 1].price));
  assert.equal(ladder[1].day, 3);
});

test('nextPrimeTime returns evening or weekend-morning windows', () => {
  assert.equal(nextPrimeTime(NOW).getTime(), NOW.getTime());
  const morning = nextPrimeTime(new Date('2026-10-07T08:15:00')); // Wednesday
  assert.equal(morning.getHours(), 18);
  const saturday = nextPrimeTime(new Date('2026-10-10T07:30:00'));
  assert.equal(saturday.getHours(), 9);
});

test('applyCompletedAction updates listing state', () => {
  const l = base();
  const dropped = applyCompletedAction(l, { type: 'price_drop', payload: { from: 300, to: 280 } }, NOW);
  assert.equal(dropped.price, 280);
  assert.equal(dropped.priceHistory.at(-1).price, 280);
  const renewed = applyCompletedAction(l, { type: 'renew' }, NOW);
  assert.equal(renewed.renewCount, 1);
  const relisted = applyCompletedAction({ ...l, renewCount: 3 }, { type: 'relist', result: { fbId: '999' } }, NOW);
  assert.equal(relisted.renewCount, 0);
  assert.equal(relisted.fbId, '999');
});
