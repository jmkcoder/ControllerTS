/**
 * Dependency Injection Decorators
 * Inspired by ASP.NET Core's DI decorators
 */

import 'reflect-metadata';
import { serviceContainer, ServiceLifetime } from './serviceContainer.js';

/**
 * Injectable decorator - marks a class as available for dependency injection
 */
export function Injectable<T extends new (...args: any[]) => any>(target: T): T {
    // Ensure the class is registered as transient by default
    if (!serviceContainer.tryGetService(target)) {
        serviceContainer.addTransient(target);
    }
    return target;
}

/**
 * Service decorator - registers a class as a service with specified lifetime
 */
export function Service(lifetime: ServiceLifetime = ServiceLifetime.Transient) {
    return function <T extends new (...args: any[]) => any>(target: T): T {
        switch (lifetime) {
            case ServiceLifetime.Singleton:
                serviceContainer.addSingleton(target);
                break;
            case ServiceLifetime.Scoped:
                serviceContainer.addScoped(target);
                break;
            case ServiceLifetime.Transient:
            default:
                serviceContainer.addTransient(target);
                break;
        }
        return target;
    };
}

/**
 * Transient service decorator
 */
export function Transient<T extends new (...args: any[]) => any>(target: T): T {
    serviceContainer.addTransient(target);
    return target;
}

/**
 * Scoped service decorator
 */
export function Scoped<T extends new (...args: any[]) => any>(target: T): T {
    // Explicitly ensure metadata is preserved by adding a property
    (target as any).__scoped = true;
    serviceContainer.addScoped(target);
    return target;
}

/**
 * Singleton service decorator
 */
export function Singleton<T extends new (...args: any[]) => any>(target: T): T {
    serviceContainer.addSingleton(target);
    return target;
}

/**
 * Inject decorator - marks a parameter for dependency injection
 */
export function Inject(token?: any) {
    return function (target: any, propertyKey: string | symbol | undefined, parameterIndex: number) {
        const existingTokens = (Reflect as any).getMetadata?.('custom:inject-tokens', target) || [];
        existingTokens[parameterIndex] = token;
        (Reflect as any).defineMetadata?.('custom:inject-tokens', existingTokens, target);
    };
}

/**
 * Autowired decorator - automatically inject dependencies into properties
 */
export function Autowired(target: any, propertyKey: string) {
    const type = (Reflect as any).getMetadata?.('design:type', target, propertyKey);
    
    Object.defineProperty(target, propertyKey, {
        get: function() {
            return serviceContainer.getService(type);
        },
        enumerable: true,
        configurable: true
    });
}
