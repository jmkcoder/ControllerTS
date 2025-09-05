# Controller Redirect Methods Documentation

## Updated Redirect Methods for Clean URL Routing

The controller redirect methods have been updated to work with the new clean URL routing system:

### Basic Redirects

```typescript
// Redirect to home page
this.Redirect('/');           // Goes to root
this.Redirect('/home');       // Goes to /home

// Redirect to other pages
this.Redirect('/about');      // Goes to /about
this.Redirect('/home/demo');  // Goes to /home/demo
```

### Action Redirects

```typescript
// Redirect to action in current controller
this.RedirectToAction('demoAction');           // Goes to /home/demo (smart mapping)
this.RedirectToAction('execute');              // Goes to /home
this.RedirectToAction('index');                // Goes to /home

// Redirect to action in different controller  
this.RedirectToAction('execute', 'About');     // Goes to /about
this.RedirectToAction('index', 'About');       // Goes to /about
```

### External Redirects

```typescript
// External URL redirect (unchanged)
this.RedirectToUrl('https://www.google.com');
this.RedirectToUrl('https://github.com');
```

## Smart Action Mapping

The `RedirectToAction` method now includes smart mapping for common scenarios:

- `demoAction` in `HomeController` → `/home/demo`
- `execute` or `index` in any controller → `/controllername`
- Other actions → `/controllername/actionname`

## Examples from HomeController

```typescript
// These all work with clean URLs:
return this.Redirect('/');                     // Home page
return this.Redirect('/about');                // About page  
return this.RedirectToAction('demoAction');    // /home/demo
return this.RedirectToUrl('https://github.com'); // External
```

## Hash Behavior

Redirects now work with normal hash anchors:

```typescript
// These would work if implementing hash support
this.Redirect('/about#info-section');    // Navigate to about + scroll to anchor
this.Redirect('/#demo-section');         // Navigate to home + scroll to demo
```

All redirect methods now use the HTML5 History API for seamless client-side navigation.
