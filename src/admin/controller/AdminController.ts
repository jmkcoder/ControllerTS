import { Controller } from '../../core/controller';
import { AutoRegister } from '../../core/controllerDiscovery';
import { route } from '../../core/decorators';

/**
 * Admin Dashboard Controller
 * Demonstrates clean architecture with domain-based organization
 */
@AutoRegister
export class AdminController extends Controller {
    
    @route('/admin')
    async dashboard() {
        console.log('🔧 AdminController: Displaying admin dashboard');
        return await this.View('admin-dashboard', {
            title: 'Admin Dashboard',
            stats: {
                totalUsers: 1250,
                totalProducts: 89,
                totalOrders: 342
            }
        });
    }
    
    @route('/admin/users')
    async manageUsers() {
        console.log('👥 AdminController: Managing users');
        return await this.View('admin-users', {
            title: 'User Management',
            users: Array.from({ length: 10 }, (_, i) => ({
                id: i + 1,
                name: `User ${i + 1}`,
                email: `user${i + 1}@example.com`,
                status: i % 2 === 0 ? 'active' : 'inactive'
            }))
        });
    }
    
    @route('/admin/settings')
    async settings() {
        console.log('⚙️ AdminController: System settings');
        return await this.View('admin-settings', {
            title: 'System Settings',
            settings: {
                siteName: 'ControllerTS Framework',
                maintenance: false,
                debug: true
            }
        });
    }
}
