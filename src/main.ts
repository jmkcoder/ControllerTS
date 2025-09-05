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

serviceContainer.addSingleton(LoggerService);
serviceContainer.addScoped(UserService);
serviceContainer.addTransient(EmailService);

// Register core services in DI container
serviceContainer.addSingleton(ViewEngine);

// Register controllers with the ControllerManager
ControllerManager.registerController('Home', HomeController);
ControllerManager.registerController('About', AboutController);

// Initialize HtmlHelper for MVC attributes immediately
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

router.init();

// Make router and DI container available globally for debugging
(window as any).router = router;
(window as any).serviceContainer = serviceContainer;
