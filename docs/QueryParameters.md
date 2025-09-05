# Query Parameters Guide

This guide explains how to use query parameters in the TypeScript MVC framework.

## Overview

The routing system now supports query parameters, allowing you to:
- Pass data through URLs (e.g., `/search?q=typescript&page=2`)
- Access query parameters in controller actions
- Build URLs with query parameters
- Redirect with query parameters

## Accessing Query Parameters in Controllers

### Basic Query Parameter Access

```typescript
import { Controller } from '../core/controller';
import { route } from '../core/decorators';

export class SearchController extends Controller {
  @route('search')
  async search(): Promise<void> {
    // Get specific query parameters
    const query = this.getQueryParam('q') || '';
    const page = parseInt(this.getQueryParam('page') || '1', 10);
    const category = this.getQueryParam('category') || 'all';
    
    // Get all query parameters as an object
    const allParams = this.getQueryParams();
    
    // Check if a parameter exists
    const hasFilter = this.hasQueryParam('filter');
    
    // Get multiple values for the same parameter
    const tags = this.getQueryParamValues('tag'); // For URLs like ?tag=js&tag=ts
    
    // Use the parameters
    await this.View('views/search.njk', {
      query,
      page,
      category,
      allParams,
      hasFilter,
      tags
    });
  }
}
```

### Controller Action Parameters

Query parameters are automatically passed to action methods:

```typescript
export class ProductController extends Controller {
  @route('products')
  async list(queryParams?: Record<string, string>): Promise<void> {
    // queryParams contains all query parameters as key-value pairs
    const category = queryParams?.category || 'all';
    const sortBy = queryParams?.sortBy || 'name';
    const page = parseInt(queryParams?.page || '1', 10);
    
    // ... process parameters and render view
  }
}
```

## Available Query Parameter Methods

### `getQueryParam(name: string): string | null`
Get a single query parameter value.

```typescript
const searchTerm = this.getQueryParam('q'); // Returns string or null
```

### `getQueryParams(): Record<string, string>`
Get all query parameters as an object.

```typescript
const params = this.getQueryParams(); // { q: 'typescript', page: '2', category: 'programming' }
```

### `getQueryParamValues(name: string): string[]`
Get all values for a parameter (useful for parameters that can appear multiple times).

```typescript
// For URL: ?tag=javascript&tag=typescript&tag=mvc
const tags = this.getQueryParamValues('tag'); // ['javascript', 'typescript', 'mvc']
```

### `hasQueryParam(name: string): boolean`
Check if a query parameter exists.

```typescript
if (this.hasQueryParam('debug')) {
  // Enable debug mode
}
```

## Building URLs with Query Parameters

### `buildUrl(path: string, queryParams?: Record<string, string>): string`
Build a URL with query parameters.

```typescript
const searchUrl = this.buildUrl('/search', {
  q: 'typescript',
  page: '1',
  category: 'programming'
});
// Result: '/search?q=typescript&page=1&category=programming'
```

### `buildActionUrl(action: string, controller?: string, queryParams?: Record<string, string>): string`
Build a URL for a controller action with query parameters.

```typescript
const actionUrl = this.buildActionUrl('search', 'Product', {
  category: 'electronics',
  price_max: '100'
});
// Result: '/product/search?category=electronics&price_max=100'
```

## Redirecting with Query Parameters

### `Redirect(route: string, queryParams?: Record<string, string>)`
Redirect to a route with optional query parameters.

```typescript
// Redirect to search with parameters
return this.Redirect('/search', {
  q: 'typescript',
  category: 'programming'
});
```

### `RedirectToAction(action: string, controller?: string, queryParams?: Record<string, string>)`
Redirect to an action with optional query parameters.

```typescript
// Redirect to search action with parameters
return this.RedirectToAction('search', 'Product', {
  category: 'electronics',
  sortBy: 'price'
});
```

## Complete Example

Here's a complete example of a search controller with pagination:

