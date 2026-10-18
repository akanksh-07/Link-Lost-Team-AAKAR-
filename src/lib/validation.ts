/**
 * Form and Data Validation Utilities for Lost-Link
 */

export interface RegistrationData {
  fullName?: string;
  collegeEmail?: string;
  rollNumber?: string;
  phoneNumber?: string;
  password?: string;
  confirmPassword?: string;
  role?: string;
}

export interface ValidationErrorMap {
  [key: string]: string;
}

/**
 * Validates email format and optionally checks for educational domains
 */
export function isValidEmail(email: string): boolean {
  if (!email || typeof email !== 'string') return false;
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email.trim().toLowerCase());
}

/**
 * Validates registration form inputs
 */
export function validateRegistration(data: RegistrationData): { isValid: boolean; errors: ValidationErrorMap } {
  const errors: ValidationErrorMap = {};

  // Full name
  if (!data.fullName || !data.fullName.trim()) {
    errors.fullName = 'Full name is required';
  } else if (data.fullName.trim().length < 2) {
    errors.fullName = 'Full name must be at least 2 characters';
  }

  // College email
  if (!data.collegeEmail || !data.collegeEmail.trim()) {
    errors.collegeEmail = 'College email is required';
  } else if (!isValidEmail(data.collegeEmail)) {
    errors.collegeEmail = 'Please provide a valid email address';
  }

  // Roll number
  if (!data.rollNumber || !data.rollNumber.trim()) {
    errors.rollNumber = 'Roll number or student ID is required';
  } else if (data.rollNumber.trim().length < 3) {
    errors.rollNumber = 'Roll number must be at least 3 characters';
  }

  // Phone number (optional or required)
  if (data.phoneNumber && data.phoneNumber.trim()) {
    const cleaned = data.phoneNumber.replace(/[\s\-\(\)\.]/g, '');
    if (cleaned.length < 7 || !/^\+?\d+$/.test(cleaned)) {
      errors.phoneNumber = 'Please enter a valid phone number';
    }
  }

  // Password
  if (!data.password) {
    errors.password = 'Password is required';
  } else if (data.password.length < 8) {
    errors.password = 'Password must be at least 8 characters';
  }

  // Confirm password
  if (!data.confirmPassword) {
    errors.confirmPassword = 'Confirm password is required';
  } else if (data.password !== data.confirmPassword) {
    errors.confirmPassword = 'Passwords do not match';
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors,
  };
}

/**
 * Validates login form inputs
 */
export function validateLogin(email?: string, password?: string): { isValid: boolean; errors: ValidationErrorMap } {
  const errors: ValidationErrorMap = {};

  if (!email || !email.trim()) {
    errors.email = 'Email address is required';
  } else if (!isValidEmail(email)) {
    errors.email = 'Please provide a valid email address';
  }

  if (!password) {
    errors.password = 'Password is required';
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors,
  };
}

/**
 * Validates found item submission
 */
export function validateFoundItem(data: {
  title?: string;
  category?: string;
  description?: string;
  foundLocation?: string;
  foundDate?: string;
}): { isValid: boolean; errors: ValidationErrorMap } {
  const errors: ValidationErrorMap = {};

  if (!data.title || !data.title.trim()) {
    errors.title = 'Item title is required';
  } else if (data.title.trim().length < 3) {
    errors.title = 'Title must be at least 3 characters';
  }

  if (!data.category || !data.category.trim()) {
    errors.category = 'Please select a category';
  }

  if (!data.description || !data.description.trim()) {
    errors.description = 'Item description is required';
  } else if (data.description.trim().length < 10) {
    errors.description = 'Description should be at least 10 characters with helpful details';
  }

  if (!data.foundLocation || !data.foundLocation.trim()) {
    errors.foundLocation = 'Location where item was found is required';
  }

  if (!data.foundDate) {
    errors.foundDate = 'Date found is required';
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors,
  };
}

/**
 * Validates lost item report submission
 */
export function validateLostReport(data: {
  title?: string;
  category?: string;
  description?: string;
  lastSeenLocation?: string;
  dateLost?: string;
}): { isValid: boolean; errors: ValidationErrorMap } {
  const errors: ValidationErrorMap = {};

  if (!data.title || !data.title.trim()) {
    errors.title = 'Item title is required';
  } else if (data.title.trim().length < 3) {
    errors.title = 'Title must be at least 3 characters';
  }

  if (!data.category || !data.category.trim()) {
    errors.category = 'Please select a category';
  }

  if (!data.description || !data.description.trim()) {
    errors.description = 'Description is required';
  } else if (data.description.trim().length < 10) {
    errors.description = 'Description should be at least 10 characters to help identify';
  }

  if (!data.lastSeenLocation || !data.lastSeenLocation.trim()) {
    errors.lastSeenLocation = 'Last seen location is required';
  }

  if (!data.dateLost) {
    errors.dateLost = 'Date lost is required';
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors,
  };
}

/**
 * Validates ownership claim request
 */
export function validateClaim(data: {
  proofDescription?: string;
  contactPhone?: string;
}): { isValid: boolean; errors: ValidationErrorMap } {
  const errors: ValidationErrorMap = {};

  if (!data.proofDescription || !data.proofDescription.trim()) {
    errors.proofDescription = 'Proof of ownership description is required';
  } else if (data.proofDescription.trim().length < 15) {
    errors.proofDescription = 'Please provide detailed proof (at least 15 characters, e.g. serial numbers, stickers, distinctive marks)';
  }

  if (!data.contactPhone || !data.contactPhone.trim()) {
    errors.contactPhone = 'Contact phone number is required for pickup coordination';
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors,
  };
}
