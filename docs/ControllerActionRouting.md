# Controller & Action Routing System

## Overview

The framework now supports **semantic routing** using `@controller` and `@action` decorators, providing a cleaner and more organized way to define routes that follows MVC conventions.

## New Decorator Syntax

### @controller(baseRoute)
Defines the base route for an entire controller:

```typescript
@controller('admin')  // Base route: /admin
export class AdminController extends Controller {
    // Actions defined here will be relative to /admin
}
```

### @action(actionRoute, method?)
Defines an action within the controller:

```typescript
@controller('admin')
export class AdminController extends Controller {
    
    @action()           // Maps to: /admin (empty action = base route)
    async dashboard() { /* ... */ }
    
    @action('users')    // Maps to: /admin/users
    async manageUsers() { /* ... */ }
    
    @action('settings') // Maps to: /admin/settings  
    async settings() { /* ... */ }
}
```

## Benefits Over @route

### ✅ **More Semantic**
```typescript
// Before: Hard to see the relationship
@route('/admin')
@route('/admin/users')
@route('/admin/settings')

// After: Clear controller organization
@controller('admin')
@action()       // dashboard
@action('users')
@action('settings')
```

### ✅ **DRY Principle**
```typescript
// Before: Repetitive base paths
@route('/api/users')
@route('/api/users/create') 
@route('/api/users/update')
@route('/api/users/delete')

// After: Base path defined once
@controller('api/users')
@action()        // /api/users
@action('create') // /api/users/create
@action('update') // /api/users/update  
@action('delete') // /api/users/delete
```

### ✅ **Easy Refactoring**
Changing the base route updates all actions automatically:
```typescript
@controller('admin')  // Change to 'dashboard' updates all routes
@action('users')      // /admin/users → /dashboard/users
@action('settings')   // /admin/settings → /dashboard/settings
```

## Complete Examples

### Traditional MVC Structure
```typescript
@AutoRegister
@controller('products')
export class ProductController extends Controller {
    
    @action()           // GET /products
    async index() {
        return await this.View('products', { products: [] });
    }
    
    @action(':id')      // GET /products/:id  
    async show(params: RouteParams) {
        return await this.View('product-detail', { id: params.id });
    }
    
    @action('create', 'POST')  // POST /products/create
    async create() {
        // Handle product creation
    }
}
```

### API Controllers
```typescript
@AutoRegister
@controller('api/v1/users')
export class UserApiController extends Controller {
    
    @action('', 'GET')         // GET /api/v1/users
    async list() {
        return this.Json({ users: [] });
    }
    
    @action('', 'POST')        // POST /api/v1/users
    async create() {
        return this.Json({ success: true });
    }
    
    @action(':id', 'GET')      // GET /api/v1/users/:id
    async get(params: RouteParams) {
        return this.Json({ user: { id: params.id } });
    }
    
    @action(':id', 'PUT')      // PUT /api/v1/users/:id
    async update(params: RouteParams) {
        return this.Json({ updated: true });
    }
}
```

### Clean Architecture Example
```typescript
// src/features/auth/controllers/AuthController.ts
@AutoRegister
@controller('auth')
export class AuthController extends Controller {
    
    @action('login')           // GET /auth/login
    async showLogin() {
        return await this.View('auth/login');
    }
    
    @action('login', 'POST')   // POST /auth/login
    async processLogin() {
        // Handle login logic
    }
    
    @action('logout')          // GET /auth/logout
    async logout() {
        // Handle logout
        return this.Redirect('/');
    }
}
```

## Parameter Support

The system fully supports route parameters:

```typescript
@controller('users')
export class UserController extends Controller {
    
    @action(':id')                    // /users/123
    async show(params: RouteParams) {
        const userId = params.id;
    }
    
    @action(':id/posts/:postId')      // /users/123/posts/456
    async showPost(params: RouteParams) {
        const { id, postId } = params;
    }
}
```

## HTTP Methods

Specify HTTP methods for each action:

```typescript
@controller('api/products')
export class ProductApiController extends Controller {
    
    @action('', 'GET')          // GET /api/products
    async list() { /* ... */ }
    
    @action('', 'POST')         // POST /api/products
    async create() { /* ... */ }
    
    @action(':id', 'PUT')       // PUT /api/products/:id
    async update() { /* ... */ }
    
    @action(':id', 'DELETE')    // DELETE /api/products/:id
    async delete() { /* ... */ }
}
```

## Migration from @route

### Old Syntax
```typescript
export class AdminController extends Controller {
    @route('/admin')
    async dashboard() { /* ... */ }
    
    @route('/admin/users')
    async manageUsers() { /* ... */ }
    
    @route('/admin/settings')
    async settings() { /* ... */ }
}
```

### New Syntax
```typescript
@controller('admin')
export class AdminController extends Controller {
    @action()
    async dashboard() { /* ... */ }
    
    @action('users')
    async manageUsers() { /* ... */ }
    
    @action('settings') 
    async settings() { /* ... */ }
}
```

## Automatic Route Registration

Routes are automatically processed during application startup:

```typescript
// In main.ts - this happens automatically
await AutoControllerLoader.loadAllControllers();
ControllerDiscovery.registerAllControllers();
processControllerRoutes();  // ← Processes @controller/@action decorators
```

Console output shows registered routes:
```
🛣️  Processing controller routes...
🛣️  Registered route: GET /admin → AdminController.dashboard
🛣️  Registered route: GET /admin/users → AdminController.manageUsers
🛣️  Registered route: GET /admin/settings → AdminController.settings
🛣️  Registered route: GET /users → UserController.index
🛣️  Registered route: GET /users/:id → UserController.show
```

## Backward Compatibility

The old `@route` decorator still works alongside the new system:

```typescript
@controller('admin')
export class AdminController extends Controller {
    @action('dashboard')        // New style
    async dashboard() { /* ... */ }
    
    @route('/admin/legacy')     // Old style - still works
    async legacyAction() { /* ... */ }
}
```

## Summary

**The new `@controller` and `@action` system provides:**

✅ **Cleaner syntax** - Less repetition, more semantic  
✅ **Better organization** - Clear controller structure  
✅ **Easy refactoring** - Change base route once  
✅ **Full feature support** - Parameters, HTTP methods, etc.  
✅ **Backward compatible** - Works with existing `@route` decorators  
✅ **Automatic processing** - No manual route registration needed  

This makes the framework even more maintainable and follows true MVC conventions! 🎉