```typescript
import { Controller } from '../core/controller';
import { route } from '../core/decorators';

export class SearchController extends Controller {
  @route('search')
  async search(queryParams?: Record<string, string>): Promise<void> {
    // Extract query parameters with defaults
    const query = this.getQueryParam('q') || '';
    const page = Math.max(1, parseInt(this.getQueryParam('page') || '1', 10));
    const pageSize = Math.max(1, parseInt(this.getQueryParam('pageSize') || '10', 10));
    const category = this.getQueryParam('category') || 'all';
    const sortBy = this.getQueryParam('sortBy') || 'relevance';
    
    // Perform search logic
    const results = await this.performSearch(query, category, sortBy, page, pageSize);
    
    // Build pagination URLs
    const baseParams = { q: query, category, sortBy, pageSize: pageSize.toString() };
    const prevUrl = page > 1 ? this.buildUrl('/search', { ...baseParams, page: (page - 1).toString() }) : null;
    const nextUrl = results.hasMore ? this.buildUrl('/search', { ...baseParams, page: (page + 1).toString() }) : null;
    
    await this.View('views/search.njk', {
      query,
      category,
      sortBy,
      page,
      pageSize,
      results: results.items,
      totalResults: results.total,
      hasMore: results.hasMore,
      pagination: {
        prevUrl,
        nextUrl,
        currentPage: page,
        totalPages: Math.ceil(results.total / pageSize)
      },
      queryParams: this.getQueryParams() // For debugging or form pre-population
    });
  }
  
  @route('search/advanced')
  async advancedSearch(): Promise<void> {
    // Pre-populate form with current query parameters
    const currentParams = this.getQueryParams();
    
    await this.View('views/advanced-search.njk', {
      currentParams
    });
  }
  
  @route('search/filter')
  async applyFilter(): Promise<any> {
    // Get current search parameters
    const currentQuery = this.getQueryParam('q') || '';
    const newCategory = this.getQueryParam('category') || 'all';
    
    // Redirect back to search with new filter
    return this.Redirect('/search', {
      q: currentQuery,
      category: newCategory,
      page: '1' // Reset to first page when filtering
    });
  }
  
  private async performSearch(query: string, category: string, sortBy: string, page: number, pageSize: number) {
    // Mock search implementation
    const allResults = [
      { title: 'TypeScript Guide', category: 'programming' },
      { title: 'MVC Architecture', category: 'architecture' },
      // ... more results
    ];
    
    let filtered = allResults;
    
    // Apply query filter
    if (query) {
      filtered = filtered.filter(item => 
        item.title.toLowerCase().includes(query.toLowerCase())
      );
    }
    
    // Apply category filter
    if (category !== 'all') {
      filtered = filtered.filter(item => item.category === category);
    }
    
    // Apply sorting (simplified)
    if (sortBy === 'title') {
      filtered.sort((a, b) => a.title.localeCompare(b.title));
    }
    
    // Apply pagination
    const startIndex = (page - 1) * pageSize;
    const endIndex = startIndex + pageSize;
    const paginatedResults = filtered.slice(startIndex, endIndex);
    
    return {
      items: paginatedResults,
      total: filtered.length,
      hasMore: endIndex < filtered.length
    };
  }
}
```

## URL Examples

Here are some example URLs and how they map to query parameters:

- `/search?q=typescript` → `{ q: 'typescript' }`
- `/search?q=mvc&page=2&pageSize=20` → `{ q: 'mvc', page: '2', pageSize: '20' }`
- `/products?category=electronics&price_min=10&price_max=100` → `{ category: 'electronics', price_min: '10', price_max: '100' }`
- `/search?tag=js&tag=ts&tag=mvc` → `getQueryParamValues('tag')` returns `['js', 'ts', 'mvc']`

## Best Practices

1. **Always provide defaults** for query parameters to handle missing values
2. **Validate and sanitize** query parameter values, especially for numbers
3. **Use meaningful parameter names** that describe their purpose
4. **Consider URL length limits** when building URLs with many parameters
5. **Encode special characters** when building URLs (the framework handles this automatically)
6. **Reset pagination** when applying new filters
7. **Preserve important parameters** when redirecting (like search query)

## Integration with Forms

Query parameters work seamlessly with HTML forms using the GET method:

```html
<form method="get" action="/search">
  <input type="text" name="q" value="{{ query }}" placeholder="Search...">
  <select name="category">
    <option value="all" {% if category == 'all' %}selected{% endif %}>All Categories</option>
    <option value="programming" {% if category == 'programming' %}selected{% endif %}>Programming</option>
  </select>
  <button type="submit">Search</button>
</form>
```

This form will submit to `/search?q=userquery&category=programming` and the query parameters will be automatically available in your controller action.
