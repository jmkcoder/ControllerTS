/**
 * Service Container for Dependency Injection
 * Inspired by ASP.NET Core's built-in DI container
 */

import 'reflect-metadata';

export enum ServiceLifetime {
    Transient = 'transient',
    Scoped = 'scoped',
    Singleton = 'singleton'
}

export interface ServiceDescriptor {
    serviceType: any;
    implementationType?: any;
    factory?: (container: ServiceContainer) => any;
    instance?: any;
    lifetime: ServiceLifetime;
}

export class ServiceContainer {
    private services = new Map<any, ServiceDescriptor>();
    private singletonInstances = new Map<any, any>();
    private scopedInstances = new Map<any, any>();

    /**
     * Register a transient service
     */
    addTransient<T>(serviceType: new (...args: any[]) => T, implementationType?: new (...args: any[]) => T): this {
        this.services.set(serviceType, {
            serviceType,
            implementationType: implementationType || serviceType,
            lifetime: ServiceLifetime.Transient
        });
        return this;
    }

    /**
     * Register a transient service with factory
     */
    addTransientFactory<T>(serviceType: new (...args: any[]) => T, factory: (container: ServiceContainer) => T): this {
        this.services.set(serviceType, {
            serviceType,
            factory,
            lifetime: ServiceLifetime.Transient
        });
        return this;
    }

    /**
     * Register a scoped service
     */
    addScoped<T>(serviceType: new (...args: any[]) => T, implementationType?: new (...args: any[]) => T): this {
        this.services.set(serviceType, {
            serviceType,
            implementationType: implementationType || serviceType,
            lifetime: ServiceLifetime.Scoped
        });
        return this;
    }

    /**
     * Register a scoped service with factory
     */
    addScopedFactory<T>(serviceType: new (...args: any[]) => T, factory: (container: ServiceContainer) => T): this {
        this.services.set(serviceType, {
            serviceType,
            factory,
            lifetime: ServiceLifetime.Scoped
        });
        return this;
    }

    /**
     * Register a singleton service
     */
    addSingleton<T>(serviceType: new (...args: any[]) => T, implementationType?: new (...args: any[]) => T): this {
        this.services.set(serviceType, {
            serviceType,
            implementationType: implementationType || serviceType,
            lifetime: ServiceLifetime.Singleton
        });
        return this;
    }

    /**
     * Register a singleton service with factory
     */
    addSingletonFactory<T>(serviceType: new (...args: any[]) => T, factory: (container: ServiceContainer) => T): this {
        this.services.set(serviceType, {
            serviceType,
            factory,
            lifetime: ServiceLifetime.Singleton
        });
        return this;
    }

    /**
     * Register a singleton instance
     */
    addSingletonInstance<T>(serviceType: new (...args: any[]) => T, instance: T): this {
        this.services.set(serviceType, {
            serviceType,
            instance,
            lifetime: ServiceLifetime.Singleton
        });
        this.singletonInstances.set(serviceType, instance);
        return this;
    }

    /**
     * Get a service instance
     */
    getService<T>(serviceType: new (...args: any[]) => T): T {
        const descriptor = this.services.get(serviceType);
        if (!descriptor) {
            throw new Error(`Service of type ${serviceType.name} is not registered`);
        }

        return this.createInstance(descriptor);
    }

    /**
     * Try to get a service instance, returns null if not found
     */
    tryGetService<T>(serviceType: new (...args: any[]) => T): T | null {
        try {
            return this.getService(serviceType);
        } catch {
            return null;
        }
    }

    /**
     * Create a new scope for scoped services
     */
    createScope(): ServiceContainer {
        const scope = new ServiceContainer();
        scope.services = this.services;
        scope.singletonInstances = this.singletonInstances;
        return scope;
    }

    /**
     * Clear scoped instances (typically called at end of request/scope)
     */
    clearScope(): void {
        this.scopedInstances.clear();
    }

    private createInstance<T>(descriptor: ServiceDescriptor): T {
        switch (descriptor.lifetime) {
            case ServiceLifetime.Singleton:
                return this.getSingletonInstance(descriptor);
            
            case ServiceLifetime.Scoped:
                return this.getScopedInstance(descriptor);
            
            case ServiceLifetime.Transient:
                return this.createTransientInstance(descriptor);
            
            default:
                throw new Error(`Unknown service lifetime: ${descriptor.lifetime}`);
        }
    }

    private getSingletonInstance<T>(descriptor: ServiceDescriptor): T {
        if (descriptor.instance) {
            return descriptor.instance;
        }

        let instance = this.singletonInstances.get(descriptor.serviceType);
        if (!instance) {
            instance = this.instantiate(descriptor);
            this.singletonInstances.set(descriptor.serviceType, instance);
        }
        return instance;
    }

    private getScopedInstance<T>(descriptor: ServiceDescriptor): T {
        let instance = this.scopedInstances.get(descriptor.serviceType);
        if (!instance) {
            instance = this.instantiate(descriptor);
            this.scopedInstances.set(descriptor.serviceType, instance);
        }
        return instance;
    }

    private createTransientInstance<T>(descriptor: ServiceDescriptor): T {
        return this.instantiate(descriptor);
    }

