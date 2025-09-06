import { Controller } from '../../../core/controller';
import { controller, action, objectAction } from '../../../core/decorators';
import { ProductModel } from '../models/ProductModel';

@controller('products')
export class ProductController extends Controller {

  @action('') // Maps to /products
  async index(): Promise<void> {
    const products = ProductModel.getAllProducts();
    const categories = ProductModel.getCategories();
    
    await this.View('features/products/views/list', {
      title: 'Our Products',
      products: products,
      categories: categories,
      totalProducts: products.length
    });
  }

  @action(':id') // Maps to /products/:id
  async details(): Promise<void> {
    const productId = parseInt(this.getRouteParams().id);
    const product = ProductModel.getProductById(productId);
    
    if (!product) {
      await this.Redirect('/products');
      return;
    }

    const relatedProducts = ProductModel.getProductsByCategory(product.category)
      .filter(p => p.id !== product.id)
      .slice(0, 3);

    await this.View('features/products/views/details', {
      title: `${product.name} - Product Details`,
      product: product,
      relatedProducts: relatedProducts
    });
  }

  @action('category/:category') // Maps to /products/category/:category
  async category(): Promise<void> {
    const categoryName = this.getRouteParams().category;
    const products = ProductModel.getProductsByCategory(categoryName);
    const categories = ProductModel.getCategories();
    
    await this.View('features/products/views/list', {
      title: `${categoryName} Products`,
      products: products,
      categories: categories,
      selectedCategory: categoryName,
      totalProducts: products.length
    });
  }

  @action('search') // Maps to /products/search
  async search(): Promise<void> {
    const query = this.getQueryParam('q') || '';
    const products = query ? ProductModel.searchProducts(query) : [];
    const categories = ProductModel.getCategories();
    
    await this.View('features/products/views/list', {
      title: `Search Results for "${query}"`,
      products: products,
      categories: categories,
      searchQuery: query,
      totalProducts: products.length
    });
  }

  @objectAction('api/featured', 'GET')
  async getFeatured(): Promise<any> {
    const count = parseInt(this.getQueryParam('count') || '3');
    const featuredProducts = ProductModel.getFeaturedProducts(count);
    
    return this.Json({
      success: true,
      data: featuredProducts,
      count: featuredProducts.length
    });
  }

  @objectAction('api/search', 'GET')
  async apiSearch(): Promise<any> {
    const query = this.getQueryParam('q') || '';
    const products = query ? ProductModel.searchProducts(query) : [];
    
    return this.Json({
      success: true,
      data: products,
      query: query,
      count: products.length
    });
  }
}
