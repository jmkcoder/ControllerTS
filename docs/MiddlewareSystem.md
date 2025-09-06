# Middleware System Documentation

## Overview

The MVC framework includes a powerful middleware pipeline system inspired by ASP.NET Core. Middleware can run **before** and **after** request processing, allowing you to implement cross-cutting concerns like authentication, logging, caching, and security.

## How Middleware Works

### **Pipeline Execution Order**

```
Request → Middleware 1 → Middleware 2 → Controller → Middleware 2 (after) → Middleware 1 (after) → Response
```

### **Middleware Interface**

```typescript
export interface Middleware {
    handle(context: RequestContext, next: () => Promise<void>): Promise<void>;
}
```

### **Request Context**

```typescript
export interface RequestContext {
    url: string;                              // Full URL
    path: string;                            // Path only
    method: string;                          // HTTP method (GET, POST, etc.)
    queryParams: Record<string, string>;     // Parsed query parameters
    services: ServiceContainer;              // Request-scoped DI container
    startTime: number;                       // Request start timestamp
}
```

## **Built-in Middleware**

### **1. ErrorHandlingMiddleware**
- Catches and handles all errors in the pipeline
- Provides user-friendly error pages
- Always runs first

### **2. LoggingMiddleware** 
- Logs all incoming requests
- Includes timing information

### **3. DIScopeMiddleware**
- Sets up request-scoped dependency injection
- Makes services available globally for the request

### **4. RequestContextMiddleware**
- Adds request context to the DI container
- Enables controllers to access request information

## **Custom Middleware Examples**

### **Before Request Processing**

```typescript
export class AuthenticationMiddleware implements Middleware {
    async handle(context: RequestContext, next: () => Promise<void>): Promise<void> {
        // ✅ Runs BEFORE request processing
        console.log('🔐 Checking authentication...');
        
        if (!this.isAuthenticated(context)) {
            // Stop pipeline execution
            throw new Error('Authentication required');
        }
        
        // Continue to next middleware
        await next();
        
        // This would run AFTER if we had code here
    }
}
```

### **Before AND After Request Processing**

```typescript
export class PerformanceMiddleware implements Middleware {
    async handle(context: RequestContext, next: () => Promise<void>): Promise<void> {
        // ✅ BEFORE: Start timing
        const startTime = performance.now();
        console.log(`⏱️ Starting request ${context.path}`);
        
        try {
            // Continue to next middleware/controller
            await next();
            
            // ✅ AFTER: Log completion time
            const duration = performance.now() - startTime;
            console.log(`✅ Request completed in ${duration.toFixed(2)}ms`);
            
        } catch (error) {
            // ✅ AFTER: Log error time
            const duration = performance.now() - startTime;
            console.log(`❌ Request failed after ${duration.toFixed(2)}ms`);
            throw error;
        }
    }
}
```

### **After Request Processing**

```typescript
export class SecurityMiddleware implements Middleware {
    async handle(context: RequestContext, next: () => Promise<void>): Promise<void> {
        // Continue to next middleware/controller first
        await next();
        
        // ✅ Runs AFTER request processing
        console.log('🛡️ Adding security headers...');
        // Add security headers to response
    }
}
```

## **Available Custom Middleware**

### **🔐 AuthenticationMiddleware**
- Checks user authentication before processing
- Redirects to login for protected routes
- Configurable protected paths

### **⏱️ PerformanceMiddleware**
- Measures request execution time
- Logs slow requests
- Provides performance metrics

### **🌐 CorsMiddleware**
- Handles Cross-Origin Resource Sharing
- Sets appropriate CORS headers
- Configurable allowed origins

### **🔍 ValidationMiddleware**
- Validates incoming requests
- Checks query parameters
- Returns validation errors

### **🎯 CachingMiddleware**
- Caches GET requests
- Configurable cache timeout
- Improves performance

### **🛡️ SecurityMiddleware**
- Adds security headers
- Implements CSP, HSTS, etc.
- Runs after request processing

## **Registering Middleware**

Add middleware to the pipeline in **main.ts**:

```typescript
// Order matters! Earlier middleware wraps later middleware
pipeline
    .use(new ErrorHandlingMiddleware())      // 1. Always first
    .use(new CorsMiddleware())              // 2. CORS 
    .use(new SecurityMiddleware())          // 3. Security
    .use(new PerformanceMiddleware())       // 4. Performance (wraps everything)
    .use(new AuthenticationMiddleware())    // 5. Auth check
    .use(new ValidationMiddleware())        // 6. Validation
    .use(new CachingMiddleware())           // 7. Caching
    .use(new LoggingMiddleware())           // 8. Logging
    .use(new DIScopeMiddleware())           // 9. DI setup
    .use(new RequestContextMiddleware());   // 10. Request context
```

## **Creating Custom Middleware**

### **1. Implement the Middleware Interface**

```typescript
export class MyCustomMiddleware implements Middleware {
    async handle(context: RequestContext, next: () => Promise<void>): Promise<void> {
        // Before request processing
        console.log('Before processing...');
        
        // Continue pipeline
        await next();
        
        // After request processing
        console.log('After processing...');
    }
}
```

### **2. Register in Pipeline**

```typescript
pipeline.use(new MyCustomMiddleware());
```

## **Real-World Use Cases**

### **API Rate Limiting**
```typescript
export class RateLimitMiddleware implements Middleware {
    private requestCounts = new Map<string, { count: number, resetTime: number }>();
    
    async handle(context: RequestContext, next: () => Promise<void>): Promise<void> {
        const clientId = this.getClientId(context);
        
        if (this.isRateLimited(clientId)) {
            throw new Error('Rate limit exceeded');
        }
        
        await next();
        
        this.incrementRequestCount(clientId);
    }
}
```

### **Request/Response Logging**
```typescript
export class AuditMiddleware implements Middleware {
    async handle(context: RequestContext, next: () => Promise<void>): Promise<void> {
        // Log request
        this.logRequest(context);
        
        await next();
        
        // Log response
        this.logResponse(context);
    }
}
```

### **Feature Flags**
```typescript
export class FeatureFlagMiddleware implements Middleware {
    async handle(context: RequestContext, next: () => Promise<void>): Promise<void> {
        if (!this.isFeatureEnabled(context.path)) {
            throw new Error('Feature not available');
        }
        
        await next();
    }
}
```

## **Benefits**

✅ **Separation of Concerns**: Keep cross-cutting logic separate from business logic  
✅ **Reusable**: Write once, use across all requests  
✅ **Composable**: Mix and match middleware as needed  
✅ **Testable**: Easy to unit test individual middleware  
✅ **Flexible**: Run code before, after, or around request processing  
✅ **Order Control**: Precise control over execution order  

The middleware system gives you enterprise-grade request processing capabilities similar to ASP.NET Core! 🚀
