import { Controller } from '../core/controller';
import { route } from '../core/decorators';

export class AboutController extends Controller {
  @route('about')
  @route('about/index')
  async execute(): Promise<void> {
    await this.View('views/about.njk', { 
        title: 'About Page', 
        subtitle: 'This is the about page - you were redirected here!' 
   });
  }

  @route('about/index')
  async index(): Promise<void> {
    await this.execute();
  }

  @route('about/home')
  async goBackHome(): Promise<{ redirect: true; route: string }> {
    return this.Redirect('/');  // Use clean URL format for home
  }
}
