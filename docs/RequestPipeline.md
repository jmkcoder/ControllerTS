# Request Pipeline and Enhanced Dependency Injection

## 🚀 Overview

The ControllerTS framework now includes a proper **request pipeline** system that eliminates the need for factory functions in dependency injection. This provides a clean, ASP.NET Core-style DI experience with proper request scoping.

## ✨ Key Features

### 1. **Clean DI Registration**
No more factory functions! Register services using simple, declarative methods:

```typescript
// BEFORE (Factory Functions - Removed)
serviceContainer.addScopedFactory(UserService, (container) => {
  const logger = container.getService(LoggerService);
  return new UserService(logger);
});

// AFTER (Clean Registration)
serviceContainer.addSingleton(LoggerService);
serviceContainer.addScoped(UserService);
serviceContainer.addTransient(EmailService);
```

### 2. **Request Pipeline Architecture**
```typescript
const pipeline = new RequestPipeline(serviceContainer, router);

pipeline
    .use(new ErrorHandlingMiddleware())      // Handle errors first
    .use(new LoggingMiddleware())           // Log requests
    .use(new DIScopeMiddleware())           // Setup DI scoping
    .use(new RequestContextMiddleware());   // Add request context to DI
```

### 3. **Automatic Dependency Resolution**
The framework now automatically resolves dependencies using TypeScript's `reflect-metadata`:

```typescript
@Injectable
export class UserService {
    constructor(private logger: LoggerService) {
        // Dependencies automatically injected!
    }
}
```

## 🛠 How It Works

### Service Lifetimes

1. **Singleton**: One instance for the entire application
   ```typescript
   serviceContainer.addSingleton(LoggerService);
   ```

2. **Scoped**: One instance per request
   ```typescript
   serviceContainer.addScoped(UserService);
   ```

3. **Transient**: New instance every time
   ```typescript
   serviceContainer.addTransient(EmailService);
   ```

### Request Flow

```
HTTP Request → Pipeline → Middleware Chain → Router → Controller → DI Resolution
     ↓             ↓           ↓              ↓          ↓           ↓
   Parse URL → Error Guard → Logging → DI Scope → Route Match → Service Creation
```

### Middleware System

The pipeline supports custom middleware:

```typescript
class CustomMiddleware implements Middleware {
    async handle(context: RequestContext, next: () => Promise<void>): Promise<void> {
        // Before request processing
        console.log(`Processing ${context.url}`);
        
        await next(); // Continue to next middleware
        
        // After request processing
        console.log(`Completed ${context.url}`);
    }
}

pipeline.use(new CustomMiddleware());
```

## 💡 Usage Examples

### In Controllers

```typescript
@AutoRegister
@Injectable
export class ProductController extends Controller {
    constructor(
        private productService: ProductService,  // Scoped
        private logger: LoggerService            // Singleton
    ) {
        super();
    }

    @route('products')
    async list(): Promise<void> {
        // Services are automatically injected!
        const products = this.productService.getAllProducts();
        this.logger.log('Products retrieved');
        
        await this.View('views/products.njk', { products });
    }
}
```

### In Services

```typescript
@Injectable
export class ProductService {
    constructor(private logger: LoggerService) {
        // Logger automatically injected
    }

    getAllProducts(): Product[] {
        this.logger.log('Fetching all products');
        return this.products;
    }
}
```

## 🔧 Advanced Features

### Request Context Access

Access current request information anywhere in your application:

```typescript
class RequestAwareService {
    async processData() {
        const context = (window as any).currentRequestServices;
        if (context) {
            console.log(`Processing for URL: ${context.url}`);
        }
    }
}
```

### Custom Service Registration

For complex scenarios, you can still use custom factories:

```typescript
serviceContainer.addSingletonFactory(DatabaseService, (container) => {
    const config = container.getService(ConfigService);
    return new DatabaseService(config.connectionString);
});
```

### Error Handling

The pipeline includes automatic error handling:

```typescript
// Errors are automatically caught and displayed
// with detailed stack traces in development
```

## 📊 Performance Benefits

1. **Request Scoping**: Services are properly scoped per request
2. **Memory Management**: Scoped services are cleaned up after each request
3. **Dependency Caching**: Scoped and singleton services are cached within their lifetime
4. **Automatic Cleanup**: No memory leaks from circular dependencies

## 🔄 Migration from Factory Pattern

### Before:
```typescript
serviceContainer.addScopedFactory(UserService, (container) => {
  const logger = container.getService(LoggerService);
  return new UserService(logger);
});
```

### After:
```typescript
serviceContainer.addScoped(UserService);
// Dependencies automatically resolved!
```

## 🎯 Best Practices

1. **Use appropriate lifetimes**:
   - Singleton: Stateless services (Logger, Config)
   - Scoped: Request-specific services (UserService, DataContext)
   - Transient: Stateful operations (EmailService, ReportGenerator)

2. **Leverage decorators**:
   ```typescript
   @Injectable
   @Singleton  // or @Scoped, @Transient
   export class MyService { }
   ```

3. **Constructor injection**:
   ```typescript
   constructor(
       private dependency1: Service1,
       private dependency2: Service2
   ) { }
   ```

4. **Avoid circular dependencies**: Use interfaces and proper layering

## 🧪 Debugging

The system provides extensive debugging capabilities:

```typescript
// Available globally
window.serviceContainer      // DI container
window.requestPipeline      // Request pipeline
window.currentRequestServices // Current request scope
```

## 🚀 Next Steps

The request pipeline is now ready for production use. Key benefits:

- ✅ **Clean DI registration** without factory functions
- ✅ **Proper request scoping** like ASP.NET Core
- ✅ **Automatic dependency resolution** via decorators
- ✅ **Extensible middleware system** for cross-cutting concerns
- ✅ **Better error handling** and logging
- ✅ **Memory management** with automatic cleanup

Your application now follows modern dependency injection patterns while maintaining the familiar ASP.NET Core development experience!
