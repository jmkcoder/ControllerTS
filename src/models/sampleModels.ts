import { Model } from '../core/model';
import { Required, StringLength, Email, Range, Compare, Phone, RegularExpression, CustomValidation } from '../core/validationDecorators';

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

    @Required('Phone number is required')
    @Phone('Please enter a valid phone number')
    phone: string = '';

    @Required('Age is required')
    @Range(18, 120, 'Age must be between 18 and 120')
    age: number = 0;

    @Required('Password is required')
    @StringLength(100, 8, 'Password must be at least 8 characters long')
    @RegularExpression(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/, 
        'Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character')
    password: string = '';

    @Required('Please confirm your password')
    @Compare('password', 'Password confirmation must match password')
    confirmPassword: string = '';

    @CustomValidation(
        (value: string, model: UserRegistrationModel) => {
            // Custom validation: username must not be the same as email local part
            if (!value || !model.email) return true;
            const emailLocalPart = model.email.split('@')[0];
            return value.toLowerCase() !== emailLocalPart.toLowerCase();
        },
        'Username cannot be the same as your email address'
    )
    @Required('Username is required')
    @StringLength(30, 3, 'Username must be between 3 and 30 characters')
    @RegularExpression(/^[a-zA-Z0-9_-]+$/, 'Username can only contain letters, numbers, underscores, and hyphens')
    username: string = '';

    department?: string = '';
    
    acceptTerms: boolean = false;

    constructor() {
        super();
    }

    // You can add custom methods to your models
    getFullName(): string {
        return `${this.firstName} ${this.lastName}`.trim();
    }

    getDisplayEmail(): string {
        return this.email || 'No email provided';
    }
}

export class ContactFormModel extends Model {
    @Required('Name is required')
    @StringLength(100, 2, 'Name must be between 2 and 100 characters')
    name: string = '';

    @Required('Email is required')
    @Email('Please enter a valid email address')
    email: string = '';

    @Required('Subject is required')
    @StringLength(200, 5, 'Subject must be between 5 and 200 characters')
    subject: string = '';

    @Required('Message is required')
    @StringLength(2000, 10, 'Message must be between 10 and 2000 characters')
    message: string = '';

    contactMethod: 'email' | 'phone' = 'email';

    phone?: string = '';

    constructor() {
        super();
    }
}

export class ProductModel extends Model {
    @Required('Product name is required')
    @StringLength(100, 2, 'Product name must be between 2 and 100 characters')
    name: string = '';

    @StringLength(500, 0, 'Description cannot exceed 500 characters')
    description: string = '';

    @Required('Price is required')
    @Range(0.01, 999999.99, 'Price must be between $0.01 and $999,999.99')
    price: number = 0;

    @Required('Category is required')
    category: string = '';

    @Range(0, 999999, 'Stock quantity must be between 0 and 999,999')
    stockQuantity: number = 0;

    isActive: boolean = true;

    constructor() {
        super();
    }

    getFormattedPrice(): string {
        return `$${this.price.toFixed(2)}`;
    }
}
