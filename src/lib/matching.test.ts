import test from 'node:test';
import assert from 'node:assert/strict';
import { calculateMatchScore, findMatches } from './matching.ts';

test('calculateMatchScore gives high score for identical category, keyword overlap and close dates', () => {
  const lost = {
    id: 'lost-1',
    title: 'Apple MacBook Air M2 Space Grey',
    category: 'Electronics',
    description: 'Left in library study desk. Has a NASA sticker and slight scratch on top lid.',
    last_seen_location: 'Central Library - 1st Floor Commons',
    date_lost: '2026-10-14',
  };

  const foundMatching = {
    id: 'found-1',
    title: 'MacBook Air Space Grey Laptop',
    category: 'Electronics',
    description: 'Found on table in library 1st floor with NASA sticker on back.',
    found_location: 'Central Library - 1st Floor Commons',
    found_date: '2026-10-15',
    status: 'unclaimed',
  };

  const foundUnrelated = {
    id: 'found-2',
    title: 'Red Gym Water Bottle',
    category: 'Water Bottles & Mugs',
    description: 'Stainless steel bottle found in Gym',
    found_location: 'Campus Recreation Center',
    found_date: '2026-09-01',
    status: 'unclaimed',
  };

  const matchHigh = calculateMatchScore(lost, foundMatching);
  assert.ok(matchHigh.score >= 70, `Expected score >= 70 but got ${matchHigh.score}`);
  assert.equal(matchHigh.confidence, 'High');

  const matchLow = calculateMatchScore(lost, foundUnrelated);
  assert.ok(matchLow.score < 25, `Expected score < 25 but got ${matchLow.score}`);
});

test('findMatches filters out low score items and sorts descending', () => {
  const lost = {
    id: 'lost-2',
    title: 'Black leather wallet with student ID',
    category: 'Wallets & IDs',
    description: 'Lost wallet with student card and transit pass',
    last_seen_location: 'Student Union - Main Food Court',
    date_lost: '2026-10-16',
  };

  const candidates = [
    {
      id: 'f-1',
      title: 'Black Leather Bifold Wallet',
      category: 'Wallets & IDs',
      description: 'Found under booth with student ID card inside',
      found_location: 'Student Union - Main Food Court',
      found_date: '2026-10-16',
      status: 'unclaimed',
    },
    {
      id: 'f-2',
      title: 'Silver Keychain with dorm keys',
      category: 'Keys',
      description: 'Dorm keys with blue fob',
      found_location: 'North Quad',
      found_date: '2026-10-16',
      status: 'unclaimed',
    },
  ];

  const matches = findMatches(lost, candidates);
  assert.equal(matches.length, 1);
  assert.equal(matches[0].item.id, 'f-1');
});
