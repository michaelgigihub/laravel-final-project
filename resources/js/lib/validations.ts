import { z } from 'zod';

/**
 * Philippine phone number regex pattern
 * Accepts: +63XXXXXXXXXX or 0XXXXXXXXXX (11 digits total for 0 prefix)
 */
export const phoneRegex = /^(\+63|0)\d{10}$/;

/**
 * Reusable phone number validation schema
 * Validates Philippine phone numbers with +63 or 0 prefix
 */
export const phoneNumberSchema = z
    .string()
    .optional()
    .refine(
        (val) => {
            if (!val || val.trim() === '') return true;
            const cleaned = val.replace(/[\s-]/g, '');
            return phoneRegex.test(cleaned);
        },
        {
            message:
                'Phone number must be 11 digits starting with +63 or 0 (e.g., 0917 123 4567)',
        },
    );

/**
 * Required phone number validation schema
 */
export const requiredPhoneNumberSchema = z
    .string()
    .min(1, 'Phone number is required')
    .refine(
        (val) => {
            const cleaned = val.replace(/[\s-]/g, '');
            return phoneRegex.test(cleaned);
        },
        {
            message:
                'Phone number must be 11 digits starting with +63 or 0 (e.g., 0917 123 4567)',
        },
    );

/**
 * Reusable required name field schema
 */
export const nameSchema = (fieldName: string) =>
    z
        .string()
        .min(1, `${fieldName} is required`)
        .max(255, `${fieldName} must not exceed 255 characters`);

/**
 * Reusable optional name field schema
 */
export const optionalNameSchema = (fieldName: string) =>
    z
        .string()
        .max(255, `${fieldName} must not exceed 255 characters`)
        .optional();

/**
 * Reusable email validation schema (optional)
 */
export const optionalEmailSchema = z
    .string()
    .max(255, 'Email must not exceed 255 characters')
    .optional()
    .refine(
        (val) => {
            if (!val || val.trim() === '') return true;
            return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(val);
        },
        { message: 'Invalid email address' },
    );

/**
 * Reusable email validation schema (required)
 */
export const requiredEmailSchema = z
    .string()
    .min(1, 'Email is required')
    .email('Invalid email address')
    .max(255, 'Email must not exceed 255 characters');

/**
 * Reusable gender validation schema
 */
export const genderSchema = z.enum(['Male', 'Female', 'Other'], {
    message: 'Gender is required',
});

/**
 * Reusable password validation schema
 */
export const passwordSchema = z
    .string()
    .min(8, 'Password must be at least 8 characters')
    .max(255, 'Password must not exceed 255 characters');
