import { Controller } from '../core/controller';
import { controller, action, objectAction } from '../core/decorators';
import { Injectable } from '../core/diDecorators';
import { AutoRegister } from '../core/controllerDiscovery';
import { UserService, LoggerService, EmailService } from '../services/exampleServices';
import { ModelValidator } from '../core/modelValidator';
import { UserRegistrationModel } from '../models/sampleModels';

@AutoRegister
@controller('home')
export class HomeController extends Controller {
  
  constructor(
    private userService: UserService,
    private logger: LoggerService,
    private emailService: EmailService
  ) {
    super();
    this.logger.log('HomeController created with constructor injection');
  }

  @action()    // Maps to /home (controller base route)
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
          '📱 Clean URLs with History API',
          '✅ Model validation with decorators'
        ]
   });
  }

  @action('index')
  async index(): Promise<void> {
    await this.execute();
  }

  // Demo method that can be called from the template
  @action('demo')
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
  @action('submit')
  async submitForm(formData: any): Promise<any> {
    
    // If validation passes, process the form
    return {
      success: true,
      message: 'Form submitted successfully!',
      data: formData
    };
  }

  // Demo redirect methods
  @action('redirect-home')
  async redirectToHome(): Promise<any> {
    return this.Redirect('/');  // Use clean URL format
  }

  @action('redirect-about')
  async redirectToAbout(): Promise<any> {
    return this.Redirect('/about');  // Use clean URL format
  }

  @action('redirect-google')
  async redirectToGoogle(): Promise<any> {
    return this.RedirectToUrl('https://www.google.com');
  }

  @action('redirect-action')
  async redirectToAction(): Promise<any> {
    return this.RedirectToAction('demoAction');  // Use actual method name
  }

  // Demo method that returns JSON with DI data
  @action('json')
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
  @action('process')
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

  // New method to demonstrate query parameter handling
  @action('search')
  async search(queryParams?: Record<string, string>): Promise<void> {
    // Get query parameters using the new methods
    const query = this.getQueryParam('q') || this.getQueryParam('query') || '';
    const page = parseInt(this.getQueryParam('page') || '1', 10);
    const pageSize = parseInt(this.getQueryParam('pageSize') || '10', 10);
    const category = this.getQueryParam('category') || 'all';
    
    this.logger.log(`Search performed: query="${query}", page=${page}, pageSize=${pageSize}, category=${category}`);

    // Simulate search results
    const allResults = [
      { id: 1, title: 'TypeScript Guide', category: 'programming' },
      { id: 2, title: 'MVC Architecture', category: 'architecture' },
      { id: 3, title: 'Dependency Injection', category: 'patterns' },
      { id: 4, title: 'Router Configuration', category: 'programming' },
      { id: 5, title: 'Query Parameters', category: 'programming' }
    ];

    // Filter by query and category
    let filteredResults = allResults;
    if (query) {
      filteredResults = allResults.filter(item => 
        item.title.toLowerCase().includes(query.toLowerCase())
      );
    }
    if (category !== 'all') {
      filteredResults = filteredResults.filter(item => item.category === category);
    }

    // Paginate results
    const totalResults = filteredResults.length;
    const totalPages = Math.ceil(totalResults / pageSize);
    const startIndex = (page - 1) * pageSize;
    const paginatedResults = filteredResults.slice(startIndex, startIndex + pageSize);

    await this.View('views/search.njk', {
      title: 'Search Results',
      query,
      category,
      page,
      pageSize,
      totalResults,
      totalPages,
      results: paginatedResults,
      queryParams: this.getQueryParams(),
      hasResults: paginatedResults.length > 0,
      pagination: {
        hasPrevious: page > 1,
        hasNext: page < totalPages,
        previousPage: page - 1,
        nextPage: page + 1,
        pages: Array.from({ length: totalPages }, (_, i) => i + 1)
      }
    });
  }

  // Method to demonstrate redirect with query parameters
  @action('redirect-with-params')
  async redirectWithParams(): Promise<any> {
    // Redirect to search with query parameters
    return this.Redirect('/home/search', {
      q: 'TypeScript',
      page: '1',
      category: 'programming'
    });
  }

  // Method to demonstrate building URLs with query parameters
  @action('url-builder')
  async urlBuilder(): Promise<void> {
    const searchUrl = this.buildUrl('/home/search', {
      q: 'example',
      page: '2',
      category: 'programming'
    });
    
    const actionUrl = this.buildActionUrl('search', 'home', {
      q: 'demo',
      category: 'architecture'
    });

    await this.View('views/demo.njk', {
      title: 'URL Builder Demo',
      message: 'Examples of building URLs with query parameters',
      data: {
        searchUrl,
        actionUrl,
        currentParams: this.getQueryParams()
      }
    });
  }

  // Method to demonstrate partial views with Nunjucks
  @action('partials-demo')
  async partialsDemo(): Promise<void> {
    this.logger.log('Partials demo page accessed');
    
    const allUsers = this.userService.getAllUsers();
    
    // Add some sample users for demo
    const sampleUsers = [
      ...allUsers,
      { id: 10, name: 'Alice Johnson', email: 'alice@example.com', department: 'Sales', role: 'Sales Rep' },
      { id: 11, name: 'Mike Davis', email: 'mike@example.com', phone: '+1-555-0199', department: 'Engineering', role: 'Senior Dev' },
      { id: 12, name: 'Sarah Wilson', email: 'sarah@example.com', department: 'HR', role: 'HR Manager' }
    ];

    await this.View('views/partials-demo.njk', {
      title: 'Partial Views Demo',
      allUsers: sampleUsers,
      breadcrumbs: [
        { title: 'Framework', url: '/home' },
        { title: 'Demos', url: '/home/demo' },
        { title: 'Partial Views' }
      ]
    });
  }

  // Method to demonstrate advanced Nunjucks features
  @action('advanced-demo')
  async advancedDemo(): Promise<void> {
    this.logger.log('Advanced Nunjucks demo page accessed');
    
    const allUsers = this.userService.getAllUsers();
    const currentUser = this.userService.getCurrentUser();
    
    // Enhanced sample data for advanced demo
    const users = [
      { id: 1, name: 'John Admin', email: 'john@example.com', department: 'IT', role: 'admin', lastLogin: '2024-01-15' },
      { id: 2, name: 'Jane Smith', email: 'jane@example.com', department: 'Sales', role: 'user', lastLogin: '2024-01-14' },
      { id: 3, name: 'Bob Wilson', email: 'bob@example.com', department: 'Engineering', role: 'user', lastLogin: '2024-01-13' },
      { id: 4, name: 'Alice Johnson', email: 'alice@example.com', department: 'Sales', role: 'user', lastLogin: '2024-01-12' },
      { id: 5, name: 'Mike Davis', email: 'mike@example.com', department: 'Engineering', role: 'admin', lastLogin: '2024-01-11' },
      { id: 6, name: 'Sarah Wilson', email: 'sarah@example.com', department: 'HR', role: 'user', lastLogin: '2024-01-10' }
    ];

    const notifications = [
      { type: 'success', title: 'Welcome!', message: 'You have successfully loaded the advanced demo page.', dismissible: true },
      { type: 'info', message: 'This page demonstrates advanced Nunjucks templating features.' }
    ];

    const tableData = {
      headers: ['ID', 'Name', 'Department', 'Role', 'Last Login'],
      rows: users.map(user => [user.id, user.name, user.department, user.role, user.lastLogin]),
      pagination: {
        currentPage: 1,
        totalPages: 1,
        totalItems: users.length,
        itemsPerPage: 10,
        baseUrl: '/home/advanced-demo'
      }
    };

    await this.View('views/advanced-demo.njk', {
      title: 'Advanced Nunjucks Demo',
      timestamp: new Date().toISOString(),
      users,
      currentUser: currentUser || users[0], // Use first user as demo current user
      notifications,
      pendingTasks: 3,
      tableData,
      queryParams: this.getQueryParams()
    });
  }

  // ========== OBJECT-ONLY ACTIONS ==========
  // These actions can only return objects/JSON and cannot render views or redirect

  @objectAction('api/users')  // Maps to /home/api/users
  async getUsersApi(): Promise<any> {
    this.logger.log('Users API endpoint called');
    
    const users = this.userService.getAllUsers();
    const currentUser = this.userService.getCurrentUser();
    
    // Object actions must return objects - no views, no redirects
    return {
      success: true,
      timestamp: new Date().toISOString(),
      data: {
        currentUser,
        users,
        totalCount: users.length
      },
      metadata: {
        endpoint: 'getUsersApi',
        version: '1.0',
        actionType: 'object-only'
      }
    };
  }

  @objectAction('api/stats', 'GET')  // Maps to /home/api/stats
  async getStatsApi(): Promise<any> {
    this.logger.log('Stats API endpoint called');
    
    const users = this.userService.getAllUsers();
    const logs = this.logger.getLogs();
    
    return {
      success: true,
      timestamp: new Date().toISOString(),
      statistics: {
        totalUsers: users.length,
        totalLogs: logs.length,
        lastActivity: logs.length > 0 ? logs[logs.length - 1] : null,
        averageLogLevel: 'INFO',
        systemUptime: Date.now() - (new Date().setHours(0, 0, 0, 0))
      },
      meta: {
        generatedBy: 'HomeController.getStatsApi',
        cacheExpiry: 300 // 5 minutes
      }
    };
  }

  @objectAction('api/config', 'GET')  // Maps to /home/api/config
  async getConfigApi(): Promise<any> {
    // Object actions can return simple objects without Json() wrapper
    return {
      success: true,
      config: {
        appName: 'ControllerTS MVC Framework',
        version: '1.0.0',
        features: [
          'Dependency Injection',
          'TypeScript Support',
          'Clean URLs',
          'Object-Only Actions',
          'Nunjucks Templating'
        ],
        environment: 'development',
        apiVersion: 'v1'
      },
      timestamp: new Date().toISOString()
    };
  }

  @objectAction('api/search', 'POST')  // Maps to /home/api/search
  async searchApi(queryParams?: Record<string, string>): Promise<any> {
    const query = this.getQueryParam('q') || '';
    const category = this.getQueryParam('category') || 'all';
    
    // Simulate search results
    const allItems = [
      { id: 1, title: 'TypeScript Guide', category: 'programming', score: 0.95 },
      { id: 2, title: 'MVC Architecture', category: 'architecture', score: 0.88 },
      { id: 3, title: 'Dependency Injection', category: 'patterns', score: 0.92 },
      { id: 4, title: 'Object Actions', category: 'features', score: 0.85 }
    ];

    const filteredResults = allItems.filter(item => {
      const matchesQuery = !query || item.title.toLowerCase().includes(query.toLowerCase());
      const matchesCategory = category === 'all' || item.category === category;
      return matchesQuery && matchesCategory;
    });

    return {
      success: true,
      query: {
        searchTerm: query,
        category,
        timestamp: new Date().toISOString()
      },
      results: filteredResults,
      metadata: {
        totalFound: filteredResults.length,
        searchDuration: Math.random() * 100, // Simulated ms
        categories: ['programming', 'architecture', 'patterns', 'features']
      }
    };
  }

  // This would cause an error if uncommented - object actions cannot redirect
  // @objectAction('api/invalid-redirect')
  // async invalidRedirectApi(): Promise<any> {
  //   return this.Redirect('/home'); // ❌ This will throw an error!
  // }

  // This would cause an error if uncommented - object actions cannot render views
  // @objectAction('api/invalid-view')
  // async invalidViewApi(): Promise<void> {
  //   await this.View('views/home.njk', {}); // ❌ This will throw an error!
  // }

  // Demo page for HtmlHelper with object actions
  @action('htmlhelper-demo')
  async htmlHelperDemo(): Promise<void> {
    this.logger.log('HtmlHelper demo page accessed');
    
    await this.View('views/htmlhelper-demo.njk', {
      title: 'HtmlHelper with Object Actions Demo',
      subtitle: 'Demonstrating the updated HtmlHelper with support for @objectAction decorators'
    });
  }

  // Model validation demo page
  @action('validation-demo')
  async validationDemo(): Promise<void> {
    this.logger.log('Model validation demo page accessed');
    
    // Import models for the demo
    const { UserRegistrationModel, ContactFormModel } = await import('../models/sampleModels');
    
    await this.View('views/validation-demo.njk', {
      title: 'Model Validation Demo',
      subtitle: 'Demonstrating ASP.NET Core style model validation with decorators',
      userModel: new UserRegistrationModel(),
      contactModel: new ContactFormModel()
    });
  }

  // Handle user registration form submission with automatic model binding
  @objectAction('registerUser', 'POST')
  async registerUser(userModel: UserRegistrationModel): Promise<any> {
    if (!this.ModelState.IsValid) {
      
      return {
        success: false,
        message: 'Registration validation failed',
        errors: this.ModelState.errors.map((error: any) => ({
          property: error.propertyName,
          message: error.message
        })),
        formData: userModel
      };
    }
    
    // Add custom business logic validation
    if (userModel.username === 'admin') {
      return {
        success: false,
        message: 'Registration validation failed',
        errors: [{ property: 'username', message: 'Username "admin" is reserved and cannot be used' }],
        formData: userModel
      };
    }
    
    return {
      success: true,
      message: 'Registration successful!',
      userData: {
        firstName: userModel.firstName,
        lastName: userModel.lastName,
        username: userModel.username,
        email: userModel.email,
        department: userModel.department
      }
    };
  }

  // Handle contact form submission
  @action('contact', 'POST')
  async submitContact(formData: any): Promise<any> {
    const { ContactFormModel } = await import('../models/sampleModels');
    
    // Create and validate the model (just like .NET MVC)
    const contactModel = this.createModel(ContactFormModel, formData);
    
    // Check ModelState.IsValid (just like .NET MVC)
    if (!this.ModelState.IsValid) {
      
      return {
        success: false,
        message: 'Please correct the errors in the form',
        errors: this.ModelState.errors.map(error => ({
          property: error.propertyName,
          message: error.message
        })),
        formData: formData
      };
    }
    
    // Add custom validation for phone number if contact method is phone
    if (contactModel.contactMethod === 'phone' && !contactModel.phone) {
      this.addModelError('phone', 'Phone number is required when contact method is phone');
      
      return {
        success: false,
        message: 'Please correct the errors in the form',
        errors: this.ModelState.errors.map(error => ({
          property: error.propertyName,
          message: error.message
        })),
        formData: formData
      };
    }
    
    // Simulate sending email (would integrate with EmailService in real app)
    // Note: In a real app, you'd have a proper contact email service
    this.logger.log(`Contact form submitted by ${contactModel.name} (${contactModel.email}): ${contactModel.subject}`);
    
    return {
      success: true,
      message: 'Thank you! Your message has been sent successfully.',
      data: {
        confirmationNumber: `CF-${Date.now()}`,
        submittedAt: new Date().toISOString()
      }
    };
  }
}
