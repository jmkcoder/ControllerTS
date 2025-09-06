/**
 * Configuration Demo Controller
 * Demonstrates how to use ConfigurationManager in controllers
 */

import { Controller } from '../core/controller';
import { action, controller } from '../core/decorators';
import { ConfigurationManager } from '../core/configurationManager';
import { ApiService } from '../services/apiService';
import { AutoRegister } from '../core/controllerDiscovery';
import { Injectable } from '../core/diDecorators';

@controller('config')
@AutoRegister
@Injectable
export class ConfigController extends Controller {
  constructor(
    private config: ConfigurationManager,
    private apiService: ApiService
  ) {
    super();
  }

  /**
   * Default action - show configuration overview
   */
  async execute(): Promise<void> {
    const configData = {
      title: 'Configuration Manager Demo',
      subtitle: `Environment: ${this.config.getEnvironment()}`,
      environment: this.config.getEnvironment(),
      isDebug: this.config.isDebug(),
      isDevelopment: this.config.isDevelopment(),
      isProduction: this.config.isProduction(),
      appConfig: {
        name: this.config.get('name'),
        version: this.config.get('version'),
        baseUrl: this.config.get('baseUrl'),
        debug: this.config.get('debug')
      },
      apiConfig: this.apiService.getConfiguration(),
      cacheConfig: this.config.getSection('cache'),
      loggingConfig: this.config.getSection('logging'),
      securityConfig: {
        cors: this.config.get('security.cors'),
        https: this.config.get('security.https')
      },
      featureFlags: this.config.getSection('features'),
      customConfig: this.config.getSection('custom')
    };

    await this.View('views/config-demo.njk', configData);
  }

  /**
   * Show environment-specific configuration
   */
  @action('environment')
  async showEnvironment(): Promise<void> {
    const envData = {
      title: 'Environment Configuration',
      currentEnvironment: this.config.getEnvironment(),
      availableEnvironments: ['development', 'uat', 'staging', 'production'],
      environmentConfig: this.config.getAll(),
      recommendations: this.getEnvironmentRecommendations()
    };

    await this.View('views/config-demo.njk', envData);
  }

  /**
   * API configuration test
   */
  @action('api-test')
  async testApiConfiguration(): Promise<void> {
    try {
      // This would normally make a real API call
      // For demo purposes, we'll just show the configuration
      const apiConfig = this.apiService.getConfiguration();
      
      const testData = {
        title: 'API Configuration Test',
        subtitle: 'Testing API service with current configuration',
        apiConfig,
        testResults: {
          baseUrlValid: this.isValidUrl(apiConfig.baseUrl),
          timeoutReasonable: apiConfig.timeout >= 1000 && apiConfig.timeout <= 60000,
          retriesConfigured: apiConfig.retries > 0 && apiConfig.retries <= 5,
          authenticationConfigured: apiConfig.hasApiKey
        },
        recommendations: this.getApiRecommendations(apiConfig)
      };

      await this.View('views/config-demo.njk', testData);
    } catch (error) {
      await this.View('views/config-demo.njk', {
        title: 'API Configuration Error',
        error: error instanceof Error ? error.message : 'Unknown error',
        apiConfig: this.apiService.getConfiguration()
      });
    }
  }

  /**
   * Feature flags demo
   */
  @action('features')
  async showFeatures(): Promise<void> {
    const features = this.config.getSection('features');
    
    const featureData = {
      title: 'Feature Flags Configuration',
      subtitle: `Environment: ${this.config.getEnvironment()}`,
      features,
      enabledFeatures: Object.entries(features).filter(([_, enabled]) => enabled),
      disabledFeatures: Object.entries(features).filter(([_, enabled]) => !enabled),
      recommendations: this.getFeatureRecommendations()
    };

    await this.View('views/config-demo.njk', featureData);
  }

  /**
   * Configuration update demo (for development)
   */
  @action('update')
  async updateConfiguration(formData?: any): Promise<void> {
    if (formData && Object.keys(formData).length > 0) {
      // Update configuration values
      Object.entries(formData).forEach(([key, value]) => {
        if (key.startsWith('config.')) {
          const configPath = key.substring(7); // Remove 'config.' prefix
          this.config.set(configPath, value);
        }
      });

      await this.View('views/config-demo.njk', {
        title: 'Configuration Updated',
        subtitle: 'Configuration has been updated successfully',
        updatedValues: formData,
        currentConfig: this.config.getAll()
      });
    } else {
      // Show update form
      await this.View('views/config-demo.njk', {
        title: 'Update Configuration',
        subtitle: 'Modify configuration values (Development only)',
        isUpdateForm: true,
        currentConfig: this.config.getAll(),
        isDevelopment: this.config.isDevelopment()
      });
    }
  }

  /**
   * Get environment-specific recommendations
   */
  private getEnvironmentRecommendations(): string[] {
    const env = this.config.getEnvironment();
    const recommendations: string[] = [];

    switch (env) {
      case 'development':
        recommendations.push('Debug mode is enabled for detailed logging');
        recommendations.push('CORS is permissive for development');
        recommendations.push('Error stack traces are visible');
        break;
      case 'uat':
        recommendations.push('Enable error reporting for testing');
        recommendations.push('Use HTTPS for realistic testing');
        recommendations.push('Enable some analytics for behavior testing');
        break;
      case 'production':
        recommendations.push('Ensure debug mode is disabled');
        recommendations.push('Enable all security features');
        recommendations.push('Configure proper error reporting');
        recommendations.push('Enable service worker for performance');
        break;
    }

    return recommendations;
  }

  /**
   * Get API configuration recommendations
   */
  private getApiRecommendations(apiConfig: any): string[] {
    const recommendations: string[] = [];

    if (!apiConfig.hasApiKey) {
      recommendations.push('Consider adding API key for authentication');
    }

    if (apiConfig.timeout > 30000) {
      recommendations.push('API timeout is quite high, consider reducing it');
    }

    if (apiConfig.retries > 3) {
      recommendations.push('High retry count may impact performance');
    }

    if (!this.isValidUrl(apiConfig.baseUrl)) {
      recommendations.push('API base URL appears to be invalid');
    }

    return recommendations;
  }

  /**
   * Get feature flag recommendations
   */
  private getFeatureRecommendations(): string[] {
    const env = this.config.getEnvironment();
    const features = this.config.getSection('features');
    const recommendations: string[] = [];

    if (env === 'production') {
      if (!features.enableAnalytics) {
        recommendations.push('Consider enabling analytics in production');
      }
      if (!features.enableServiceWorker) {
        recommendations.push('Service worker can improve performance');
      }
    }

    if (env === 'development') {
      if (features.enableAnalytics) {
        recommendations.push('Analytics can be disabled in development');
      }
    }

    return recommendations;
  }

  /**
   * Validate URL format
   */
  private isValidUrl(url: string): boolean {
    try {
      new URL(url);
      return true;
    } catch {
      return false;
    }
  }
}
