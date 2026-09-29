import { test } from 'node:test';
import assert from 'node:assert/strict';
import { parsePrice, nicePrice, analyzeMarket, quantile } from '../src/pricing.js';
import { titleSimilarity } from '../src/similarity.js';
import { guessCategory } from '../src/categories.js';

test('parsePrice handles Canadian FR/EN formats', () => {
  assert.equal(parsePrice('$1,250'), 1250);
  assert.equal(parsePrice('1 250 $'), 1250);
  assert.equal(parsePrice('1 250 $'), 1250);
  assert.equal(parsePrice('45,50 $'), 45.5);
  assert.equal(parsePrice('CA$45'), 45);
  assert.equal(parsePrice('Gratuit'), 0);
  assert.equal(parsePrice('Free'), 0);
  assert.equal(parsePrice('Contactez-nous'), null);
  assert.equal(parsePrice(99), 99);
});

test('nicePrice rounds to marketplace-looking numbers', () => {
  assert.equal(nicePrice(23.4), 25);
  assert.equal(nicePrice(12.4), 12);
  assert.equal(nicePrice(187), 185);
  assert.equal(nicePrice(1234), 1225);
  assert.equal(nicePrice(0), 0);
});

test('quantile interpolates', () => {
  assert.equal(quantile([10, 20, 30, 40], 0.5), 25);
  assert.equal(quantile([], 0.5), null);
});

test('titleSimilarity penalises different model numbers', () => {
  const same = titleSimilarity('iPhone 13 128 Go bleu', 'iphone 13 128gb');
  const diff = titleSimilarity('iPhone 14 128 Go', 'iphone 13 128gb');
  assert.ok(same > diff, `${same} should beat ${diff}`);
  assert.ok(titleSimilarity('Perceuse DeWalt 20V', 'dewalt 20v drill') > 0.4);
  assert.equal(titleSimilarity('', 'x'), 0);
});

test('analyzeMarket computes strategies from comparables and drops outliers', () => {
  const listings = [
    ...[180, 200, 210, 220, 225, 230, 240, 250, 260].map((p, i) => ({ title: 'Vélo Trek FX 3 taille M', price: `${p} $`, url: `u${i}` })),
    { title: 'Vélo Trek FX 3 taille M', price: '2 000 $', url: 'outlier' },
    { title: 'Casque de vélo', price: '20 $', url: 'other' },
    { title: 'Vélo Trek FX 3', price: 'Gratuit', url: 'free' },
  ];
  const result = analyzeMarket(listings, { queries: ['Trek FX 3 vélo'], desiredPrice: 275 });
  assert.equal(result.usedCount, 9, 'outlier and unrelated removed');
  assert.equal(result.stats.median, 225);
  const [fast, market, max] = result.strategies;
  assert.ok(fast.price < market.price && market.price <= max.price);
  assert.equal(market.price, 225);
  assert.match(result.desired.verdict, /Cher/);
  assert.ok(result.desired.daysToSell.max > fast.daysToSell.max);
});

test('analyzeMarket respects AI match verdicts', () => {
  const listings = [
    { title: 'Totally unrelated words', price: 100, match: 'identical' },
    { title: 'Trek FX 3', price: 500, match: 'different' },
  ];
  const result = analyzeMarket(listings, { queries: ['Trek FX 3'] });
  assert.equal(result.comparableCount, 1);
  assert.equal(result.stats.median, 100);
});

test('analyzeMarket with no data', () => {
  const result = analyzeMarket([], { queries: ['x'] });
  assert.equal(result.confidence, 'aucune');
  assert.equal(result.stats, null);
});

test('guessCategory keyword fallback', () => {
  assert.equal(guessCategory('Perceuse DeWalt 20V'), 'tools');
  assert.equal(guessCategory('iPhone 13 bleu'), 'mobile_phones');
  assert.equal(guessCategory('Canne à pêche à mouche'), 'sports_outdoors');
  assert.equal(guessCategory('xyz'), 'misc');
});
