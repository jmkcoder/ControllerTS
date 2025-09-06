# Default Route Configuration

This document explains how to configure the default route for your MVC application using the new default route configuration system instead of using `@route('')` attributes.

## Overview

The default route configuration allows you to specify which controller and action should handle the root URL (`/`) of your application. This approach centralizes the routing configuration in your `main.ts` file and eliminates the need for special route attributes.

## Configuration

### Setting the Default Route

In your `main.ts` file, configure the default route after creating the router instance:

```typescript
import { Router } from './core/router';

// Create router instance
const router = new Router();

// Configure default route (controller: 'home', action: 'execute')
router.setDefaultRoute('home', 'execute');
```

### Available Methods

#### `setDefaultRoute(controller: string, action: string)`
Sets the default route that will be used when users navigate to the root path (`/`).

- **controller**: The name of the controller (without "Controller" suffix)
- **action**: The method name on the controller to execute

#### `getDefaultRoute(): DefaultRouteConfig | null`
Returns the current default route configuration or `null` if none is set.

```typescript
const defaultRoute = router.getDefaultRoute();
if (defaultRoute) {
    console.log(`Default route: ${defaultRoute.controller}/${defaultRoute.action}`);
}
```

## Examples

### Example 1: Home Controller as Default

```typescript
// In main.ts
router.setDefaultRoute('home', 'execute');

// This will route '/' to HomeController.execute()
```

### Example 2: About Controller as Default

```typescript
// In main.ts
router.setDefaultRoute('about', 'index');

// This will route '/' to AboutController.index()
```

### Example 3: Custom Landing Page

```typescript
// In main.ts
router.setDefaultRoute('landing', 'welcome');

// This will route '/' to LandingController.welcome()
```

## Controller Setup

Your controllers should use the `@controller` and `@action` decorators without needing special root route attributes:

```typescript
import { Controller } from '../core/controller';
import { controller, action } from '../core/decorators';

@controller('home')
export class HomeController extends Controller {
    
    @action()  // This creates route: /home
    async execute(): Promise<void> {
        // This method will be called for the root route '/'
        // when configured as the default route
        await this.View('views/home.njk', { 
            title: 'Welcome to the Application'
        });
    }
    
    @action('about')  // This creates route: /home/about
    async about(): Promise<void> {
        // Other actions work normally
    }
}
```

## Migration from `@route('')` Attributes

### Before (using route attribute)
```typescript
@controller('home')
export class HomeController extends Controller {
    
    @action()
    @route('')  // Root route attribute
    async execute(): Promise<void> {
        // Handle root route
    }
}
```

### After (using default route configuration)
```typescript
// In main.ts
router.setDefaultRoute('home', 'execute');

// In HomeController.ts
@controller('home')
export class HomeController extends Controller {
    
    @action()  // No special route attribute needed
    async execute(): Promise<void> {
        // Handle root route
    }
}
```

## Benefits

1. **Centralized Configuration**: All routing configuration is in one place (`main.ts`)
2. **Cleaner Controllers**: No need for special route attributes on controllers
3. **Flexibility**: Easy to change the default route without modifying controller files
4. **Maintainability**: Simpler to understand and modify routing behavior
5. **Consistency**: Follows standard MVC patterns where routing is configured at application startup

## Fallback Behavior

If no default route is configured, the application will fall back to using `'home'` as the default controller, maintaining backward compatibility.

```typescript
// If no default route is set:
// '/' routes to 'home' controller (HomeController.execute())

// If default route is set:
// '/' routes to the specified controller and action
```

## Route Processing Order

The router processes routes in the following order:

1. **Exact decorator routes** (from `@route` and `@controller/@action` decorators)
2. **Default route** (for root path `/`)
3. **Controller/action pattern** (e.g., `/products/list`)
4. **Single controller** (e.g., `/about`)
5. **404 Not Found**

## TypeScript Interface

```typescript
export interface DefaultRouteConfig {
    controller: string;
    action: string;
}
```

## Best Practices

1. **Set the default route early** in your application initialization
2. **Use descriptive action names** that clearly indicate the purpose
3. **Ensure the target controller and action exist** before setting as default
4. **Document your default route choice** for team members
5. **Test the root route** thoroughly after configuration changes

## Error Handling

If the configured default route points to a non-existent controller or action, the router will:

1. Try to create the controller through dependency injection
2. Check if the action method exists
3. Fall back to the controller's `execute()` method if the action doesn't exist
4. Show a 404 error if the controller doesn't exist

This provides graceful degradation and helpful error messages during development.
