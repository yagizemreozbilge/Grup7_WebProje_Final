# Developer Guide - Campus Management System

## 👨‍💻 Geliştirici Kılavuzu

Bu kılavuz, projeye katkıda bulunmak isteyen geliştiriciler için hazırlanmıştır.

---

## 📁 Proje Yapısı

### Backend Yapısı

```
backend/
├── src/
│   ├── controllers/      # Request handlers
│   │   ├── authController.js
│   │   ├── userController.js
│   │   ├── courseController.js
│   │   └── ...
│   ├── services/         # Business logic
│   │   ├── authService.js
│   │   ├── attendanceService.js
│   │   └── ...
│   ├── routes/           # API routes
│   │   ├── auth.js
│   │   ├── users.js
│   │   └── ...
│   ├── middleware/       # Custom middleware
│   │   ├── auth.js
│   │   ├── validation.js
│   │   └── errorHandler.js
│   ├── utils/            # Utility functions
│   │   ├── logger.js
│   │   ├── errors.js
│   │   └── ...
│   └── app.js           # Express app setup
├── prisma/
│   ├── schema.prisma    # Database schema
│   └── migrations/      # Database migrations
├── tests/               # Test files
├── uploads/            # Uploaded files
└── package.json
```

### Frontend Yapısı

```
frontend/src/
├── components/         # Reusable components
│   ├── Navbar.js
│   ├── Sidebar.js
│   └── ...
├── pages/              # Page components
│   ├── Login.js
│   ├── Dashboard.js
│   └── ...
├── services/           # API services
│   └── api.js
├── context/            # React Context
│   ├── AuthContext.js
│   └── NotificationContext.js
├── hooks/              # Custom hooks
│   └── useAuth.js
├── utils/              # Utility functions
│   └── helpers.js
└── App.js
```

---

## 📝 Coding Conventions

### JavaScript/Node.js

#### Naming Conventions

- **Variables:** `camelCase`
  ```javascript
  const userName = 'John';
  const isActive = true;
  ```

- **Functions:** `camelCase`
  ```javascript
  function getUserById(id) { ... }
  const calculateGPA = (grades) => { ... };
  ```

- **Classes:** `PascalCase`
  ```javascript
  class UserService { ... }
  ```

- **Constants:** `UPPER_SNAKE_CASE`
  ```javascript
  const MAX_FILE_SIZE = 5242880;
  const API_BASE_URL = '/api/v1';
  ```

- **Files:** `camelCase.js` (controllers, services)
  ```javascript
  authController.js
  userService.js
  ```

#### Code Style

- **Indentation:** 2 spaces
- **Quotes:** Single quotes for strings
- **Semicolons:** Always use semicolons
- **Trailing Commas:** Use in arrays and objects

```javascript
// ✅ Good
const user = {
  id: 1,
  name: 'John',
  email: 'john@example.com',
};

// ❌ Bad
const user = {id:1,name:"John",email:"john@example.com"}
```

#### Async/Await

```javascript
// ✅ Good - Use async/await
async function getUser(id) {
  try {
    const user = await prisma.user.findUnique({ where: { id } });
    return user;
  } catch (error) {
    throw error;
  }
}

// ❌ Bad - Avoid callback hell
function getUser(id, callback) {
  prisma.user.findUnique({ where: { id } }, (err, user) => {
    if (err) callback(err);
    else callback(null, user);
  });
}
```

#### Error Handling

```javascript
// ✅ Good - Proper error handling
async function createUser(userData) {
  try {
    const user = await prisma.user.create({ data: userData });
    return { success: true, data: user };
  } catch (error) {
    logger.error('Error creating user:', error);
    throw new AppError('Failed to create user', 500);
  }
}
```

### React

#### Component Structure

```javascript
// ✅ Good - Functional component with hooks
import React, { useState, useEffect } from 'react';
import PropTypes from 'prop-types';

const UserProfile = ({ userId }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchUser(userId);
  }, [userId]);

  const fetchUser = async (id) => {
    try {
      const response = await api.get(`/users/${id}`);
      setUser(response.data);
    } catch (error) {
      console.error('Error fetching user:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <LoadingSpinner />;
  if (!user) return <NotFound />;

  return (
    <div className="user-profile">
      <h1>{user.name}</h1>
      <p>{user.email}</p>
    </div>
  );
};

UserProfile.propTypes = {
  userId: PropTypes.string.isRequired,
};

export default UserProfile;
```

#### Hooks Usage

```javascript
// ✅ Good - Custom hooks for reusable logic
const useUser = (userId) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchUser();
  }, [userId]);

  const fetchUser = async () => {
    try {
      const response = await api.get(`/users/${userId}`);
      setUser(response.data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return { user, loading, error, refetch: fetchUser };
};
```

---

## 🧪 Testing Guide

### Backend Testing

#### Unit Tests

```javascript
// tests/unit/services/authService.test.js
const AuthService = require('../../../src/services/authService');
const prisma = require('../../../src/prisma');

describe('AuthService', () => {
  describe('registerUser', () => {
    it('should register a new user successfully', async () => {
      const userData = {
        email: 'test@example.com',
        password: 'Password123',
        fullName: 'Test User',
        role: 'student',
      };

      const user = await AuthService.registerUser(userData);

      expect(user).toHaveProperty('id');
      expect(user.email).toBe(userData.email);
    });

    it('should throw error for duplicate email', async () => {
      // Test implementation
    });
  });
});
```

#### Integration Tests

```javascript
// tests/integration/auth.test.js
const request = require('supertest');
const app = require('../../src/app');

describe('POST /api/v1/auth/register', () => {
  it('should register a new user', async () => {
    const response = await request(app)
      .post('/api/v1/auth/register')
      .send({
        email: 'newuser@example.com',
        password: 'Password123',
        fullName: 'New User',
        role: 'student',
      });

    expect(response.status).toBe(201);
    expect(response.body).toHaveProperty('data');
  });
});
```

