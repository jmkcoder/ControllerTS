export interface Product {
  id: number;
  name: string;
  description: string;
  price: number;
  category: string;
  inStock: boolean;
  rating: number;
  image: string;
}

export interface ProductCategory {
  id: string;
  name: string;
  count: number;
}

export class ProductModel {
  private static products: Product[] = [
    {
      id: 1,
      name: "Premium Wireless Headphones",
      description: "High-quality wireless headphones with noise cancellation and superior sound quality.",
      price: 299.99,
      category: "Electronics",
      inStock: true,
      rating: 4.8,
      image: "/images/headphones.jpg"
    },
    {
      id: 2,
      name: "Smart Fitness Watch",
      description: "Advanced fitness tracking with heart rate monitoring and GPS.",
      price: 249.99,
      category: "Electronics",
      inStock: true,
      rating: 4.6,
      image: "/images/watch.jpg"
    },
    {
      id: 3,
      name: "Ergonomic Office Chair",
      description: "Comfortable office chair with lumbar support and adjustable height.",
      price: 399.99,
      category: "Furniture",
      inStock: false,
      rating: 4.7,
      image: "/images/chair.jpg"
    },
    {
      id: 4,
      name: "Professional Camera Lens",
      description: "85mm f/1.4 portrait lens for professional photography.",
      price: 1299.99,
      category: "Photography",
      inStock: true,
      rating: 4.9,
      image: "/images/lens.jpg"
    },
    {
      id: 5,
      name: "Mechanical Gaming Keyboard",
      description: "RGB mechanical keyboard with blue switches and programmable keys.",
      price: 159.99,
      category: "Electronics",
      inStock: true,
      rating: 4.5,
      image: "/images/keyboard.jpg"
    },
    {
      id: 6,
      name: "Coffee Maker Pro",
      description: "Programmable coffee maker with built-in grinder and thermal carafe.",
      price: 179.99,
      category: "Appliances",
      inStock: true,
      rating: 4.4,
      image: "/images/coffee.jpg"
    }
  ];

  static getAllProducts(): Product[] {
    return this.products;
  }

  static getProductById(id: number): Product | undefined {
    return this.products.find(p => p.id === id);
  }

  static getProductsByCategory(category: string): Product[] {
    return this.products.filter(p => p.category.toLowerCase() === category.toLowerCase());
  }

  static getCategories(): ProductCategory[] {
    const categoryMap = new Map<string, number>();
    
    this.products.forEach(product => {
      const count = categoryMap.get(product.category) || 0;
      categoryMap.set(product.category, count + 1);
    });

    return Array.from(categoryMap.entries()).map(([name, count]) => ({
      id: name.toLowerCase(),
      name,
      count
    }));
  }

  static searchProducts(query: string): Product[] {
    const searchTerm = query.toLowerCase();
    return this.products.filter(product => 
      product.name.toLowerCase().includes(searchTerm) ||
      product.description.toLowerCase().includes(searchTerm) ||
      product.category.toLowerCase().includes(searchTerm)
    );
  }

  static getFeaturedProducts(count: number = 3): Product[] {
    return this.products
      .filter(p => p.inStock)
      .sort((a, b) => b.rating - a.rating)
      .slice(0, count);
  }
}
