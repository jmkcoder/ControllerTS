import 'reflect-metadata'; // Required for dependency injection
import { Router } from './core/router';
import { ViewEngine } from './core/viewEngine';
import { ControllerDiscovery } from './core/controllerDiscovery';
import { HtmlHelper } from './core/htmlHelper';
import { Controller } from './core/controller';
import { serviceContainer } from './core/serviceContainer';
import { LoggerService, UserService, EmailService } from './services/exampleServices';
import { ProductService } from './services/productService';
import { ApiService } from './services/apiService';
import { App } from './core/app';
import { LoggingMiddleware, ErrorHandlingMiddleware, DIScopeMiddleware, RequestContextMiddleware } from './core/requestPipeline';
import { AuthenticationMiddleware, PerformanceMiddleware, CorsMiddleware, ValidationMiddleware, CachingMiddleware, SecurityMiddleware } from './core/customMiddleware';
import { AutoControllerLoader } from './core/autoControllerLoader';
import { processControllerRoutes } from './core/decorators';
import { registerActionParameters } from './core/parameterBinding';
import { UserRegistrationModel, ContactFormModel } from './models/sampleModels';
import { configureErrorPages } from './core/errorConfig';
import { ConfigurationManager, configManager } from './core/configurationManager';
import { EnvironmentManager } from './core/environmentManager';
import './style.css';

async function initializeApplication() {
    // Initialize configuration manager first
    // Option 1: Use automatic environment detection (default)
    // await configManager.initialize();
    
    // Option 2: Specify custom .env file
    // await configManager.initialize('.env.custom');
    
    // Option 3: Use environment variable to override
    const customEnvFile = (window as any).__CUSTOM_ENV_FILE__ || null;
    await configManager.initialize(customEnvFile);
    
    // IMPORTANT: Register services using proper DI registration (no more factories needed!)
    // Register singleton services (shared across the entire application)
    serviceContainer.addSingleton(LoggerService);
    serviceContainer.addSingleton(ViewEngine);
    serviceContainer.addSingleton(ConfigurationManager);

    // Register scoped services (one instance per request)
    serviceContainer.addScoped(UserService);
    serviceContainer.addScoped(ProductService);
    serviceContainer.addScoped(ApiService);

    // Register transient services (new instance every time)
    serviceContainer.addTransient(EmailService);

    await AutoControllerLoader.loadAllControllers();

    // Controllers are now auto-loaded after service registration
    // Initialize ControllerDiscovery and register all controllers
    ControllerDiscovery.registerAllControllers();
    
    // Process controller routes from @controller/@action decorators
    processControllerRoutes();

    // WORKAROUND: Manually register parameter types since webpack minification affects reflection metadata
    // Register strongly typed parameters for actions that need automatic model binding
    registerActionParameters('HomeController', 'registerUser', [UserRegistrationModel]);
    registerActionParameters('HomeController', 'submitContact', [ContactFormModel]);

    // Configure error pages (no need to touch core router!)
    // Use configuration manager to determine error page setup
    const errorConfig = configManager.get('errors.showStackTrace', true) ? {
        404: {
            template: 'views/errors/404.njk'
        },
        500: {
            template: 'views/errors/500.njk' 
        },
        403: {
            template: 'views/errors/403.njk'
        }
    } : {
        404: {
            template: 'views/errors/404.njk',
            data: { environment: 'production' }
        },
        500: {
            controller: 'Error',
            action: 'serverError'
        },
        403: {
            template: 'views/errors/403.njk',
            data: { environment: 'production' }
        }
    };
    
    configureErrorPages(errorConfig);

    

    // Initialize HtmlHelper for MVC attributes immediately
    HtmlHelper.initializeMvcAttributes();

    // Also make it available globally for template access
    (window as any).Html = HtmlHelper;

    const router = new Router();

    // Configure default route (instead of using @route('') attribute)
    router.setDefaultRoute('home', 'execute');

    // Set router instance for controller redirects
    Controller.setRouter(router);

    // Register discovered controllers with the router as well
    const discoveredControllers = ControllerDiscovery.getControllers();
    for (const [name, controllerClass] of discoveredControllers) {
        // Register with router if it has these methods
        if (router.registerController) {
            router.registerController(name, controllerClass);
        }
        if (router.addRoute) {
            router.addRoute(name.toLowerCase(), controllerClass);
        }
    }

    // Create the application
    const app = new App(serviceContainer, router);

    // Configure middleware using the clean API (order matters!)
    app
        .use(new ErrorHandlingMiddleware())      // 1. Handle errors first
        .use(new CorsMiddleware())              // 2. CORS headers  
        .use(new SecurityMiddleware())          // 3. Security headers
        .use(new PerformanceMiddleware())       // 4. Performance monitoring (wraps request)
        .use(new AuthenticationMiddleware())    // 5. Authentication check
        .use(new ValidationMiddleware())        // 6. Request validation
        .use(new LoggingMiddleware())           // 8. Log requests
        .use(new DIScopeMiddleware())           // 9. Setup DI scoping
        .use(new RequestContextMiddleware());   // 10. Add request context to DI

    // Start the application
    app.start();

    // Make services available globally for debugging
    (window as any).serviceContainer = serviceContainer;
    (window as any).app = app;
    (window as any).router = router;
    (window as any).configManager = configManager;
    
    // Add environment switcher in development mode
    if (configManager.get('debug', false)) {
        document.addEventListener('DOMContentLoaded', () => {
            const switcher = EnvironmentManager.createEnvironmentSwitcher();
            document.body.appendChild(switcher);
            
            // Log environment info
            console.log('🔧 Development mode - Environment utilities available:');
            console.log('  switchEnv("env-file")  - Switch environment');
            console.log('  showEnvInfo()          - Show current environment info');
            console.log('  createEnvSwitcher()    - Create environment switcher UI');
        });
    }
    
    // Import and make ControllerManager available globally
    const { ControllerManager } = await import('./core/controllerManager');
    (window as any).ControllerManager = ControllerManager;
}

// Initialize the application
initializeApplication().catch(error => {
    console.error('❌ Failed to initialize application:', error);
});
