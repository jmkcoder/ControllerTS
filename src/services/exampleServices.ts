/**
 * Example services to demonstrate Dependency Injection
 */

import { Injectable, Singleton, Scoped } from '../core/diDecorators';

// Example interface for better abstraction
export interface IUserService {
    getCurrentUser(): User | null;
    getUserById(id: string): User | null;
    getAllUsers(): User[];
}

export interface ILoggerService {
    log(message: string): void;
    logError(message: string, error?: any): void;
    logWarning(message: string): void;
}

export interface User {
    id: string;
    name: string;
    email: string;
}

/**
 * Logger Service - Singleton lifetime
 * Only one instance across the entire application
 */
@Singleton
export class LoggerService implements ILoggerService {
    private logs: string[] = [];

    log(message: string): void {
        const timestamp = new Date().toISOString();
        const logEntry = `[${timestamp}] INFO: ${message}`;
        this.logs.push(logEntry);
        console.log(logEntry);
    }

    logError(message: string, error?: any): void {
        const timestamp = new Date().toISOString();
        const logEntry = `[${timestamp}] ERROR: ${message}`;
        this.logs.push(logEntry);
        console.error(logEntry, error);
    }

    logWarning(message: string): void {
        const timestamp = new Date().toISOString();
        const logEntry = `[${timestamp}] WARNING: ${message}`;
        this.logs.push(logEntry);
        console.warn(logEntry);
    }

    getLogs(): string[] {
        return [...this.logs];
    }
}

/**
 * User Service - Scoped lifetime
 * One instance per request/scope
 */
@Scoped
export class UserService implements IUserService {
    private users: User[] = [
        { id: '1', name: 'John Doe', email: 'john@example.com' },
        { id: '2', name: 'Jane Smith', email: 'jane@example.com' },
        { id: '3', name: 'Bob Johnson', email: 'bob@example.com' }
    ];

    constructor(private logger: LoggerService) {
        this.logger.log('UserService instance created');
    }

    getCurrentUser(): User | null {
        // In a real app, this would get the current authenticated user
        this.logger.log('Getting current user');
        return this.users[0];
    }

    getUserById(id: string): User | null {
        this.logger.log(`Getting user by ID: ${id}`);
        return this.users.find(user => user.id === id) || null;
    }

    getAllUsers(): User[] {
        this.logger.log('Getting all users');
        return [...this.users];
    }
}

/**
 * Email Service - Transient lifetime
 * New instance every time it's requested
 */
@Injectable
export class EmailService {
    constructor(private logger: LoggerService) {
        this.logger.log('EmailService instance created');
    }

    sendEmail(to: string, subject: string, body: string): boolean {
        this.logger.log(`Sending email to ${to}: ${subject}`);
        // In a real app, this would send an actual email
        console.log(`📧 Email sent to ${to}`);
        console.log(`📧 Subject: ${subject}`);
        console.log(`📧 Body: ${body}`);
        return true;
    }

    sendWelcomeEmail(user: User): boolean {
        return this.sendEmail(
            user.email,
            'Welcome!',
            `Hello ${user.name}, welcome to ControllerTS!`
        );
    }
}
