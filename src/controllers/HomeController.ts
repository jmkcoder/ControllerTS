import { Controller } from '../core/controller';
import { route } from '../core/decorators';
import { Injectable } from '../core/diDecorators';
import { AutoRegister } from '../core/controllerDiscovery';
import { UserService, LoggerService, EmailService } from '../services/exampleServices';

@AutoRegister
@Injectable
export class HomeController extends Controller {
  private userService: UserService;
  private logger: LoggerService;
  private emailService: EmailService;
  
  constructor() {
    super();
    
    // Get services from DI container or create fallback instances
    try {
      this.userService = this.getService(UserService);
      this.logger = this.getService(LoggerService);
      this.emailService = this.getService(EmailService);
      this.logger.log('HomeController created with injected dependencies');
    } catch (error) {
      // Fallback if DI services aren't available yet
      console.warn('DI services not available, creating fallback instances');
      this.logger = new LoggerService();
      this.userService = new UserService(this.logger);
      this.emailService = new EmailService(this.logger);
      this.logger.log('HomeController created with fallback dependencies');
    }
  }
  @route('home')
  @route('')  // Root route
  async execute(): Promise<void> {
    this.logger.log('Home page accessed');
    
    const currentUser = this.userService.getCurrentUser();
    const allUsers = this.userService.getAllUsers();
    
    await this.View('views/home.njk', { 
        title: 'Welcome to ControllerTS with DI!', 
        subtitle: 'TypeScript MVC Framework with Dependency Injection',
        currentUser,
        userCount: allUsers.length,
        features: [
          '🎯 @route decorators for clean routing',
          '💉 Dependency injection like ASP.NET Core', 
          '🏗️ MVC architecture pattern',
          '📝 Nunjucks templating',
          '🚀 TypeScript support',
          '📱 Clean URLs with History API'
        ]
   });
  }

  @route('home/index')
  async index(): Promise<void> {
    await this.execute();
  }

  // Demo method that can be called from the template
  @route('home/demo')
  async demoAction(data?: any): Promise<void> {
    this.logger.log(`Demo action called with data: ${JSON.stringify(data)}`);
    
    const user = this.userService.getCurrentUser();
    if (user) {
      // Demonstrate transient service - new instance each time
      const emailSent = this.emailService.sendWelcomeEmail(user);
      this.logger.log(`Welcome email sent: ${emailSent}`);
    }

    const users = this.userService.getAllUsers();
    const logs = this.logger.getLogs();
    
    // Return a view with demo data including DI information
    await this.View('views/demo.njk', {
      title: 'Demo Action Page with DI',
      message: 'Hello from the demo action with dependency injection!',
      timestamp: new Date().toISOString(),
      currentUser: user,
      allUsers: users,
      recentLogs: logs.slice(-5), // Show last 5 log entries
      diInfo: {
        userService: 'Scoped - One instance per request',
        loggerService: 'Singleton - Same instance across app',
        emailService: 'Transient - New instance each time'
      },
      data: data || { source: 'demo-action' }
    });
  }

  // Another demo method for form submission
  @route('home/submit')
  async submitForm(formData: any): Promise<any> {
    return {
      success: true,
      message: 'Form submitted successfully!',
      data: formData
    };
  }

  // Demo redirect methods
  @route('home/redirect-home')
  async redirectToHome(): Promise<any> {
    return this.Redirect('/');  // Use clean URL format
  }

  @route('home/redirect-about')
  async redirectToAbout(): Promise<any> {
    return this.Redirect('/about');  // Use clean URL format
  }

  @route('home/redirect-google')
  async redirectToGoogle(): Promise<any> {
    return this.RedirectToUrl('https://www.google.com');
  }

  @route('home/redirect-action')
  async redirectToAction(): Promise<any> {
    return this.RedirectToAction('demoAction');  // Use actual method name
  }

  // Demo method that returns JSON with DI data
  @route('home/json')
  async getJsonData(): Promise<any> {
    this.logger.log('JSON API endpoint called');
    
    const users = this.userService.getAllUsers();
    const currentUser = this.userService.getCurrentUser();
    
    return this.Json({
      message: 'This is JSON data with dependency injection',
      timestamp: new Date().toISOString(),
      currentUser,
      data: { users, count: users.length },
      serviceInfo: {
        userService: 'Scoped lifetime',
        loggerService: 'Singleton lifetime',
        emailService: 'Transient lifetime'
      }
    });
  }

  // Demo method that conditionally redirects
  @route('home/process')
  async processAndRedirect(data: any): Promise<any> {
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
