# ControllerTS - TypeScript MVC Framework

A modern TypeScript MVC framework inspired by ASP.NET Core, featuring clean architecture, decorator-based routing, and beautiful UI components with Tailwind CSS and shadcn/ui.

## ✨ Features

- 🎯 **Decorator-based Routing**: Use `@controller` and `@action` decorators for semantic routing
- 🏗️ **Clean Architecture**: Feature-based folder structure with controllers, models, and views
- 🎨 **Modern UI**: Tailwind CSS with shadcn/ui design system
- 📱 **Responsive Design**: Mobile-first, responsive components
- 🔧 **TypeScript First**: Full TypeScript support with strong typing
- ⚡ **Fast Development**: Hot module replacement and instant feedback
- 🌐 **HTML5 History API**: Clean URLs with client-side navigation
- 🎭 **Templating**: Nunjucks templating engine with layouts and partials

## 🚀 Quick Start

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Start the development server:**
   ```bash
   npm run dev
   ```

3. **Open your browser:**
   Navigate to `http://localhost:3000`

## 📁 Project Structure

```
src/
├── core/                      # Framework core
│   ├── controller.ts          # Base controller class
│   ├── decorators.ts          # @controller and @action decorators
│   ├── router.ts              # Routing engine
│   └── ...                    # Other framework components
├── features/                  # Feature-based architecture
│   ├── home/                  # Home feature
│   │   ├── controllers/       # Home controllers
│   │   ├── models/           # Home models
│   │   └── views/            # Home views
│   ├── products/             # Products feature
│   │   ├── controllers/      # Product controllers
│   │   ├── models/          # Product models
│   │   └── views/           # Product views
│   └── contact/              # Contact feature
│       ├── controllers/      # Contact controllers
│       ├── models/          # Contact models
│       └── views/           # Contact views
├── shared/                   # Shared layouts and components
└── views/                    # Global views (errors, etc.)
```

## 🎯 Demo Features

### 🏠 Home Feature
- Welcome dashboard with statistics
- Framework information and features
- Interactive demo with API calls

### 🛍️ Products Feature
- Product catalog with categories
- Product details with related items
- Search functionality
- Category filtering

### 📞 Contact Feature
- Contact form with validation
- Team member showcase
- Contact information display
- Form submission handling

## 🎨 UI Components

Built with **Tailwind CSS** and **shadcn/ui** design system:

- 🎨 Modern, clean design
- 📱 Fully responsive
- ♿ Accessible components
- 🎯 Consistent design language
- 🚀 Fast and lightweight

## 🧩 Architecture Patterns

### Clean Architecture
Each feature is self-contained with its own:
- **Controllers**: Handle HTTP requests and responses
- **Models**: Business logic and data models
- **Views**: UI templates and presentation

### Decorator-Based Routing
```typescript
@controller('products')
export class ProductController extends Controller {
  
  @action('')           // GET /products
  async index() {
    // List all products
  }
  
  @action(':id')        // GET /products/:id
  async details() {
    // Show product details
  }
}
```

### Dependency Injection
```typescript
@AutoRegister
@controller('home')
export class HomeController extends Controller {
  // Automatically registered and injectable
}
```

## 🛠️ Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run preview` - Preview production build
- `npm run type-check` - Type check without building

## 🌟 Framework Highlights

### TypeScript MVC Patterns
- Familiar ASP.NET Core-style controllers
- Strong typing throughout the application
- Decorator-based metadata and routing

### Modern Web Standards
- HTML5 History API for clean URLs
- CSS Grid and Flexbox layouts
- Modern JavaScript features

### Developer Experience
- Hot module replacement
- TypeScript IntelliSense
- Automatic controller discovery
- Built-in error handling

## 📚 Learn More

Explore the demo application to see ControllerTS in action:
- **Home**: Framework overview and interactive demos
- **Products**: Product catalog with search and filtering
- **Contact**: Contact forms and team information

---

Built with ❤️ by [jmkcoder](https://github.com/jmkcoder)
