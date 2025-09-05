# Pure TypeScript MVC Framework (Frontend)

This project is a pure TypeScript MVC framework inspired by .NET MVC, designed for frontend-only applications. It uses Vite for fast development and Nunjucks as the view engine.

## Structure
- `src/models/` — Data models and business logic
- `src/views/` — Nunjucks templates for UI
- `src/controllers/` — Controllers to handle user input and update models/views
- `src/core/` — Core framework logic (routing, base classes, etc.)

## Routing System

The framework now supports clean URLs with three types of routing (no hash required):

### 1. Decorator-Based Routing
Controllers can use the `@route` decorator to define custom routes:

```typescript
import { Controller } from '../core/controller';
import { route } from '../core/decorators';

export class HomeController extends Controller {
  @route('home')
  @route('')  // Root route
  async execute(): Promise<void> {
    await this.View('views/home.njk', { title: 'Home Page' });
  }

  @route('home/demo')
  async demoAction(): Promise<void> {
    await this.View('views/demo.njk', { title: 'Demo Page' });
  }
}
```

### 2. Controller/Action Pattern
Automatic routing based on URL pattern `/controller/action`:
- `/home/demo` → `HomeController.demo()`
- `/about/index` → `AboutController.index()`

### 3. Default Controller Routing
Single controller name routes to the default `execute()` method:
- `/home` → `HomeController.execute()`
- `/about` → `AboutController.execute()`
- `/` → `HomeController.execute()` (root route)

## Available Routes

### Home Controller
- `/` - Root/default home page
- `/home` - Home page
- `/home/index` - Same as home
- `/home/demo` - Demo action page
- `/home/submit` - Form submission demo
- `/home/json` - JSON response demo
- `/home/redirect-*` - Various redirect examples

### About Controller
- `/about` - About page
- `/about/index` - Same as about
- `/about/home` - Redirect back to home

## Getting Started
1. Install dependencies:
   ```sh
   npm install
   ```
2. Start the dev server:
   ```sh
   npm run dev
   ```
3. Open your browser to `http://localhost:5173`
4. Navigate to different routes using clean URLs:
   - `http://localhost:5173/` (Home)
   - `http://localhost:5173/about` (About page)
   - `http://localhost:5173/home/demo` (Demo action)

## Features
- Pure TypeScript with decorator support
- Vite for fast builds and HMR
- Nunjucks for view rendering
- MVC pattern (frontend only)
- **Clean URL routing** with HTML5 History API (no hashes for routes!)
- **Normal hash behavior** for page anchors (e.g., `#section-id`)
- Automatic client-side navigation
- Controller actions with redirect support
- JSON response support for AJAX calls

## Framework Components

### Routing Behavior
- **Clean URLs**: `/home`, `/about`, `/home/demo` (no hash required)
- **Page Anchors**: `#section-id` works normally for scrolling within pages
- **Combined**: `/about#info-section` navigates to about page AND scrolls to anchor
- **Client-side**: No page reloads for internal navigation
- **Standards Compliant**: Hash fragments behave like normal HTML anchors

### Controllers
Extend the `Controller` base class and use decorators or conventions for routing.

### Views
Nunjucks templates in the `src/views/` directory with shared layouts.

### Models
Data models and business logic (to be implemented as needed).

### Core
- `Router` - Handles URL routing and controller dispatch
- `Controller` - Base controller class with view and redirect methods
- `ViewEngine` - Nunjucks integration with HMR support
- `decorators` - Route decorator and registration system

---

This framework provides a familiar MVC development experience with modern TypeScript features and frontend tooling.
