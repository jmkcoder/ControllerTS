import 'reflect-metadata'; // Required for dependency injection
import { Router } from './core/router';
import { ViewEngine } from './core/viewEngine';
import { ControllerDiscovery } from './core/controllerDiscovery';
import { HtmlHelper } from './core/htmlHelper';
import { Controller } from './core/controller';
import { serviceContainer } from './core/serviceContainer';
import { LoggerService, UserService, EmailService } from './services/exampleServices';
import { ProductService } from './services/productService';
import './style.css';

// IMPORTANT: Register services FIRST before importing controllers
// Register LoggerService first (no dependencies)
serviceContainer.addSingleton(LoggerService);

// Register services with explicit factories to handle dependencies
serviceContainer.addScopedFactory(UserService, (container) => {
  const logger = container.getService(LoggerService);
  return new UserService(logger);
});

serviceContainer.addTransientFactory(EmailService, (container) => {
  const logger = container.getService(LoggerService);
  return new EmailService(logger);
});

serviceContainer.addScopedFactory(ProductService, (container) => {
  const logger = container.getService(LoggerService);
  return new ProductService(logger);
});

serviceContainer.addSingleton(ViewEngine);

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

router.init();

// Make router and DI container available globally for debugging
(window as any).router = router;
(window as any).serviceContainer = serviceContainer;
