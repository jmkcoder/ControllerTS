import { Required, StringLength, Email } from '../../../core/validationDecorators';
import { ModelValidator } from '../../../core/modelValidator';

export interface ContactForm {
  name: string;
  email: string;
  subject: string;
  message: string;
}

export class ContactFormModel {
  @Required('Name is required')
  @StringLength(50, 2, 'Name must be between 2 and 50 characters')
  name: string = '';

  @Required('Email address is required')
  @Email('Please enter a valid email address')
  email: string = '';

  @Required('Subject is required')
  @StringLength(100, 3, 'Subject must be between 3 and 100 characters')
  subject: string = '';

  @Required('Message is required')
  @StringLength(1000, 10, 'Message must be between 10 and 1000 characters')
  message: string = '';

  constructor(data?: Partial<ContactForm>) {
    if (data) {
      this.name = data.name || '';
      this.email = data.email || '';
      this.subject = data.subject || '';
      this.message = data.message || '';
    }
  }
}

export interface ContactInfo {
  address: string;
  phone: string;
  email: string;
  hours: string;
}

export interface TeamMember {
  name: string;
  role: string;
  email: string;
  bio: string;
}

export class ContactModel {
  static getContactInfo(): ContactInfo {
    return {
      address: "123 Tech Street, Innovation City, IC 12345",
      phone: "+1 (555) 123-4567",
      email: "info@controllerts.dev",
      hours: "Monday - Friday: 9:00 AM - 6:00 PM PST"
    };
  }

  static getTeamMembers(): TeamMember[] {
    return [
      {
        name: "John Smith",
        role: "Lead Developer",
        email: "john@controllerts.dev",
        bio: "Full-stack developer with 8+ years of experience in TypeScript and modern web frameworks."
      },
      {
        name: "Sarah Johnson",
        role: "Frontend Architect",
        email: "sarah@controllerts.dev",
        bio: "UI/UX specialist focused on creating beautiful and accessible user interfaces."
      },
      {
        name: "Mike Chen",
        role: "Backend Engineer",
        email: "mike@controllerts.dev",
        bio: "Backend systems expert with deep knowledge of scalable architecture patterns."
      }
    ];
  }

  static validateContactForm(form: Partial<ContactForm>): { isValid: boolean; errors: string[] } {
    // Use decorator-based validation instead of manual validation
    const contactModel = new ContactFormModel(form);
    const modelState = ModelValidator.validate(contactModel);
    
    return {
      isValid: modelState.isValid,
      errors: modelState.errors.map(error => error.message)
    };
  }

  static submitContactForm(form: ContactForm): { success: boolean; message: string } {
    // In a real application, this would save to database or send email
    console.log('Contact form submitted:', form);
    
    return {
      success: true,
      message: "Thank you for your message! We'll get back to you within 24 hours."
    };
  }
}
