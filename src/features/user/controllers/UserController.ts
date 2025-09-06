import { Controller } from '../../../core/controller';
import { AutoRegister } from '../../../core/controllerDiscovery';
import { route } from '../../../core/decorators';

/**
 * User Management Controller
 * Demonstrates clean architecture with feature-based organization
 */
@AutoRegister
export class UserController extends Controller {
    
    @route('/users')
    async index() {
        console.log('👥 UserController: Displaying all users');
        return await this.View('users', {
            title: 'User Management',
            users: [
                { id: 1, name: 'John Doe', email: 'john@example.com' },
                { id: 2, name: 'Jane Smith', email: 'jane@example.com' }
            ]
        });
    }
    
    @route('/users/:id')
    async show(params: any) {
        console.log('👤 UserController: Displaying user', params.id);
        return await this.View('user-detail', {
            title: 'User Details',
            user: { 
                id: params.id, 
                name: `User ${params.id}`,
                email: `user${params.id}@example.com`
            }
        });
    }
    
    @route('/user/profile')
    async profile() {
        console.log('📋 UserController: Displaying user profile');
        return await this.View('user-profile', {
            title: 'My Profile',
            user: {
                name: 'Current User',
                email: 'current@example.com'
            }
        });
    }
}
