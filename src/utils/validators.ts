
import * as Supastruct from 'supastruct';

// Basic string validation
export const validateText = (value: unknown): { valid: boolean; error?: string } => {
  try {
    Supastruct.validate(value, Supastruct.string());
    return { valid: true };
  } catch (error) {
    return { 
      valid: false, 
      error: error instanceof Error ? error.message : 'Invalid string value' 
    };
  }
};

// Email validation
export const emailSchema = Supastruct.refine(
  Supastruct.string(),
  (value) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value),
  'Must be a valid email address'
);

export const validateEmail = (value: unknown): { valid: boolean; error?: string } => {
  try {
    Supastruct.validate(value, emailSchema);
    return { valid: true };
  } catch (error) {
    return { 
      valid: false, 
      error: error instanceof Error ? error.message : 'Invalid email address' 
    };
  }
};

// Number validation (positive integers only)
export const positiveIntegerSchema = Supastruct.refine(
  Supastruct.number(),
  (value) => Number.isInteger(value) && value > 0,
  'Must be a positive integer'
);

export const validatePositiveInteger = (value: unknown): { valid: boolean; error?: string } => {
  try {
    // First convert string to number if needed
    const numberValue = typeof value === 'string' ? Number(value) : value;
    Supastruct.validate(numberValue, positiveIntegerSchema);
    return { valid: true };
  } catch (error) {
    return { 
      valid: false, 
      error: error instanceof Error ? error.message : 'Invalid number' 
    };
  }
};

// Phone number validation (simple format)
export const phoneSchema = Supastruct.refine(
  Supastruct.string(),
  (value) => /^\+?[\d\s-()]{7,15}$/.test(value),
  'Must be a valid phone number'
);

export const validatePhone = (value: unknown): { valid: boolean; error?: string } => {
  try {
    Supastruct.validate(value, phoneSchema);
    return { valid: true };
  } catch (error) {
    return { 
      valid: false, 
      error: error instanceof Error ? error.message : 'Invalid phone number' 
    };
  }
};

// Example of a complex object schema (for reference)
export const propertyContactSchema = Supastruct.object({
  name: Supastruct.string(),
  email: emailSchema,
  phone: Supastruct.union([Supastruct.literal(null), phoneSchema]),
  role: Supastruct.union([Supastruct.literal(null), Supastruct.string()]),
});
