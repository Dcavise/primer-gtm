
import { z } from 'zod';

// Basic string validation
export const validateText = (value: unknown): { valid: boolean; error?: string } => {
  try {
    z.string().parse(value);
    return { valid: true };
  } catch (error) {
    return { 
      valid: false, 
      error: error instanceof Error ? error.message : 'Invalid string value' 
    };
  }
};

// Email validation
export const emailSchema = z.string().email('Must be a valid email address');

export const validateEmail = (value: unknown): { valid: boolean; error?: string } => {
  try {
    emailSchema.parse(value);
    return { valid: true };
  } catch (error) {
    return { 
      valid: false, 
      error: error instanceof Error ? error.message : 'Invalid email address' 
    };
  }
};

// Number validation (positive integers only)
export const positiveIntegerSchema = z.number()
  .int('Must be an integer')
  .positive('Must be a positive integer');

export const validatePositiveInteger = (value: unknown): { valid: boolean; error?: string } => {
  try {
    // First convert string to number if needed
    const numberValue = typeof value === 'string' ? Number(value) : value;
    positiveIntegerSchema.parse(numberValue);
    return { valid: true };
  } catch (error) {
    return { 
      valid: false, 
      error: error instanceof Error ? error.message : 'Invalid number' 
    };
  }
};

// Phone number validation (simple format)
export const phoneSchema = z.string()
  .regex(/^\+?[\d\s-()]{7,15}$/, 'Must be a valid phone number');

export const validatePhone = (value: unknown): { valid: boolean; error?: string } => {
  try {
    phoneSchema.parse(value);
    return { valid: true };
  } catch (error) {
    return { 
      valid: false, 
      error: error instanceof Error ? error.message : 'Invalid phone number' 
    };
  }
};

// Example of a complex object schema (for reference)
export const propertyContactSchema = z.object({
  name: z.string(),
  email: emailSchema,
  phone: z.string().nullable(),
  role: z.string().nullable(),
});
