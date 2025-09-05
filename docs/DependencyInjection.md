# Dependency Injection in ControllerTS

ControllerTS includes a powerful dependency injection system inspired by ASP.NET Core. This allows you to write clean, testable, and maintainable code by automatically managing dependencies between your services and controllers.

## Table of Contents

- [Service Registration](#service-registration)
- [Service Lifetimes](#service-lifetimes)
- [Using Services in Controllers](#using-services-in-controllers)
- [DI Decorators](#di-decorators)
- [Creating Services](#creating-services)
- [Advanced DI Features](#advanced-di-features)

## Service Registration

Services can be registered in several ways:

### 1. Using Decorators (Recommended)

```typescript
import { Injectable, Singleton, Scoped } from './core/diDecorators';

@Singleton  // Register as singleton
export class LoggerService {
  log(message: string): void {
    console.log(`[${new Date().toISOString()}] ${message}`);
  }
}

@Scoped     // Register as scoped
export class UserService {
  constructor(private logger: LoggerService) {
    this.logger.log('UserService created');
  }
}

@Injectable // Register as transient (default)
export class EmailService {
  constructor(private logger: LoggerService) {
    this.logger.log('EmailService created');
  }
}
```

### 2. Manual Registration

```typescript
import { serviceContainer, ServiceLifetime } from './core/serviceContainer';

// Register services manually
serviceContainer.addSingleton(LoggerService);
serviceContainer.addScoped(UserService);
serviceContainer.addTransient(EmailService);

// Register with factory
serviceContainer.addSingletonFactory(ConfigService, (container) => {
  return new ConfigService(process.env.NODE_ENV);
});
```

## Service Lifetimes

ControllerTS supports three service lifetimes, just like ASP.NET Core:

### Singleton
- **One instance** for the entire application lifetime
- Created once and reused everywhere
- Perfect for: logging, configuration, caching

```typescript
@Singleton
export class LoggerService {
  // Implementation
}
```

### Scoped
- **One instance per request/scope**
- New instance for each HTTP request or operation scope
- Perfect for: database contexts, user sessions, request-specific data

```typescript
@Scoped
export class UserService {
  // Implementation
}
```

### Transient
- **New instance every time** it's requested
- Created fresh for each injection
- Perfect for: lightweight services, stateless operations

```typescript
@Injectable  // Default is Transient
export class EmailService {
  // Implementation
}
```

## Using Services in Controllers

### Constructor Injection

```typescript
import { Injectable } from '../core/diDecorators';
import { Controller } from '../core/controller';

@Injectable
export class HomeController extends Controller {
  constructor(
    private userService: UserService,
    private logger: LoggerService,
    private emailService: EmailService
  ) {
    super();
    this.logger.log('HomeController created with dependencies');
  }

  async execute(): Promise<void> {
    const users = this.userService.getAllUsers();
    this.logger.log(`Retrieved ${users.length} users`);
    
    const model = { users };
    await this.View('home', model);
  }
}
```

### Manual Service Resolution

```typescript
export class MyController extends Controller {
  async someAction(): Promise<void> {
    // Get service manually when needed
    const userService = this.getService(UserService);
    const logger = this.tryGetService(LoggerService); // Returns null if not found
    
    const users = userService.getAllUsers();
    logger?.log(`Retrieved ${users.length} users`);
  }
}
```

## DI Decorators

### @Injectable
Marks a class as available for dependency injection (Transient lifetime):

```typescript
@Injectable
export class MyService {
  // Service implementation
}
```

### @Singleton
Registers a service with Singleton lifetime:

```typescript
@Singleton
export class ConfigService {
  private config = { apiUrl: 'https://api.example.com' };
  
  getConfig() {
    return this.config;
  }
}
```

### @Scoped
Registers a service with Scoped lifetime:

```typescript
@Scoped
export class DatabaseContext {
  private connection: any;
  
  constructor() {
    this.connection = createDatabaseConnection();
  }
}
```

### @Service
Generic service decorator with configurable lifetime:

```typescript
import { ServiceLifetime } from './core/serviceContainer';

@Service(ServiceLifetime.Singleton)
export class CacheService {
  // Implementation
}
```

### @Autowired
Property injection decorator:

```typescript
export class MyComponent {
  @Autowired
  private logger: LoggerService;
  
  doSomething() {
    this.logger.log('Doing something...');
  }
}
```

## Creating Services

### Basic Service

```typescript
@Injectable
export class ApiService {
  constructor(private logger: LoggerService) {}
  
  async fetchData(url: string): Promise<any> {
    this.logger.log(`Fetching data from ${url}`);
    const response = await fetch(url);
    return response.json();
  }
}
```

### Service with Interface

```typescript
export interface IUserRepository {
  getById(id: string): User | null;
  getAll(): User[];
  save(user: User): void;
}

@Scoped
export class UserRepository implements IUserRepository {
  constructor(private logger: LoggerService) {}
  
  getById(id: string): User | null {
    this.logger.log(`Getting user by ID: ${id}`);
    // Implementation
  }
  
  getAll(): User[] {
    this.logger.log('Getting all users');
    // Implementation
  }
  
  save(user: User): void {
    this.logger.log(`Saving user: ${user.name}`);
    // Implementation
  }
}
```

### Service with Factory Registration

```typescript
// Register with custom factory
serviceContainer.addSingletonFactory(DatabaseService, (container) => {
  const config = container.getService(ConfigService);
  return new DatabaseService(config.getConnectionString());
});
```

## Advanced DI Features

### Service Scoping

Create and manage scopes for scoped services:

```typescript
const scope = serviceContainer.createScope();

// Use scoped services
const userService = scope.getService(UserService);

// Clear scope when done (e.g., end of request)
scope.clearScope();
```

### Conditional Registration

```typescript
// Register different implementations based on environment
if (process.env.NODE_ENV === 'development') {
  serviceContainer.addSingleton(ILoggerService, ConsoleLoggerService);
} else {
  serviceContainer.addSingleton(ILoggerService, FileLoggerService);
}
```

### Multiple Interface Implementations

```typescript
// Register multiple implementations
serviceContainer.addTransient(INotificationService, EmailNotificationService);
serviceContainer.addTransient(INotificationService, SmsNotificationService);

// Get all implementations
const notificationServices = serviceContainer.getServices(INotificationService);
```

## Example: Complete Service Setup

```typescript
// services/userServices.ts
export interface IUserService {
  getCurrentUser(): User | null;
  getUserById(id: string): User | null;
}

@Scoped
export class UserService implements IUserService {
  constructor(
    private repository: UserRepository,
    private logger: LoggerService
  ) {}
  
  getCurrentUser(): User | null {
    this.logger.log('Getting current user');
    return this.repository.getById('current');
  }
  
  getUserById(id: string): User | null {
    this.logger.log(`Getting user by ID: ${id}`);
    return this.repository.getById(id);
  }
}

// controllers/UserController.ts
@Injectable
export class UserController extends Controller {
  constructor(
    private userService: IUserService,
    private logger: LoggerService
  ) {
    super();
  }
  
  @route('/users/:id')
  async getUserDetails(): Promise<void> {
    const userId = this.getRouteParam('id');
    const user = this.userService.getUserById(userId);
    
    if (!user) {
      this.logger.logWarning(`User not found: ${userId}`);
      this.Redirect('/users');
      return;
    }
    
    await this.View('userDetails', { user });
  }
}
```

## Best Practices

1. **Use Interfaces**: Define interfaces for your services to enable easier testing and swapping implementations
2. **Choose Appropriate Lifetimes**: Use Singleton for stateless services, Scoped for request-specific data, Transient for lightweight operations
3. **Avoid Circular Dependencies**: Design your services to avoid circular references
4. **Use Constructor Injection**: Prefer constructor injection over property injection for required dependencies
5. **Register Early**: Register all services during application startup in `main.ts`

## Integration with ASP.NET Core

ControllerTS DI system is designed to be familiar to .NET developers:

| ControllerTS | ASP.NET Core |
|--------------|--------------|
| `@Injectable` | `[Service]` attribute |
| `@Singleton` | `services.AddSingleton<T>()` |
| `@Scoped` | `services.AddScoped<T>()` |
| `serviceContainer` | `IServiceCollection` |
| Constructor injection | Constructor injection |
| `getService<T>()` | `GetService<T>()` |

This makes it easy for .NET developers to understand and use the dependency injection system in ControllerTS.
