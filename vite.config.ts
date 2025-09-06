import { defineConfig } from 'vite';
import * as fs from 'fs';
import * as path from 'path';

export default defineConfig(({ command, mode }) => {
  const isDev = command === 'serve';
  return {
    root: '.',
    build: {
      outDir: 'dist',
      emptyOutDir: true
    },
    server: {
      open: true,
      watch: {
        // Watch for changes in all .njk files
        ignored: ['!**/src/**/*.njk'],
      },
      // Configure historyApiFallback for client-side routing
      historyApiFallback: true,
      fs: {
        // Allow serving files from the project root (for .env files)
        allow: ['..', '.'],
      },
    },
    plugins: [
      {
        name: 'serve-njk-files',
        configureServer(server) {
          // Serve .env files for configuration loading
          server.middlewares.use((req, res, next) => {
            const url = (req as any).url;
            if (url && url.match(/^\/\.env(\.[^/]+)?$/)) {
              const envFileName = url.substring(1); // Remove leading /
              const envPath = path.join(process.cwd(), envFileName);
              
              try {
                const content = fs.readFileSync(envPath, 'utf8');
                res.setHeader('Content-Type', 'text/plain; charset=utf-8');
                res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
                res.setHeader('Pragma', 'no-cache');
                res.setHeader('Expires', '0');
                res.end(content);
                return;
              } catch (err) {
                console.warn(`Environment file not found: ${envPath}`);
                res.statusCode = 404;
                res.end('Environment file not found');
                return;
              }
            }
            next();
          });

          // Handle client-side routing - serve index.html for navigation routes
          server.middlewares.use((req, res, next) => {
            const url = (req as any).url;
            const isNavigationRoute = url && !url.includes('.') && !url.startsWith('/src/') && !url.startsWith('/@');
            
            if (isNavigationRoute && (req as any).method === 'GET') {
              // Serve index.html for client-side routing
              const indexPath = path.join(process.cwd(), 'index.html');
              try {
                const content = fs.readFileSync(indexPath, 'utf8');
                res.setHeader('Content-Type', 'text/html');
                res.end(content);
                return;
              } catch (err) {
                console.error('Could not serve index.html:', err);
              }
            }
            next();
          });

          server.middlewares.use('/src', (req, res, next) => {
            if ((req as any).url?.endsWith('.njk')) {
              // Remove /src prefix and any query parameters for file path
              const urlPath = (req as any).url.split('?')[0];
              const relativePath = urlPath.replace('/src/', '');
              const filePath = path.join(process.cwd(), 'src', relativePath);
              
              try {
                // Always read fresh from file system
                const content = fs.readFileSync(filePath, 'utf8');
                
                // Set headers to prevent caching
                res.setHeader('Content-Type', 'text/plain; charset=utf-8');
                res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
                res.setHeader('Pragma', 'no-cache');
                res.setHeader('Expires', '0');
                res.setHeader('ETag', `"${Date.now()}"`);
                
                res.end(content);
              } catch (err) {
                console.error(`Template not found: ${filePath}`, err);
                res.statusCode = 404;
                res.end('Not found');
              }
            } else {
              next();
            }
          });
        },
      },
      ...(isDev
        ? [
            {
              name: 'nunjucks-hmr',
              handleHotUpdate({ file, server }) {
                if (file.endsWith('.njk')) {
                  // Send a custom HMR message to clear template cache
                  server.ws.send({
                    type: 'custom',
                    event: 'template-changed',
                    data: { file }
                  });
                  // Trigger full page reload
                  server.ws.send({ type: 'full-reload' });
                  return [];
                }
              },
            },
          ]
        : []),
    ],
  };
});
