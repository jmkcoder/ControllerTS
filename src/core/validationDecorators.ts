/**
 * Validation decorators for model properties - similar to ASP.NET Core Data Annotations
 */

export interface ValidationRule {
    propertyName: string;
    validatorName: string;
    message: string;
    validate: (value: any, target: any) => boolean;
    options?: any;
}

export interface ValidationError {
    propertyName: string;
    message: string;
    attemptedValue: any;
}

export interface ValidationResult {
    isValid: boolean;
    errors: ValidationError[];
    getError(propertyName: string): string | undefined;
    hasError(propertyName: string): boolean;
}

// Metadata key for storing validation rules
const VALIDATION_METADATA_KEY = Symbol('validation:rules');

// Store validation rules on the target class
function addValidationRule(target: any, propertyName: string, rule: Omit<ValidationRule, 'propertyName'>): void {
    const existingRules: ValidationRule[] = Reflect.getMetadata(VALIDATION_METADATA_KEY, target) || [];
    const newRule: ValidationRule = {
        propertyName,
        ...rule
    };
    existingRules.push(newRule);
    Reflect.defineMetadata(VALIDATION_METADATA_KEY, existingRules, target);
}

// Get all validation rules for a class
export function getValidationRules(target: any): ValidationRule[] {
    return Reflect.getMetadata(VALIDATION_METADATA_KEY, target) || [];
}

// Required validation decorator
export function Required(message?: string) {
    return function (target: any, propertyName: string) {
        addValidationRule(target, propertyName, {
            validatorName: 'Required',
            message: message || `${propertyName} is required.`,
            validate: (value: any) => {
                if (value === null || value === undefined) return false;
                if (typeof value === 'string' && value.trim() === '') return false;
                if (Array.isArray(value) && value.length === 0) return false;
                return true;
            }
        });
    };
}

// String length validation decorator
export function StringLength(maxLength: number, minLength: number = 0, message?: string) {
    return function (target: any, propertyName: string) {
        addValidationRule(target, propertyName, {
            validatorName: 'StringLength',
            message: message || `${propertyName} must be between ${minLength} and ${maxLength} characters.`,
            validate: (value: any) => {
                if (value === null || value === undefined) return true; // Use Required for null checks
                const str = String(value);
                return str.length >= minLength && str.length <= maxLength;
            },
            options: { minLength, maxLength }
        });
    };
}

// Email validation decorator
export function Email(message?: string) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return function (target: any, propertyName: string) {
        addValidationRule(target, propertyName, {
            validatorName: 'Email',
            message: message || `${propertyName} must be a valid email address.`,
            validate: (value: any) => {
                if (value === null || value === undefined || value === '') return true; // Use Required for null checks
                return emailRegex.test(String(value));
            }
        });
    };
}

// Range validation decorator
export function Range(min: number, max: number, message?: string) {
    return function (target: any, propertyName: string) {
        addValidationRule(target, propertyName, {
            validatorName: 'Range',
            message: message || `${propertyName} must be between ${min} and ${max}.`,
            validate: (value: any) => {
                if (value === null || value === undefined) return true; // Use Required for null checks
                const num = Number(value);
                if (isNaN(num)) return false;
                return num >= min && num <= max;
            },
            options: { min, max }
        });
    };
}

// Regular expression validation decorator
export function RegularExpression(pattern: string | RegExp, message?: string) {
    const regex = typeof pattern === 'string' ? new RegExp(pattern) : pattern;
    return function (target: any, propertyName: string) {
        addValidationRule(target, propertyName, {
            validatorName: 'RegularExpression',
            message: message || `${propertyName} format is invalid.`,
            validate: (value: any) => {
                if (value === null || value === undefined || value === '') return true; // Use Required for null checks
                return regex.test(String(value));
            },
            options: { pattern: pattern.toString() }
        });
    };
}

// Compare validation decorator (useful for password confirmation)
export function Compare(otherProperty: string, message?: string) {
    return function (target: any, propertyName: string) {
        addValidationRule(target, propertyName, {
            validatorName: 'Compare',
            message: message || `${propertyName} must match ${otherProperty}.`,
            validate: (value: any, targetObject: any) => {
                if (value === null || value === undefined) return true; // Use Required for null checks
                return value === targetObject[otherProperty];
            },
            options: { otherProperty }
        });
    };
}

// Custom validation decorator
export function CustomValidation(validatorFunction: (value: any, target: any) => boolean, message: string) {
    return function (target: any, propertyName: string) {
        addValidationRule(target, propertyName, {
            validatorName: 'Custom',
            message: message,
            validate: validatorFunction
        });
    };
}

// Phone number validation decorator
export function Phone(message?: string) {
    const phoneRegex = /^[\+]?[1-9][\d]{0,15}$/; // Basic international phone number format
    return function (target: any, propertyName: string) {
        addValidationRule(target, propertyName, {
            validatorName: 'Phone',
            message: message || `${propertyName} must be a valid phone number.`,
            validate: (value: any) => {
                if (value === null || value === undefined || value === '') return true; // Use Required for null checks
                // Remove common phone number formatting characters
                const cleanValue = String(value).replace(/[\s\-\(\)\.]/g, '');
                return phoneRegex.test(cleanValue);
            }
        });
    };
}

// URL validation decorator
export function Url(message?: string) {
    return function (target: any, propertyName: string) {
        addValidationRule(target, propertyName, {
            validatorName: 'Url',
            message: message || `${propertyName} must be a valid URL.`,
            validate: (value: any) => {
                if (value === null || value === undefined || value === '') return true; // Use Required for null checks
                try {
                    new URL(String(value));
                    return true;
                } catch {
                    return false;
                }
            }
        });
    };
}

// Credit card validation decorator
export function CreditCard(message?: string) {
    return function (target: any, propertyName: string) {
        addValidationRule(target, propertyName, {
            validatorName: 'CreditCard',
            message: message || `${propertyName} must be a valid credit card number.`,
            validate: (value: any) => {
                if (value === null || value === undefined || value === '') return true; // Use Required for null checks
                // Simple Luhn algorithm implementation
                const cardNumber = String(value).replace(/\D/g, '');
                if (cardNumber.length < 13 || cardNumber.length > 19) return false;
                
                let sum = 0;
                let isEven = false;
                for (let i = cardNumber.length - 1; i >= 0; i--) {
                    let digit = parseInt(cardNumber[i]);
                    if (isEven) {
                        digit *= 2;
                        if (digit > 9) digit -= 9;
                    }
                    sum += digit;
                    isEven = !isEven;
                }
                return sum % 10 === 0;
            }
        });
    };
}
