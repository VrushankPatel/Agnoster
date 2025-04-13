<div align="center">
  <img src="static/images/agnoster-logo.svg" alt="Agnoster Logo" width="200">
  <h1>Agnoster</h1>
  <p>Kubernetes Namespace Management System</p>
  
  <p>
    <a href="#features">
      <img src="https://img.shields.io/badge/kubernetes-namespace_monitoring-326CE5?style=for-the-badge&logo=kubernetes&logoColor=white" alt="Kubernetes Monitoring">
    </a>
    <a href="#getting-started">
      <img src="https://img.shields.io/badge/python-3.8|3.9|3.10-blue?style=for-the-badge&logo=python&logoColor=white" alt="Python Versions">
    </a>
    <a href="#license">
      <img src="https://img.shields.io/badge/license-MIT-green?style=for-the-badge" alt="License">
    </a>
    <a href="#deployment">
      <img src="https://img.shields.io/badge/docker-ready-2496ED?style=for-the-badge&logo=docker&logoColor=white" alt="Docker Ready">
    </a>
  </p>
</div>

## Overview

Agnoster is a comprehensive Kubernetes namespace management system that monitors pod runtimes and automates shutdown of long-running namespaces. It provides a sleek, user-friendly interface for administrators to monitor and manage cluster resources efficiently.

## Features

- **Namespace Monitoring**: Automatically track and display long-running namespaces
- **Automated Shutdown**: Configure threshold-based shutdown of namespaces to save resources
- **User Management**: Administrative interface for managing users and permissions
- **Blacklisting**: Prevent specific namespaces from being monitored or shut down
- **Demo Mode**: Functional demonstration with sample data when kubectl is not available
- **Responsive UI**: Modern ShadCN UI components for a clean, intuitive interface
- **Real-time Updates**: Live monitoring with automatic refresh
- **Kubernetes Integration**: Seamless integration with Kubernetes API

## Screenshots

*Dashboard view showing monitored namespaces and their statuses*

*Admin panel for configuration and user management*

## Getting Started

### Prerequisites

- Python 3.8 or higher
- PostgreSQL database (optional, SQLite used by default)
- Access to a Kubernetes cluster (optional, demo mode available)

### Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/yourusername/agnoster.git
   cd agnoster
   ```

2. Run the build script to set up the environment:
   ```bash
   ./build.sh
   ```

3. Start the application:
   ```bash
   ./build.sh --start
   ```
   
   Or use the workflow in Replit:
   ```bash
   gunicorn --bind 0.0.0.0:5000 --reuse-port --reload main:app
   ```

4. Access the web interface at: http://localhost:5000
   - Default credentials: 
     - Username: `admin`
     - Password: `admin`
   - **Important**: Change the default password after first login

### Configuration

Configure the system through the admin interface or by setting environment variables:

- `DATABASE_URL`: Database connection string (Default: SQLite)
- `PORT`: Port to run the application on (Default: 5000)

## Deployment

### Docker

```bash
docker build -t agnoster .
docker run -p 5000:5000 -e DATABASE_URL=postgres://user:password@host:port/dbname agnoster
```

### Kubernetes

```bash
kubectl apply -f deployment.yaml
```

## Demo Mode

When kubectl is not available, Agnoster automatically runs in demo mode, providing sample data for demonstration purposes. This is useful for:

- Development environments without Kubernetes access
- Training and demonstration
- Testing the UI without affecting real clusters

The demo mode is clearly indicated in the interface with a notification banner.

## Technical Architecture

- **Backend**: Flask (Python)
- **Database**: PostgreSQL or SQLite
- **Authentication**: Flask-Login
- **UI Framework**: Custom CSS with ShadCN UI components
- **Kubernetes Integration**: kubectl CLI or direct API

## Contributing

We welcome contributions! Please check out our [Contribution Guidelines](CONTRIBUTING.md) for details.

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Acknowledgements

- Kubernetes team for the amazing container orchestration platform
- ShadCN for the beautiful UI components
- All our contributors who have helped shape this project

---

<div align="center">
  <sub>Built with ❤️ for Kubernetes administrators everywhere</sub>
</div>