import { Controller } from '../../../core/controller';
import { controller, action } from '../../../core/decorators';
import { ContactModel, ContactForm, ContactFormModel } from '../models/ContactModel';
import { ModelValidator } from '../../../core/modelValidator';

@controller('contact')
export class ContactController extends Controller {

  @action('') // Maps to /contact
  async index(): Promise<void> {
    const contactInfo = ContactModel.getContactInfo();
    const teamMembers = ContactModel.getTeamMembers();
    
    await this.View('features/contact/views/index', {
      title: 'Contact Us',
      contactInfo: contactInfo,
      teamMembers: teamMembers
    });
  }

  @action('submit', 'POST') // Maps to POST /contact/submit
  async submit(contactForm: ContactFormModel): Promise<void> {
      if (!this.modelState.isValid) {
        await this.View('features/contact/views/index', {
          title: 'Contact Us',
          contactInfo: ContactModel.getContactInfo(),
          teamMembers: ContactModel.getTeamMembers(),
          errors: this.modelState.errors.map(error => error.message),
          formData: contactForm,
          modelState: this.modelState // Pass the full ModelState for per-field error display
        });
        return;
      }

      const result = ContactModel.submitContactForm(contactForm as ContactForm);
      
      await this.View('features/contact/views/success', {
        title: 'Message Sent',
        message: result.message
      });
  }

  @action('team') // Maps to /contact/team
  async team(): Promise<void> {
    const teamMembers = ContactModel.getTeamMembers();
    
    await this.View('features/contact/views/team', {
      title: 'Our Team',
      teamMembers: teamMembers
    });
  }

  @action('api/validate', 'POST')
  async validateForm(): Promise<any> {
    try {
      const formData = this.getFormData();
      const contactForm: Partial<ContactForm> = {
        name: formData.get('name')?.toString(),
        email: formData.get('email')?.toString(),
        subject: formData.get('subject')?.toString(),
        message: formData.get('message')?.toString()
      };

      // Use decorator-based validation
      const contactModel = new ContactFormModel(contactForm);
      const modelState = ModelValidator.validate(contactModel);
      
      return this.Json({
        success: modelState.isValid,
        errors: modelState.errors.map(error => error.message),
        fieldErrors: modelState.getAllErrors()
      });

    } catch (error) {
      return this.Json({
        success: false,
        errors: ['Validation failed']
      });
    }
  }
}
