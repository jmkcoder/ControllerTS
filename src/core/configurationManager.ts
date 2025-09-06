/**
 * Configuration Manager
 * Manages application configuration with environment-specific .env file loading
 * Integrates with DI system and provides type-safe configuration access
 */

import { EnvParser, EnvUtils } from './envParser';
import type { AppConfig } from './configTypes';
import { DEFAULT_CONFIG, ENVIRONMENT_CONFIGS } from './configTypes';
import { Singleton } from './diDecorators';

@Singleton
export class ConfigurationManager {
  private config: AppConfig;
  private loaded = false;
  private envFileLoaded = false;

  constructor() {
    this.config = this.createInitialConfig();
  }

  /**
   * Initialize and load configuration
   */
  async initialize(customEnvFile?: string): Promise<void> {
    if (this.loaded) return;

    try {
      // Load .env file first
      await this.loadEnvFile(customEnvFile);
      
      // Build final configuration
      this.config = this.buildConfiguration();
      
      this.loaded = true;
      
      console.log(`✅ Configuration loaded for environment: ${this.config.environment}`);
      
      if (this.config.debug) {
        console.log('🔧 Configuration:', this.getSafeConfigForLogging());
      }
    } catch (error) {
      console.error('❌ Failed to load configuration:', error);
      // Use default configuration as fallback
      this.config = this.createInitialConfig();
      this.loaded = true;
    }
  }

  /**
   * Get configuration value by path (supports dot notation)
   */
  get<T = any>(path: string, defaultValue?: T): T {
    return this.getNestedValue(this.config, path, defaultValue);
  }

  /**
   * Get full configuration object
   */
  getAll(): AppConfig {
    return { ...this.config };
  }

  /**
   * Get configuration for specific section
   */
  getSection<T = any>(section: keyof AppConfig): T {
    return this.config[section] as T;
  }

  /**
   * Check if configuration has been loaded
   */
  isLoaded(): boolean {
    return this.loaded;
  }

  /**
   * Get current environment
   */
  getEnvironment(): string {
    return this.config.environment;
  }

  /**
   * Check if running in development
   */
  isDevelopment(): boolean {
    return this.config.environment === 'development';
  }

  /**
   * Check if running in production
   */
  isProduction(): boolean {
    return this.config.environment === 'production';
  }

  /**
   * Check if debug mode is enabled
   */
  isDebug(): boolean {
    return this.config.debug;
  }

  /**
   * Set configuration value (for testing/runtime updates)
   */
  set(path: string, value: any): void {
    this.setNestedValue(this.config, path, value);
  }

  /**
   * Check if configuration key exists
   */
  has(path: string): boolean {
    return this.getNestedValue(this.config, path) !== undefined;
  }

  /**
   * Reload configuration
   */
  async reload(customEnvFile?: string): Promise<void> {
    this.loaded = false;
    this.envFileLoaded = false;
    EnvParser.clearCache();
    await this.initialize(customEnvFile);
  }

  /**
   * Create initial configuration from defaults
   */
  private createInitialConfig(): AppConfig {
    return JSON.parse(JSON.stringify(DEFAULT_CONFIG));
  }

  /**
   * Load .env file based on environment with layered configuration
   * First loads base .env, then overlays environment-specific .env
   */
  private async loadEnvFile(customEnvFile?: string): Promise<void> {
    if (this.envFileLoaded) return;

    try {
      const environment = EnvUtils.getEnvironment();
      
      // In a browser environment, we need to fetch the .env files
      if (typeof window !== 'undefined') {
        // Step 1: Load base .env file first (with fallback)
        await this.loadEnvFromHttp('.env', true);
        
        // Step 2: Load environment-specific .env file (overrides base)
        const envFileName = customEnvFile || this.getEnvFileName(environment);
        await this.loadEnvFromHttp(envFileName, false);
        
        // Step 3: If no files were loaded, use hardcoded defaults
        await this.ensureMinimalConfiguration(environment);
      } else {
        // For build-time or SSR
        await this.loadEnvFromFileSystem('.env', true);
        const envFileName = customEnvFile || this.getEnvFileName(environment);
        await this.loadEnvFromFileSystem(envFileName, false);
      }
      
      this.envFileLoaded = true;
      console.log(`✅ Layered configuration loaded: base .env + ${this.getEnvFileName(environment)}`);
    } catch (error) {
      console.warn(`⚠️ Could not load .env files, using defaults:`, error);
      // Continue with default configuration
    }
  }

  /**
   * Get .env file name based on environment
   */
  private getEnvFileName(environment: string): string {
    switch (environment) {
      case 'development':
        return '.env.development';
      case 'uat':
        return '.env.uat';
      case 'staging':
        return '.env.staging';
      case 'production':
        return '.env.production';
      default:
        return `.env.${environment}`;
    }
  }

