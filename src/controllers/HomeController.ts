import { Controller } from '../core/controller';
import { route } from '../core/decorators';

export class HomeController extends Controller {
  @route('home')
  @route('')  // Root route
  async execute(): Promise<void> {
    await this.View('views/home.njk', { 
        title: 'Welcome to TypeScript MVC!', 
        subtitle: 'This is the home page rendered by Nunjucks!' 
   });
  }

  @route('home/index')
  async index(): Promise<void> {
    await this.execute();
  }

  // Demo method that can be called from the template
  @route('home/demo')
  async demoAction(data?: any): Promise<void> {
    console.log('Demo action called with data:', data);
    
    // Return a view with demo data
    await this.View('views/demo.njk', {
      title: 'Demo Action Page',
      message: 'Hello from the demo action!',
      timestamp: new Date().toISOString(),
      data: data || { source: 'demo-action' }
    });
  }

  // Another demo method for form submission
  @route('home/submit')
  async submitForm(formData: any): Promise<any> {
    console.log('Form submitted with data:', formData);
    return {
      success: true,
      message: 'Form submitted successfully!',
      data: formData
    };
  }

  // Demo redirect methods
  @route('home/redirect-home')
  async redirectToHome(): Promise<any> {
    console.log('Redirecting to home...');
    return this.Redirect('/');  // Use clean URL format
  }

  @route('home/redirect-about')
  async redirectToAbout(): Promise<any> {
    console.log('Redirecting to about page...');
    return this.Redirect('/about');  // Use clean URL format
  }

  @route('home/redirect-google')
  async redirectToGoogle(): Promise<any> {
    console.log('Redirecting to Google...');
    return this.RedirectToUrl('https://www.google.com');
  }

  @route('home/redirect-action')
  async redirectToAction(): Promise<any> {
    console.log('Redirecting to demo action...');
    return this.RedirectToAction('demoAction');  // Use actual method name
  }

  // Demo method that returns JSON
  @route('home/json')
  async getJsonData(): Promise<any> {
    return this.Json({
      message: 'This is JSON data',
      timestamp: new Date().toISOString(),
      data: { users: ['John', 'Jane', 'Bob'], count: 3 }
    });
  }

  // Demo method that conditionally redirects
  @route('home/process')
  async processAndRedirect(data: any): Promise<any> {
    console.log('Processing data:', data);
    
    // Simulate some processing logic
    if (data && data.redirect === 'true') {
      return this.Redirect('/');  // Use clean URL format for home
    } else if (data && data.external === 'true') {
      return this.RedirectToUrl('https://github.com');
    } else {
      return {
        success: true,
        message: 'Processing completed successfully',
        processedData: data
      };
    }
  }
}
