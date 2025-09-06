# Universal Form Interception

The HtmlHelper now provides **universal form interception**, automatically intercepting ALL form submissions in your application and processing them through the MVC system with decorator validation.

## How It Works

### Before (MVC Attributes Required)
Previously, only forms with explicit MVC attributes were intercepted:

```html
<!-- Only this form would be intercepted -->
<form mvc-controller="contact" mvc-action="submit" mvc-result-target="result">
  <input name="email" type="email" />
  <button type="submit">Submit</button>
</form>

<!-- This form would submit normally (page reload) -->
<form action="/contact/submit" method="POST">
  <input name="email" type="email" />
  <button type="submit">Submit</button>
</form>
```

### After (Universal Interception)
Now ALL forms are automatically intercepted and processed:

```html
<!-- All of these forms are intercepted and processed via AJAX -->

<!-- Form with action attribute -->
<form action="/contact/submit" method="POST">
  <input name="email" type="email" />
  <button type="submit">Submit</button>
</form>

<!-- Form with MVC attributes (still works) -->
<form mvc-controller="contact" mvc-action="submit">
  <input name="email" type="email" />
  <button type="submit">Submit</button>
</form>

<!-- Form without action (infers from current URL) -->
<form method="POST">
  <input name="email" type="email" />
  <button type="submit">Submit</button>
</form>
```

## Route Detection Logic

The system automatically determines the controller and action using the following priority:

1. **Explicit MVC Attributes** (highest priority)
   ```html
   <form mvc-controller="user" mvc-action="register">
   ```

2. **Form Action Attribute**
   ```html
   <form action="/contact/submit" method="POST">
   <!-- Extracts: controller="contact", action="submit" -->
   ```

3. **Current URL Inference** (fallback)
   ```html
   <!-- On page /contact -->
   <form method="POST">
   <!-- Infers: controller="contact", action="submit" -->
   ```

## Automatic Validation

All intercepted forms automatically use the decorator validation system:

```typescript
// ContactController.ts
class ContactController extends Controller {
  @route('POST', '/contact/submit')
  async submit(contactForm: ContactFormModel) {
    // Model automatically validated with decorators
    if (!this.modelState.isValid) {
      return this.Json({ 
        success: false, 
        errors: this.modelState.errors 
      });
    }
    
    // Process valid form
    return this.Json({ success: true, message: 'Contact sent!' });
  }
}

// ContactFormModel.ts
class ContactFormModel {
  @Required('Name is required')
  @StringLength(2, 100, 'Name must be 2-100 characters')
  name: string;

  @Required('Email is required')
  @Email('Please enter a valid email address')
  email: string;

  @Required('Message is required')
  @StringLength(10, 1000, 'Message must be 10-1000 characters')
  message: string;
}
```

## Error Display

Validation errors are automatically displayed:

- **Field-level errors**: Shown next to each input field
- **General errors**: Displayed in result containers
- **Visual indicators**: Invalid fields get red borders
- **Error styling**: Both Bootstrap and Tailwind CSS classes applied

```html
<!-- Validation errors automatically inserted -->
<form action="/contact/submit" method="POST">
  <input name="email" class="is-invalid border-red-500" />
  <div class="invalid-feedback">⚠️ Please enter a valid email address</div>
  
  <div class="validation-summary">
    <div class="alert alert-danger">Please correct the following errors:</div>
  </div>
</form>
```

## Result Handling

### Automatic Result Containers
If no explicit result target is specified, the system automatically:

1. Looks for existing `.validation-summary` or `.alert` elements
2. Creates a new result container at the top of the form if none found
3. Shows success/error messages with appropriate styling

### Custom Result Targets
You can still specify custom result targets:

```html
<form action="/contact/submit" mvc-result-target="my-result">
  <!-- form fields -->
</form>

<div id="my-result" class="d-none">
  <!-- Results will be shown here -->
</div>
```

### Success/Error Templates
Customize the display templates:

```html
<form action="/contact/submit" 
      mvc-success-template="<div class='alert alert-success'>✅ {{result}}</div>"
      mvc-error-template="<div class='alert alert-danger'>❌ {{error}}</div>">
  <!-- form fields -->
</form>
```

## Benefits

### 1. **Zero Configuration**
- No need to add MVC attributes to every form
- Works with existing HTML forms out of the box
- Automatically handles route detection

### 2. **Consistent Validation**
- All forms use the same decorator validation system
- Field-level error display for better UX
- Automatic error styling and positioning

### 3. **Better User Experience**
- No page reloads on form submission
- Real-time validation feedback
- Loading states on submit buttons
- Smooth error/success transitions

### 4. **Progressive Enhancement**
- Graceful fallback if JavaScript fails
- Works with any form structure
- Maintains semantic HTML

## Migration Guide

### Existing Forms
Your existing forms with MVC attributes continue to work exactly as before. No changes needed.

### New Forms
Simply create standard HTML forms and they'll automatically be enhanced:

```html
<!-- Old way (still works) -->
<form mvc-controller="user" mvc-action="login" mvc-result-target="login-result">

<!-- New way (automatically enhanced) -->
<form action="/user/login" method="POST">
```

### Legacy Compatibility
If you need to disable interception for specific forms, add:

```html
<form action="/legacy/endpoint" data-mvc-ignore="true">
  <!-- This form will submit normally -->
</form>
```

## Technical Implementation

The universal form interception is implemented in `HtmlHelper.submitHandler()`:

1. **Event Listener**: Captures all `submit` events on the document
2. **Route Resolution**: Determines controller/action from attributes, action, or URL
3. **Data Collection**: Extracts form data as key-value pairs
4. **Validation**: Processes through ModelValidator with decorators
5. **Result Handling**: Updates UI with success/error messages
6. **State Management**: Manages button states and form reset

This provides a seamless, universal form handling experience while maintaining the power and flexibility of the MVC decorator validation system.
