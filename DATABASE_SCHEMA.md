# Database Schema Documentation

## ER Diagram

```
┌─────────────┐
│   users     │
├─────────────┤
│ id (PK)     │
│ email       │
│ password_   │
│   hash      │
│ role        │
│ full_name   │
│ phone       │
│ profile_    │
│   picture_  │
│   url       │
│ is_verified │
│ verification│
│   _token    │
│ refresh_    │
│   token     │
│ created_at  │
│ updated_at  │
└─────────────┘
      │
      │ 1:1
      │
      ├─────────────────┐
      │                 │
      ▼                 ▼
┌─────────────┐  ┌─────────────┐
│  students   │  │   faculty   │
├─────────────┤  ├─────────────┤
│ id (PK)     │  │ id (PK)     │
│ user_id (FK)│  │ user_id (FK)│
│ student_    │  │ employee_   │
│   number    │  │   number    │
│ department_ │  │ title       │
│   id (FK)   │  │ department_ │
│ gpa         │  │   id (FK)   │
│ cgpa        │  │ created_at  │
│ created_at  │  │ updated_at  │
│ updated_at  │  └─────────────┘
└─────────────┘         │
      │                 │
      │                 │
      └────────┬────────┘
               │
               │ N:1
               │
               ▼
      ┌─────────────┐
      │ departments │
      ├─────────────┤
      │ id (PK)     │
      │ name        │
      │ code        │
      │ faculty     │
      │ created_at  │
      │ updated_at  │
      └─────────────┘
```

## Tables

### users

Ana kullanıcı tablosu. Tüm kullanıcılar (öğrenci, öğretim üyesi, admin) bu tabloda saklanır.

| Column | Type | Constraints | Description |
|--------|------|------------|-------------|
| id | UUID | PRIMARY KEY | Unique identifier |
| email | VARCHAR | UNIQUE, NOT NULL | User email address |
| password_hash | VARCHAR | NOT NULL | Hashed password (bcrypt) |
| role | ENUM | NOT NULL | User role: student, faculty, admin |
| full_name | VARCHAR | NULL | User's full name |
| phone | VARCHAR | NULL | Phone number |
| profile_picture_url | VARCHAR | NULL | URL to profile picture |
| is_verified | BOOLEAN | DEFAULT false | Email verification status |
| verification_token | VARCHAR | NULL | Email verification token |
| verification_token_expires | TIMESTAMP | NULL | Token expiration time |
| reset_password_token | VARCHAR | NULL | Password reset token |
| reset_password_expires | TIMESTAMP | NULL | Reset token expiration |
| refresh_token | TEXT | NULL | JWT refresh token |
| created_at | TIMESTAMP | NOT NULL | Creation timestamp |
| updated_at | TIMESTAMP | NOT NULL | Update timestamp |

**Indexes:**
- `email` (UNIQUE)

**Relationships:**
- One-to-One with `students` (if role = 'student')
- One-to-One with `faculty` (if role = 'faculty')

---

### students

Öğrenci bilgileri tablosu.

| Column | Type | Constraints | Description |
|--------|------|------------|-------------|
| id | UUID | PRIMARY KEY | Unique identifier |
| user_id | UUID | FOREIGN KEY, UNIQUE, NOT NULL | Reference to users.id |
| student_number | VARCHAR | UNIQUE, NOT NULL | Student identification number |
| department_id | UUID | FOREIGN KEY, NOT NULL | Reference to departments.id |
| gpa | DECIMAL(3,2) | DEFAULT 0.00 | Grade Point Average |
| cgpa | DECIMAL(3,2) | DEFAULT 0.00 | Cumulative GPA |
| created_at | TIMESTAMP | NOT NULL | Creation timestamp |
| updated_at | TIMESTAMP | NOT NULL | Update timestamp |

**Indexes:**
- `user_id` (UNIQUE, FOREIGN KEY -> users.id)
- `student_number` (UNIQUE)
- `department_id` (FOREIGN KEY -> departments.id)

**Relationships:**
- Many-to-One with `departments`
- One-to-One with `users`

---

### faculty

Öğretim üyesi bilgileri tablosu.

| Column | Type | Constraints | Description |
|--------|------|------------|-------------|
| id | UUID | PRIMARY KEY | Unique identifier |
| user_id | UUID | FOREIGN KEY, UNIQUE, NOT NULL | Reference to users.id |
| employee_number | VARCHAR | UNIQUE, NOT NULL | Employee identification number |
| title | VARCHAR | NOT NULL | Academic title (e.g., Professor) |
| department_id | UUID | FOREIGN KEY, NOT NULL | Reference to departments.id |
| created_at | TIMESTAMP | NOT NULL | Creation timestamp |
| updated_at | TIMESTAMP | NOT NULL | Update timestamp |

**Indexes:**
- `user_id` (UNIQUE, FOREIGN KEY -> users.id)
- `employee_number` (UNIQUE)
- `department_id` (FOREIGN KEY -> departments.id)

**Relationships:**
- Many-to-One with `departments`
- One-to-One with `users`

---

### departments

Bölüm bilgileri tablosu.

| Column | Type | Constraints | Description |
|--------|------|------------|-------------|
| id | UUID | PRIMARY KEY | Unique identifier |
| name | VARCHAR | NOT NULL | Department name |
| code | VARCHAR | UNIQUE, NOT NULL | Department code |
| faculty | VARCHAR | NOT NULL | Faculty name |
| created_at | TIMESTAMP | NOT NULL | Creation timestamp |
| updated_at | TIMESTAMP | NOT NULL | Update timestamp |

**Indexes:**
- `code` (UNIQUE)

**Relationships:**
- One-to-Many with `students`
- One-to-Many with `faculty`

---

## Foreign Key Constraints

1. **students.user_id** → **users.id**
   - ON UPDATE CASCADE
   - ON DELETE CASCADE

2. **students.department_id** → **departments.id**
   - ON UPDATE CASCADE
   - ON DELETE RESTRICT

3. **faculty.user_id** → **users.id**
   - ON UPDATE CASCADE
   - ON DELETE CASCADE

4. **faculty.department_id** → **departments.id**
   - ON UPDATE CASCADE
   - ON DELETE RESTRICT

---

## Seed Data

### Departments
- Computer Engineering (CENG) - Engineering
- Electrical Engineering (EE) - Engineering
- Mathematics (MATH) - Science

### Users
- 1 Admin user: admin@campus.edu
- 2 Faculty users: prof.doe@campus.edu, prof.smith@campus.edu
- 5 Student users: student1@campus.edu through student5@campus.edu

**Default Password:** `Password123` (for all seed users)

---

## Notes

- All timestamps are in UTC
- UUIDs are used for all primary keys for better distributed system support
- Password hashing uses bcrypt with 10 salt rounds
- Email verification tokens expire after 24 hours
- Password reset tokens expire after 24 hours
- Refresh tokens are stored in the database for revocation capability

