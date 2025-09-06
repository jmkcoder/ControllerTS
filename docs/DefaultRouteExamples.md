# Default Route Configuration Examples

This file provides practical examples of different ways to configure your application's default route.

## Example Configurations in main.ts

### 1. Standard Home Page
```typescript
// Most common configuration - route root to home page
router.setDefaultRoute('home', 'execute');
// Routes: / → HomeController.execute()
```

### 2. Landing Page
```typescript
// Route to a dedicated landing page
router.setDefaultRoute('landing', 'index');
// Routes: / → LandingController.index()
```

### 3. Dashboard Application
```typescript
// Route directly to dashboard for internal apps
router.setDefaultRoute('dashboard', 'overview');
// Routes: / → DashboardController.overview()
```

### 4. Product Catalog
```typescript
// E-commerce site routing to product catalog
router.setDefaultRoute('products', 'catalog');
// Routes: / → ProductController.catalog()
```

### 5. User Portal
```typescript
// Route to user portal or profile
router.setDefaultRoute('user', 'portal');
// Routes: / → UserController.portal()
```

## Complete main.ts Example

```typescript
import 'reflect-metadata';
import { Router } from './core/router';
import { App } from './core/app';
import { Controller } from './core/controller';
import { AutoControllerLoader } from './core/autoControllerLoader';
import { processControllerRoutes } from './core/decorators';

async function initializeApplication() {
    // Register services
    // ... service registration code ...

    // Load all controllers
    await AutoControllerLoader.loadAllControllers();
    
    // Process controller routes
    processControllerRoutes();

    // Create router and configure default route
    const router = new Router();
    
    // CONFIGURE YOUR DEFAULT ROUTE HERE
    // Option 1: Standard home page (recommended for most apps)
    router.setDefaultRoute('home', 'execute');
    
    // Option 2: Custom landing page
    // router.setDefaultRoute('landing', 'welcome');
    
    // Option 3: Dashboard for internal apps
    // router.setDefaultRoute('dashboard', 'index');
    
    // Option 4: Product catalog for e-commerce
    // router.setDefaultRoute('products', 'list');

    // Set router for controllers
    Controller.setRouter(router);

    // Create and configure app
    const app = new App(serviceContainer, router);
    
    // Configure middleware
    // ... middleware configuration ...

    // Start the application
    app.start();
}

initializeApplication().catch(console.error);
```

## Controller Examples

### Home Controller (Standard)
```typescript
@controller('home')
export class HomeController extends Controller {
    
    @action()
    async execute(): Promise<void> {
        await this.View('views/home.njk', { 
            title: 'Welcome Home',
            content: 'This is the application homepage'
        });
    }
    
    @action('about')
    async about(): Promise<void> {
        await this.View('views/about.njk');
    }
}
```

### Landing Controller (Marketing Site)
```typescript
@controller('landing')
export class LandingController extends Controller {
    
    @action('welcome')
    async welcome(): Promise<void> {
        await this.View('views/landing/welcome.njk', {
            title: 'Welcome to Our Platform',
            features: ['Feature 1', 'Feature 2', 'Feature 3'],
            ctaButton: 'Get Started'
        });
    }
    
    @action('pricing')
    async pricing(): Promise<void> {
        await this.View('views/landing/pricing.njk');
    }
}
```

### Dashboard Controller (Internal App)
```typescript
@controller('dashboard')
export class DashboardController extends Controller {
    
    @action('overview')
    async overview(): Promise<void> {
        // Fetch dashboard data
        const stats = {
            users: 1250,
            orders: 340,
            revenue: 45600
        };
        
        await this.View('views/dashboard/overview.njk', {
            title: 'Dashboard Overview',
            stats
        });
    }
    
    @action('analytics')
    async analytics(): Promise<void> {
        await this.View('views/dashboard/analytics.njk');
    }
}
```

## Dynamic Default Route Configuration

You can also set the default route conditionally based on environment or configuration:

```typescript
async function initializeApplication() {
    // ... initialization code ...
    
    const router = new Router();
    
    // Configure default route based on environment
    const environment = process.env.NODE_ENV || 'development';
    
    switch (environment) {
        case 'production':
            router.setDefaultRoute('home', 'execute');
            break;
        case 'staging':
            router.setDefaultRoute('test', 'dashboard');
            break;
        case 'development':
            router.setDefaultRoute('dev', 'tools');
            break;
        default:
            router.setDefaultRoute('home', 'execute');
    }
    
    // ... rest of initialization ...
}
```

## Configuration from Settings

```typescript
// config.ts
export interface AppConfig {
    defaultRoute: {
        controller: string;
        action: string;
    };
}

export const appConfig: AppConfig = {
    defaultRoute: {
        controller: 'home',
        action: 'execute'
    }
};

// main.ts
import { appConfig } from './config';

async function initializeApplication() {
    // ... initialization code ...
    
    const router = new Router();
    
    // Configure from settings
    router.setDefaultRoute(
        appConfig.defaultRoute.controller,
        appConfig.defaultRoute.action
    );
    
    // ... rest of initialization ...
}
```

## Testing Default Routes

```typescript
// test/router.test.ts
import { Router } from '../src/core/router';

describe('Default Route Configuration', () => {
    let router: Router;
    
    beforeEach(() => {
        router = new Router();
    });
    
    test('should set and get default route', () => {
        router.setDefaultRoute('home', 'execute');
        
        const defaultRoute = router.getDefaultRoute();
        expect(defaultRoute).toEqual({
            controller: 'home',
            action: 'execute'
        });
    });
    
    test('should handle root path with default route', async () => {
        router.setDefaultRoute('landing', 'welcome');
        
        // Test that / routes to landing/welcome
        // ... test implementation ...
    });
});
```

## Troubleshooting

### Common Issues

1. **Controller not found**: Ensure the controller is loaded by AutoControllerLoader
2. **Action not found**: Verify the action method exists and is decorated with `@action`
3. **Route not working**: Check that `processControllerRoutes()` is called after loading controllers
4. **Circular dependencies**: Ensure clean separation between controllers and routing configuration

### Debug Information

Add logging to see how routes are resolved:

```typescript
// In main.ts
router.setDefaultRoute('home', 'execute');

const defaultRoute = router.getDefaultRoute();
console.log('Default route configured:', defaultRoute);
```

This provides a comprehensive set of examples for implementing default route configuration in your MVC application.
