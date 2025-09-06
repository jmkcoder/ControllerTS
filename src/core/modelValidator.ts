/**
 * Model validation system - similar to ASP.NET Core ModelState
 */

import { ValidationRule, ValidationError, ValidationResult, getValidationRules } from './validationDecorators';

export class ModelState implements ValidationResult {
    private _errors: ValidationError[] = [];
    
    constructor(errors: ValidationError[] = []) {
        this._errors = [...errors];
    }

    get isValid(): boolean {
        return this._errors.length === 0;
    }

    get errors(): ValidationError[] {
        return [...this._errors];
    }

    getError(propertyName: string): string | undefined {
        const error = this._errors.find(e => e.propertyName === propertyName);
        return error?.message;
    }

    hasError(propertyName: string): boolean {
        return this._errors.some(e => e.propertyName === propertyName);
    }

    getErrors(propertyName: string): ValidationError[] {
        return this._errors.filter(e => e.propertyName === propertyName);
    }

    getAllErrors(): Record<string, string[]> {
        const result: Record<string, string[]> = {};
        this._errors.forEach(error => {
            if (!result[error.propertyName]) {
                result[error.propertyName] = [];
            }
            result[error.propertyName].push(error.message);
        });
        return result;
    }

    addError(propertyName: string, message: string, attemptedValue?: any): void {
        this._errors.push({
            propertyName,
            message,
            attemptedValue
        });
    }

    addErrors(errors: ValidationError[]): void {
        this._errors.push(...errors);
    }

    /**
     * Update this ModelState with errors from another validation result
     */
    updateFromValidationResult(validationResult: ValidationResult): void {
        if (!validationResult.isValid) {
            this._errors.push(...validationResult.errors);
        }
    }

    clear(): void {
        this._errors = [];
    }

    clearProperty(propertyName: string): void {
        this._errors = this._errors.filter(e => e.propertyName !== propertyName);
    }
}

export class ModelValidator {
    /**
     * Validates a model instance using its validation decorators
     * @param model The model instance to validate
     * @returns ModelState with validation results
     */
    static validate(model: any): ModelState {
        const errors: ValidationError[] = [];
        
        if (!model) {
            return new ModelState([{
                propertyName: '',
                message: 'Model cannot be null or undefined',
                attemptedValue: model
            }]);
        }

        // Get validation rules from the model's prototype
        const rules = getValidationRules(Object.getPrototypeOf(model));

        for (const rule of rules) {
            try {
                const propertyValue = model[rule.propertyName];
                const isValid = rule.validate(propertyValue, model);
                
                if (!isValid) {
                    errors.push({
                        propertyName: rule.propertyName,
                        message: rule.message,
                        attemptedValue: propertyValue
                    });
                }
            } catch (error) {
                console.error(`❌ ModelValidator: Error validating property ${rule.propertyName}:`, error);
                errors.push({
                    propertyName: rule.propertyName,
                    message: `Validation error: ${error instanceof Error ? error.message : 'Unknown error'}`,
                    attemptedValue: model[rule.propertyName]
                });
            }
        }

        const modelState = new ModelState(errors);
        
        return modelState;
    }

    /**
     * Validates form data against a model class
     * @param modelClass The model class constructor
     * @param formData The form data to validate
     * @returns ModelState with validation results
     */
    static validateFormData(modelClass: new () => any, formData: any): ModelState {
        try {
            // Create an instance of the model
            const modelInstance = new modelClass();
            
            // Copy form data to model instance
            if (formData && typeof formData === 'object') {
                Object.keys(formData).forEach(key => {
                    if (formData[key] !== undefined) {
                        modelInstance[key] = formData[key];
                    }
                });
            }
            
            return ModelValidator.validate(modelInstance);
        } catch (error) {
            console.error('❌ ModelValidator: Error creating model instance:', error);
            return new ModelState([{
                propertyName: '',
                message: `Model validation failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
                attemptedValue: formData
            }]);
        }
    }

    /**
     * Validates a specific property of a model
     * @param model The model instance
     * @param propertyName The property name to validate
     * @returns Validation errors for the property
     */
    static validateProperty(model: any, propertyName: string): ValidationError[] {
        const errors: ValidationError[] = [];
        const rules = getValidationRules(Object.getPrototypeOf(model));
        const propertyRules = rules.filter(rule => rule.propertyName === propertyName);
        
        for (const rule of propertyRules) {
            try {
                const propertyValue = model[propertyName];
                const isValid = rule.validate(propertyValue, model);
                
                if (!isValid) {
                    errors.push({
                        propertyName,
                        message: rule.message,
                        attemptedValue: propertyValue
                    });
                }
            } catch (error) {
                errors.push({
                    propertyName,
                    message: `Validation error: ${error instanceof Error ? error.message : 'Unknown error'}`,
                    attemptedValue: model[propertyName]
                });
            }
        }
        
        return errors;
    }

    /**
     * Creates a validation summary for display in views
     * @param modelState The ModelState from validation
     * @returns HTML string with validation summary
     */
    static createValidationSummary(modelState: ModelState): string {
        if (modelState.isValid) {
            return '';
        }

        const errors = modelState.errors;
        let html = '<div class="validation-summary text-danger">';
        html += '<ul>';
        
        errors.forEach(error => {
            html += `<li>${error.message}</li>`;
        });
        
        html += '</ul>';
        html += '</div>';
        
        return html;
    }

    /**
     * Gets validation attributes for form fields (for client-side validation)
     * @param modelClass The model class
     * @param propertyName The property name
     * @returns Object with validation attributes
     */
    static getValidationAttributes(modelClass: any, propertyName: string): Record<string, any> {
        const rules = getValidationRules(modelClass.prototype);
        const propertyRules = rules.filter(rule => rule.propertyName === propertyName);
        const attributes: Record<string, any> = {};
        
        propertyRules.forEach(rule => {
            switch (rule.validatorName) {
                case 'Required':
                    attributes['required'] = true;
                    attributes['data-val'] = true;
                    attributes['data-val-required'] = rule.message;
                    break;
                case 'StringLength':
                    if (rule.options?.maxLength) {
                        attributes['maxlength'] = rule.options.maxLength;
                        attributes['data-val-length'] = rule.message;
                        attributes['data-val-length-max'] = rule.options.maxLength;
                        if (rule.options.minLength > 0) {
                            attributes['data-val-length-min'] = rule.options.minLength;
                        }
                    }
                    break;
                case 'Email':
                    attributes['type'] = 'email';
                    attributes['data-val-email'] = rule.message;
                    break;
                case 'Range':
                    if (rule.options?.min !== undefined) {
                        attributes['min'] = rule.options.min;
                    }
                    if (rule.options?.max !== undefined) {
                        attributes['max'] = rule.options.max;
                    }
                    attributes['data-val-range'] = rule.message;
                    break;
                case 'RegularExpression':
                    attributes['pattern'] = rule.options?.pattern;
                    attributes['data-val-regex'] = rule.message;
                    break;
                case 'Phone':
                    attributes['type'] = 'tel';
                    attributes['data-val-phone'] = rule.message;
                    break;
                case 'Url':
                    attributes['type'] = 'url';
                    attributes['data-val-url'] = rule.message;
                    break;
            }
        });
        
        return attributes;
    }
}
