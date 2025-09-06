import { Controller } from '../core/controller';
import { controller, action } from '../core/decorators';
import { Injectable } from '../core/diDecorators';
import { AutoRegister } from '../core/controllerDiscovery';
import { ProductService } from '../services/productService';
import { LoggerService } from '../services/exampleServices';

@AutoRegister
@Injectable
@controller('products')
export class ProductController extends Controller {

  constructor(private productService: ProductService, private logger: LoggerService) {
    super();
    this.logger.log('ProductController created with injected dependencies');
  }
  
  @action()  // Maps to /products
  async list(queryParams?: Record<string, string>): Promise<void> {
    // Extract query parameters with validation
    const category = this.getQueryParam('category') || 'all';
    const priceMin = Math.max(0, parseFloat(this.getQueryParam('price_min') || '0'));
    const priceMax = Math.min(10000, parseFloat(this.getQueryParam('price_max') || '10000'));
    const sortBy = this.getQueryParam('sortBy') || 'name';
    const page = Math.max(1, parseInt(this.getQueryParam('page') || '1', 10));
    const pageSize = Math.max(1, Math.min(50, parseInt(this.getQueryParam('pageSize') || '12', 10)));
    const tags = this.getQueryParamValues('tag'); // Support multiple tags
    const inStock = this.getQueryParam('inStock') === 'true';
    
    this.logger.log(`Product search: category=${category}, price=${priceMin}-${priceMax}, tags=[${tags.join(',')}], inStock=${inStock}`);
    
    // Use ProductService to search for products
    const allProducts = this.productService.searchProducts({
      category,
      priceMin,
      priceMax,
      tags,
      inStock,
      sortBy
    });
    
    // Apply pagination
    const totalProducts = allProducts.length;
    const totalPages = Math.ceil(totalProducts / pageSize);
    const startIndex = (page - 1) * pageSize;
    const paginatedProducts = allProducts.slice(startIndex, startIndex + pageSize);
    
    // Build pagination URLs
    const baseParams = {
      category,
      price_min: priceMin.toString(),
      price_max: priceMax.toString(),
      sortBy,
      pageSize: pageSize.toString(),
      inStock: inStock.toString(),
      ...tags.reduce((acc, tag, index) => ({ ...acc, [`tag`]: tag }), {})
    };
    
    const pagination = {
      currentPage: page,
      totalPages,
      hasPrevious: page > 1,
      hasNext: page < totalPages,
      previousUrl: page > 1 ? this.buildUrl('/products', { ...baseParams, page: (page - 1).toString() }) : null,
      nextUrl: page < totalPages ? this.buildUrl('/products', { ...baseParams, page: (page + 1).toString() }) : null,
      firstUrl: this.buildUrl('/products', { ...baseParams, page: '1' }),
      lastUrl: this.buildUrl('/products', { ...baseParams, page: totalPages.toString() })
    };
    
    await this.View('views/products.njk', {
      title: 'Product Catalog',
      products: paginatedProducts,
      totalProducts,
      filters: {
        category,
        priceMin,
        priceMax,
        sortBy,
        tags,
        inStock
      },
      pagination,
      categories: ['all', ...this.productService.getCategories()],
      availableTags: this.productService.getAllTags(),
      queryParams: this.getQueryParams()
    });
  }
  
  @action('filter')  // Maps to /products/filter
  async filter(): Promise<any> {
    // This action handles filter form submissions and redirects back to the list
    const category = this.getQueryParam('category') || 'all';
    const priceMin = this.getQueryParam('price_min') || '0';
    const priceMax = this.getQueryParam('price_max') || '10000';
    const sortBy = this.getQueryParam('sortBy') || 'name';
    const inStock = this.hasQueryParam('inStock');
    const tags = this.getQueryParamValues('tag');
    
    // Build filter parameters
    const filterParams: Record<string, string> = {
      category,
      price_min: priceMin,
      price_max: priceMax,
      sortBy,
      page: '1' // Reset to first page when applying filters
    };
    
    if (inStock) {
      filterParams.inStock = 'true';
    }
    
    // Add tags to filter parameters
    // Note: For multiple values, we'll pass them as separate parameters
    const redirectUrl = this.buildUrlWithTags('/products', filterParams, tags);
    
    // Redirect back to products list with filters applied
    return this.Redirect(redirectUrl);
  }
  
  @action('clear-filters')  // Maps to /products/clear-filters
  async clearFilters(): Promise<any> {
    // Redirect to products list with no filters
    return this.Redirect('/products');
  }
  
  @action('quick-filter')  // Maps to /products/quick-filter
  async quickFilter(): Promise<any> {
    // Quick filter examples
    const filterType = this.getQueryParam('type');
    
    switch (filterType) {
      case 'programming-books':
        return this.Redirect('/products', {
          category: 'books',
          tag: 'programming',
          sortBy: 'price_asc'
        });
      case 'electronics-under-500':
        return this.Redirect('/products', {
          category: 'electronics',
          price_max: '500',
          sortBy: 'price_desc'
        });
      case 'in-stock-only':
        return this.Redirect('/products', {
          inStock: 'true',
          sortBy: 'name'
        });
      default:
        return this.Redirect('/products');
    }
  }
  
  private buildUrlWithTags(basePath: string, params: Record<string, string>, tags: string[]): string {
    const url = new URL(basePath, 'http://localhost');
    
    // Add regular parameters
    Object.entries(params).forEach(([key, value]) => {
      url.searchParams.set(key, value);
    });
    
    // Add tags as multiple parameters
    tags.forEach(tag => {
      url.searchParams.append('tag', tag);
    });
    
    return url.pathname + url.search;
  }
}
