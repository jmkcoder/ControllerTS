# Layered Configuration System

## Overview

The MVC framework now supports a **layered configuration system** that provides flexible, environment-specific configuration management with inheritance and overrides.

## Configuration Structure

### Base Configuration (`.env`)
- Contains **common settings** shared across all environments
- Provides **default values** for all configuration keys
- Serves as the **foundation** for environment-specific overrides

### Environment-Specific Configuration
- `.env.development` - Development environment overrides
- `.env.uat` - UAT/staging environment overrides  
- `.env.production` - Production environment overrides
- `.env.{custom}` - Custom environment overrides

## Loading Strategy

The configuration system uses a **two-phase loading approach**:

1. **Base Loading**: Loads `.env` file with common configuration
2. **Environment Overlay**: Loads environment-specific `.env.{environment}` file that overrides base values

```
Final Config = Base (.env) + Environment Overrides (.env.{environment})
```

## Configuration Files

### Base Configuration (`.env`)
```bash
# Base Configuration - Common settings across all environments
APP_NAME=TypeScript MVC Framework
APP_VERSION=1.0.0
DEBUG=false
API_BASE_URL=https://api.example.com
API_TIMEOUT=5000
FEATURE_ANALYTICS=false
# ... more common settings
```

### Development Overrides (`.env.development`)
```bash
# Development Environment Overrides
NODE_ENV=development
DEBUG=true
API_BASE_URL=http://localhost:8080/api
API_TIMEOUT=30000
FEATURE_BETA_FEATURES=true
# Only contains values that differ from base
```

### Production Overrides (`.env.production`)
```bash
# Production Environment Overrides
NODE_ENV=production
DEBUG=false
API_TIMEOUT=5000
FEATURE_BETA_FEATURES=false
ENABLE_ANALYTICS=true
# Only contains production-specific changes
```

## Key Benefits

### 1. **DRY Principle**
- Common configuration defined once in base `.env`
- Environment files only contain differences
- Reduces duplication and maintenance overhead

### 2. **Environment Flexibility**
- Easy to add new environments
- Clear separation of environment-specific settings
- No need to duplicate common configuration

### 3. **Inheritance Model**
- Environment configs inherit from base
- Override only what's necessary
- Missing values fall back to base configuration

### 4. **Maintainability**
- Changes to common settings update all environments
- Environment-specific changes are isolated
- Clear visibility of environment differences

## Usage in Code

### ConfigurationManager Integration
```typescript
// Automatic layered loading
await configManager.initialize();

// Access merged configuration
const apiUrl = configManager.get('api.baseUrl');
const isDebug = configManager.get('debug');
```

### Environment Detection
```typescript
// Automatically detects environment from NODE_ENV
const environment = EnvUtils.getEnvironment();

// Loads: .env + .env.{environment}
```

## Environment Loading Process

### Browser Environment
1. Fetch base `.env` file via HTTP
2. Parse and load base configuration
3. Fetch environment-specific `.env.{environment}` file
4. Parse and merge with base configuration
5. Environment values override base values

### Build-Time Environment
1. Process base `.env` file during build
2. Process environment-specific file during build
3. Inject merged configuration into bundle

## Configuration Demo

Visit `/config` in your application to see:
- **Current environment detection**
- **Merged configuration values**
- **Override visualization**
- **Feature flag management**
- **Configuration testing tools**

## Best Practices

### 1. **Base Configuration**
- Include all possible configuration keys
- Use sensible defaults
- Document each configuration option
- Keep it environment-agnostic

### 2. **Environment Overrides**
- Only include values that differ from base
- Use descriptive comments
- Keep environment-specific logic minimal
- Test overrides thoroughly

### 3. **Security**
- Never commit sensitive data to base `.env`
- Use environment-specific files for secrets
- Use build-time injection for production secrets
- Validate configuration at startup

### 4. **Documentation**
- Document configuration inheritance
- Explain environment-specific behavior
- Provide examples for each environment
- Keep configuration reference updated

## Configuration Types

The system supports type-safe configuration with TypeScript interfaces:

```typescript
interface AppConfig {
  app: {
    name: string;
    version: string;
    baseUrl: string;
  };
  api: {
    baseUrl: string;
    timeout: number;
    retries: number;
  };
  features: {
    [key: string]: boolean;
  };
  // ... more typed configuration
}
```

## Migration from Single .env

If you're migrating from a single `.env` file approach:

1. **Create base `.env`** with common settings
2. **Create environment-specific files** with overrides only
3. **Remove duplicated values** from environment files
4. **Test configuration loading** in each environment
5. **Update documentation** to reflect new structure

## Troubleshooting

### Configuration Not Loading
- Check file paths and names
- Verify HTTP access to `.env` files
- Check browser console for loading errors
- Ensure proper file permissions

### Values Not Overriding
- Verify environment detection
- Check file loading order
- Confirm file parsing
- Validate merge logic

### Type Safety Issues
- Update TypeScript interfaces
- Ensure proper type conversion
- Validate configuration at runtime
- Use type guards for safety

This layered configuration system provides the flexibility and maintainability needed for production applications while keeping the complexity manageable.