### Frontend Testing

#### Component Tests

```javascript
// src/components/__tests__/Button.test.js
import { render, screen, fireEvent } from '@testing-library/react';
import Button from '../Button';

describe('Button', () => {
  it('should render button with text', () => {
    render(<Button>Click me</Button>);
    expect(screen.getByText('Click me')).toBeInTheDocument();
  });

  it('should call onClick when clicked', () => {
    const handleClick = jest.fn();
    render(<Button onClick={handleClick}>Click me</Button>);
    
    fireEvent.click(screen.getByText('Click me'));
    expect(handleClick).toHaveBeenCalledTimes(1);
  });
});
```

### Running Tests

```bash
# Backend tests
cd backend
npm test                    # Run all tests
npm test -- --watch        # Watch mode
npm test -- --coverage     # With coverage

# Frontend tests
cd frontend
npm test                   # Run all tests
npm test -- --coverage     # With coverage
```

---

## 🔄 Git Workflow

### Branch Strategy

- **main:** Production-ready code
- **develop:** Development branch
- **feature/feature-name:** Feature branches
- **bugfix/bug-name:** Bug fix branches
- **hotfix/hotfix-name:** Hotfix branches

### Commit Messages

Format: `type(scope): subject`

Types:
- `feat:` New feature
- `fix:` Bug fix
- `docs:` Documentation
- `style:` Code style changes
- `refactor:` Code refactoring
- `test:` Test additions/changes
- `chore:` Build process or auxiliary tool changes

Examples:
```
feat(auth): add two-factor authentication
fix(attendance): resolve GPS accuracy issue
docs(api): update API documentation
refactor(services): improve error handling
```

### Pull Request Process

1. Create feature branch from `develop`
2. Make changes and commit
3. Push branch to remote
4. Create Pull Request
5. Code review
6. Merge to `develop`
7. Deploy to staging
8. Merge to `main` after testing

---

## 🛠️ Development Setup

### Prerequisites

- Node.js 18+
- PostgreSQL 14+
- Docker & Docker Compose (optional)
- Git

### Local Setup

```bash
# Clone repositories
git clone https://github.com/yagizemreozbilge/Grup7_WebProje_Final.git
git clone https://github.com/emrekorkmaz-ce/Grup7_WebProje_Frontend.git

# Backend setup
cd Grup7_WebProje_Final/backend
npm install
cp .env.example .env
npx prisma generate
npx prisma migrate dev
npm run prisma:seed
npm run dev

# Frontend setup
cd ../../Grup7_WebProje_Frontend
npm install
cp .env.example .env
npm start
```

### Docker Setup

```bash
# Start all services
docker-compose up --build

# Run migrations
docker-compose exec backend npx prisma migrate deploy

# Seed database
docker-compose exec backend npm run prisma:seed
```

---

## 📚 Code Documentation

### JSDoc Comments

```javascript
/**
 * Register a new user
 * @param {Object} userData - User registration data
 * @param {string} userData.email - User email
 * @param {string} userData.password - User password
 * @param {string} userData.fullName - User full name
 * @param {string} userData.role - User role (student/faculty/admin)
 * @returns {Promise<Object>} Created user object
 * @throws {Error} If email already exists or validation fails
 */
async function registerUser(userData) {
  // Implementation
}
```

### API Documentation

Use Swagger/OpenAPI for API documentation:

```javascript
/**
 * @swagger
 * /api/v1/users/{id}:
 *   get:
 *     summary: Get user by ID
 *     tags: [Users]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: User found
 *       404:
 *         description: User not found
 */
```

---

## 🐛 Debugging

### Backend Debugging

```javascript
// Use logger instead of console.log
const logger = require('./utils/logger');

logger.info('User logged in', { userId: user.id });
logger.error('Error occurred', { error: err.message, stack: err.stack });
logger.debug('Debug information', { data: someData });
```

### Frontend Debugging

```javascript
// Use React DevTools
// Use browser DevTools
// Use console.log sparingly in production

// Development only
if (process.env.NODE_ENV === 'development') {
  console.log('Debug info:', data);
}
```

---

## 🔍 Code Review Checklist

### Backend Code Review

- [ ] Error handling implemented
- [ ] Input validation added
- [ ] Database queries optimized
- [ ] Tests written and passing
- [ ] Logging added where needed
- [ ] Security considerations addressed
- [ ] Documentation updated

### Frontend Code Review

- [ ] Component is reusable
- [ ] Error states handled
- [ ] Loading states handled
- [ ] Responsive design
- [ ] Accessibility considered
- [ ] Tests written
- [ ] Performance optimized

---

## 📦 Dependencies Management

### Adding Dependencies

```bash
# Backend
cd backend
npm install package-name --save
npm install package-name --save-dev  # Dev dependency

# Frontend
cd frontend
npm install package-name
```

### Updating Dependencies

```bash
# Check outdated packages
npm outdated

# Update packages
npm update

# Update specific package
npm install package-name@latest
```

---

## 🚀 Deployment Checklist

Before deploying:

- [ ] All tests passing
- [ ] Environment variables set
- [ ] Database migrations ready
- [ ] Build successful
- [ ] Security audit done
- [ ] Documentation updated
- [ ] Changelog updated

---

## 📞 Getting Help

- **Documentation:** Check `/docs` folder
- **Issues:** GitHub Issues
- **Code Review:** Create Pull Request
- **Questions:** Contact team lead

---

**Son Güncelleme:** 28 Aralık 2025