  /**
   * Load .env file via HTTP (browser environment)
   */
  private async loadEnvFromHttp(fileName: string, isBase: boolean = false): Promise<void> {
    try {
      console.log(`🔍 Attempting to load: ${fileName} (base: ${isBase})`);
      let response = await fetch(`/${fileName}`);
      
      if (!response.ok) {
        if (isBase) {
          console.warn(`⚠️ Base .env file not found: ${fileName} (${response.status} ${response.statusText})`);
          return;
        } else {
          // For environment-specific files, try to fallback to generic .env if not base
          console.warn(`⚠️ Environment-specific file not found: ${fileName} (${response.status} ${response.statusText}), using base configuration only`);
          return;
        }
      }
      
      if (response.ok) {
        const envContent = await response.text();
        const envData = this.parseEnvContent(envContent);
        
        if (isBase) {
          // Clear and load base configuration
          EnvParser.load(envData);
          console.log(`✅ Loaded base environment file: ${fileName} (${Object.keys(envData).length} variables)`);
        } else {
          // Merge with existing configuration (environment-specific overrides)
          EnvParser.merge(envData);
          console.log(`✅ Loaded environment overrides: ${fileName} (${Object.keys(envData).length} variables)`);
        }
      }
    } catch (error) {
      console.warn(`⚠️ Could not fetch ${fileName}:`, error);
    }
  }

  /**
   * Load .env file from file system (Node.js environment)
   */
  private async loadEnvFromFileSystem(fileName: string, isBase: boolean = false): Promise<void> {
    // This would be implemented for SSR/build-time scenarios
    // For now, we'll rely on build tools to inject environment variables
    console.log(`📝 Environment file ${fileName} should be processed by build tools (base: ${isBase})`);
  }

  /**
   * Ensure minimal configuration is available when .env files fail to load
   */
  private async ensureMinimalConfiguration(environment: string): Promise<void> {
    // Check if we have any configuration loaded
    const hasConfig = (typeof window !== 'undefined') && (window as any).__ENV__;
    
    if (!hasConfig) {
      console.log('🔧 Using fallback configuration - .env files not accessible');
      
      // Load minimal default configuration
      const fallbackConfig = {
        NODE_ENV: environment,
        APP_NAME: 'TypeScript MVC Framework',
        APP_VERSION: '1.0.0',
        DEBUG: environment === 'development' ? 'true' : 'false',
        API_BASE_URL: environment === 'development' ? 'http://localhost:8080/api' : '/api',
        API_TIMEOUT: '5000',
        LOG_LEVEL: environment === 'development' ? 'debug' : 'warn',
        FEATURE_ADVANCED_ROUTING: 'true',
        FEATURE_MODEL_VALIDATION: 'true',
        FEATURE_DEPENDENCY_INJECTION: 'true',
        FEATURE_MIDDLEWARE_PIPELINE: 'true',
        FEATURE_ERROR_HANDLING: 'true',
        FEATURE_VIEW_ENGINE: 'true',
        FEATURE_HTML_HELPERS: 'true',
        FEATURE_CONFIGURATION_MANAGER: 'true',
      };
      
      // Add environment-specific defaults
      if (environment === 'development') {
        Object.assign(fallbackConfig, {
          ENABLE_HOT_RELOAD: 'true',
          ENABLE_SOURCE_MAPS: 'true',
          FEATURE_BETA_FEATURES: 'true',
          CORS_ORIGINS: 'http://localhost:5173,http://127.0.0.1:5173',
        });
      } else if (environment === 'production') {
        Object.assign(fallbackConfig, {
          ENABLE_HOT_RELOAD: 'false',
          ENABLE_SOURCE_MAPS: 'false',
          FEATURE_BETA_FEATURES: 'false',
          ENABLE_ANALYTICS: 'true',
        });
      }
      
      EnvParser.load(fallbackConfig);
      console.log(`✅ Loaded fallback configuration for ${environment} environment`);
    }
  }

  /**
   * Parse .env file content
   */
  private parseEnvContent(content: string): Record<string, string> {
    const result: Record<string, string> = {};
    
    content.split('\n').forEach(line => {
      line = line.trim();
      
      // Skip empty lines and comments
      if (!line || line.startsWith('#')) return;
      
      const separatorIndex = line.indexOf('=');
      if (separatorIndex === -1) return;
      
      const key = line.substring(0, separatorIndex).trim();
      const value = line.substring(separatorIndex + 1).trim();
      
      result[key] = value;
    });
    
    return result;
  }

  /**
   * Build final configuration by merging defaults, environment config, and .env values
   */
  private buildConfiguration(): AppConfig {
    // Start with default configuration
    let config: AppConfig = JSON.parse(JSON.stringify(DEFAULT_CONFIG));
    
    // Get environment from env vars or default
    const environment = EnvParser.get('NODE_ENV', 'development');
    config.environment = environment;
    
    // Apply environment-specific overrides
    if (ENVIRONMENT_CONFIGS[environment]) {
      config = this.deepMerge(config, ENVIRONMENT_CONFIGS[environment]);
    }
    
    // Apply .env file overrides
    config = this.applyEnvOverrides(config);
    
    return config;
  }