    private instantiate<T>(descriptor: ServiceDescriptor): T {
        if (descriptor.factory) {
            return descriptor.factory(this);
        }

        if (!descriptor.implementationType) {
            throw new Error(`No implementation type or factory for service ${descriptor.serviceType.name}`);
        }

        // Get constructor parameters using reflection metadata
        let paramTypes: any[] = [];
        try {
            paramTypes = (Reflect as any).getMetadata?.('design:paramtypes', descriptor.implementationType) || [];
        } catch (error) {
            console.warn(`Could not get metadata for ${descriptor.implementationType.name}, assuming no dependencies`);
            paramTypes = [];
        }

        if (paramTypes.length === 0) {
            // Check if constructor actually has parameters even if metadata is missing
            const constructorString = descriptor.implementationType.toString();
            const hasParameters = constructorString.includes('constructor(') && 
                                  !constructorString.match(/constructor\(\s*\)/);
            
            if (hasParameters) {
                // Generic handling for all controllers and services with constructor dependencies
                const constructorMatch = constructorString.match(/constructor\s*\(([^)]*)\)/);
                if (constructorMatch && constructorMatch[1].trim()) {
                    const paramString = constructorMatch[1];
                    
                    // Try to resolve dependencies by common service naming patterns
                    const dependencies: any[] = [];
                    const params = paramString.split(',').map((p: string) => p.trim());
                    
                    for (const param of params) {
                        // Extract parameter name (before the colon if TypeScript, or just the name if compiled)
                        const paramName = param.split(':')[0].trim();
                        
                        // Try to resolve dependency by matching parameter name to registered services
                        let resolvedDependency = null;
                        
                        // Get all registered service names
                        const registeredServices = Array.from(this.services.keys()).map(k => ({
                            type: k,
                            name: k.name
                        }));
                        
                        // Strategy 1: Try exact name match (camelCase param -> PascalCase service)
                        const pascalCaseServiceName = paramName.charAt(0).toUpperCase() + paramName.slice(1);
                        const exactMatch = registeredServices.find(s => s.name === pascalCaseServiceName);
                        if (exactMatch) {
                            resolvedDependency = this.createInstance(this.services.get(exactMatch.type)!);
                        }
                        
                        // Strategy 2: Try service name pattern matching (remove "Service" suffix)
                        if (!resolvedDependency) {
                            const servicePattern = registeredServices.find(s => {
                                const serviceName = s.name.toLowerCase();
                                const paramNameLower = paramName.toLowerCase();
                                
                                // Check if service name (without "Service" suffix) matches parameter name
                                const serviceBase = serviceName.replace('service', '');
                                return serviceBase === paramNameLower || 
                                       serviceName === paramNameLower + 'service' ||
                                       serviceName.includes(paramNameLower);
                            });
                            
                            if (servicePattern) {
                                resolvedDependency = this.createInstance(this.services.get(servicePattern.type)!);
                            }
                        }
                        
                        // Strategy 3: Try partial name matching
                        if (!resolvedDependency) {
                            const partialMatch = registeredServices.find(s => {
                                const serviceName = s.name.toLowerCase();
                                const paramNameLower = paramName.toLowerCase();
                                return serviceName.includes(paramNameLower) || paramNameLower.includes(serviceName.replace('service', ''));
                            });
                            
                            if (partialMatch) {
                                resolvedDependency = this.createInstance(this.services.get(partialMatch.type)!);
                            }
                        }
                        
                        if (resolvedDependency) {
                            dependencies.push(resolvedDependency);
                        } else {
                            console.warn(`✗ Could not resolve dependency: ${paramName}`);
                            console.log(`Available services: ${registeredServices.map(s => s.name).join(', ')}`);
                            dependencies.push(undefined);
                        }
                    }
                    
                    // Only proceed if we resolved all dependencies
                    if (dependencies.length > 0 && dependencies.every((dep: any) => dep !== undefined)) {
                        return new descriptor.implementationType(...dependencies);
                    } else {
                        console.error(`✗ Failed to resolve all dependencies for ${descriptor.implementationType.name}`);
                    }
                }
                
                // Fallback for known services that depend on LoggerService
                if (['UserService', 'ProductService', 'EmailService'].includes(descriptor.implementationType.name)) {
                    // Find LoggerService by searching through registered services
                    for (const [serviceType, serviceDescriptor] of this.services.entries()) {
                        if (serviceType.name === 'LoggerService') {
                            const logger = this.createInstance(serviceDescriptor);
                            return new descriptor.implementationType(logger);
                        }
                    }
                }
            }
            
            // No dependencies, create simple instance
            return new descriptor.implementationType();
        }

        const dependencies = paramTypes.map((paramType: any) => {
            if (paramType === Object || paramType === undefined) {
                return undefined;
            }
            try {
                const dependency = this.getService(paramType);
                return dependency;
            } catch (error) {
                console.warn(`Failed to resolve dependency ${paramType?.name || 'unknown'} for ${descriptor.implementationType.name}:`, error);
                return undefined;
            }
        });

        return new descriptor.implementationType(...dependencies);
    }
}

// Global service container instance
export const serviceContainer = new ServiceContainer();
