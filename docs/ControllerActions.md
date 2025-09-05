# How to Call Controller Actions from Nunjucks Templates

## Overview

This TypeScript MVC framework now supports **ASP.NET MVC-style** HTML attributes for calling controller actions directly from templates. You can use `mvc-controller` and `mvc-action` attributes on buttons and forms, similar to how ASP.NET MVC works.

## Quick Start

### 1. Simple Button with MVC Attributes

```html
<button mvc-controller="Home" 
        mvc-action="demoAction" 
        mvc-result-target="results">
  Call Demo Action
</button>

<div id="results"></div>
```

### 2. Form with MVC Attributes

```html
<form mvc-controller="Home" 
      mvc-action="submitForm" 
      mvc-result-target="results"
      mvc-reset-on-success="true">
  <input type="text" name="username" placeholder="Username" />
  <button type="submit">Submit</button>
</form>
```

## MVC Attribute Reference

### Core Attributes

| Attribute | Description | Required |
|-----------|-------------|----------|
| `mvc-controller` | Controller name (e.g., "Home") | ✅ Yes |
| `mvc-action` | Action method name (e.g., "demoAction") | ✅ Yes |
| `mvc-data` | JSON data to pass to action | ❌ No |
| `mvc-result-target` | ID of element to display results | ❌ No |

### UI Enhancement Attributes

| Attribute | Description | Default |
|-----------|-------------|---------|
| `mvc-loading-text` | Text to show while loading | "Loading..." |
| `mvc-success-template` | HTML template for success | Basic success div |
| `mvc-error-template` | HTML template for errors | Basic error div |
| `mvc-reset-on-success` | Reset form on success (forms only) | false |

### Template Placeholders

- `{{result}}` - Replaced with JSON.stringify(result.data, null, 2)
- `{{error}}` - Replaced with error message

## Advanced Examples

### Button with Custom Data and Templates

```html
<button mvc-controller="Home" 
        mvc-action="demoAction" 
        mvc-data='{"userId": 123, "action": "click"}' 
        mvc-result-target="results"
        mvc-loading-text="Processing..."
        mvc-success-template='<div class="alert alert-success">Success: {{result}}</div>'
        mvc-error-template='<div class="alert alert-error">Failed: {{error}}</div>'>
  Advanced Action Call
</button>
```

### Form with Custom Success Handling

```html
<form mvc-controller="User" 
      mvc-action="createUser" 
      mvc-result-target="user-results"
      mvc-reset-on-success="true"
      mvc-success-template='<div class="alert alert-success"><strong>User Created!</strong><br>{{result}}</div>'>
  <input type="text" name="username" required />
  <input type="email" name="email" required />
  <button type="submit">Create User</button>
</form>
```

## JavaScript API (Legacy & Direct Access)

### Html.Action (Recommended)

```javascript
// ASP.NET MVC-style action call
const result = await window.Html.Action('Home', 'demoAction', { data: 'test' });

if (result.success) {
  console.log('Success:', result.data);
} else {
  console.error('Error:', result.error);
}
```

### Legacy callControllerAction (Still Supported)

```javascript
// Legacy method (still works)
const result = await callControllerAction('Home', 'demoAction', { data: 'test' });
```

## Event Handling

The system fires custom events for advanced scenarios:

```javascript
// Listen for action completions
document.addEventListener('mvc-action-complete', function(event) {
  console.log('Action completed:', event.detail);
  // event.detail contains: { controller, action, result, element }
});

// Listen for form submissions
document.addEventListener('mvc-form-submit-complete', function(event) {
  console.log('Form submitted:', event.detail);
  // event.detail contains: { controller, action, result, form }
});
```

## Controller Setup

### 1. Controller with Action Methods

```typescript
export class HomeController extends Controller {
  async execute(): Promise<void> {
    await this.View('views/home.njk', { 
        title: 'Welcome to TypeScript MVC!', 
        subtitle: 'This is the home page rendered by Nunjucks!' 
   });
  }

  async demoAction(data?: any): Promise<{ message: string; timestamp: string; data?: any }> {
    console.log('Demo action called with data:', data);
    return {
      message: 'Hello from the demo action!',
      timestamp: new Date().toISOString(),
      data: data
    };
  }

  async submitForm(formData: FormData): Promise<{ success: boolean; message: string }> {
    console.log('Form submitted with data:', Object.fromEntries(formData));
    return {
      success: true,
      message: 'Form submitted successfully!'
    };
  }
}
```

### 2. Controller Registration

```typescript
// In main.ts
import { ControllerManager } from './core/controllerManager';
import { HtmlHelper } from './core/htmlHelper';

// Register controllers
ControllerManager.registerController('Home', HomeController);
ControllerManager.registerController('User', UserController);
```

## CSS Classes (Optional)

The framework includes CSS classes for consistent styling:

```css
.alert { /* Base alert styling */ }
.alert-success { /* Green success alerts */ }
.alert-error { /* Red error alerts */ }
.alert-warning { /* Yellow warning alerts */ }
.alert-info { /* Blue info alerts */ }
```

## Best Practices

1. **Use MVC Attributes**: Prefer `mvc-controller` and `mvc-action` over manual JavaScript
2. **Provide Feedback**: Always use `mvc-result-target` to show users what happened
3. **Handle Errors**: Include `mvc-error-template` for better error UX
4. **Loading States**: Use `mvc-loading-text` to indicate processing
5. **Form Reset**: Use `mvc-reset-on-success="true"` for forms that should clear on success

## Migration from Legacy

If you have existing `callControllerAction()` calls, they still work:

```javascript
// Old way (still works)
const result = await callControllerAction('Home', 'demoAction', data);

// New way (recommended)
const result = await window.Html.Action('Home', 'demoAction', data);

// Best way (declarative)
<button mvc-controller="Home" mvc-action="demoAction">Click Me</button>
```

This approach provides a clean, declarative way to call controller actions that's familiar to ASP.NET MVC developers while maintaining the flexibility of a modern JavaScript framework.
