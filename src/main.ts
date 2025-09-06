import 'reflect-metadata'; // Required for dependency injection
import { Router } from './core/router';
import { ViewEngine } from './core/viewEngine';
import { ControllerDiscovery } from './core/controllerDiscovery';
import { HtmlHelper } from './core/htmlHelper';
import { Controller } from './core/controller';
import { serviceContainer } from './core/serviceContainer';
import { LoggerService, UserService, EmailService } from './services/exampleServices';
import { ProductService } from './services/productService';
import { App } from './core/app';
import { LoggingMiddleware, ErrorHandlingMiddleware, DIScopeMiddleware, RequestContextMiddleware } from './core/requestPipeline';
import { AuthenticationMiddleware, PerformanceMiddleware, CorsMiddleware, ValidationMiddleware, CachingMiddleware, SecurityMiddleware } from './core/customMiddleware';
import { AutoControllerLoader } from './core/autoControllerLoader';
import { processControllerRoutes } from './core/decorators';
import './style.css';

async function initializeApplication() {
    // IMPORTANT: Register services using proper DI registration (no more factories needed!)
    // Register singleton services (shared across the entire application)
    serviceContainer.addSingleton(LoggerService);
    serviceContainer.addSingleton(ViewEngine);

    // Register scoped services (one instance per request)
    serviceContainer.addScoped(UserService);
    serviceContainer.addScoped(ProductService);

    // Register transient services (new instance every time)
    serviceContainer.addTransient(EmailService);

    await AutoControllerLoader.loadAllControllers();

    // Controllers are now auto-loaded after service registration
    // Initialize ControllerDiscovery and register all controllers
    ControllerDiscovery.registerAllControllers();
    
    // Process controller routes from @controller/@action decorators
    console.log('🛣️  Processing controller routes...');
    processControllerRoutes();

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
        .use(new CachingMiddleware())           // 7. Response caching
        .use(new LoggingMiddleware())           // 8. Log requests
        .use(new DIScopeMiddleware())           // 9. Setup DI scoping
        .use(new RequestContextMiddleware());   // 10. Add request context to DI

    // Start the application
    app.start();

    // Make services available globally for debugging
    (window as any).serviceContainer = serviceContainer;
    (window as any).app = app;
    
    console.log('🎉 Application initialized with auto-discovered controllers!');
}

// Initialize the application
initializeApplication().catch(error => {
    console.error('❌ Failed to initialize application:', error);
});
