import { LoggerService } from './exampleServices';
import { Injectable } from '../core/diDecorators';

export interface Product {
  id: number;
  name: string;
  category: string;
  price: number;
  tags: string[];
  inStock: boolean;
}

@Injectable
export class ProductService {
  private products: Product[] = [
    { id: 1, name: 'TypeScript Handbook', category: 'books', price: 29.99, tags: ['typescript', 'programming'], inStock: true },
    { id: 2, name: 'MVC Framework Guide', category: 'books', price: 34.99, tags: ['mvc', 'architecture'], inStock: true },
    { id: 3, name: 'JavaScript Laptop', category: 'electronics', price: 899.99, tags: ['laptop', 'javascript'], inStock: false },
    { id: 4, name: 'Programming Keyboard', category: 'electronics', price: 129.99, tags: ['keyboard', 'programming'], inStock: true },
    { id: 5, name: 'Web Development Course', category: 'courses', price: 99.99, tags: ['web', 'development'], inStock: true },
    { id: 6, name: 'React Components Book', category: 'books', price: 39.99, tags: ['react', 'components'], inStock: true },
    { id: 7, name: 'Monitor 4K', category: 'electronics', price: 299.99, tags: ['monitor', '4k'], inStock: true },
    { id: 8, name: 'Node.js Masterclass', category: 'courses', price: 149.99, tags: ['nodejs', 'backend'], inStock: false },
    { id: 9, name: 'Vue.js Complete Guide', category: 'books', price: 45.99, tags: ['vue', 'javascript'], inStock: true },
    { id: 10, name: 'Wireless Mouse', category: 'electronics', price: 29.99, tags: ['mouse', 'wireless'], inStock: true },
    { id: 11, name: 'Database Design Course', category: 'courses', price: 79.99, tags: ['database', 'sql'], inStock: true },
    { id: 12, name: 'Angular Development', category: 'books', price: 52.99, tags: ['angular', 'typescript'], inStock: false }
  ];

  constructor(private logger: LoggerService) {
    this.logger.log('ProductService initialized');
  }

  getAllProducts(): Product[] {
    this.logger.log(`Retrieved ${this.products.length} products`);
    return [...this.products];
  }

  getProductsByCategory(category: string): Product[] {
    if (category === 'all') {
      return this.getAllProducts();
    }
    const filtered = this.products.filter(p => p.category === category);
    this.logger.log(`Retrieved ${filtered.length} products for category: ${category}`);
    return filtered;
  }

  getProductsByPriceRange(minPrice: number, maxPrice: number): Product[] {
    const filtered = this.products.filter(p => p.price >= minPrice && p.price <= maxPrice);
    this.logger.log(`Retrieved ${filtered.length} products in price range: $${minPrice} - $${maxPrice}`);
    return filtered;
  }

  getProductsByTags(tags: string[]): Product[] {
    if (tags.length === 0) {
      return this.getAllProducts();
    }
    const filtered = this.products.filter(p => 
      tags.every(tag => p.tags.includes(tag.toLowerCase()))
    );
    this.logger.log(`Retrieved ${filtered.length} products with tags: ${tags.join(', ')}`);
    return filtered;
  }

  getInStockProducts(): Product[] {
    const filtered = this.products.filter(p => p.inStock);
    this.logger.log(`Retrieved ${filtered.length} in-stock products`);
    return filtered;
  }

  searchProducts(filters: {
    category?: string;
    priceMin?: number;
    priceMax?: number;
    tags?: string[];
    inStock?: boolean;
    sortBy?: string;
  }): Product[] {
    let filtered = this.getAllProducts();

    // Apply category filter
    if (filters.category && filters.category !== 'all') {
      filtered = filtered.filter(p => p.category === filters.category);
    }

    // Apply price range filter
    if (filters.priceMin !== undefined || filters.priceMax !== undefined) {
      const minPrice = filters.priceMin || 0;
      const maxPrice = filters.priceMax || Number.MAX_VALUE;
      filtered = filtered.filter(p => p.price >= minPrice && p.price <= maxPrice);
    }

    // Apply tags filter
    if (filters.tags && filters.tags.length > 0) {
      filtered = filtered.filter(p => 
        filters.tags!.every(tag => p.tags.includes(tag.toLowerCase()))
      );
    }

    // Apply stock filter
    if (filters.inStock) {
      filtered = filtered.filter(p => p.inStock);
    }

    // Apply sorting
    switch (filters.sortBy) {
      case 'price_asc':
        filtered.sort((a, b) => a.price - b.price);
        break;
      case 'price_desc':
        filtered.sort((a, b) => b.price - a.price);
        break;
      case 'name':
      default:
        filtered.sort((a, b) => a.name.localeCompare(b.name));
        break;
    }

    this.logger.log(`Search completed: ${filtered.length} products found with filters: ${JSON.stringify(filters)}`);
    return filtered;
  }

  getCategories(): string[] {
    const categories = [...new Set(this.products.map(p => p.category))];
    this.logger.log(`Retrieved ${categories.length} categories: ${categories.join(', ')}`);
    return categories;
  }

  getAllTags(): string[] {
    const allTags = new Set<string>();
    this.products.forEach(p => p.tags.forEach(tag => allTags.add(tag)));
    const tags = Array.from(allTags).sort();
    this.logger.log(`Retrieved ${tags.length} unique tags`);
    return tags;
  }

  addProduct(product: Omit<Product, 'id'>): Product {
    const newProduct = {
      ...product,
      id: Math.max(...this.products.map(p => p.id)) + 1
    };
    this.products.push(newProduct);
    this.logger.log(`Added new product: ${newProduct.name} (ID: ${newProduct.id})`);
    return newProduct;
  }

  updateProduct(id: number, updates: Partial<Product>): Product | null {
    const index = this.products.findIndex(p => p.id === id);
    if (index === -1) {
      this.logger.log(`Product not found for update: ID ${id}`);
      return null;
    }

    this.products[index] = { ...this.products[index], ...updates };
    this.logger.log(`Updated product: ${this.products[index].name} (ID: ${id})`);
    return this.products[index];
  }

  deleteProduct(id: number): boolean {
    const index = this.products.findIndex(p => p.id === id);
    if (index === -1) {
      this.logger.log(`Product not found for deletion: ID ${id}`);
      return false;
    }

    const deleted = this.products.splice(index, 1)[0];
    this.logger.log(`Deleted product: ${deleted.name} (ID: ${id})`);
    return true;
  }
}
