
import { s } from 'supastruct';

// Basic string validation
export const validateText = (value: unknown): { valid: boolean; error?: string } => {
  try {
    s.validate(value, s.string());
    return { valid: true };
  } catch (error) {
    return { 
      valid: false, 
      error: error instanceof Error ? error.message : 'Invalid string value' 
    };
  }
};

// Email validation
export const emailSchema = s.refine(
  s.string(),
  (value) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value),
  'Must be a valid email address'
);

export const validateEmail = (value: unknown): { valid: boolean; error?: string } => {
  try {
    s.validate(value, emailSchema);
    return { valid: true };
  } catch (error) {
    return { 
      valid: false, 
      error: error instanceof Error ? error.message : 'Invalid email address' 
    };
  }
};

// Number validation (positive integers only)
export const positiveIntegerSchema = s.refine(
  s.number(),
  (value) => Number.isInteger(value) && value > 0,
  'Must be a positive integer'
);

export const validatePositiveInteger = (value: unknown): { valid: boolean; error?: string } => {
  try {
    // First convert string to number if needed
    const numberValue = typeof value === 'string' ? Number(value) : value;
    s.validate(numberValue, positiveIntegerSchema);
    return { valid: true };
  } catch (error) {
    return { 
      valid: false, 
      error: error instanceof Error ? error.message : 'Invalid number' 
    };
  }
};

// Phone number validation (simple format)
export const phoneSchema = s.refine(
  s.string(),
  (value) => /^\+?[\d\s-()]{7,15}$/.test(value),
  'Must be a valid phone number'
);

export const validatePhone = (value: unknown): { valid: boolean; error?: string } => {
  try {
    s.validate(value, phoneSchema);
    return { valid: true };
  } catch (error) {
    return { 
      valid: false, 
      error: error instanceof Error ? error.message : 'Invalid phone number' 
    };
  }
};

// Example of a complex object schema (for reference)
export const propertyContactSchema = s.object({
  name: s.string(),
  email: emailSchema,
  phone: s.union([s.literal(null), phoneSchema]),
  role: s.union([s.literal(null), s.string()]),
});
