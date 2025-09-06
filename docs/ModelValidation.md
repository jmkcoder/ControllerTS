# Model Validation System

The MVC framework includes a comprehensive model validation system inspired by ASP.NET Core's Data Annotations. This system provides declarative validation using TypeScript decorators and integrates seamlessly with the controller and view systems.

## Overview

The validation system consists of several key components:

1. **Validation Decorators** - Define validation rules on model properties
2. **ModelValidator** - Validates models and provides validation results
3. **ModelState** - Stores validation results (similar to ASP.NET Core's ModelState)
4. **Controller Integration** - Built-in methods for validation in controllers
5. **View Integration** - Automatic ModelState and validation helpers in views

## Available Validation Decorators

### @Required(message?: string)
Validates that a value is provided and not empty.

```typescript
@Required('First name is required')
firstName: string = '';
```

### @StringLength(maxLength: number, minLength?: number, message?: string)
Validates string length constraints.

```typescript
@StringLength(50, 2, 'Name must be between 2 and 50 characters')
name: string = '';
```

### @Email(message?: string)
Validates email address format.

```typescript
@Email('Please enter a valid email address')
email: string = '';
```

### @Range(min: number, max: number, message?: string)
Validates numeric range.

```typescript
@Range(18, 120, 'Age must be between 18 and 120')
age: number = 0;
```

### @Compare(otherProperty: string, message?: string)
Compares with another property (useful for password confirmation).

```typescript
@Compare('password', 'Password confirmation must match password')
confirmPassword: string = '';
```

### @RegularExpression(pattern: string | RegExp, message?: string)
Validates against a regular expression pattern.

```typescript
@RegularExpression(/^[a-zA-Z0-9_-]+$/, 'Username can only contain letters, numbers, underscores, and hyphens')
username: string = '';
```

### @Phone(message?: string)
Validates phone number format.

```typescript
@Phone('Please enter a valid phone number')
phone: string = '';
```

### @Url(message?: string)
Validates URL format.

```typescript
@Url('Please enter a valid URL')
website: string = '';
```

### @CreditCard(message?: string)
Validates credit card number using the Luhn algorithm.

```typescript
@CreditCard('Please enter a valid credit card number')
cardNumber: string = '';
```

### @CustomValidation(validatorFunction, message)
Custom validation logic.

```typescript
@CustomValidation(
    (value: string, model: MyModel) => {
        // Custom validation logic
        return value !== model.email.split('@')[0];
    },
    'Username cannot be the same as email local part'
)
username: string = '';
```

## Creating Model Classes

Models should extend the base `Model` class and use validation decorators:

```typescript
import { Model } from '../core/model';
import { Required, StringLength, Email, Range, Compare } from '../core/validationDecorators';

export class UserRegistrationModel extends Model {
    @Required('First name is required')
    @StringLength(50, 2, 'First name must be between 2 and 50 characters')
    firstName: string = '';

    @Required('Last name is required')
    @StringLength(50, 2, 'Last name must be between 2 and 50 characters') 
    lastName: string = '';

    @Required('Email address is required')
    @Email('Please enter a valid email address')
    email: string = '';

    @Required('Age is required')
    @Range(18, 120, 'Age must be between 18 and 120')
    age: number = 0;

    @Required('Password is required')
    @StringLength(100, 8, 'Password must be at least 8 characters long')
    password: string = '';

    @Required('Please confirm your password')
    @Compare('password', 'Password confirmation must match password')
    confirmPassword: string = '';

    constructor() {
        super();
    }

    // You can add custom methods to your models
    getFullName(): string {
        return `${this.firstName} ${this.lastName}`.trim();
    }
}
```

## Controller Integration

Controllers have built-in validation support through the `ModelState` property and validation methods:

### Available Controller Methods

```typescript
// Validate a model instance
protected tryValidateModel(model: any): boolean

// Validate form data against a model class
protected tryValidateFormData(modelClass: new () => any, formData: any): boolean

// Add custom validation errors
protected addModelError(propertyName: string, errorMessage: string, attemptedValue?: any): void

// Clear validation state
protected clearModelState(): void

// Access validation state
protected get ModelState(): ModelState
```

### Example Controller Action

```typescript
@action('register')
async registerUser(formData: any): Promise<any> {
    const { UserRegistrationModel } = await import('../models/userModels');
    
    // Validate the registration data
    if (!this.tryValidateFormData(UserRegistrationModel, formData)) {
        console.log('❌ Registration validation failed:', this.ModelState.errors);
        
        // Return to registration form with validation errors
        await this.View('views/register.njk', {
            title: 'Registration Failed',
            subtitle: 'Please correct the errors below',
            userModel: formData, // Pass back the submitted data
            registrationErrors: this.ModelState.getAllErrors()
        });
        return;
    }
    
    // Add custom business logic validation
    if (formData.username === 'admin') {
        this.addModelError('username', 'Username "admin" is reserved and cannot be used');
        
        await this.View('views/register.njk', {
            title: 'Registration Failed',
            userModel: formData,
            registrationErrors: this.ModelState.getAllErrors()
        });
        return;
    }
    
    // Registration successful
    await this.View('views/register-success.njk', {
        title: 'Registration Successful!',
        userData: formData
    });
}
```

## ModelState API

The `ModelState` object provides access to validation results:

```typescript
interface ModelState {
    // Check if the model is valid
    isValid: boolean;
    
    // Get all validation errors
    errors: ValidationError[];
    
    // Get error message for a specific property
    getError(propertyName: string): string | undefined;
    
    // Check if a property has errors
    hasError(propertyName: string): boolean;
    
    // Get all errors for a specific property
    getErrors(propertyName: string): ValidationError[];
    
    // Get all errors organized by property
    getAllErrors(): Record<string, string[]>;
    
    // Add custom errors
    addError(propertyName: string, message: string, attemptedValue?: any): void;
    
    // Clear validation state
    clear(): void;
    
    // Clear errors for a specific property
    clearProperty(propertyName: string): void;
}
```

## View Integration

Views automatically receive validation-related data:

### Available in Templates

- `ModelState` - The complete ModelState object
- `ValidationSummary` - HTML validation summary
- `ValidationAttributes` - Helper function for form field attributes

### Using in Nunjucks Templates

```nunjucks
<!-- Display validation summary -->
{% if ValidationSummary %}
    {{ ValidationSummary | safe }}
{% endif %}

<!-- Display field-specific errors -->
{% if ModelState.hasError('firstName') %}
    <div class="text-danger">{{ ModelState.getError('firstName') }}</div>
{% endif %}

<!-- Show all errors for a property -->
{% if registrationErrors.firstName %}
    <div class="invalid-feedback">{{ registrationErrors.firstName[0] }}</div>
{% endif %}

<!-- Form field with validation state -->
<input type="text" 
       class="form-control {% if registrationErrors.firstName %}is-invalid{% endif %}" 
       name="firstName" 
       value="{{ userModel.firstName or '' }}" 
       required maxlength="50">
```

## AJAX Validation

For AJAX form submissions, validation errors are returned as JSON:

```typescript
// Controller action for AJAX
@action('contact')
async submitContact(formData: any): Promise<any> {
    const { ContactFormModel } = await import('../models/contactModels');
    
    if (!this.tryValidateFormData(ContactFormModel, formData)) {
        return {
            success: false,
            message: 'Please correct the errors in the form',
            errors: this.ModelState.getAllErrors(),
            formData: formData
        };
    }
    
    return {
        success: true,
        message: 'Thank you! Your message has been sent successfully.'
    };
}
```

```javascript
// Client-side AJAX handling
const response = await fetch('/home/contact', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(formData)
});

const result = await response.json();

if (!result.success && result.errors) {
    // Display validation errors
    for (const [field, errors] of Object.entries(result.errors)) {
        errors.forEach(error => {
            console.log(`${field}: ${error}`);
        });
    }
}
```

## Client-Side Validation Attributes

The system can generate HTML5 validation attributes for client-side validation:

```typescript
// Get validation attributes for a property
const attributes = ModelValidator.getValidationAttributes(UserRegistrationModel, 'firstName');
// Returns: { required: true, maxlength: 50, 'data-val': true, 'data-val-required': 'First name is required' }
```

## Best Practices

1. **Always extend Model**: Have your model classes extend the base `Model` class
2. **Use specific messages**: Provide clear, user-friendly error messages
3. **Combine validation**: Use multiple decorators on the same property when needed
4. **Custom validation**: Use `@CustomValidation` for complex business rules
5. **Business logic validation**: Add custom errors in controllers for business logic validation
6. **Client-side integration**: Use generated validation attributes for HTML5 validation
7. **Error handling**: Always check `ModelState.isValid` before processing valid data

## Example Usage

See the validation demo at `/home/validation-demo` for a complete working example with:
- User registration form with comprehensive validation
- Contact form with AJAX submission
- Custom validation rules and error handling
- Integration with Bootstrap for UI feedback

The validation system provides a robust, type-safe way to handle form validation in your MVC application, closely mirroring the experience of ASP.NET Core while leveraging TypeScript's type system.