  /**
   * Apply environment variable overrides to configuration
   */
  private applyEnvOverrides(config: AppConfig): AppConfig {
    // Map common environment variables
    const envMappings: Record<string, string> = {
      'APP_NAME': 'name',
      'APP_VERSION': 'version',
      'NODE_ENV': 'environment',
      'DEBUG': 'debug',
      'BASE_URL': 'baseUrl',
      'PORT': 'port',
      
      // API configuration
      'API_BASE_URL': 'api.baseUrl',
      'API_TIMEOUT': 'api.timeout',
      'API_RETRIES': 'api.retries',
      'API_KEY': 'api.apiKey',
      'API_VERSION': 'api.version',
      
      // Cache configuration
      'CACHE_ENABLED': 'cache.enabled',
      'CACHE_TTL': 'cache.ttl',
      'CACHE_MAX_SIZE': 'cache.maxSize',
      'CACHE_STRATEGY': 'cache.strategy',
      
      // Logging configuration
      'LOG_LEVEL': 'logging.level',
      'LOG_CONSOLE': 'logging.console',
      'LOG_REMOTE_ENABLED': 'logging.remote.enabled',
      'LOG_REMOTE_ENDPOINT': 'logging.remote.endpoint',
      'LOG_REMOTE_API_KEY': 'logging.remote.apiKey',
      
      // Security configuration
      'CORS_ENABLED': 'security.cors.enabled',
      'CORS_ORIGINS': 'security.cors.allowedOrigins',
      'CSP_ENABLED': 'security.csp.enabled',
      'HTTPS_ENFORCE': 'security.https.enforce',
      'HSTS_ENABLED': 'security.https.hsts',
      
      // Error configuration
      'SHOW_STACK_TRACE': 'errors.showStackTrace',
      'LOG_ERRORS': 'errors.logErrors',
      'ERROR_REPORTING_ENABLED': 'errors.errorReporting.enabled',
      'ERROR_REPORTING_SERVICE': 'errors.errorReporting.service',
      'ERROR_REPORTING_DSN': 'errors.errorReporting.dsn'
    };

    // Apply mapped environment variables
    Object.entries(envMappings).forEach(([envKey, configPath]) => {
      if (EnvParser.has(envKey)) {
        const value = EnvParser.get(envKey);
        this.setNestedValue(config, configPath, value);
      }
    });

    // Apply feature flags (any env var starting with FEATURE_)
    const featureFlags = EnvParser.getWithPrefix('FEATURE_');
    Object.entries(featureFlags).forEach(([key, value]) => {
      config.features[key.toLowerCase()] = value;
    });

    // Apply custom configuration (any env var starting with CUSTOM_)
    const customConfig = EnvParser.getWithPrefix('CUSTOM_');
    Object.entries(customConfig).forEach(([key, value]) => {
      config.custom[key.toLowerCase()] = value;
    });

    return config;
  }

  /**
   * Deep merge two objects
   */
  private deepMerge(target: any, source: any): any {
    const result = { ...target };
    
    Object.keys(source).forEach(key => {
      if (source[key] && typeof source[key] === 'object' && !Array.isArray(source[key])) {
        result[key] = this.deepMerge(target[key] || {}, source[key]);
      } else {
        result[key] = source[key];
      }
    });
    
    return result;
  }

  /**
   * Get nested value from object using dot notation
   */
  private getNestedValue(obj: any, path: string, defaultValue?: any): any {
    return path.split('.').reduce((current, key) => {
      return current && current[key] !== undefined ? current[key] : defaultValue;
    }, obj);
  }

  /**
   * Set nested value in object using dot notation
   */
  private setNestedValue(obj: any, path: string, value: any): void {
    const keys = path.split('.');
    const lastKey = keys.pop()!;
    
    const target = keys.reduce((current, key) => {
      if (!current[key] || typeof current[key] !== 'object') {
        current[key] = {};
      }
      return current[key];
    }, obj);
    
    target[lastKey] = value;
  }

  /**
   * Get safe configuration for logging (removes sensitive data)
   */
  private getSafeConfigForLogging(): any {
    const safe = JSON.parse(JSON.stringify(this.config));
    
    // Remove sensitive data
    if (safe.database?.password) safe.database.password = '***';
    if (safe.api?.apiKey) safe.api.apiKey = '***';
    if (safe.logging?.remote?.apiKey) safe.logging.remote.apiKey = '***';
    if (safe.errors?.errorReporting?.dsn) safe.errors.errorReporting.dsn = '***';
    
    return safe;
  }
}

// Export singleton instance for convenience
export const configManager = new ConfigurationManager();
