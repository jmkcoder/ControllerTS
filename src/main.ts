import 'reflect-metadata'; // Required for dependency injection
import { Router } from './core/router';
import { ViewEngine } from './core/viewEngine';
import { ControllerDiscovery } from './core/controllerDiscovery';
import { HtmlHelper } from './core/htmlHelper';
import { Controller } from './core/controller';
import { serviceContainer } from './core/serviceContainer';
import { LoggerService, UserService, EmailService } from './services/exampleServices';
import { ProductService } from './services/productService';
import { RequestPipeline, LoggingMiddleware, ErrorHandlingMiddleware, DIScopeMiddleware, RequestContextMiddleware } from './core/requestPipeline';
import './style.css';

// IMPORTANT: Register services using proper DI registration (no more factories needed!)
// Register singleton services (shared across the entire application)
serviceContainer.addSingleton(LoggerService);
serviceContainer.addSingleton(ViewEngine);

// Register scoped services (one instance per request)
serviceContainer.addScoped(UserService);
serviceContainer.addScoped(ProductService);

// Register transient services (new instance every time)
serviceContainer.addTransient(EmailService);

// NOW import controllers to trigger @AutoRegister decorators
// This ensures services are available when controllers are constructed
import './controllers/HomeController';
import './controllers/AboutController';
import './controllers/ProductController';

// Controllers are now imported after service registration
// Initialize ControllerDiscovery and register all controllers
ControllerDiscovery.registerAllControllers();

// Initialize HtmlHelper for MVC attributes immediately
HtmlHelper.initializeMvcAttributes();

// Also make it available globally for template access
(window as any).Html = HtmlHelper;

const router = new Router();

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

// Create and configure the request pipeline
const pipeline = new RequestPipeline(serviceContainer, router);

// Add middleware to the pipeline (order matters!)
pipeline
    .use(new ErrorHandlingMiddleware())      // Handle errors first
    .use(new LoggingMiddleware())           // Log requests
    .use(new DIScopeMiddleware())           // Setup DI scoping
    .use(new RequestContextMiddleware());   // Add request context to DI

// Set up the pipeline handler in the router
router.setPipelineHandler((url: string, method: string) => pipeline.processRequest(url, method));

// Initialize routing - now all routes will go through the pipeline
router.init();

// Make router, DI container, and pipeline available globally for debugging
(window as any).router = router;
(window as any).serviceContainer = serviceContainer;
(window as any).requestPipeline = pipeline;
