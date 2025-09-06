# Environment Configuration Management

## Overview

The MVC framework provides multiple ways to control which `.env` configuration file is used, allowing flexible environment switching for development, testing, and deployment.

## 🔧 **Methods to Set Current .env File**

### **1. Automatic Environment Detection (Default)**

The system automatically detects the environment based on `NODE_ENV`:

```bash
# Development environment
NODE_ENV=development npm run dev
# Loads: .env + .env.development

# Production environment  
NODE_ENV=production npm run build
# Loads: .env + .env.production

# UAT environment
NODE_ENV=uat npm run dev
# Loads: .env + .env.uat
```

### **2. Custom Environment File**

Specify a custom `.env` file programmatically:

```typescript
// In main.ts or application startup
await configManager.initialize('.env.custom');
await configManager.initialize('.env.staging');
await configManager.initialize('.env.testing');
```

### **3. Runtime Environment Switching**

Use the EnvironmentManager for dynamic switching:

```typescript
import { EnvironmentManager } from './core/environmentManager';

// Switch to different environment
await EnvironmentManager.switchEnvironment('.env.production');
await EnvironmentManager.switchEnvironment('.env.uat');
```

### **4. Browser Console Commands (Development)**

In development mode, use browser console commands:

```javascript
// Switch environment
switchEnv('.env.production');
switchEnv('.env.uat');
switchEnv('.env.development');

// Show current environment info
showEnvInfo();

// Create environment switcher UI
createEnvSwitcher();
```

### **5. Environment Switcher UI (Development)**

In development mode, an environment switcher appears automatically:
- **Location**: Top-right corner of the page
- **Functionality**: Dropdown to switch between environments
- **Real-time**: Immediate configuration reload

## 📁 **Available Environment Files**

### **Base Configuration**
- `.env` - Common settings shared across all environments

### **Environment-Specific**
- `.env.development` - Development overrides
- `.env.uat` - UAT/staging overrides
- `.env.production` - Production overrides
- `.env.staging` - Staging environment (if needed)
- `.env.testing` - Testing environment (if needed)
- `.env.{custom}` - Any custom environment name

## 🔄 **Environment Switching Process**

1. **Clear Current Configuration**
   - Removes existing environment variables
   - Clears configuration cache

2. **Load Base Configuration**
   - Loads common settings from `.env`
   - Establishes baseline configuration

3. **Apply Environment Overrides**
   - Loads environment-specific file
   - Merges with base configuration
   - Environment values override base values

4. **Trigger Application Update**
   - Dispatches `environment-changed` event
   - Updates configuration throughout application
   - Refreshes dependent services

## 💻 **Development Tools**

### **Environment Switcher UI**

```typescript
// Automatically added in development mode
if (configManager.get('debug', false)) {
    const switcher = EnvironmentManager.createEnvironmentSwitcher();
    document.body.appendChild(switcher);
}
```

### **Console Utilities**

```javascript
// Available in browser console (development mode)
switchEnv('.env.production');     // Switch environment
showEnvInfo();                    // Show environment details
createEnvSwitcher();             // Create switcher UI
```

### **Environment Information**

```javascript
// Get environment details
EnvironmentManager.getCurrentEnvironment();           // 'development'
EnvironmentManager.getAvailableEnvironments();       // ['.env.development', ...]
EnvironmentManager.checkEnvironmentFile('.env.uat'); // true/false
```

## 🛠️ **Programmatic Usage**

### **Application Initialization**

```typescript
// main.ts
async function initializeApplication() {
    // Option 1: Automatic detection
    await configManager.initialize();
    
    // Option 2: Custom environment file
    await configManager.initialize('.env.custom');
    
    // Option 3: Environment variable override
    const customEnvFile = process.env.CUSTOM_ENV_FILE || null;
    await configManager.initialize(customEnvFile);
}
```

### **Runtime Environment Management**

```typescript
// Switch environment during runtime
await EnvironmentManager.switchEnvironment('.env.uat');

// Check if environment file exists
const exists = await EnvironmentManager.checkEnvironmentFile('.env.staging');

// Get current environment
const current = EnvironmentManager.getCurrentEnvironment();
```

### **Configuration Reload**

```typescript
// Reload configuration with different environment
await configManager.reload('.env.production');

// Reload with current environment
await configManager.reload();
```

## 🔍 **Environment Detection Logic**

```typescript
// Automatic detection priority:
1. Custom file parameter (if provided)
2. __CUSTOM_ENV_FILE__ global variable
3. NODE_ENV environment variable
4. Default to 'development'

// File selection:
NODE_ENV=development → .env.development
NODE_ENV=production  → .env.production
NODE_ENV=uat         → .env.uat
NODE_ENV=staging     → .env.staging
NODE_ENV=custom      → .env.custom
```

## 📊 **Environment Configuration Demo**

Visit `/config` in your application to see:
- **Current active environment**
- **Loaded configuration files**
- **Merged configuration values**
- **Environment switching tools**
- **Configuration validation**

## 🔐 **Security Considerations**

### **Development Environment**
- Environment switcher only available in debug mode
- Console utilities disabled in production
- Sensitive values masked in logs

### **Production Environment**
- Environment switching disabled
- Configuration locked after initialization
- No debug utilities exposed

## 🚀 **Deployment Scenarios**

### **Development**
```bash
NODE_ENV=development npm run dev
# Full environment switching capabilities
```

### **UAT/Staging**
```bash
NODE_ENV=uat npm run build
# Loads UAT-specific configuration
```

### **Production**
```bash
NODE_ENV=production npm run build
# Loads production-optimized configuration
```

### **Custom Environments**
```bash
NODE_ENV=custom npm run dev
# Loads .env.custom configuration
```

## 🔧 **Troubleshooting**

### **Environment File Not Found**
```javascript
// Check if file exists
const exists = await EnvironmentManager.checkEnvironmentFile('.env.uat');
if (!exists) {
    console.log('Environment file not found, using fallback configuration');
}
```

### **Configuration Not Loading**
```javascript
// Show environment information
showEnvInfo();

// Check loaded configuration
console.log('Current config:', configManager.getAll());
```

### **Environment Switching Issues**
```javascript
// Reload configuration
await configManager.reload();

// Switch with error handling
try {
    await EnvironmentManager.switchEnvironment('.env.production');
} catch (error) {
    console.error('Failed to switch environment:', error);
}
```

This comprehensive environment management system provides the flexibility needed for modern application deployment while maintaining simplicity for development workflows.
