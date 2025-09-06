import { Router } from './router';
import { ServiceContainer } from './serviceContainer';
import { RequestPipeline, Middleware } from './requestPipeline';

/**
 * Application class that abstracts the pipeline configuration
 * Provides a clean API for middleware registration
 */
export class App {
    private pipeline: RequestPipeline;
    private router: Router;

    constructor(serviceContainer: ServiceContainer, router: Router) {
        this.router = router;
        this.pipeline = new RequestPipeline(serviceContainer, router);
        
        // Set up the pipeline handler in the router
        this.router.setPipelineHandler((url: string, method: string) => 
            this.pipeline.processRequest(url, method)
        );
    }

    /**
     * Add middleware to the application pipeline
     * @param middleware The middleware to add
     * @returns The App instance for method chaining
     */
    use(middleware: Middleware): App {
        this.pipeline.use(middleware);
        return this;
    }

    /**
     * Start the application
     */
    start(): void {
        // Initialize routing - all routes will go through the pipeline
        this.router.init();
        
        // Make available globally for debugging
        (window as any).router = this.router;
        (window as any).requestPipeline = this.pipeline;
    }

    /**
     * Get the underlying router (for advanced use cases)
     */
    getRouter(): Router {
        return this.router;
    }

    /**
     * Get the underlying pipeline (for advanced use cases)
     */
    getPipeline(): RequestPipeline {
        return this.pipeline;
    }
}
