import { Controller } from '../../../core/controller';
import { AutoRegister } from '../../../core/controllerDiscovery';
import { controller, action } from '../../../core/decorators';

/**
 * User Management Controller
 * Demonstrates clean architecture with feature-based organization
 */
@AutoRegister
@controller('users')
export class UserController extends Controller {
    
    @action()  // Maps to /users
    async index() {
        return await this.View('users', {
            title: 'User Management',
            users: [
                { id: 1, name: 'John Doe', email: 'john@example.com' },
                { id: 2, name: 'Jane Smith', email: 'jane@example.com' }
            ]
        });
    }
    
    @action(':id')  // Maps to /users/:id
    async show(params: any) {
        return await this.View('user-detail', {
            title: 'User Details',
            user: { 
                id: params.id, 
                name: `User ${params.id}`,
                email: `user${params.id}@example.com`
            }
        });
    }
}
