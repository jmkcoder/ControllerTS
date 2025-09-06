/**
 * Environment Management Utilities
 * Helper functions for managing environment configuration
 */

import { configManager } from './configurationManager';
import { EnvParser } from './envParser';

export class EnvironmentManager {
  
  /**
   * Switch to a different environment configuration
   */
  static async switchEnvironment(envFile: string): Promise<void> {
    console.log(`🔄 Switching to environment file: ${envFile}`);
    
    // Clear existing configuration and cache
    if (typeof window !== 'undefined') {
      (window as any).__ENV__ = {};
    }
    
    // Use the reload method which properly resets the configuration manager
    await configManager.reload(envFile);
    
    // Trigger a reload to apply new configuration
    if (typeof window !== 'undefined') {
      const event = new CustomEvent('environment-changed', {
        detail: { envFile }
      });
      window.dispatchEvent(event);
    }
    
    console.log(`✅ Switched to ${envFile}`);
    
    // Show updated environment info
    setTimeout(() => {
      this.showEnvironmentInfo();
    }, 100);
  }
  
  /**
   * Get available environment files
   */
  static getAvailableEnvironments(): string[] {
    return [
      '.env.development',
      '.env.uat',
      '.env.production',
      '.env.staging',
    ];
  }
  
  /**
   * Get current environment name
   */
  static getCurrentEnvironment(): string {
    // Get from NODE_ENV environment variable, which should be set in .env files
    const nodeEnv = configManager.get('NODE_ENV', 'development');
    return nodeEnv;
  }
  
  /**
   * Check if environment file exists
   */
  static async checkEnvironmentFile(envFile: string): Promise<boolean> {
    try {
      const response = await fetch(`/${envFile}`);
      return response.ok;
    } catch {
      return false;
    }
  }
  
  /**
   * Create environment switcher for development
   */
  static createEnvironmentSwitcher(): HTMLElement {
    const container = document.createElement('div');
    container.style.cssText = `
      position: fixed;
      top: 10px;
      right: 10px;
      background: #2c3e50;
      color: white;
      padding: 10px;
      border-radius: 5px;
      z-index: 10000;
      font-family: monospace;
      font-size: 12px;
      box-shadow: 0 2px 10px rgba(0,0,0,0.3);
    `;
    
    const label = document.createElement('label');
    label.textContent = 'Environment: ';
    label.style.marginRight = '5px';
    
    const select = document.createElement('select');
    select.style.cssText = `
      background: #34495e;
      color: white;
      border: 1px solid #7f8c8d;
      padding: 2px 5px;
      border-radius: 3px;
    `;
    
    const environments = this.getAvailableEnvironments();
    const currentNodeEnv = EnvParser.get('NODE_ENV', 'development');
    
    environments.forEach(env => {
      const option = document.createElement('option');
      option.value = env;
      option.textContent = env.replace('.env.', '').toUpperCase();
      
      // Check if this environment matches current NODE_ENV
      if (env.includes(currentNodeEnv)) {
        option.selected = true;
      }
      select.appendChild(option);
    });
    
    select.addEventListener('change', async (e) => {
      const selectedEnv = (e.target as HTMLSelectElement).value;
      await this.switchEnvironment(selectedEnv);
      
      // Show notification
      const notification = document.createElement('div');
      notification.textContent = `Switched to ${selectedEnv}`;
      notification.style.cssText = `
        position: fixed;
        top: 60px;
        right: 10px;
        background: #27ae60;
        color: white;
        padding: 8px 12px;
        border-radius: 4px;
        z-index: 10001;
        font-family: monospace;
        font-size: 11px;
      `;
      document.body.appendChild(notification);
      
      setTimeout(() => {
        document.body.removeChild(notification);
      }, 3000);
    });
    
    container.appendChild(label);
    container.appendChild(select);
    
    return container;
  }
  
