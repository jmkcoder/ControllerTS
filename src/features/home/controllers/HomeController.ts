import { Controller } from '../../../core/controller';
import { controller, action, objectAction } from '../../../core/decorators';
import { HomeModel, DemoFormModel, DemoForm } from '../models/HomeModel';
import { ModelValidator } from '../../../core/modelValidator';

@controller('home')
export class HomeController extends Controller {

  @action('index') // Maps to /home/index
  async index(): Promise<void> {
    const welcomeData = HomeModel.getWelcomeMessage();
    const stats = HomeModel.getDashboardStats();
    
    await this.View('features/home/views/index', {
      title: welcomeData.title,
      subtitle: welcomeData.subtitle,
      description: welcomeData.description,
      features: welcomeData.features,
      stats: stats
    });
  }

  @action('') // Maps to /home (when accessed as /home without action)
  async home(): Promise<void> {
    // Redirect to the index action for consistency
    await this.index();
  }

  @action('about')
  async about(): Promise<void> {
    await this.View('features/home/views/about', {
      title: 'About ControllerTS',
      description: 'Learn more about this TypeScript MVC framework and its capabilities.'
    });
  }

  @action('demo')
  async demo(): Promise<void> {
    const demoData = {
      framework: 'ControllerTS',
      version: '1.0.0',
      author: 'jmkcoder',
      technologies: [
        'TypeScript',
        'Tailwind CSS',
        'Nunjucks',
        'Vite/Webpack',
        'HTML5 History API'
      ],
      timestamp: new Date().toISOString()
    };

    await this.View('features/home/views/demo', {
      title: 'Framework Demo',
      demoData: demoData
    });
  }

  @action('submitDemo', 'POST')
  async submitDemo(demoForm: DemoFormModel): Promise<void> {
    if (!this.modelState.isValid) {
      const demoData = {
        framework: 'ControllerTS',
        version: '1.0.0',
        author: 'jmkcoder',
        technologies: [
          'TypeScript',
          'Tailwind CSS',
          'Nunjucks',
          'Vite/Webpack',
          'HTML5 History API'
        ],
        timestamp: new Date().toISOString()
      };

      await this.View('features/home/views/demo', {
        title: 'Framework Demo',
        demoData: demoData,
        errors: this.modelState.errors.map(error => error.message),
        formData: demoForm,
        modelState: this.modelState
      });
      return;
    }

    const result = DemoFormModel.submitDemoForm(demoForm as DemoForm);
    
    const demoData = {
      framework: 'ControllerTS',
      version: '1.0.0',
      author: 'jmkcoder',
      technologies: [
        'TypeScript',
        'Tailwind CSS',
        'Nunjucks',
        'Vite/Webpack',
        'HTML5 History API'
      ],
      timestamp: new Date().toISOString()
    };

    await this.View('features/home/views/demo', {
      title: 'Framework Demo',
      demoData: demoData,
      success: result.message
    });
  }

  @objectAction('api/stats', 'GET')
  async getStats(): Promise<any> {
    const stats = HomeModel.getDashboardStats();
    return {
      success: true,
      data: stats,
      timestamp: new Date().toISOString()
    };
  }
}
