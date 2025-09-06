# Simplified App API Documentation

## Overview

The `App` class provides a clean, abstracted API for configuring your MVC application without exposing the underlying pipeline complexity. This follows the **Express.js/ASP.NET Core** pattern for a more intuitive developer experience.

## **Before vs After**

### **❌ Before (Explicit Pipeline)**
```typescript
// Complex pipeline setup
const pipeline = new RequestPipeline(serviceContainer, router);

pipeline
    .use(new ErrorHandlingMiddleware())
    .use(new CorsMiddleware())
    .use(new SecurityMiddleware());

router.setPipelineHandler((url, method) => pipeline.processRequest(url, method));
router.init();
```

### **✅ After (Abstracted App)**
```typescript
// Clean, simple API
const app = new App(serviceContainer, router);

app
    .use(new ErrorHandlingMiddleware())
    .use(new CorsMiddleware())
    .use(new SecurityMiddleware());

app.start();
```

## **Complete Setup Example**

```typescript
import { App } from './core/app';
import { serviceContainer } from './core/serviceContainer';
import { Router } from './core/router';

// Register your services
serviceContainer.addSingleton(LoggerService);
serviceContainer.addScoped(UserService);

// Import controllers
import './controllers/HomeController';
import './controllers/AboutController';

// Create the app
const app = new App(serviceContainer, router);

// Configure middleware (order matters!)
app
    .use(new ErrorHandlingMiddleware())      // 1. Handle errors first
    .use(new CorsMiddleware())              // 2. CORS headers  
    .use(new SecurityMiddleware())          // 3. Security headers
    .use(new PerformanceMiddleware())       // 4. Performance monitoring
    .use(new AuthenticationMiddleware())    // 5. Authentication check
    .use(new ValidationMiddleware())        // 6. Request validation
    .use(new CachingMiddleware())           // 7. Response caching
    .use(new LoggingMiddleware())           // 8. Log requests
    .use(new DIScopeMiddleware())           // 9. Setup DI scoping
    .use(new RequestContextMiddleware());   // 10. Add request context to DI

// Start the application
app.start();
```

## **App Class API**

### **Constructor**
```typescript
const app = new App(serviceContainer: ServiceContainer, router: Router);
```

### **use(middleware) - Fluent API**
```typescript
app.use(middleware: Middleware): App
```
- Adds middleware to the pipeline
- Returns the App instance for method chaining
- Middleware executes in the order you add them

### **start() - Initialize Application**
```typescript
app.start(): void
```
- Initializes the router and starts processing requests
- Sets up global debugging objects
- Call this after configuring all middleware

### **Advanced Methods (Optional)**
```typescript
app.getRouter(): Router        // Access underlying router
app.getPipeline(): RequestPipeline  // Access underlying pipeline
```

## **Benefits of the App API**

### **🎯 Simplified Configuration**
- No need to understand internal pipeline mechanics
- Clean, readable middleware configuration
- Follows familiar patterns from other frameworks

### **🔗 Method Chaining**
```typescript
app
    .use(middleware1)
    .use(middleware2)
    .use(middleware3)
    .start();
```

### **🛡️ Abstraction**
- Hides pipeline complexity
- Router setup is automatic
- Consistent API regardless of internal changes

### **🚀 Familiar Pattern**
Similar to popular frameworks:
```typescript
// Express.js style
app.use(middleware);

// ASP.NET Core style  
app.UseMiddleware<MyMiddleware>();
```

### **🔧 Extensible**
- Can still access underlying components if needed
- Easy to add new convenience methods
- Maintains full flexibility

## **Migration Guide**

If you have existing code using `RequestPipeline` directly:

### **1. Replace Pipeline Import**
```typescript
// Old
import { RequestPipeline } from './core/requestPipeline';

// New  
import { App } from './core/app';
```

### **2. Replace Pipeline Creation**
```typescript
// Old
const pipeline = new RequestPipeline(serviceContainer, router);

// New
const app = new App(serviceContainer, router);
```

### **3. Replace Middleware Registration**
```typescript
// Old
pipeline.use(new MyMiddleware());

// New
app.use(new MyMiddleware());
```

### **4. Replace Start Logic**
```typescript
// Old
router.setPipelineHandler((url, method) => pipeline.processRequest(url, method));
router.init();

// New
app.start();
```

## **Framework Comparison**

| Framework | Middleware Registration | Start Method |
|-----------|------------------------|--------------|
| **Our MVC** | `app.use(middleware)` | `app.start()` |
| **Express.js** | `app.use(middleware)` | `app.listen()` |
| **ASP.NET Core** | `app.UseMiddleware<T>()` | `app.Run()` |
| **Koa.js** | `app.use(middleware)` | `app.listen()` |

Your MVC framework now follows industry-standard patterns! 🎉