  /**
   * Show environment info panel
   */
  static showEnvironmentInfo(): void {
    // Get feature flags using EnvParser
    const features: Record<string, any> = {};
    
    // Common feature flags to check
    const featureKeys = [
      'FEATURE_ADVANCED_ROUTING',
      'FEATURE_MODEL_VALIDATION', 
      'FEATURE_DEPENDENCY_INJECTION',
      'FEATURE_MIDDLEWARE_PIPELINE',
      'FEATURE_ERROR_HANDLING',
      'FEATURE_VIEW_ENGINE',
      'FEATURE_HTML_HELPERS',
      'FEATURE_CONFIGURATION_MANAGER',
      'FEATURE_BETA_FEATURES',
      'FEATURE_ADVANCED_DEBUGGING',
      'FEATURE_CONFIG_UPDATES',
      'FEATURE_ANALYTICS',
      'FEATURE_SERVICE_WORKER',
      'FEATURE_OFFLINE_MODE'
    ];
    
    featureKeys.forEach(key => {
      const value = EnvParser.get(key);
      if (value !== undefined) {
        features[key] = value;
      }
    });
    
    const nodeEnv = EnvParser.get('NODE_ENV', 'development');
    
    const info = {
      current: nodeEnv,  // Use NODE_ENV as the current environment
      configFile: `.env.${nodeEnv}`,  // Config file should match NODE_ENV
      debug: EnvParser.get('DEBUG', false),
      apiUrl: EnvParser.get('API_BASE_URL', '/api'),
      nodeEnv: nodeEnv,
      features: features,
      envVarCount: typeof window !== 'undefined' && (window as any).__ENV__ ? 
                   Object.keys((window as any).__ENV__).length : 0
    };
    
    console.group('🌍 Environment Information');
    console.log('Current Environment:', info.current);
    console.log('NODE_ENV:', info.nodeEnv);
    console.log('Config File:', info.configFile);
    console.log('Debug Mode:', info.debug);
    console.log('API URL:', info.apiUrl);
    console.log('Feature Flags:', info.features);
    console.log('Total Environment Variables:', info.envVarCount);
    console.groupEnd();
  }
}

// Global utilities for browser console
if (typeof window !== 'undefined') {
  (window as any).switchEnv = EnvironmentManager.switchEnvironment.bind(EnvironmentManager);
  (window as any).showEnvInfo = EnvironmentManager.showEnvironmentInfo.bind(EnvironmentManager);
  (window as any).createEnvSwitcher = EnvironmentManager.createEnvironmentSwitcher.bind(EnvironmentManager);
  
  // Additional debug utilities
  (window as any).testEnvSwitch = async () => {
    console.log('🧪 Testing Environment Switching...');
    
    console.log('\n📋 Available Environments:');
    EnvironmentManager.getAvailableEnvironments().forEach(env => {
      console.log(`  - ${env}`);
    });
    
    console.log('\n🔍 Current State:');
    EnvironmentManager.showEnvironmentInfo();
    
    console.log('\n🔄 Testing switch to production...');
    await EnvironmentManager.switchEnvironment('.env.production');
    
    console.log('\n🔄 Testing switch to UAT...');
    await EnvironmentManager.switchEnvironment('.env.uat');
    
    console.log('\n🔄 Switching back to development...');
    await EnvironmentManager.switchEnvironment('.env.development');
    
    console.log('\n✅ Environment switching test complete!');
  };
  
  (window as any).listAllEnvVars = () => {
    const env = (window as any).__ENV__ || {};
    console.log('📋 All Environment Variables:');
    Object.keys(env).sort().forEach(key => {
      console.log(`  ${key} = ${env[key]}`);
    });
  };
  
  (window as any).debugEnvSwitch = async (envFile: string) => {
    console.log(`🔍 Debug: Switching to ${envFile}`);
    
    console.log('📋 Before switch:');
    const beforeEnv = (window as any).__ENV__ || {};
    console.log(`  NODE_ENV: ${beforeEnv.NODE_ENV || 'undefined'}`);
    console.log(`  DEBUG: ${beforeEnv.DEBUG || 'undefined'}`);
    console.log(`  API_BASE_URL: ${beforeEnv.API_BASE_URL || 'undefined'}`);
    
    await EnvironmentManager.switchEnvironment(envFile);
    
    console.log('📋 After switch:');
    const afterEnv = (window as any).__ENV__ || {};
    console.log(`  NODE_ENV: ${afterEnv.NODE_ENV || 'undefined'}`);
    console.log(`  DEBUG: ${afterEnv.DEBUG || 'undefined'}`);
    console.log(`  API_BASE_URL: ${afterEnv.API_BASE_URL || 'undefined'}`);
    
    EnvironmentManager.showEnvironmentInfo();
  };
}
