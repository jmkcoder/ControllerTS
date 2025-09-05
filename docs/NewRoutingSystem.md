# Updated Routing System

The MVC framework now supports clean URLs with the HTML5 History API and both decorator-based routing and the default `/controller/action` pattern.

## Route Decorator Usage

Controllers can now use the `@route` decorator to define custom routes:

```typescript
import { Controller } from '../core/controller';
import { route } from '../core/decorators';

export class HomeController extends Controller {
  @route('home')
  @route('')  // Root route
  async execute(): Promise<void> {
    await this.View('views/home.njk', { 
        title: 'Welcome to TypeScript MVC!', 
        subtitle: 'This is the home page rendered by Nunjucks!' 
   });
  }

  @route('home/demo')
  async demoAction(): Promise<void> {
    await this.View('views/demo.njk', {
      title: 'Demo Action Page',
      message: 'Hello from the demo action!',
      timestamp: new Date().toISOString()
    });
  }
}
```

## Routing Patterns

The router now supports multiple routing patterns in this order of priority:

1. **Decorator Routes**: Routes defined with `@route` decorator
   - `@route('home')` → `/home`
   - `@route('home/demo')` → `/home/demo`
   - `@route('')` → `/` (root route)

2. **Legacy Routes**: Manually registered routes (for backward compatibility)
   - `router.addRoute('home', HomeController)`

3. **Controller/Action Pattern**: Automatic routing based on controller and action names
   - `/home/demo` → `HomeController.demo()`
   - `/about/index` → `AboutController.index()`

4. **Default Controller**: Single controller name routes to the default `execute()` method
   - `/home` → `HomeController.execute()`
   - `/about` → `AboutController.execute()`

## Key Features

### Clean URLs
- No hash (`#`) required for routing
- Uses HTML5 History API for client-side navigation
- URLs like `/home/demo` instead of hash-based routing

### Normal Hash Behavior
- **Hash fragments work exactly like standard HTML anchors**
- `#section-id` scrolls to elements with that ID on the current page
- `/about#info-section` navigates to the about page AND scrolls to the anchor
- Preserves all standard web behavior for page anchors
- No interference with routing system

### Intelligent Link Handling
- Same-page anchors (`#anchor`) are handled normally (browser scrolling)
- Cross-page links (`/page`) use client-side routing
- Cross-page anchors (`/page#anchor`) combine both behaviors
- External links work normally without interference

### Client-Side Navigation
- `window.history.pushState()` for programmatic navigation
- Browser back/forward buttons work correctly
- Bookmarkable URLs

## Available Routes

### Home Controller
- `/` - Root page (default home)
- `/home` - Home page
- `/home/index` - Same as home
- `/home/demo` - Demo action with view
- `/home/submit` - Form submission
- `/home/json` - JSON response
- `/home/redirect-home` - Redirect to home
- `/home/redirect-about` - Redirect to about
- `/home/redirect-google` - External redirect
- `/home/process` - Process and conditionally redirect

### About Controller
- `/about` - About page
- `/about/index` - Same as about
- `/about/home` - Redirect back to home

## Testing the Routes

You can test these routes by navigating to:
- `http://localhost:5173/` (Home)
- `http://localhost:5173/home/demo` (Demo action)
- `http://localhost:5173/about` (About page)
- `http://localhost:5173/about/home` (Redirect example)

## Navigation Examples

### In Templates (Nunjucks)
```html
<!-- Route navigation (client-side) -->
<a href="/">Home</a>
<a href="/about">About</a>
<a href="/home/demo">Demo</a>

<!-- Page anchors (normal hash behavior) -->
<a href="#section1">Scroll to Section 1</a>
<a href="#demo-area">Scroll to Demo Area</a>

<!-- Combined: route + anchor -->
<a href="/about#info-section">Go to About page, scroll to Info</a>
<a href="/home#features-section">Go to Home page, scroll to Features</a>
```

### Programmatic Navigation
```typescript
// In controller actions
this.Redirect('/home');
this.RedirectToAction('demo', 'Home');

// In JavaScript - route navigation
window.history.pushState({}, '', '/about');
window.dispatchEvent(new PopStateEvent('popstate'));

// In JavaScript - anchor scrolling (normal behavior)
window.location.hash = 'section-id';  // Just scrolls, no route change
```

## Hash Behavior Examples

### What Works as Expected:
- `http://localhost:5173/` - Home page
- `http://localhost:5173/#demo-section` - Home page, scrolled to demo section
- `http://localhost:5173/about` - About page  
- `http://localhost:5173/about#info-section` - About page, scrolled to info section
- `http://localhost:5173/home/demo#features-section` - Demo action page, scrolled to features

### Link Behavior:
- `<a href="#anchor">` - Scrolls to anchor on current page (normal hash behavior)
- `<a href="/page">` - Navigates to page using client-side routing
- `<a href="/page#anchor">` - Navigates to page AND scrolls to anchor
- `<a href="https://external.com">` - Normal external link (full page load)

The system maintains backward compatibility while providing a modern, clean URL experience similar to server-side MVC frameworks.
