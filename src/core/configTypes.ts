/**
 * Configuration Manager for Environment-Specific Settings
 * Integrates with DI system and automatically loads .env files based on environment
 */

export interface DatabaseConfig {
  host: string;
  port: number;
  database: string;
  username: string;
  password: string;
  ssl: boolean;
}

export interface ApiConfig {
  baseUrl: string;
  timeout: number;
  retries: number;
  apiKey?: string;
  version: string;
}

export interface CacheConfig {
  enabled: boolean;
  ttl: number;
  maxSize: number;
  strategy: 'memory' | 'localStorage' | 'sessionStorage';
}

export interface LoggingConfig {
  level: 'debug' | 'info' | 'warn' | 'error';
  console: boolean;
  remote: {
    enabled: boolean;
    endpoint?: string;
    apiKey?: string;
  };
}

export interface SecurityConfig {
  cors: {
    enabled: boolean;
    allowedOrigins: string[];
  };
  csp: {
    enabled: boolean;
    directives: Record<string, string[]>;
  };
  https: {
    enforce: boolean;
    hsts: boolean;
  };
}

export interface ErrorConfig {
  showStackTrace: boolean;
  logErrors: boolean;
  errorReporting: {
    enabled: boolean;
    service?: 'sentry' | 'bugsnag' | 'custom';
    dsn?: string;
  };
}

export interface AppConfig {
  name: string;
  version: string;
  environment: 'development' | 'uat' | 'staging' | 'production' | string;
  debug: boolean;
  baseUrl: string;
  port: number;
  database?: DatabaseConfig;
  api: ApiConfig;
  cache: CacheConfig;
  logging: LoggingConfig;
  security: SecurityConfig;
  errors: ErrorConfig;
  features: Record<string, boolean>;
  custom: Record<string, any>;
}

/**
 * Default configuration that serves as fallback
 */
const DEFAULT_CONFIG: AppConfig = {
  name: 'ControllerTS App',
  version: '1.0.0',
  environment: 'development',
  debug: true,
  baseUrl: 'http://localhost:5173',
  port: 5173,
  api: {
    baseUrl: '/api',
    timeout: 30000,
    retries: 3,
    version: 'v1'
  },
  cache: {
    enabled: true,
    ttl: 300000, // 5 minutes
    maxSize: 100,
    strategy: 'memory'
  },
  logging: {
    level: 'debug',
    console: true,
    remote: {
      enabled: false
    }
  },
  security: {
    cors: {
      enabled: true,
      allowedOrigins: ['http://localhost:5173', 'http://127.0.0.1:5173']
    },
    csp: {
      enabled: false,
      directives: {
        'default-src': ["'self'"],
        'script-src': ["'self'", "'unsafe-inline'"],
        'style-src': ["'self'", "'unsafe-inline'"]
      }
    },
    https: {
      enforce: false,
      hsts: false
    }
  },
  errors: {
    showStackTrace: true,
    logErrors: true,
    errorReporting: {
      enabled: false
    }
  },
  features: {
    enableAnalytics: false,
    enableServiceWorker: false,
    enableOfflineMode: false
  },
  custom: {}
};

/**
 * Environment-specific configuration overrides
 */
const ENVIRONMENT_CONFIGS: Record<string, Partial<AppConfig>> = {
  development: {
    debug: true,
    logging: {
      level: 'debug',
      console: true,
      remote: { enabled: false }
    },
    errors: {
      showStackTrace: true,
      logErrors: true,
      errorReporting: { enabled: false }
    },
    security: {
      cors: { enabled: true, allowedOrigins: ['*'] },
      csp: { enabled: false, directives: {} },
      https: { enforce: false, hsts: false }
    }
  },
  uat: {
    debug: true,
    logging: {
      level: 'info',
      console: true,
      remote: { enabled: true }
    },
    errors: {
      showStackTrace: true,
      logErrors: true,
      errorReporting: { enabled: true }
    },
    security: {
      cors: { enabled: true, allowedOrigins: ['https://uat.example.com'] },
      csp: { enabled: true, directives: {} },
      https: { enforce: true, hsts: true }
    }
  },
  staging: {
    debug: false,
    logging: {
      level: 'info',
      console: false,
      remote: { enabled: true }
    },
    errors: {
      showStackTrace: false,
      logErrors: true,
      errorReporting: { enabled: true }
    },
    security: {
      cors: { enabled: true, allowedOrigins: ['https://staging.example.com'] },
      csp: { enabled: true, directives: {} },
      https: { enforce: true, hsts: true }
    }
  },
  production: {
    debug: false,
    logging: {
      level: 'warn',
      console: false,
      remote: { enabled: true }
    },
    errors: {
      showStackTrace: false,
      logErrors: true,
      errorReporting: { enabled: true }
    },
    security: {
      cors: { enabled: true, allowedOrigins: ['https://example.com'] },
      csp: { enabled: true, directives: {} },
      https: { enforce: true, hsts: true }
    },
    features: {
      enableAnalytics: true,
      enableServiceWorker: true,
      enableOfflineMode: true
    }
  }
};

export { DEFAULT_CONFIG, ENVIRONMENT_CONFIGS };
