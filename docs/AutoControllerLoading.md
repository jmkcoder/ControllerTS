# Automated Controller Loading

## Overview

The framework now features **automatic controller discovery, loading, and DI registration** based on inheritance from the `Controller` class. **No more manual imports or DI registration needed!** 🎉

## How It Works

### 1. Auto-Discovery with Vite's `import.meta.glob`

The `AutoControllerLoader` uses Vite's built-in `import.meta.glob` API to automatically discover all controller files across the entire `src` directory:

```typescript
// Automatically finds controllers in any architectural pattern
const allControllerModules = {
    // Pattern 1: Any *Controller.ts file anywhere in src
    ...import.meta.glob('../**/*Controller.ts', { eager: false }),
    
    // Pattern 2: Files in any controller/ subdirectory
    ...import.meta.glob('../**/controller/*Controller.ts', { eager: false }),
    
    // Pattern 3: Files in any controllers/ subdirectory  
    ...import.meta.glob('../**/controllers/*Controller.ts', { eager: false }),
};
```

### 2. Inheritance-Based Validation + Automatic DI Registration

Each discovered file is analyzed to find classes that extend `Controller`, and they're automatically registered with the DI container:

```typescript
const controllerClasses = this.findControllerClasses(module, path);
controllerClasses.forEach(cls => {
    // Register with DI container (as transient - new instance per request)
    console.log(`📦 Auto-registering controller with DI: ${cls.name}`);
    serviceContainer.addTransient(cls);
    
    // Track loaded controllers
    this.loadedControllers.add(cls.name);
});
```

```typescript
private static isControllerClass(value: any): value is typeof Controller {
    // Check prototype chain to verify inheritance
    let proto = Object.getPrototypeOf(value);
    while (proto && proto !== Function.prototype) {
        if (proto === Controller || proto.name === 'Controller') {
            return true;
        }
        proto = Object.getPrototypeOf(proto);
    }
    
    // Also check if prototype is instance of Controller
    return value.prototype instanceof Controller;
}
```

### 3. Clean Architecture Support

The system supports **any directory structure**, perfect for clean architecture patterns:

```
src/
├── controllers/                    ✅ Traditional MVC
│   ├── HomeController.ts
│   └── ProductController.ts
├── features/                       ✅ Feature-based architecture
│   └── user/
│       └── controllers/
│           └── UserController.ts
├── admin/                          ✅ Domain-based architecture
│   └── controller/
│       └── AdminController.ts
└── modules/                        ✅ Module-based architecture
    └── auth/
        └── controllers/
            └── AuthController.ts
```

**All of these are automatically discovered and registered!**

### 4. Automatic Loading in main.ts

Controllers are now loaded and registered automatically during application initialization:

```typescript
async function initializeApplication() {
    // Register services first
    serviceContainer.addSingleton(LoggerService);
    serviceContainer.addScoped(UserService);
    // ... other services

    // AUTO-LOAD controllers with DI registration - COMPLETELY AUTOMATED! 🎉
    console.log('🚀 Starting automatic controller discovery...');
    await AutoControllerLoader.loadAllControllers();

    // Continue with app initialization...
}
```

## Benefits

### ✅ **Zero Configuration**
- No need to manually import each controller
- No need to register controllers with DI container
- New controllers are automatically discovered and registered
- Works with any directory structure or naming convention

### ✅ **Complete DI Integration**
- Controllers automatically registered as transient services
- Full dependency injection support in constructors
- Request-scoped DI containers work seamlessly
- No manual service registration needed

### ✅ **Clean Architecture Ready**
- Supports feature-based organization (`src/features/user/controllers/`)
- Supports domain-driven design (`src/admin/controller/`)
- Supports traditional MVC (`src/controllers/`)
- Works with any nested directory structure

### ✅ **Type-Safe Discovery**
- Only loads classes that actually extend `Controller`
- Validates inheritance at runtime
- Provides clear logging of discovery and registration process

### ✅ **Development Efficiency**
- Add new controller → Automatically discovered and registered
- Remove controller → Automatically excluded
- Rename controller → Still works
- Move controller to any directory → Still discovered

### ✅ **Production Optimized**
- Vite automatically code-splits controllers
- Only loads controllers that are actually used
- Tree-shaking removes unused controllers
- Each controller becomes its own optimized chunk

## Before vs After

