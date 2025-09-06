import { Required, Email, StringLength } from '../../../core/validationDecorators';

export interface DashboardStats {
  totalUsers: number;
  totalProducts: number;
  totalOrders: number;
  revenue: number;
}

export interface Feature {
  icon: string;
  title: string;
  description: string;
}

export interface WelcomeMessage {
  title: string;
  subtitle: string;
  description: string;
  features: Feature[];
}

export interface DemoForm {
  name: string;
  email: string;
  subject: string;
  message: string;
}

export class DemoFormModel {
  @Required('Name is required')
  @StringLength(100, 2, 'Name must be between 2 and 100 characters')
  name: string;

  @Required('Email is required')
  @Email('Please enter a valid email address')
  email: string;

  @Required('Subject is required')
  @StringLength(200, 3, 'Subject must be between 3 and 200 characters')
  subject: string;

  @Required('Message is required')
  @StringLength(1000, 10, 'Message must be between 10 and 1000 characters')
  message: string;

  constructor(data: Partial<DemoForm> = {}) {
    this.name = data.name || '';
    this.email = data.email || '';
    this.subject = data.subject || '';
    this.message = data.message || '';
  }

  static submitDemoForm(demoForm: DemoForm): { success: boolean; message: string } {
    // Simulate form processing
    console.log('Demo form submitted:', demoForm);
    
    return {
      success: true,
      message: 'Demo form submitted successfully! This showcases the complete MVC form handling workflow with validation, model binding, and user feedback.'
    };
  }
}

export class HomeModel {
  static getDashboardStats(): DashboardStats {
    return {
      totalUsers: 1247,
      totalProducts: 89,
      totalOrders: 342,
      revenue: 24580.50
    };
  }

  static getWelcomeMessage(): WelcomeMessage {
    return {
      title: "Welcome to ControllerTS",
      subtitle: "A Modern TypeScript MVC Framework",
      description: "Experience the power of TypeScript with familiar MVC patterns. Clean architecture, decorator-based routing, and modern web standards.",
      features: [
        {
          icon: "route",
          title: "Decorator-Based Routing",
          description: "Elegant @controller and @action decorators for clean, declarative route definitions with automatic path resolution."
        },
        {
          icon: "architecture",
          title: "Clean Architecture",
          description: "Organized feature folders with MVC pattern separation for maintainable and scalable application structure."
        },
        {
          icon: "palette",
          title: "Modern UI Framework",
          description: "Built with Tailwind CSS and shadcn/ui components for beautiful, responsive, and accessible user interfaces."
        },
        {
          icon: "devices",
          title: "Responsive Design",
          description: "Mobile-first approach with fluid layouts that adapt seamlessly across all device sizes and orientations."
        },
        {
          icon: "code",
          title: "TypeScript First",
          description: "Full TypeScript support with strong typing, IntelliSense, and compile-time error checking for robust development."
        },
        {
          icon: "speed",
          title: "Fast Development",
          description: "Lightning-fast development experience powered by Vite with hot module replacement and optimized builds."
        },
        {
          icon: "navigation",
          title: "SPA Navigation",
          description: "Smooth single-page application navigation using HTML5 History API without page refreshes."
        },
        {
          icon: "view_quilt",
          title: "Template Engine",
          description: "Powerful Nunjucks templating with inheritance, macros, and filters for dynamic content rendering."
        }
      ]
    };
  }
}
