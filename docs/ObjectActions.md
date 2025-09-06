# Object-Only Actions

This document explains how to use the new `@objectAction` decorator to create actions that can only return objects/JSON data and cannot render views or redirects.

## Overview

Object-only actions are a special type of controller action designed for API endpoints that need to ensure they only return structured data. These actions provide type safety and runtime validation to prevent common mistakes like accidentally rendering views or returning redirects from API endpoints.

## Key Features

- **Type Safety**: Object actions can only return objects, arrays, or primitives
- **Runtime Validation**: Automatic validation prevents views/redirects in object actions
- **Clean API Design**: Clear separation between view actions and data actions
- **JSON Response**: Automatic JSON formatting for browser display
- **Error Prevention**: Compile-time and runtime checks for common mistakes

## Basic Usage

### Import the Decorator

```typescript
import { objectAction } from '../core/decorators';
```

### Define Object Actions

```typescript
@controller('api')
export class ApiController extends Controller {
  
  @objectAction('users')  // Maps to /api/users
  async getUsers(): Promise<any> {
    // ✅ This is valid - returning an object
    return {
      success: true,
      users: this.userService.getAllUsers(),
      timestamp: new Date().toISOString()
    };
  }
  
  @objectAction('config', 'GET')  // Maps to /api/config
  async getConfig(): Promise<any> {
    // ✅ This is valid - returning configuration data
    return {
      appName: 'My App',
      version: '1.0.0',
      features: ['feature1', 'feature2']
    };
  }
}
```

## Decorator Syntax

```typescript
@objectAction(route?: string, method?: string)
```

- **route**: Optional route path (default: empty string)
- **method**: HTTP method (default: 'GET')

### Examples

```typescript
@objectAction()                    // Maps to controller base route
@objectAction('data')              // Maps to /controller/data  
@objectAction('search', 'POST')    // POST /controller/search
@objectAction('api/v1/users')      // Maps to /controller/api/v1/users
```

## What's Allowed in Object Actions

### ✅ Valid Returns

```typescript
@objectAction('valid-examples')
async validExamples(): Promise<any> {
  // Simple objects
  return { message: 'Hello', status: 'ok' };
  
  // Arrays
  return [1, 2, 3, { id: 1, name: 'test' }];
  
  // Primitives
  return 'Hello World';
  return 42;
  return true;
  
  // Complex nested objects
  return {
    data: {
      users: [...],
      meta: { count: 10 }
    },
    pagination: { page: 1, total: 100 }
  };
}
```

### ✅ Using Services and DI

```typescript
@objectAction('user-stats')
async getUserStats(): Promise<any> {
  // ✅ DI works normally
  const users = this.userService.getAllUsers();
  const logs = this.logger.getLogs();
  
  // ✅ Return computed data
  return {
    totalUsers: users.length,
    activeUsers: users.filter(u => u.active).length,
    lastActivity: logs[logs.length - 1]
  };
}
```

### ✅ Query Parameters

```typescript
@objectAction('search')
async search(): Promise<any> {
  // ✅ Query parameters work normally
  const query = this.getQueryParam('q');
  const page = parseInt(this.getQueryParam('page') || '1');
  
  return {
    query,
    page,
    results: this.performSearch(query, page)
  };
}
```

## What's NOT Allowed in Object Actions

### ❌ View Rendering

```typescript
@objectAction('invalid-view')
async invalidView(): Promise<void> {
  // ❌ ERROR: Object actions cannot render views
  await this.View('views/home.njk', {});
}
```

### ❌ Redirects

```typescript
@objectAction('invalid-redirect')
async invalidRedirect(): Promise<any> {
  // ❌ ERROR: Object actions cannot redirect
  return this.Redirect('/home');
  
  // ❌ ERROR: No external redirects either
  return this.RedirectToUrl('https://google.com');
  
  // ❌ ERROR: No action redirects
  return this.RedirectToAction('someAction');
}
```

### ❌ Void Returns (unless returning undefined)

```typescript
@objectAction('invalid-void')
async invalidVoid(): Promise<void> {
  // ❌ ERROR: Object actions must return data
  // (void return suggests a view was rendered)
}
```

### ❌ Non-Serializable Objects

```typescript
@objectAction('invalid-function')
async invalidFunction(): Promise<any> {
  // ❌ ERROR: Functions cannot be serialized
  return {
    callback: () => { console.log('test'); }
  };
}
```

## Error Handling

The system provides helpful error messages when object actions violate the rules:

```typescript
// Runtime Error Examples:
❌ "Object action ApiController.getUsers cannot return redirects. Use regular @action decorator for actions that need to redirect."

❌ "Object action ApiController.getData must return an object or use this.Json(). It cannot render views or return void."

❌ "Object action ApiController.getConfig returned a non-serializable result. Return plain objects, arrays, or primitives."
```

## Comparison with Regular Actions

### Regular Actions (`@action`)

```typescript
@action('flexible')
async flexibleAction(): Promise<any> {
  // ✅ Can render views
  await this.View('views/page.njk', {});
  
  // ✅ Can redirect
  return this.Redirect('/other-page');
  
  // ✅ Can return JSON
  return this.Json({ data: 'value' });
  
  // ✅ Can return objects
  return { message: 'Hello' };
}
```

### Object Actions (`@objectAction`)