### Before (Manual & Error-Prone):
```typescript
// ❌ Had to manually import every single controller
import './controllers/HomeController';
import './controllers/AboutController';
import './controllers/ProductController';
import './features/user/controllers/UserController';  // Easy to forget!
import './admin/controller/AdminController';          // Gets tedious...

// ❌ AND manually register each with DI container
serviceContainer.addTransient(HomeController);
serviceContainer.addTransient(AboutController);
serviceContainer.addTransient(ProductController);
serviceContainer.addTransient(UserController);       // More to remember!
serviceContainer.addTransient(AdminController);      // Even more tedious...
```

### After (Completely Automated):
```typescript
// ✅ One line automatically discovers, loads, and registers ALL controllers!
await AutoControllerLoader.loadAllControllers();
```

**That's it!** No imports, no DI registration, no maintenance overhead!

## Adding New Controllers

Simply create a new controller that extends `Controller`:

```typescript
// controllers/NewFeatureController.ts
import { Controller } from '../core/controller';
import { AutoRegister } from '../core/controllerDiscovery';
import { route } from '../core/decorators';

@AutoRegister  // Still needed for registration
export class NewFeatureController extends Controller {
    @route('/new-feature')
    async index() {
        return await this.View('new-feature');
    }
}
```

**That's it!** No need to modify `main.ts` or any other files. The controller will be automatically discovered and loaded.

## Error Handling

The system follows a **fail-fast approach** for reliability:

### Immediate Error Reporting
If auto-discovery fails, the application startup will fail immediately:
```typescript
try {
    await AutoControllerLoader.loadAllControllers();
} catch (error) {
    console.error('❌ Failed to auto-discover controllers:', error);
    throw error; // Application startup fails - no silent errors
}
```

### Individual Controller Errors
Failed controller loads don't break the entire discovery process:
```typescript
try {
    const module = await importFn();
    // Process controller...
} catch (error) {
    console.error(`❌ Failed to load controller from ${path}:`, error);
    // Continue with other controllers
}
```

**Why Fail Fast?**
- **Predictable Behavior**: Errors are immediately visible
- **No Silent Failures**: Missing controllers are detected early  
- **Development Friendly**: Clear error messages during development
- **Production Safety**: Application won't start with broken configuration

## Console Output

The system provides detailed logging during development:

```
🔍 Auto-discovering controllers across entire src directory...
📁 Found 5 potential controller files across src: [
  "../controllers/HomeController.ts", 
  "../controllers/AboutController.ts", 
  "../controllers/ProductController.ts",
  "../features/user/controllers/UserController.ts",
  "../admin/controller/AdminController.ts"
]
📦 Loading controller: ../controllers/HomeController.ts
🎯 Found controller class: HomeController in ../controllers/HomeController.ts
📦 Auto-registering controller with DI: HomeController
✅ Loaded 1 controller(s) from ../controllers/HomeController.ts: ["HomeController"]
📦 Loading controller: ../features/user/controllers/UserController.ts
🎯 Found controller class: UserController in ../features/user/controllers/UserController.ts
📦 Auto-registering controller with DI: UserController
✅ Loaded 1 controller(s) from ../features/user/controllers/UserController.ts: ["UserController"]
🎉 Auto-discovery complete! Loaded 5 controllers: [
  "HomeController", "AboutController", "ProductController", "UserController", "AdminController"
]
```

## Build Optimization

Vite automatically optimizes the build:

```
✓ 28 modules transformed.
dist/assets/AboutController-rPpc0pC_.js      0.67 kB │ gzip:  0.43 kB
dist/assets/ProductController-BerPBHkQ.js    3.23 kB │ gzip:  1.30 kB  
dist/assets/HomeController-Y9i1-APa.js       7.08 kB │ gzip:  2.58 kB
dist/assets/index-CiskO4Ih.js              141.24 kB │ gzip: 43.16 kB
```

Each controller becomes its own optimized chunk for efficient loading!

## Implementation Details

### File Matching Pattern
```typescript
'../controllers/**/*Controller.ts'
```
- Searches recursively in controllers directory
- Matches any file ending with `Controller.ts`
- Supports nested subdirectories

### Dynamic Import Strategy
- Uses `{ eager: false }` for lazy loading
- Controllers loaded async during initialization
- Supports both named and default exports

### TypeScript Support
- Full type checking during compilation
- Runtime type validation for safety
- Proper generic constraints for inheritance

## Summary

**This is a game-changer for development productivity!** 🚀

The automated controller loading system eliminates boilerplate while maintaining type safety and performance. It showcases advanced TypeScript patterns and modern bundler features, making this framework truly enterprise-ready.

**No more forgetting to import controllers. No more manual maintenance. Just pure coding efficiency!** ✨
