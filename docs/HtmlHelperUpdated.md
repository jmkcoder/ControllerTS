# Updated HtmlHelper with Object Action Support

This document explains the enhanced HtmlHelper that properly handles the new routing system and object actions (`@objectAction` decorators).

## Overview

The HtmlHelper has been completely updated to:

1. **Properly differentiate between view actions and object actions**
2. **Use appropriate methods for each action type**
3. **Integrate with the ActionValidator for proper validation**
4. **Provide better error handling and user feedback**
5. **Support the new decorator-based routing system**

## Key Features

### 🎯 Smart Action Detection
- Automatically detects if an action is object-only (`@objectAction`)
- Uses `Html.Ajax()` for object actions and `Html.Action()` for view actions
- Prevents inappropriate use of object actions for template rendering

### 🛡️ Enhanced Validation
- Integrates with `ActionValidator` for result validation
- Provides clear error messages for violations
- Handles serialization issues gracefully

### 📱 Better AJAX Support
- New `Html.Ajax()` method specifically for API calls
- Improved JSON response formatting
- Support for both object and view actions via AJAX

### 🧭 Navigation Helpers
- `Html.navigateToAction()` for programmatic navigation
- Query parameter support
- Router integration

## Updated API

### Html.Action(controller, action, data)
**Use for**: Traditional view actions that may render views or redirect

```javascript
// View action that might render a view or redirect
const result = await Html.Action('home', 'demo', { param: 'value' });

// Handles redirects automatically
const redirectResult = await Html.Action('home', 'redirectToAbout');
```

**⚠️ Warning**: This method will show a warning if used with object actions.

### Html.Ajax(controller, action, data) [NEW]
**Use for**: API calls to both object actions and view actions

```javascript
// Object action - returns JSON data directly
const users = await Html.Ajax('home', 'getUsersApi');
console.log(users.data); // Array of users

// View action that returns JSON
const stats = await Html.Ajax('home', 'getJsonData');
console.log(stats.data); // JSON response
```

### Html.navigateToAction(controller, action?, queryParams?) [NEW]
**Use for**: Programmatic navigation

```javascript
// Navigate to controller default action
Html.navigateToAction('home');

// Navigate to specific action
Html.navigateToAction('home', 'demo');

// Navigate with query parameters
Html.navigateToAction('home', 'search', {
  q: 'typescript',
  category: 'programming'
});
```

## MVC Attributes

### Enhanced Button Support

```html
<!-- Object Action Button -->
<button 
  mvc-controller="home" 
  mvc-action="getUsersApi"
  mvc-result-target="result-area"
  mvc-loading-text="Loading users..."
  mvc-success-template='<div class="success">{{result}}</div>'>
  Get Users (Object Action)
</button>

<!-- View Action Button -->
<button 
  mvc-controller="home" 
  mvc-action="demo"
  mvc-result-target="result-area"
  mvc-data='{"param": "value"}'>
  Call Demo Action
</button>
```

### Enhanced Form Support

```html
<!-- Object Action Form -->
<form 
  mvc-controller="home" 
  mvc-action="searchApi"
  mvc-result-target="search-results"
  mvc-reset-on-success="true"
  mvc-success-template='<div class="results"><pre>{{result}}</pre></div>'>
  
  <input type="text" name="q" placeholder="Search term" />
  <select name="category">
    <option value="all">All</option>
    <option value="programming">Programming</option>
  </select>
  <button type="submit">Search</button>
</form>
```

### New Template Variables

Object actions automatically get enhanced templates:

```html
<!-- For object actions, {{result}} contains formatted JSON -->
mvc-success-template='<div class="json-result"><pre>{{result}}</pre></div>'

<!-- For view actions, {{result}} contains the raw data -->
mvc-success-template='<div class="data-result">{{result}}</div>'
```

## Action Type Detection

The HtmlHelper automatically detects action types:

```typescript
// Object action - uses Html.Ajax() internally
@objectAction('api/users')
async getUsersApi(): Promise<any> {
  return { users: [...] };
}

// View action - uses Html.Action() internally  
@action('demo')
async demo(): Promise<void> {
  await this.View('views/demo.njk', {});
}
```

## Error Handling

### Enhanced Error Messages

```javascript
// Controller not found
{
  success: false,
  error: "Controller 'nonexistent' not found. Available controllers: home, about, products"
}

// Action not found
{
  success: false,
  error: "Action 'badAction' not found in controller 'home'. Available methods: execute, demo, search"
}

// Object action validation error
{
  success: false,
  error: "Object action HomeController.getUsersApi cannot return redirects. Use regular @action decorator for actions that need to redirect."
}
```

### Error Display in Templates

```html
<button 
  mvc-controller="invalid" 
  mvc-action="action"
  mvc-result-target="error-area"
  mvc-error-template='<div class="alert alert-danger">❌ {{error}}</div>'>
  Test Error Handling
</button>
<div id="error-area"></div>
```

