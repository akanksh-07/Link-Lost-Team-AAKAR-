import test from 'node:test';
import assert from 'node:assert/strict';
import {
  isValidEmail,
  validateRegistration,
  validateLogin,
  validateFoundItem,
  validateClaim,
} from './validation.ts';

test('isValidEmail handles valid and invalid emails', () => {
  assert.equal(isValidEmail('student@university.edu'), true);
  assert.equal(isValidEmail('john.doe@college.ac.uk'), true);
  assert.equal(isValidEmail('invalid-email'), false);
  assert.equal(isValidEmail('no-domain@'), false);
  assert.equal(isValidEmail(''), false);
});

test('validateRegistration checks all required fields, password length, and password match', () => {
  // Missing all fields
  const emptyRes = validateRegistration({});
  assert.equal(emptyRes.isValid, false);
  assert.ok(emptyRes.errors.fullName);
  assert.ok(emptyRes.errors.collegeEmail);
  assert.ok(emptyRes.errors.rollNumber);
  assert.ok(emptyRes.errors.password);

  // Short password (< 8 chars)
  const shortPass = validateRegistration({
    fullName: 'Jane Doe',
    collegeEmail: 'jane@campus.edu',
    rollNumber: 'CS2025-01',
    password: 'short',
    confirmPassword: 'short',
  });
  assert.equal(shortPass.isValid, false);
  assert.match(shortPass.errors.password, /8 characters/);

  // Mismatched passwords
  const mismatch = validateRegistration({
    fullName: 'Jane Doe',
    collegeEmail: 'jane@campus.edu',
    rollNumber: 'CS2025-01',
    password: 'Password123!',
    confirmPassword: 'DifferentPassword123!',
  });
  assert.equal(mismatch.isValid, false);
  assert.match(mismatch.errors.confirmPassword, /do not match/);

  // Fully valid
  const valid = validateRegistration({
    fullName: 'Jane Doe',
    collegeEmail: 'jane@campus.edu',
    rollNumber: 'CS2025-01',
    phoneNumber: '+1-555-0192',
    password: 'Password123!',
    confirmPassword: 'Password123!',
  });
  assert.equal(valid.isValid, true);
  assert.equal(Object.keys(valid.errors).length, 0);
});

test('validateFoundItem requires title, category, description, and location', () => {
  const invalid = validateFoundItem({});
  assert.equal(invalid.isValid, false);
  assert.ok(invalid.errors.title);
  assert.ok(invalid.errors.category);
  assert.ok(invalid.errors.description);
  assert.ok(invalid.errors.foundLocation);

  const valid = validateFoundItem({
    title: 'Blue Hydro Flask 32oz',
    category: 'Water Bottles & Mugs',
    description: 'Found left under desk in Lecture Hall 101. Has mountain sticker on side.',
    foundLocation: 'Science Complex - Lecture Hall 101',
    foundDate: '2026-10-15',
  });
  assert.equal(valid.isValid, true);
});

test('validateClaim checks ownership description minimum length and phone', () => {
  const tooShort = validateClaim({
    proofDescription: 'Mine',
    contactPhone: '',
  });
  assert.equal(tooShort.isValid, false);
  assert.ok(tooShort.errors.proofDescription);
  assert.ok(tooShort.errors.contactPhone);

  const valid = validateClaim({
    proofDescription: 'Serial number ends in 8892 and lock screen is a picture of a golden retriever',
    contactPhone: '555-0199',
  });
  assert.equal(valid.isValid, true);
});
