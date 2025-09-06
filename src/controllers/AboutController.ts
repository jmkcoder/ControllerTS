import { Controller } from '../core/controller';
import { controller, action } from '../core/decorators';
import { AutoRegister } from '../core/controllerDiscovery';

@AutoRegister
@controller('about')
export class AboutController extends Controller {

  @action()  // Maps to /about
  async execute(): Promise<void> {
    await this.View('views/about.njk', { 
        title: 'About Page', 
        subtitle: 'This is the about page - you were redirected here!' 
   });
  }

  @action('index')  // Maps to /about/index
  async index(): Promise<void> {
    await this.execute();
  }

  @action('home')  // Maps to /about/home
  async goBackHome(): Promise<{ redirect: true; route: string }> {
    return this.Redirect('/');  // Use clean URL format for home
  }
}