## Migration Guide

### Before (Old HtmlHelper)

```javascript
// Old way - no action type detection
const result = await Html.Action('api', 'getUsers');

// Manual JSON handling
if (result.success && result.data.json) {
  console.log(result.data.data);
}
```

### After (New HtmlHelper)

```javascript
// New way - automatic action type detection
const result = await Html.Ajax('home', 'getUsersApi');
console.log(result.data); // Direct access to data

// Or use the smart Action method
const result = await Html.Action('home', 'getUsersApi'); // Shows warning but works
```

## Controller Manager Integration

The ControllerManager has been updated to work with the new system:

```typescript
// Enhanced error messages
ControllerManager.callAction('invalid', 'action')
// Error: Controller 'invalid' not found. Available controllers: home, about, products

// Automatic validation
ControllerManager.callAction('home', 'getUsersApi')
// Validates object action results automatically
```

## Event System

Enhanced events with action type information:

```javascript
// Button click events
document.addEventListener('mvc-action-complete', (event) => {
  const { controller, action, result, element, isObjectAction } = event.detail;
  
  if (isObjectAction) {
    console.log('Object action completed:', result.data);
  } else {
    console.log('View action completed:', result);
  }
});

// Form submission events
document.addEventListener('mvc-form-submit-complete', (event) => {
  const { controller, action, result, form, isObjectAction } = event.detail;
  // Handle form completion
});
```

## Best Practices

### 1. Use Appropriate Methods

```javascript
// ✅ Good - Use Ajax for API calls
const apiData = await Html.Ajax('api', 'getUsers');

// ✅ Good - Use Action for page interactions
const pageResult = await Html.Action('home', 'processForm');

// ❌ Avoid - Don't use Action for object actions
const apiData = await Html.Action('api', 'getUsers'); // Shows warning
```

### 2. Handle Object Action Results

```javascript
// ✅ Good - Object actions return structured data
const result = await Html.Ajax('home', 'getUsersApi');
if (result.success) {
  const users = result.data.users;
  // Process users array
}

// ✅ Good - Check for errors
if (!result.success) {
  console.error('API call failed:', result.error);
}
```

### 3. Use Appropriate Templates

```html
<!-- ✅ Good - Object action template with JSON formatting -->
<button mvc-controller="home" mvc-action="getUsersApi"
        mvc-success-template='<pre>{{result}}</pre>'>
  Get Users
</button>

<!-- ✅ Good - View action template -->
<button mvc-controller="home" mvc-action="demo"
        mvc-success-template='<div>{{result}}</div>'>
  Demo Action
</button>
```

## Performance Considerations

1. **Object actions are faster** - No view rendering overhead
2. **Automatic JSON formatting** - Efficient serialization
3. **Smart method selection** - Uses appropriate internal methods
4. **Reduced network overhead** - Direct JSON responses

## Testing

### Unit Testing Controllers

```typescript
// Test object actions
test('getUsersApi returns user data', async () => {
  const result = await Html.Ajax('home', 'getUsersApi');
  
  expect(result.success).toBe(true);
  expect(result.data).toHaveProperty('users');
  expect(Array.isArray(result.data.users)).toBe(true);
});

// Test view actions
test('demo action works correctly', async () => {
  const result = await Html.Action('home', 'demo');
  
  expect(result.success).toBe(true);
  // May redirect or return data
});
```

### Integration Testing

```typescript
// Test MVC attributes
test('mvc-controller attribute calls object action', async () => {
  const button = document.createElement('button');
  button.setAttribute('mvc-controller', 'home');
  button.setAttribute('mvc-action', 'getUsersApi');
  
  button.click();
  
  // Verify AJAX call was made
  // Verify result was displayed
});
```

## Debugging

### Enable Debug Logging

```javascript
// The HtmlHelper automatically logs action type detection
// Look for these messages in the console:

// ⚠️ Object action HomeController.getUsersApi called from template. Object actions should only be used for AJAX/API calls.
// ❌ Action validation failed: Object action cannot return redirects
// 🔧 Using Ajax method for object action: home.getUsersApi
```

### Check Action Registration

```javascript
// View registered routes
console.log(Html.getRegisteredRoutes());

// Check if action is object-only
console.log(Html.isObjectAction('home', 'getUsersApi')); // true
console.log(Html.isObjectAction('home', 'demo')); // false
```

## Summary

The updated HtmlHelper provides:

- 🎯 **Smart action detection** - Automatically handles object vs view actions
- 🛡️ **Enhanced validation** - Prevents common mistakes
- 📱 **Better AJAX support** - Dedicated methods for API calls  
- 🧭 **Navigation helpers** - Programmatic routing support
- 🚀 **Improved performance** - Optimized for different action types
- ✅ **Better error handling** - Clear, actionable error messages

Use the demo page at `/home/htmlhelper-demo` to test all features interactively.
