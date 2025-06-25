# EuroLink Warehouse Management System v1.0

A modern, lightweight, and full-stack warehouse management system designed to provide clear inventory tracking, efficient stock movement operations, and insightful data visualization.


## ✨ Key Features

*   **Authentication & Authorization**: Secure role-based access control (Admin/Operator) using JSON Web Tokens (JWT).
*   **Core CRUD Operations**: Complete management modules for parts and suppliers.
*   **Transactional Stock Movements**: Atomic IN/OUT operations to ensure data integrity and prevent stock discrepancies.
*   **Data Visualization**: An intuitive dashboard showcasing key performance indicators (KPIs), stock level trends, and inventory composition charts powered by ECharts.
*   **Reporting & Exporting**: Powerful transaction log filtering with support for exporting data to both Excel and PDF formats.
*   **Comprehensive Testing**: Includes backend unit/integration tests (Jest & Supertest) and frontend end-to-end tests (Cypress) to ensure application stability.
*   **Containerized Deployment**: Fully containerized with Docker and Docker Compose for easy, one-command deployment.

## 🛠️ Tech Stack

*   **Backend**: Node.js, Express, PostgreSQL, Sequelize (ORM), JSON Web Token (JWT), bcryptjs
*   **Frontend**: Vue 3 (Composition API), Vite, Vue Router, Pinia, Axios, Element Plus, ECharts
*   **Testing**:
    *   Backend: Jest, Supertest
    *   Frontend: Vitest, Vue Testing Library, Cypress (E2E)
*   **Deployment**: Docker, Docker Compose, Nginx

## 🚀 Getting Started (Local Development)

Follow these instructions to get a copy of the project up and running on your local machine for development and testing purposes.

### 1. Prerequisites

Make sure you have the following software installed on your system:

*   [Node.js](https://nodejs.org/) (v18+ recommended)
*   [PostgreSQL](https://www.postgresql.org/download/)
*   [Git](https://git-scm.com/downloads)

### 2. Clone the Repository

```bash
git clone https://github.com/Bojom/EuroLink_WarehouseSystem.git
cd EuroLink_WarehouseSystem
```

### 3. Environment Setup

The project uses a `.env` file in the root directory to manage all environment variables, including database credentials, secrets, and initial admin user details.

First, copy the example file:
```bash
cp .env.example .env
```
Next, open the `.env` file with a text editor and fill in the required values, especially for `DB_PASSWORD`, `JWT_SECRET`, and `ADMIN_PASSWORD`.

### 4. Backend Setup

Navigate to the backend directory, install dependencies, and then run the database migrations and seeding.

```bash
cd backend
npm install

# Create database tables and initial structure
npm run db:migrate

# Populate the database with the initial admin user
npm run db:seed:all

# Start the backend server (runs on http://localhost:3001)
npm run dev
```
**Database Management**: You no longer need to manually run SQL files. The `npm run db:migrate` command handles the entire database schema setup. If you need to reset the database during development, you can use `npm run db:reset`.

### 5. Frontend Setup

In a new terminal, navigate to the frontend directory.

```bash
cd frontend
npm install

# Start the frontend development server (runs on http://localhost:5173)
npm run dev
```

### 6. Access the Application

Once both backend and frontend servers are running, open your browser and navigate to **http://localhost:5173**. You can log in with the admin credentials you set in the `.env` file.

## This project includes a comprehensive test suite.

* Run Backend Tests:

```bash
cd backend
npm test -- --coverage
```
* Run Frontend Unit/Component Tests:

```bash
cd frontend
npm test
```
* Run Frontend End-to-End (E2E) Tests:

```bash
npx cypress open
```

## 🐳 Deployment with Docker

### 1.Prerequisites :

* docker : https://www.docker.com/products/docker-desktop/

### 2.Build and run :

From the project root directory, run the following command:

```bash
docker-compose up --build -d
```
### 3.Access the application:
The application will be availble at http://localhost:8080.

### 4.Manage Services:
* To view logs:
 ```bash
 docker-compose logs -f
 ```
* To stop and remove containers:
 ```bash
 docker-compose down
 ```
### Deployment Architecture & API Proxy

In the provided `docker-compose.yml` setup, the frontend and backend are served under the same domain (`http://localhost:8080`) to avoid Cross-Origin Resource Sharing (CORS) issues in production.

This is achieved using a **Nginx reverse proxy**.

*   The `frontend` service runs a Vue application, built and served by Nginx.
*   The `backend` service runs the Node.js API.
*   The Nginx server is configured (via `frontend/nginx.conf`) to handle all incoming traffic on port 8080.
    *   Requests for the web application (e.g., `/`, `/dashboard`, `/parts`) are served the Vue app's static files.
    *   Requests sent to `/api/...` are automatically **forwarded (proxied)** to the backend service at `http://backend:3001/api/...`.

This is why the frontend's production environment variable `VITE_API_BASE_URL` is set to a relative path (`/api`). The browser sends a request to `http://localhost:8080/api/some-endpoint`, Nginx intercepts it and proxies it to the backend.

#### Deploying to Different Domains

If you intend to host the frontend and backend on separate domains (e.g., `https://app.my-domain.com` and `https://api.my-domain.com`), you will need to make the following adjustments:

1.  **Frontend**: In the `frontend/.env.production` file, set `VITE_API_BASE_URL` to the full public URL of your backend:
    ```
    VITE_API_BASE_URL=https://api.my-domain.com/api
    ```
2.  **Backend**: In your root `.env` file, set the `FRONTEND_URL` to the public URL of your frontend to allow CORS requests:
    ```
    FRONTEND_URL=https://app.my-domain.com
    ```
3.  **Nginx**: You would likely remove the reverse proxy configuration from the Nginx server that serves the frontend.

---

© 2025 [Bojom]. All Rights Reserved.
