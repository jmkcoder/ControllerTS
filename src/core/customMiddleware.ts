/**
 * Custom Middleware Examples
 * Shows how to create middleware that runs before and after request processing
 */

import { RequestContext, Middleware } from './requestPipeline';

/**
 * Authentication Middleware - runs before request processing
 */
export class AuthenticationMiddleware implements Middleware {
    async handle(context: RequestContext, next: () => Promise<void>): Promise<void> {
        
        // Simulate authentication check
        const isAuthenticated = true; // In real app, check JWT token, session, etc.
        
        if (!isAuthenticated && this.requiresAuth(context.path)) {
            // Redirect to login or throw error
            window.location.href = '/login';
            return; // Stop pipeline execution
        }
        
        // Continue to next middleware
        await next();
    }
    
    private requiresAuth(path: string): boolean {
        const protectedPaths = ['/admin', '/profile', '/orders'];
        return protectedPaths.some(p => path.startsWith(p));
    }
}

/**
 * Performance Monitoring Middleware - runs before and after
 */
export class PerformanceMiddleware implements Middleware {
    async handle(context: RequestContext, next: () => Promise<void>): Promise<void> {
        const startTime = performance.now();

        try {
            // Continue to next middleware/controller
            await next();
            
            // This runs AFTER the request is processed
            const endTime = performance.now();
            const duration = endTime - startTime;
            
            // Log performance metrics
            this.logPerformanceMetric(context.path, duration);
            
        } catch (error) {
            const endTime = performance.now();
            const duration = endTime - startTime;
            console.log(`❌ Perf: Request ${context.path} failed after ${duration.toFixed(2)}ms`);
            throw error; // Re-throw to maintain error handling
        }
    }
    
    private logPerformanceMetric(path: string, duration: number): void {
        // In a real app, send to analytics service
        if (duration > 1000) {
            console.warn(`🐌 Slow request detected: ${path} took ${duration.toFixed(2)}ms`);
        }
    }
}

/**
 * CORS Middleware - runs before request processing
 */
export class CorsMiddleware implements Middleware {
    async handle(context: RequestContext, next: () => Promise<void>): Promise<void> {
        // In a real app, you'd set actual HTTP headers
        // For SPA, we'll just log the CORS handling
        const allowedOrigins = ['http://localhost:5173', 'https://myapp.com'];
        const origin = window.location.origin;
        
        if (allowedOrigins.includes(origin)) {
            console.log(`✅ CORS: Origin ${origin} allowed`);
        }
        
        // Continue to next middleware
        await next();
    }
}

/**
 * Request Validation Middleware - runs before processing
 */
export class ValidationMiddleware implements Middleware {
    async handle(context: RequestContext, next: () => Promise<void>): Promise<void> {
        // Validate query parameters
        const errors = this.validateRequest(context);
        
        if (errors.length > 0) {
            console.log(`❌ Validation: Request validation failed:`, errors);
            // In a real app, return 400 Bad Request
            throw new Error(`Validation failed: ${errors.join(', ')}`);
        }
        
        // Continue to next middleware
        await next();
    }
    
    private validateRequest(context: RequestContext): string[] {
        const errors: string[] = [];
        
        // Example validations
        if (context.path === '/products' && context.queryParams.page) {
            const page = parseInt(context.queryParams.page);
            if (isNaN(page) || page < 1) {
                errors.push('Page parameter must be a positive number');
            }
        }
        
        return errors;
    }
}

/**
 * Response Caching Middleware - runs after processing
 */
export class CachingMiddleware implements Middleware {
    private cache = new Map<string, { data: any, timestamp: number }>();
    private cacheTimeout = 5 * 60 * 1000; // 5 minutes
    
    async handle(context: RequestContext, next: () => Promise<void>): Promise<void> {
        const cacheKey = `${context.method}:${context.path}:${JSON.stringify(context.queryParams)}`;
        
        // Check cache before processing (for GET requests)
        if (context.method === 'GET') {
            const cached = this.cache.get(cacheKey);
            if (cached && (Date.now() - cached.timestamp) < this.cacheTimeout) {
                // In a real app, you'd return the cached response
                return;
            }
        }
        
        // Continue to next middleware/controller
        await next();
        
        // Cache the response after processing (for GET requests)
        if (context.method === 'GET') {
            this.cache.set(cacheKey, {
                data: 'response-data', // In real app, capture actual response
                timestamp: Date.now()
            });
        }
    }
}

/**
 * Security Headers Middleware - runs after processing
 */
export class SecurityMiddleware implements Middleware {
    async handle(context: RequestContext, next: () => Promise<void>): Promise<void> {
        console.log(`🛡️  Security: Adding security headers for ${context.path}`);
        
        // Continue to next middleware/controller first
        await next();
        
        // Add security headers after response is generated
        // In a real app, you'd set actual HTTP headers
        console.log(`🔒 Security: Applied security headers (CSP, HSTS, X-Frame-Options, etc.)`);
    }
}
