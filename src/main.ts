import { HomeController } from './controllers/HomeController';
import { AboutController } from './controllers/AboutController';
import { Router } from './core/router';
import { ViewEngine } from './core/viewEngine';
import { ControllerManager } from './core/controllerManager';
import { HtmlHelper } from './core/htmlHelper';
import { Controller } from './core/controller';
import './style.css';

console.log('Main.ts loaded');

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

// Make router available globally for debugging
(window as any).router = router;
