/**
 * Request Pipeline for handling HTTP requests with proper DI scoping
 * Inspired by ASP.NET Core's request pipeline
 */

import { ServiceContainer } from './serviceContainer';
import { Router } from './router';

export interface RequestContext {
    url: string;
    path: string;
    method: string;
    queryParams: Record<string, string>;
    services: ServiceContainer;
    startTime: number;
}

export interface Middleware {
    handle(context: RequestContext, next: () => Promise<void>): Promise<void>;
}

export class RequestPipeline {
    private middlewares: Middleware[] = [];
    private rootContainer: ServiceContainer;
    private router: Router;

    constructor(rootContainer: ServiceContainer, router: Router) {
        this.rootContainer = rootContainer;
        this.router = router;
    }

    /**
     * Add middleware to the pipeline
     */
    use(middleware: Middleware): this {
        this.middlewares.push(middleware);
        return this;
    }

    /**
     * Process a request through the pipeline
     */
    async processRequest(url: string, method: string = 'GET'): Promise<void> {
        // Create a new scope for this request
        const requestScope = this.rootContainer.createScope();
        
        // Parse URL and query parameters
        const urlObj = new URL(url, window.location.origin);
        const queryParams: Record<string, string> = {};
        urlObj.searchParams.forEach((value, key) => {
            queryParams[key] = value;
        });

        // Create request context
        const context: RequestContext = {
            url,
            path: urlObj.pathname,
            method,
            queryParams,
            services: requestScope,
            startTime: Date.now()
        };

        try {
            // Process through middleware pipeline
            await this.processMiddlewares(context, 0);
        } finally {
            // Always clean up scoped services after request
            requestScope.clearScope();
        }
    }

    private async processMiddlewares(context: RequestContext, index: number): Promise<void> {
        console.log(`🔗 RequestPipeline: processMiddlewares called with index ${index}/${this.middlewares.length}`);
        
        if (index >= this.middlewares.length) {
            // End of middleware chain, execute the router
            console.log('🔗 RequestPipeline: End of middleware chain, executing route...');
            return this.executeRoute(context);
        }

        const middleware = this.middlewares[index];
        console.log(`🔗 RequestPipeline: Processing middleware ${index}: ${middleware.constructor.name}`);
        
        await middleware.handle(context, () => {
            console.log(`🔗 RequestPipeline: Middleware ${index} (${middleware.constructor.name}) called next()`);
            return this.processMiddlewares(context, index + 1);
        });
        
        console.log(`🔗 RequestPipeline: Middleware ${index} (${middleware.constructor.name}) completed`);
    }

    private async executeRoute(context: RequestContext): Promise<void> {
        console.log('🔗 RequestPipeline: executeRoute called with context:', context.path);
        
        // Set the current request context in the router
        this.router.setRequestContext(context);
        console.log('🔗 RequestPipeline: Request context set in router');
        
        // Route the request
        console.log('🔗 RequestPipeline: Calling router.routePath...');
        await this.router.routePath(context.path);
        console.log('🔗 RequestPipeline: router.routePath completed');
    }
}

/**
 * Logging middleware
 */
export class LoggingMiddleware implements Middleware {
    async handle(context: RequestContext, next: () => Promise<void>): Promise<void> {
        console.log(`[${new Date().toISOString()}] ${context.method} ${context.url}`);
        
        await next();
        
        const duration = Date.now() - context.startTime;
        console.log(`[${new Date().toISOString()}] Completed ${context.method} ${context.url} in ${duration}ms`);
    }
}

/**
 * Error handling middleware
 */
export class ErrorHandlingMiddleware implements Middleware {
    async handle(context: RequestContext, next: () => Promise<void>): Promise<void> {
        try {
            await next();
        } catch (error) {
            console.error(`Error processing request ${context.url}:`, error);
            
            // You could render an error page here
            const errorHtml = `
                <div style="padding: 20px; background: #f8d7da; color: #721c24; border: 1px solid #f5c6cb; border-radius: 4px; margin: 20px;">
                    <h3>❌ Request Error</h3>
                    <p><strong>URL:</strong> ${context.url}</p>
                    <p><strong>Error:</strong> ${error instanceof Error ? error.message : 'Unknown error'}</p>
                    <details>
                        <summary>Stack Trace</summary>
                        <pre style="background: #fff; padding: 10px; border-radius: 4px; margin-top: 10px;">${error instanceof Error ? error.stack : 'No stack trace available'}</pre>
                    </details>
                </div>
            `;
            
            const appElement = document.getElementById('app');
            if (appElement) {
                appElement.innerHTML = errorHtml;
            }
            
            throw error; // Re-throw for debugging
        }
    }
}

/**
 * DI scope middleware - ensures proper scoping of services
 */
export class DIScopeMiddleware implements Middleware {
    async handle(context: RequestContext, next: () => Promise<void>): Promise<void> {
        // Make the request-scoped container available globally for this request
        (window as any).currentRequestServices = context.services;
        
        try {
            await next();
        } finally {
            // Clean up global reference
            delete (window as any).currentRequestServices;
        }
    }
}

/**
 * Request context middleware - adds request info to DI container
 */
export class RequestContextMiddleware implements Middleware {
    async handle(context: RequestContext, next: () => Promise<void>): Promise<void> {
        // Register request context as a singleton for this request using a class token
        class RequestContextToken {}
        context.services.addSingletonInstance(RequestContextToken as any, context);
        
        await next();
    }
}
