import 'reflect-metadata'; // Required for dependency injection
import { HomeController } from './controllers/HomeController';
import { AboutController } from './controllers/AboutController';
import { Router } from './core/router';
import { ViewEngine } from './core/viewEngine';
import { ControllerManager } from './core/controllerManager';
import { HtmlHelper } from './core/htmlHelper';
import { Controller } from './core/controller';
import { serviceContainer } from './core/serviceContainer';
import { LoggerService, UserService, EmailService } from './services/exampleServices';
import './style.css';

console.log('Main.ts loaded with Dependency Injection');

// Register services manually to ensure they're available
console.log('Registering services...');
serviceContainer.addSingleton(LoggerService);
serviceContainer.addScoped(UserService);
serviceContainer.addTransient(EmailService);

// Register core services in DI container
serviceContainer.addSingleton(ViewEngine);

console.log('Services registered:', {
  LoggerService: 'Singleton',
  UserService: 'Scoped', 
  EmailService: 'Transient',
  ViewEngine: 'Singleton'
});

// Initialize HMR for templates
ViewEngine.initHMR();

// Register controllers with the ControllerManager
ControllerManager.registerController('Home', HomeController);
ControllerManager.registerController('About', AboutController);

// Initialize HtmlHelper for MVC attributes immediately
console.log('Initializing HtmlHelper...');
HtmlHelper.initializeMvcAttributes();

// Also make it available globally for template access
(window as any).Html = HtmlHelper;

const router = new Router();

// Set router instance for controller redirects
Controller.setRouter(router);

// Register controllers with the router for controller/action routing
router.registerController('Home', HomeController);
router.registerController('About', AboutController);

// Legacy route support (optional - decorators will handle most routing)
router.addRoute('home', HomeController);
router.addRoute('about', AboutController);

console.log('Router initialized');
router.init();

// Test that DI is working
try {
  const logger = serviceContainer.getService(LoggerService);
  logger.log('🚀 ControllerTS MVC application started with Dependency Injection!');
  logger.log('✅ Dependency injection system is working correctly');
} catch (error) {
  console.error('❌ DI system failed:', error);
  console.log('🚀 ControllerTS MVC application started (without DI)');
}

// Make router and DI container available globally for debugging
(window as any).router = router;
(window as any).serviceContainer = serviceContainer;
