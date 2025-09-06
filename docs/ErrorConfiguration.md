# Error Page Configuration System

The MVC framework provides a flexible error page configuration system that allows you to customize error pages without modifying the core router code.

## 🎯 Overview

The error configuration system supports three types of error page handling:

1. **Template-based**: Render Nunjucks templates with error data
2. **Controller-based**: Route errors to controller actions
3. **Inline templates**: Simple HTML with variable substitution

## 🔧 Basic Configuration

### Method 1: Template-Based Error Pages

```typescript
import { configureErrorPages } from './core/errorConfig';

configureErrorPages({
  404: {
    template: 'views/errors/404.njk'
  },
  500: {
    template: 'views/errors/500.njk'  
  },
  403: {
    template: 'views/errors/403.njk'
  }
});
```

### Method 2: Controller-Based Error Pages

```typescript
import { configureErrorPages } from './core/errorConfig';

configureErrorPages({
  404: {
    controller: 'Error',
    action: 'notFound'
  },
  500: {
    controller: 'Error', 
    action: 'serverError'
  },
  403: {
    controller: 'Error',
    action: 'forbidden'
  }
});
```

### Method 3: Inline Templates

```typescript
import { configureErrorPages } from './core/errorConfig';

configureErrorPages({
  404: {
    template: `
      <div style="text-align: center; padding: 50px;">
        <h1>{{statusCode}} - {{message}}</h1>
        <p>Page not found</p>
        <a href="/">Go Home</a>
      </div>
    `
  }
});
```

## 🚀 Advanced Configuration

### Individual Error Page Setup

```typescript
import { setErrorPage } from './core/errorConfig';

// Set individual error pages
setErrorPage(404, {
  template: 'views/errors/404.njk',
  data: {
    customMessage: 'Page not found',
    showSuggestions: true
  }
});

setErrorPage(500, {
  controller: 'Error',
  action: 'serverError',
  data: {
    supportEmail: 'support@example.com'
  }
});
```

### Environment-Specific Configuration

```typescript
function setupErrorPages() {
  const isDev = window.location.hostname === 'localhost';
  
  if (isDev) {
    // Development: Show detailed errors
    configureErrorPages({
      500: {
        controller: 'Error',
        action: 'developmentError',
        data: { showStackTrace: true }
      }
    });
  } else {
    // Production: User-friendly errors
    configureErrorPages({
      500: {
        template: 'views/errors/500.njk',
        data: { supportEmail: 'support@company.com' }
      }
    });
  }
}
```

## 📝 Configuration Options

### ErrorPageConfig Interface

```typescript
interface ErrorPageConfig {
  template?: string;           // Template path or inline HTML
  controller?: string;         // Controller name
  action?: string;            // Action method name
  data?: Record<string, any>; // Additional data passed to template/controller
}
```

### Template Data

All error handlers receive the following data:

```typescript
{
  statusCode: number;         // HTTP status code (404, 500, etc.)
  message: string;           // Error message
  details: any;              // Error details (stack trace, etc.)
  timestamp: string;         // ISO timestamp
  // ...plus any custom data from config
}
```

## 🎨 Template Examples

### 404.njk Template

```html
{% extends "shared/_base.njk" %}

{% block title %}{{ statusCode }} - {{ message }}{% endblock %}

{% block content %}
<div class="error-page">
  <h1>{{ statusCode }}</h1>
  <h2>{{ message }}</h2>
  <p>The page you're looking for could not be found.</p>
  
  {% if suggestions %}
  <ul>
    {% for suggestion in suggestions %}
    <li>{{ suggestion }}</li>
    {% endfor %}
  </ul>
  {% endif %}
  
  <a href="/">Go Home</a>
</div>
{% endblock %}
```

### Error Controller Action

```typescript
export class ErrorController extends Controller {
  
  @action('404')
  async notFound(errorData?: any): Promise<void> {
    const data = {
      title: '404 - Page Not Found',
      statusCode: errorData?.statusCode || 404,
      message: errorData?.message || 'Page not found',
      suggestions: [
        'Check the URL for typos',
        'Go back to the previous page',
        'Visit our homepage'
      ],
      ...errorData
    };

    await this.View('views/errors/404.njk', data);
  }
}
```

## 🔄 Usage in Application

### Setup in main.ts

```typescript
import { setupBasicErrorPages } from './errorPagesConfig';

async function initializeApplication() {
  // ... other initialization ...
  
  // Configure error pages
  setupBasicErrorPages();
  
  // ... rest of initialization ...
}
```

### Manual Error Triggering

```typescript
import { ErrorHandler } from './core/errorHandler';

// Trigger specific errors
await ErrorHandler.handle404('Custom 404 message');
await ErrorHandler.handle500(new Error('Something went wrong'));
await ErrorHandler.handleError(403, 'Access denied');
```

## 🛠 Built-in Error Templates

The framework includes default error templates:

- `views/errors/404.njk` - Page not found
- `views/errors/500.njk` - Server error  
- `views/errors/403.njk` - Access forbidden

These templates extend the base layout and provide:
- Clean, responsive design
- Keyboard shortcuts (H for home, R for reload)
- Accessible markup
- Development/production modes
- Stack trace display (development only)

## 🎯 Best Practices

### 1. Use Templates for Consistent Design

```typescript
configureErrorPages({
  404: { template: 'views/errors/404.njk' },
  500: { template: 'views/errors/500.njk' },
  403: { template: 'views/errors/403.njk' }
});
```

### 2. Use Controllers for Complex Logic

```typescript
configureErrorPages({
  500: {
    controller: 'Error',
    action: 'serverError' // Can log errors, send notifications, etc.
  }
});
```

### 3. Environment-Specific Configuration

```typescript
if (isDevelopment) {
  // Show detailed errors in development
  setErrorPage(500, {
    controller: 'Error',
    action: 'developmentError',
    data: { showStackTrace: true }
  });
}
```

### 4. Provide Helpful Information

```typescript
setErrorPage(404, {
  template: 'views/errors/404.njk',
  data: {
    suggestions: ['Check URL', 'Go back', 'Search site'],
    searchEnabled: true,
    contactInfo: { email: 'help@company.com' }
  }
});
```

## 🔍 Debugging

The error configuration is available globally for debugging:

```javascript
// In browser console
window.errorConfig.getAllConfigs()
window.ErrorHandler.handleError(404, 'Test error')
```

## ⚡ Performance Notes

- Templates are cached in production
- Controller-based errors use the DI system
- Inline templates have minimal overhead
- Error pages don't break the middleware pipeline

The error configuration system provides enterprise-grade error handling while maintaining the clean MVC architecture!