```typescript
@objectAction('strict')
async strictAction(): Promise<any> {
  // ❌ Cannot render views
  // ❌ Cannot redirect
  
  // ✅ Can return objects directly
  return { data: 'value' };
  
  // ✅ Can use this.Json() but it's not required
  return this.Json({ data: 'value' }); // Equivalent to above
}
```

## Real-World Examples

### API Controller

```typescript
@controller('api/v1')
export class ApiV1Controller extends Controller {
  
  @objectAction('health')
  async healthCheck(): Promise<any> {
    return {
      status: 'healthy',
      timestamp: new Date().toISOString(),
      version: '1.0.0',
      uptime: process.uptime()
    };
  }
  
  @objectAction('users', 'GET')
  async listUsers(): Promise<any> {
    const users = this.userService.getAllUsers();
    return {
      success: true,
      data: users,
      count: users.length
    };
  }
  
  @objectAction('users', 'POST')
  async createUser(): Promise<any> {
    const userData = this.getQueryParams();
    const newUser = this.userService.createUser(userData);
    
    return {
      success: true,
      message: 'User created successfully',
      data: newUser,
      id: newUser.id
    };
  }
}
```

### Data Export Controller

```typescript
@controller('export')
export class ExportController extends Controller {
  
  @objectAction('csv-data')
  async getCsvData(): Promise<any> {
    const users = this.userService.getAllUsers();
    
    return {
      format: 'csv',
      headers: ['ID', 'Name', 'Email'],
      rows: users.map(u => [u.id, u.name, u.email]),
      totalRecords: users.length,
      exportedAt: new Date().toISOString()
    };
  }
  
  @objectAction('report')
  async generateReport(): Promise<any> {
    return {
      reportType: 'user-activity',
      generatedAt: new Date().toISOString(),
      data: {
        totalUsers: 150,
        activeToday: 45,
        newThisWeek: 12
      },
      charts: [
        { type: 'line', data: [1, 5, 10, 15, 12] },
        { type: 'pie', data: { active: 45, inactive: 105 } }
      ]
    };
  }
}
```

## Best Practices

### 1. Use Descriptive Route Names

```typescript
// ✅ Good
@objectAction('api/users/active')
@objectAction('data/monthly-stats')
@objectAction('export/csv-format')

// ❌ Avoid
@objectAction('data')
@objectAction('get')
```

### 2. Include Metadata in Responses

```typescript
@objectAction('user-list')
async getUserList(): Promise<any> {
  const users = this.userService.getAllUsers();
  
  return {
    // ✅ Include success/error status
    success: true,
    
    // ✅ Include timestamps
    timestamp: new Date().toISOString(),
    
    // ✅ Include metadata
    metadata: {
      totalCount: users.length,
      endpoint: 'getUserList',
      version: 'v1'
    },
    
    // ✅ Actual data
    data: users
  };
}
```

### 3. Handle Errors Gracefully

```typescript
@objectAction('risky-operation')
async riskyOperation(): Promise<any> {
  try {
    const result = await this.someService.dangerousOperation();
    return {
      success: true,
      data: result
    };
  } catch (error) {
    return {
      success: false,
      error: error.message,
      timestamp: new Date().toISOString()
    };
  }
}
```

### 4. Use Consistent Response Formats

```typescript
// ✅ Consistent API response format
interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  timestamp: string;
  metadata?: Record<string, any>;
}

@objectAction('consistent-api')
async consistentApi(): Promise<ApiResponse<any>> {
  return {
    success: true,
    data: { /* your data */ },
    timestamp: new Date().toISOString(),
    metadata: { version: 'v1' }
  };
}
```

## Testing Object Actions

### Unit Testing

```typescript
describe('Object Actions', () => {
  test('should return valid JSON data', async () => {
    const controller = new ApiController();
    const result = await controller.getUsers();
    
    expect(result).toHaveProperty('success');
    expect(result).toHaveProperty('data');
    expect(Array.isArray(result.data)).toBe(true);
  });
  
  test('should throw error for redirect attempts', async () => {
    // Object actions should prevent redirects at runtime
    const controller = new ApiController();
    
    await expect(controller.invalidRedirect()).rejects.toThrow(
      'Object action ApiController.invalidRedirect cannot return redirects'
    );
  });
});
```

### Integration Testing

```typescript
test('object action route returns JSON', async () => {
  const response = await fetch('/api/users');
  const data = await response.json();
  
  expect(data).toHaveProperty('success');
  expect(data).toHaveProperty('users');
});
```

## Migration Guide

### Converting Regular Actions to Object Actions

```typescript
// Before: Regular action with manual JSON return
@action('user-data')
async getUserData(): Promise<any> {
  const users = this.userService.getAllUsers();
  return this.Json({
    users,
    count: users.length
  });
}

// After: Object action with direct return
@objectAction('user-data')
async getUserData(): Promise<any> {
  const users = this.userService.getAllUsers();
  return {
    users,
    count: users.length
  };
}
```

The object action approach is cleaner and provides better type safety and validation.

## Summary

Object-only actions provide:

- 🛡️ **Type Safety**: Prevents common API mistakes
- 🚀 **Performance**: No view rendering overhead
- 🧹 **Clean Code**: Clear separation of concerns
- ✅ **Validation**: Runtime checks for compliance
- 📱 **API-First**: Designed for modern API development

Use `@objectAction` for API endpoints and data services, and `@action` for traditional web pages and flexible endpoints.
