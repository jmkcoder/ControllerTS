import * as nunjucks from 'nunjucks';

// Import HtmlHelper for reinitialization after DOM updates
import { HtmlHelper } from './htmlHelper';

// Custom template cache for compiled HTML
const templateCache: Record<string, string> = {};

// Configure Nunjucks environment
let nunjucksEnv: nunjucks.Environment | null = null;

function getNunjucksEnvironment(): nunjucks.Environment {
  if (!nunjucksEnv) {
    // Create a custom loader that fetches templates via HTTP
    class HttpLoader {
      async: boolean = false;
      
      getSource(name: string): nunjucks.LoaderSource {
        // For browser environment, we'll use synchronous XMLHttpRequest
        const isDevelopment = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
        const cacheBuster = isDevelopment ? `?t=${Date.now()}&r=${Math.random()}` : '';
        
        const xhr = new XMLHttpRequest();
        xhr.open('GET', `/src/${name}${cacheBuster}`, false); // Synchronous request
        
        if (isDevelopment) {
          xhr.setRequestHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
          xhr.setRequestHeader('Pragma', 'no-cache');
          xhr.setRequestHeader('Expires', '0');
        }
        
        try {
          xhr.send();
          
          if (xhr.status !== 200) {
            throw new Error(`Template not found: ${name} (status: ${xhr.status})`);
          }
          
          return {
            src: xhr.responseText,
            path: name,
            noCache: isDevelopment
          };
        } catch (error) {
          console.error(`Failed to load template ${name}:`, error);
          throw error;
        }
      }
    }
    
    // Create Nunjucks environment with custom loader
    nunjucksEnv = new nunjucks.Environment(new HttpLoader() as any, {
      autoescape: true,
      trimBlocks: true,
      lstripBlocks: true
    });
    
    // Add custom filters
    nunjucksEnv.addFilter('urlencode', (str: string) => {
      return encodeURIComponent(str || '');
    });
    
    nunjucksEnv.addFilter('title', (str: string) => {
      return (str || '').replace(/\w\S*/g, (txt) => 
        txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase()
      );
    });
    
    nunjucksEnv.addFilter('dump', (obj: any, indent: number = 2) => {
      return JSON.stringify(obj, null, indent);
    });
  }
  
  return nunjucksEnv;
}

export class ViewEngine {
  /**
   * Clear the template cache (useful for HMR)
   */
  static clearCache(): void {
    Object.keys(templateCache).forEach(key => delete templateCache[key]);
    // Reset the Nunjucks environment to clear its cache
    nunjucksEnv = null;
  }
  /**
   * Renders a template with context using Nunjucks
   */
  private static async renderTemplate(viewPath: string, context: Record<string, any> = {}): Promise<string> {
    try {
      const env = getNunjucksEnvironment();
      
      // Convert view path to template path
      const templatePath = viewPath.startsWith('/') ? viewPath.substring(1) : viewPath;
      
      // Add HtmlHelper to the template context
      const templateContext = {
        ...context,
        Html: HtmlHelper // Make HtmlHelper available in templates
      };
      
      // Use Nunjucks to render the template
      return new Promise((resolve, reject) => {
        env.render(templatePath, templateContext, (err, result) => {
          if (err) {
            console.error('Nunjucks rendering error:', err);
            reject(err);
          } else {
            resolve(result || '');
          }
        });
      });
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
    
    // Always just replace the body content to preserve event listeners
    // document.open() and document.write() can break event listeners
    document.body.innerHTML = html;
    
    // IMPORTANT: Reinitialize HtmlHelper after DOM content changes
    // This ensures MVC attributes work on the new content
    HtmlHelper.reinitialize();
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
