# Workflow Management System

A powerful workflow automation system built with Laravel and React, designed to help you create, manage, and execute automated workflows based on triggers and actions.

## Features

- **Visual Workflow Builder**: Drag-and-drop interface for creating complex workflows
- **Custom Triggers**: Define events that initiate workflows
- **Flexible Actions**: Configure various actions to be executed in your workflows
- **Workflow Connections**: Create sophisticated flows by connecting multiple actions
- **Status Tracking**: Monitor the status and execution of your workflows

## Technology Stack

- **Backend**: Laravel 10+ (PHP 8.1+)
- **Frontend**: React with modern JavaScript
- **Styling**: Tailwind CSS
- **Database**: SQL (configurable for other databases)
- **Build Tool**: Vite

## Getting Started

### Prerequisites

- PHP 8.1 or higher
- Composer
- Node.js and NPM
- Git

### Installation



1. Install PHP dependencies
```bash
composer install
```

2. Install JavaScript dependencies
```bash
npm install
```

3. Create a copy of the environment file
```bash
cp .env.example .env 

do database configuration like this 
DB_CONNECTION=mysql
DB_HOST=127.0.0.1
DB_PORT=3306
DB_DATABASE=automation_app
DB_USERNAME=root
DB_PASSWORD=

```

4. Generate an application key
```bash
php artisan key:generate
```

5. Configure your database in the `.env` file

6. Run migrations and seed the database
```bash
php artisan migrate --seed
```

7. Start the development server
```bash
php artisan serve
```

8. In a separate terminal, compile assets
```bash
npm run dev
```

9. Access the application at http://localhost:8000

## Project Structure

- **Models**: Workflow, Trigger, Action, WorkflowAction, WorkflowConnection
- **Controllers**: Handle HTTP requests and responses
- **React Components**: UI components for the workflow builder and management
- **Migrations**: Database structure for the workflow system

## Usage

1. Create triggers that will initiate your workflows
2. Define actions that can be performed in response to triggers
3. Build workflows by connecting triggers to actions
4. Configure parameters for each action in your workflow
5. Activate workflows and monitor their execution


## License

This project is licensed under the MIT License - see the LICENSE file for details.
