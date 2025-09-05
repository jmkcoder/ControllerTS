# MVC Redirect Functionality

## Overview

The TypeScript MVC framework now supports comprehensive redirect functionality, similar to ASP.NET MVC's redirect methods. Controllers can redirect to routes, external URLs, or specific actions.

## Controller Redirect Methods

### 1. Redirect to Route

Redirect to another route within the application:

```typescript
protected Redirect(route: string): { redirect: true; route: string }
```

**Example:**
```typescript
async redirectToAbout(): Promise<{ redirect: true; route: string }> {
  return this.Redirect('about');
}
```

### 2. Redirect to External URL

Redirect to an external website:

```typescript
protected RedirectToUrl(url: string): { redirect: true; url: string }
```

**Example:**
```typescript
async redirectToGoogle(): Promise<{ redirect: true; url: string }> {
  return this.RedirectToUrl('https://www.google.com');
}
```

### 3. Redirect to Action

Redirect to another action in the same or different controller:

```typescript
protected RedirectToAction(action: string, controller?: string): { redirect: true; action: string; controller?: string }
```

**Example:**
```typescript
async redirectToAction(): Promise<{ redirect: true; action: string; controller?: string }> {
  return this.RedirectToAction('demoAction'); // Same controller
}

async redirectToOtherController(): Promise<{ redirect: true; action: string; controller?: string }> {
  return this.RedirectToAction('index', 'About'); // Different controller
}
```

### 4. Return JSON Data

For AJAX calls that need to return data instead of redirecting:

```typescript
protected Json(data: any): { json: true; data: any }
```

**Example:**
```typescript
async getJsonData(): Promise<{ json: true; data: any }> {
  return this.Json({
    message: 'Success',
    data: ['item1', 'item2', 'item3']
  });
}
```

## Usage Examples

### Basic Controller with Redirects

```typescript
export class HomeController extends Controller {
  async execute(): Promise<void> {
    await this.View('views/home.njk', { title: 'Home Page' });
  }

  async redirectToAbout(): Promise<{ redirect: true; route: string }> {
    return this.Redirect('about');
  }

  async redirectToGoogle(): Promise<{ redirect: true; url: string }> {
    return this.RedirectToUrl('https://www.google.com');
  }

  async processForm(formData: FormData): Promise<any> {
    const username = formData.get('username') as string;
    
    if (!username) {
      return { success: false, error: 'Username is required' };
    }
    
    // Process the form data
    console.log('Processing user:', username);
    
    // Redirect after successful processing
    return this.Redirect('success');
  }

  async conditionalRedirect(data: any): Promise<any> {
    if (data.shouldRedirect) {
      return this.Redirect('about');
    } else {
      return this.Json({ message: 'No redirect needed', data });
    }
  }
}
```

### Template Usage with MVC Attributes

```html
<!-- Redirect Buttons -->
<button mvc-controller="Home" mvc-action="redirectToAbout">
  Go to About Page
</button>

<button mvc-controller="Home" mvc-action="redirectToGoogle">
  Visit Google
</button>

<!-- Form that redirects on success -->
<form mvc-controller="Home" mvc-action="processForm">
  <input name="username" placeholder="Username" required />
  <button type="submit">Submit and Redirect</button>
</form>

<!-- Conditional redirect -->
<button mvc-controller="Home" 
        mvc-action="conditionalRedirect"
        mvc-data='{"shouldRedirect": true}'>
  Conditional Redirect
</button>
```

## Automatic Redirect Handling

The framework automatically handles redirects returned from controller actions:

1. **Route Redirects**: Changes `window.location.hash`
2. **URL Redirects**: Changes `window.location.href`
3. **Action Redirects**: Constructs route and changes hash

When a redirect occurs:
- UI updates are skipped (no result templates rendered)
- The browser navigates to the new location
- `redirected: true` is returned in the result

## Advanced Scenarios

### POST-Redirect-GET Pattern

```typescript
async createUser(formData: FormData): Promise<any> {
  const user = {
    name: formData.get('name'),
    email: formData.get('email')
  };
  
  try {
    // Save user to database (simulated)
    console.log('Creating user:', user);
    
    // Redirect to success page
    return this.Redirect('user-created');
  } catch (error) {
    return { 
      success: false, 
      error: 'Failed to create user' 
    };
  }
}
```

### Conditional Redirects Based on User Input

```typescript
async handleLogin(formData: FormData): Promise<any> {
  const username = formData.get('username') as string;
  const password = formData.get('password') as string;
  
  // Simulate authentication
  if (username === 'admin' && password === 'admin') {
    return this.Redirect('admin-dashboard');
  } else if (username && password) {
    return this.Redirect('user-dashboard');
  } else {
    return { 
      success: false, 
      error: 'Invalid credentials' 
    };
  }
}
```

### External Integration Redirects

```typescript
async authenticateWithProvider(data: any): Promise<any> {
  const provider = data.provider;
  
  switch (provider) {
    case 'google':
      return this.RedirectToUrl('https://accounts.google.com/oauth/authorize?...');
    case 'github':
      return this.RedirectToUrl('https://github.com/login/oauth/authorize?...');
    default:
      return { success: false, error: 'Unknown provider' };
  }
}
```

## Redirect Attributes

You can control redirect behavior with MVC attributes:

| Attribute | Description | Usage |
|-----------|-------------|-------|
| `mvc-no-redirect-ui` | Skip UI updates on redirect | `mvc-no-redirect-ui="true"` |
| `mvc-redirect-delay` | Delay before redirect (ms) | `mvc-redirect-delay="2000"` |

```html
<button mvc-controller="Home" 
        mvc-action="redirectToAbout"
        mvc-no-redirect-ui="true">
  Silent Redirect
</button>
```

## Events

Redirect events are fired for advanced handling:

```javascript
document.addEventListener('mvc-redirect', function(event) {
  console.log('Redirect triggered:', event.detail);
  // event.detail contains: { type, destination, controller, action }
});
```

## Best Practices

1. **Use POST-Redirect-GET** for form submissions
2. **Return JSON for AJAX** calls that need data
3. **Use route redirects** for internal navigation
4. **Use URL redirects** for external sites
5. **Handle errors gracefully** - don't redirect on errors
6. **Provide user feedback** before redirects when appropriate

This redirect system provides a familiar, ASP.NET MVC-style experience while leveraging modern JavaScript capabilities for smooth navigation.
