// Custom template cache for compiled HTML
const templateCache: Record<string, string> = {};

export class ViewEngine {
  /**
   * Clear the template cache (useful for HMR)
   */
  static clearCache(): void {
    Object.keys(templateCache).forEach(key => delete templateCache[key]);
    console.log('🗑️ Template cache cleared');
  }

  /**
   * Initialize HMR listener for template changes
   */
  static initHMR(): void {
    if (typeof window !== 'undefined' && (window as any).__vite_plugin_react_preamble_installed__) {
      // Simple polling approach for development
      // In a real implementation, you'd use Vite's HMR API
      console.log('� HMR initialized for templates');
    }
  }
  /**
   * Loads a template and compiles it to HTML at runtime
   */
  private static async loadAndCompileTemplate(viewPath: string, context: Record<string, any> = {}): Promise<string> {
    // In development mode, disable caching completely for better HMR experience
    const isDevelopment = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
    
    // Always clear cache in development mode to ensure fresh templates
    if (isDevelopment) {
      this.clearCache();
    }
    
    const cacheKey = `${viewPath}_${JSON.stringify(context)}`;
    
    if (!isDevelopment && templateCache[cacheKey]) {
      return templateCache[cacheKey];
    }

    // Convert view path to template path served by Vite
    const templatePath = viewPath.startsWith('/') ? viewPath.substring(1) : viewPath;
    
    // Add cache-busting in development mode
    const cacheBuster = isDevelopment ? `?t=${Date.now()}&r=${Math.random()}` : '';
    const fullUrl = `/src/${templatePath}${cacheBuster}`;

    try {
      console.log(`🔄 Fetching template: ${fullUrl}`);
      
      // Fetch the .njk template file through Vite's dev server with cache busting
      const response = await fetch(fullUrl, {
        cache: isDevelopment ? 'no-cache' : 'default',
        headers: isDevelopment ? {
          'Cache-Control': 'no-cache, no-store, must-revalidate',
          'Pragma': 'no-cache',
          'Expires': '0'
        } : {}
      });
      
      if (!response.ok) {
        throw new Error(`Template not found: ${templatePath} (status: ${response.status})`);
      }

      const templateContent = await response.text();
      console.log(`📄 Template content (first 100 chars): ${templateContent.substring(0, 100)}...`);
      
      // Compile the template at runtime
      const compiledHtml = await this.compileTemplate(templateContent, context);
      console.log(`✅ Template compiled, HTML length: ${compiledHtml.length}`);
      
      // Cache the compiled HTML only in production
      if (!isDevelopment) {
        templateCache[cacheKey] = compiledHtml;
      }
      
      return compiledHtml;
    } catch (error) {
      console.error(`Failed to load and compile template ${templatePath}:`, error);
      throw error;
    }
  }

  /**
   * Simple runtime template compilation
   */
  private static async compileTemplate(templateContent: string, context: Record<string, any> = {}): Promise<string> {
    let result = templateContent;

    // Handle template inheritance (extends)
    const extendsMatch = result.match(/{% extends ["']([^"']+)["'] %}/);
    if (extendsMatch) {
      const baseTemplatePath = extendsMatch[1];
      
      try {
        const baseTemplate = await this.loadBaseTemplate(baseTemplatePath);
        
        // Extract blocks from child template
        const blockMatches = result.matchAll(/{% block (\w+) %}([\s\S]*?){% endblock %}/g);
        const blocks: Record<string, string> = {};
        
        for (const match of blockMatches) {
          blocks[match[1]] = match[2].trim();
        }
        
        // Replace blocks in base template
        result = baseTemplate;
        for (const [blockName, blockContent] of Object.entries(blocks)) {
          const blockRegex = new RegExp(`{% block ${blockName} %}[\\s\\S]*?{% endblock %}`, 'g');
          result = result.replace(blockRegex, blockContent);
        }
      } catch (error) {
        console.error(`Error loading base template: ${baseTemplatePath}`, error);
        throw error;
      }
    }

    // Remove any remaining Nunjucks syntax
    result = result.replace(/{% extends [^%]+ %}/g, '');
    result = result.replace(/{% block \w+ %}/g, '');
    result = result.replace(/{% endblock %}/g, '');

    // Replace variables
    result = this.replaceVariables(result, context);

    return result;
  }

  /**
   * Load base template for inheritance
   */
  private static async loadBaseTemplate(templatePath: string): Promise<string> {
    const isDevelopment = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
    const cacheBuster = isDevelopment ? `?t=${Date.now()}&r=${Math.random()}` : '';
    
    console.log(`🔄 Fetching base template: /src/${templatePath}${cacheBuster}`);
    
    const response = await fetch(`/src/${templatePath}${cacheBuster}`, {
      cache: isDevelopment ? 'no-cache' : 'default',
      headers: isDevelopment ? {
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0'
      } : {}
    });
    
    if (!response.ok) {
      throw new Error(`Base template not found: ${templatePath}`);
    }
    
    const content = await response.text();
    console.log(`📄 Base template content (first 100 chars): ${content.substring(0, 100)}...`);
    
    return content;
  }

  /**
   * Replace template variables with context values
   */
  private static replaceVariables(template: string, context: Record<string, any>): string {
    let result = template;
    
    // Replace {{ variable }} patterns
    const variableRegex = /\{\{\s*(\w+)\s*\}\}/g;
    result = result.replace(variableRegex, (match, varName) => {
      return context[varName] !== undefined ? String(context[varName]) : match;
    });
    
    return result;
  }

  /**
   * Renders a template with context by compiling it at runtime
   */
  private static async renderTemplate(viewPath: string, context: Record<string, any> = {}): Promise<string> {
    try {
      return await this.loadAndCompileTemplate(viewPath, context);
    } catch (error) {
      console.error('Template rendering error:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      return `<div style="color: red; padding: 20px; border: 1px solid red;">
        <h3>Template Error</h3>
        <p>Failed to render template: ${viewPath}</p>
        <p>Error: ${errorMessage}</p>
      </div>`;
    }
  }

  /**
   * Renders a full view and replaces the entire document content (like MVC View())
   */
  static async View(viewPath: string, context: Record<string, any> = {}): Promise<void> {
    const html = await this.renderTemplate(viewPath, context);
    
    // Check if the template contains a full HTML document
    if (html.includes('<!DOCTYPE html>') || html.includes('<html')) {
      // Replace the entire document
      document.open();
      document.write(html);
      document.close();
    } else {
      // Just replace the body content for partial templates
      document.body.innerHTML = html;
    }
  }

  /**
   * Renders a partial view and returns the HTML string (like MVC PartialView())
   */
  static async PartialView(viewPath: string, context: Record<string, any> = {}): Promise<string> {
    return await this.renderTemplate(viewPath, context);
  }

  /**
   * For advanced/manual rendering (returns HTML string)
   */
  static async render(viewPath: string, context: Record<string, any> = {}): Promise<string> {
    return await this.renderTemplate(viewPath, context);
  }
}
