import { Controller } from '../core/controller';
import { controller, action, route } from '../core/decorators';
import { Injectable } from '../core/diDecorators';
import { AutoRegister } from '../core/controllerDiscovery';
import { UserService, LoggerService, EmailService } from '../services/exampleServices';

@AutoRegister
@Injectable
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
  @route('')   // Maps to / (root route) - backward compatibility
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
}
