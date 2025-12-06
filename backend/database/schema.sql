-- ============================================
-- Campus Management System - Complete Database Schema
-- PostgreSQL 14+
-- 30+ Tables with 3NF Normalization
-- ============================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ============================================
-- ENUM TYPES
-- ============================================

CREATE TYPE user_role AS ENUM ('student', 'faculty', 'admin', 'staff');
CREATE TYPE user_status AS ENUM ('active', 'inactive', 'suspended', 'pending');
CREATE TYPE semester_type AS ENUM ('fall', 'spring', 'summer');
CREATE TYPE enrollment_status AS ENUM ('enrolled', 'dropped', 'completed', 'failed', 'withdrawn');
CREATE TYPE attendance_status AS ENUM ('present', 'absent', 'late', 'excused');
CREATE TYPE excuse_status AS ENUM ('pending', 'approved', 'rejected');
CREATE TYPE reservation_status AS ENUM ('pending', 'confirmed', 'cancelled', 'completed');
CREATE TYPE transaction_type AS ENUM ('deposit', 'withdrawal', 'payment', 'refund', 'transfer');
CREATE TYPE transaction_status AS ENUM ('pending', 'completed', 'failed', 'cancelled');
CREATE TYPE notification_type AS ENUM ('info', 'warning', 'success', 'error', 'reminder');
CREATE TYPE sensor_type AS ENUM ('temperature', 'humidity', 'occupancy', 'air_quality', 'noise', 'light');
CREATE TYPE event_status AS ENUM ('draft', 'published', 'cancelled', 'completed');
CREATE TYPE day_of_week AS ENUM ('monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday');

-- ============================================
-- 1. DEPARTMENTS TABLE
-- ============================================
CREATE TABLE departments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(100) NOT NULL,
    code VARCHAR(20) NOT NULL UNIQUE,
    faculty VARCHAR(100) NOT NULL,
    description TEXT,
    head_id UUID, -- Will be FK to faculty after faculty table created
    building VARCHAR(100),
    phone VARCHAR(20),
    email VARCHAR(100),
    website VARCHAR(255),
    is_active BOOLEAN DEFAULT true,
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    deleted_at TIMESTAMP WITH TIME ZONE
);

CREATE INDEX idx_departments_code ON departments(code);
CREATE INDEX idx_departments_faculty ON departments(faculty);
CREATE INDEX idx_departments_active ON departments(is_active) WHERE is_active = true;

-- ============================================
-- 2. USERS TABLE
-- ============================================
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email VARCHAR(255) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    role user_role NOT NULL DEFAULT 'student',
    status user_status NOT NULL DEFAULT 'pending',
    full_name VARCHAR(100),
    phone VARCHAR(20),
    profile_picture_url VARCHAR(500),
    date_of_birth DATE,
    gender VARCHAR(20),
    address TEXT,
    city VARCHAR(100),
    country VARCHAR(100) DEFAULT 'Turkey',
    is_verified BOOLEAN DEFAULT false,
    is_two_factor_enabled BOOLEAN DEFAULT false,
    two_factor_secret VARCHAR(255),
    last_login_at TIMESTAMP WITH TIME ZONE,
    last_login_ip VARCHAR(45),
    failed_login_attempts INTEGER DEFAULT 0,
    locked_until TIMESTAMP WITH TIME ZONE,
    preferences JSONB DEFAULT '{}',
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    deleted_at TIMESTAMP WITH TIME ZONE
);

CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_role ON users(role);
CREATE INDEX idx_users_status ON users(status);
CREATE INDEX idx_users_verified ON users(is_verified) WHERE is_verified = true;
CREATE INDEX idx_users_deleted ON users(deleted_at) WHERE deleted_at IS NULL;

-- ============================================
-- 3. STUDENTS TABLE
-- ============================================
CREATE TABLE students (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
    student_number VARCHAR(20) NOT NULL UNIQUE,
    department_id UUID NOT NULL REFERENCES departments(id) ON DELETE RESTRICT,
    admission_year INTEGER NOT NULL,
    expected_graduation_year INTEGER,
    current_semester INTEGER DEFAULT 1 CHECK (current_semester >= 1 AND current_semester <= 12),
    gpa DECIMAL(3, 2) DEFAULT 0.00 CHECK (gpa >= 0 AND gpa <= 4.00),
    cgpa DECIMAL(3, 2) DEFAULT 0.00 CHECK (cgpa >= 0 AND cgpa <= 4.00),
    total_credits INTEGER DEFAULT 0,
    advisor_id UUID, -- FK to faculty
    scholarship_status VARCHAR(50),
    enrollment_status VARCHAR(20) DEFAULT 'active',
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    deleted_at TIMESTAMP WITH TIME ZONE
);

CREATE INDEX idx_students_user ON students(user_id);
CREATE INDEX idx_students_number ON students(student_number);
CREATE INDEX idx_students_department ON students(department_id);
CREATE INDEX idx_students_advisor ON students(advisor_id);
CREATE INDEX idx_students_gpa ON students(gpa);

-- ============================================
-- 4. FACULTY TABLE
-- ============================================
CREATE TABLE faculty (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
    employee_number VARCHAR(20) NOT NULL UNIQUE,
    department_id UUID NOT NULL REFERENCES departments(id) ON DELETE RESTRICT,
    title VARCHAR(50) NOT NULL, -- Prof., Doç. Dr., Dr. Öğr. Üyesi, etc.
    academic_rank VARCHAR(50),
    office_location VARCHAR(100),
    office_hours JSONB DEFAULT '{}',
    research_interests TEXT[],
    specialization VARCHAR(255),
    hire_date DATE,
    tenure_status BOOLEAN DEFAULT false,
    max_advisees INTEGER DEFAULT 10,
    current_advisees INTEGER DEFAULT 0,
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    deleted_at TIMESTAMP WITH TIME ZONE
);

CREATE INDEX idx_faculty_user ON faculty(user_id);
CREATE INDEX idx_faculty_employee ON faculty(employee_number);
CREATE INDEX idx_faculty_department ON faculty(department_id);
CREATE INDEX idx_faculty_title ON faculty(title);

-- Add FK for department head
ALTER TABLE departments ADD CONSTRAINT fk_department_head 
    FOREIGN KEY (head_id) REFERENCES faculty(id) ON DELETE SET NULL;

-- Add FK for student advisor
ALTER TABLE students ADD CONSTRAINT fk_student_advisor 
    FOREIGN KEY (advisor_id) REFERENCES faculty(id) ON DELETE SET NULL;

-- ============================================
-- 5. ADMINS TABLE
-- ============================================
CREATE TABLE admins (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
    employee_number VARCHAR(20) NOT NULL UNIQUE,
    department_id UUID REFERENCES departments(id) ON DELETE SET NULL,
    position VARCHAR(100),
    permissions JSONB DEFAULT '{}',
    access_level INTEGER DEFAULT 1 CHECK (access_level >= 1 AND access_level <= 10),
    can_manage_users BOOLEAN DEFAULT false,
    can_manage_courses BOOLEAN DEFAULT false,
    can_manage_finance BOOLEAN DEFAULT false,
    can_view_reports BOOLEAN DEFAULT true,
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    deleted_at TIMESTAMP WITH TIME ZONE
);

CREATE INDEX idx_admins_user ON admins(user_id);
CREATE INDEX idx_admins_employee ON admins(employee_number);
CREATE INDEX idx_admins_access_level ON admins(access_level);

-- ============================================
-- 6. SEMESTERS TABLE
-- ============================================
CREATE TABLE semesters (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(50) NOT NULL,
    type semester_type NOT NULL,
    year INTEGER NOT NULL,
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    registration_start DATE,
    registration_end DATE,
    add_drop_deadline DATE,
    withdrawal_deadline DATE,
    is_current BOOLEAN DEFAULT false,
    is_active BOOLEAN DEFAULT true,
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT valid_dates CHECK (end_date > start_date),
    CONSTRAINT unique_semester UNIQUE (type, year)
);

CREATE INDEX idx_semesters_current ON semesters(is_current) WHERE is_current = true;
CREATE INDEX idx_semesters_dates ON semesters(start_date, end_date);

-- ============================================
-- 7. COURSES TABLE
-- ============================================
CREATE TABLE courses (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    code VARCHAR(20) NOT NULL UNIQUE,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    department_id UUID NOT NULL REFERENCES departments(id) ON DELETE RESTRICT,
    credits INTEGER NOT NULL CHECK (credits >= 1 AND credits <= 10),
    ects_credits DECIMAL(3, 1),
    lecture_hours INTEGER DEFAULT 0,
    lab_hours INTEGER DEFAULT 0,
    prerequisite_ids UUID[] DEFAULT '{}',
    corequisite_ids UUID[] DEFAULT '{}',
    level VARCHAR(20) DEFAULT 'undergraduate', -- undergraduate, graduate, phd
    is_elective BOOLEAN DEFAULT false,
    is_active BOOLEAN DEFAULT true,
    syllabus_url VARCHAR(500),
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    deleted_at TIMESTAMP WITH TIME ZONE
);

CREATE INDEX idx_courses_code ON courses(code);
CREATE INDEX idx_courses_department ON courses(department_id);
CREATE INDEX idx_courses_active ON courses(is_active) WHERE is_active = true;
CREATE INDEX idx_courses_level ON courses(level);

-- ============================================
-- 8. CLASSROOMS TABLE
-- ============================================
CREATE TABLE classrooms (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(100) NOT NULL,
    code VARCHAR(20) NOT NULL UNIQUE,
    building VARCHAR(100) NOT NULL,
    floor INTEGER,
    capacity INTEGER NOT NULL CHECK (capacity > 0),
    room_type VARCHAR(50) DEFAULT 'lecture', -- lecture, lab, seminar, auditorium
    has_projector BOOLEAN DEFAULT true,
    has_whiteboard BOOLEAN DEFAULT true,
    has_computers BOOLEAN DEFAULT false,
    has_ac BOOLEAN DEFAULT true,
    has_video_conference BOOLEAN DEFAULT false,
    accessibility_features JSONB DEFAULT '{}',
    equipment JSONB DEFAULT '{}',
    is_active BOOLEAN DEFAULT true,
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    deleted_at TIMESTAMP WITH TIME ZONE
);

CREATE INDEX idx_classrooms_code ON classrooms(code);
CREATE INDEX idx_classrooms_building ON classrooms(building);
CREATE INDEX idx_classrooms_capacity ON classrooms(capacity);
CREATE INDEX idx_classrooms_type ON classrooms(room_type);

-- ============================================
-- 9. COURSE_SECTIONS TABLE
-- ============================================
CREATE TABLE course_sections (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    course_id UUID NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
    semester_id UUID NOT NULL REFERENCES semesters(id) ON DELETE RESTRICT,
    section_number VARCHAR(10) NOT NULL,
    instructor_id UUID NOT NULL REFERENCES faculty(id) ON DELETE RESTRICT,
    classroom_id UUID REFERENCES classrooms(id) ON DELETE SET NULL,
    capacity INTEGER NOT NULL CHECK (capacity > 0),
    enrolled_count INTEGER DEFAULT 0 CHECK (enrolled_count >= 0),
    waitlist_count INTEGER DEFAULT 0,
    schedule_info JSONB DEFAULT '{}',
    syllabus_url VARCHAR(500),
    is_online BOOLEAN DEFAULT false,
    meeting_link VARCHAR(500),
    is_active BOOLEAN DEFAULT true,
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    deleted_at TIMESTAMP WITH TIME ZONE,
    CONSTRAINT unique_section UNIQUE (course_id, semester_id, section_number),
    CONSTRAINT valid_enrollment CHECK (enrolled_count <= capacity)
);

CREATE INDEX idx_sections_course ON course_sections(course_id);
CREATE INDEX idx_sections_semester ON course_sections(semester_id);
CREATE INDEX idx_sections_instructor ON course_sections(instructor_id);
CREATE INDEX idx_sections_classroom ON course_sections(classroom_id);

-- ============================================
-- 10. SCHEDULES TABLE
-- ============================================
CREATE TABLE schedules (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    section_id UUID NOT NULL REFERENCES course_sections(id) ON DELETE CASCADE,
    classroom_id UUID REFERENCES classrooms(id) ON DELETE SET NULL,
    day_of_week day_of_week NOT NULL,
    start_time TIME NOT NULL,
    end_time TIME NOT NULL,
    is_recurring BOOLEAN DEFAULT true,
    effective_from DATE,
    effective_until DATE,
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT valid_time CHECK (end_time > start_time)
);

CREATE INDEX idx_schedules_section ON schedules(section_id);
CREATE INDEX idx_schedules_classroom ON schedules(classroom_id);
CREATE INDEX idx_schedules_day ON schedules(day_of_week);
CREATE INDEX idx_schedules_time ON schedules(start_time, end_time);

-- ============================================
-- 11. ENROLLMENTS TABLE
-- ============================================
CREATE TABLE enrollments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    student_id UUID NOT NULL REFERENCES students(id) ON DELETE CASCADE,
    section_id UUID NOT NULL REFERENCES course_sections(id) ON DELETE CASCADE,
    status enrollment_status NOT NULL DEFAULT 'enrolled',
    grade VARCHAR(5),
    grade_points DECIMAL(3, 2) CHECK (grade_points >= 0 AND grade_points <= 4.00),
    midterm_grade DECIMAL(5, 2),
    final_grade DECIMAL(5, 2),
    assignment_grades JSONB DEFAULT '{}',
    attendance_percentage DECIMAL(5, 2) DEFAULT 0,
    enrolled_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    dropped_at TIMESTAMP WITH TIME ZONE,
    completed_at TIMESTAMP WITH TIME ZONE,
    notes TEXT,
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT unique_enrollment UNIQUE (student_id, section_id)
);

CREATE INDEX idx_enrollments_student ON enrollments(student_id);
CREATE INDEX idx_enrollments_section ON enrollments(section_id);
CREATE INDEX idx_enrollments_status ON enrollments(status);
CREATE INDEX idx_enrollments_grade ON enrollments(grade);

-- ============================================
-- 12. ATTENDANCE_SESSIONS TABLE
-- ============================================
CREATE TABLE attendance_sessions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    section_id UUID NOT NULL REFERENCES course_sections(id) ON DELETE CASCADE,
    classroom_id UUID REFERENCES classrooms(id) ON DELETE SET NULL,
    session_date DATE NOT NULL,
    start_time TIME NOT NULL,
    end_time TIME NOT NULL,
    session_type VARCHAR(20) DEFAULT 'lecture', -- lecture, lab, exam, makeup
    topic VARCHAR(255),
    qr_code VARCHAR(255) UNIQUE,
    qr_expires_at TIMESTAMP WITH TIME ZONE,
    is_mandatory BOOLEAN DEFAULT true,
    is_completed BOOLEAN DEFAULT false,
    total_students INTEGER DEFAULT 0,
    present_count INTEGER DEFAULT 0,
    absent_count INTEGER DEFAULT 0,
    late_count INTEGER DEFAULT 0,
    notes TEXT,
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_attendance_sessions_section ON attendance_sessions(section_id);
CREATE INDEX idx_attendance_sessions_date ON attendance_sessions(session_date);
CREATE INDEX idx_attendance_sessions_qr ON attendance_sessions(qr_code);

-- ============================================
-- 13. ATTENDANCE_RECORDS TABLE
-- ============================================
CREATE TABLE attendance_records (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    session_id UUID NOT NULL REFERENCES attendance_sessions(id) ON DELETE CASCADE,
    student_id UUID NOT NULL REFERENCES students(id) ON DELETE CASCADE,
    status attendance_status NOT NULL DEFAULT 'absent',
    check_in_time TIMESTAMP WITH TIME ZONE,
    check_out_time TIMESTAMP WITH TIME ZONE,
    check_in_method VARCHAR(20), -- qr, manual, nfc, face_recognition
    location_data JSONB,
    device_info JSONB,
    notes TEXT,
    marked_by UUID REFERENCES users(id),
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT unique_attendance UNIQUE (session_id, student_id)
);

CREATE INDEX idx_attendance_records_session ON attendance_records(session_id);
CREATE INDEX idx_attendance_records_student ON attendance_records(student_id);
CREATE INDEX idx_attendance_records_status ON attendance_records(status);
CREATE INDEX idx_attendance_records_date ON attendance_records(check_in_time);

-- ============================================
-- 14. EXCUSE_REQUESTS TABLE
-- ============================================
CREATE TABLE excuse_requests (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    student_id UUID NOT NULL REFERENCES students(id) ON DELETE CASCADE,
    attendance_record_id UUID REFERENCES attendance_records(id) ON DELETE SET NULL,
    section_id UUID REFERENCES course_sections(id) ON DELETE SET NULL,
    excuse_type VARCHAR(50) NOT NULL, -- medical, family_emergency, official, other
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    reason TEXT NOT NULL,
    document_urls TEXT[],
    status excuse_status NOT NULL DEFAULT 'pending',
    reviewed_by UUID REFERENCES users(id),
    reviewed_at TIMESTAMP WITH TIME ZONE,
    reviewer_notes TEXT,
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT valid_excuse_dates CHECK (end_date >= start_date)
);

CREATE INDEX idx_excuse_requests_student ON excuse_requests(student_id);
CREATE INDEX idx_excuse_requests_status ON excuse_requests(status);
CREATE INDEX idx_excuse_requests_dates ON excuse_requests(start_date, end_date);

-- ============================================
-- 15. RESERVATIONS TABLE
-- ============================================
CREATE TABLE reservations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    classroom_id UUID NOT NULL REFERENCES classrooms(id) ON DELETE CASCADE,
    reserved_by UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    reservation_date DATE NOT NULL,
    start_time TIME NOT NULL,
    end_time TIME NOT NULL,
    status reservation_status NOT NULL DEFAULT 'pending',
    purpose VARCHAR(100), -- class, meeting, exam, event, maintenance
    attendee_count INTEGER,
    equipment_needed JSONB DEFAULT '{}',
    approved_by UUID REFERENCES users(id),
    approved_at TIMESTAMP WITH TIME ZONE,
    cancellation_reason TEXT,
    recurring_pattern JSONB,
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT valid_reservation_time CHECK (end_time > start_time)
);

CREATE INDEX idx_reservations_classroom ON reservations(classroom_id);
CREATE INDEX idx_reservations_user ON reservations(reserved_by);
CREATE INDEX idx_reservations_date ON reservations(reservation_date);
CREATE INDEX idx_reservations_status ON reservations(status);

-- ============================================
-- 16. MEAL_MENUS TABLE
-- ============================================
CREATE TABLE meal_menus (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    menu_date DATE NOT NULL,
    meal_type VARCHAR(20) NOT NULL, -- breakfast, lunch, dinner
    menu_items JSONB NOT NULL DEFAULT '[]',
    calories INTEGER,
    allergens TEXT[],
    vegetarian_option BOOLEAN DEFAULT false,
    vegan_option BOOLEAN DEFAULT false,
    price DECIMAL(10, 2) NOT NULL,
    student_price DECIMAL(10, 2),
    is_available BOOLEAN DEFAULT true,
    available_quantity INTEGER,
    reserved_quantity INTEGER DEFAULT 0,
    cafeteria_location VARCHAR(100),
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT unique_menu UNIQUE (menu_date, meal_type, cafeteria_location)
);

CREATE INDEX idx_meal_menus_date ON meal_menus(menu_date);
CREATE INDEX idx_meal_menus_type ON meal_menus(meal_type);
CREATE INDEX idx_meal_menus_available ON meal_menus(is_available) WHERE is_available = true;

-- ============================================
-- 17. MEAL_RESERVATIONS TABLE
-- ============================================
CREATE TABLE meal_reservations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    menu_id UUID NOT NULL REFERENCES meal_menus(id) ON DELETE CASCADE,
    quantity INTEGER NOT NULL DEFAULT 1 CHECK (quantity > 0),
    total_price DECIMAL(10, 2) NOT NULL,
    status reservation_status NOT NULL DEFAULT 'confirmed',
    payment_method VARCHAR(50), -- wallet, cash, card
    transaction_id UUID,
    pickup_time TIME,
    picked_up_at TIMESTAMP WITH TIME ZONE,
    qr_code VARCHAR(255) UNIQUE,
    notes TEXT,
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_meal_reservations_user ON meal_reservations(user_id);
CREATE INDEX idx_meal_reservations_menu ON meal_reservations(menu_id);
CREATE INDEX idx_meal_reservations_status ON meal_reservations(status);
CREATE INDEX idx_meal_reservations_qr ON meal_reservations(qr_code);

-- ============================================
-- 18. WALLETS TABLE
-- ============================================
CREATE TABLE wallets (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
    balance DECIMAL(12, 2) NOT NULL DEFAULT 0.00 CHECK (balance >= 0),
    currency VARCHAR(3) DEFAULT 'TRY',
    is_active BOOLEAN DEFAULT true,
    daily_limit DECIMAL(10, 2) DEFAULT 1000.00,
    monthly_limit DECIMAL(10, 2) DEFAULT 10000.00,
    last_transaction_at TIMESTAMP WITH TIME ZONE,
    pin_hash VARCHAR(255),
    is_pin_required BOOLEAN DEFAULT false,
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_wallets_user ON wallets(user_id);
CREATE INDEX idx_wallets_active ON wallets(is_active) WHERE is_active = true;

-- ============================================
-- 19. TRANSACTIONS TABLE
-- ============================================
CREATE TABLE transactions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    wallet_id UUID NOT NULL REFERENCES wallets(id) ON DELETE RESTRICT,
    type transaction_type NOT NULL,
    amount DECIMAL(12, 2) NOT NULL CHECK (amount > 0),
    balance_before DECIMAL(12, 2) NOT NULL,
    balance_after DECIMAL(12, 2) NOT NULL,
    status transaction_status NOT NULL DEFAULT 'pending',
    reference_type VARCHAR(50), -- meal_reservation, event_registration, transfer, etc.
    reference_id UUID,
    recipient_wallet_id UUID REFERENCES wallets(id),
    description TEXT,
    payment_method VARCHAR(50),
    external_transaction_id VARCHAR(255),
    processed_at TIMESTAMP WITH TIME ZONE,
    failed_reason TEXT,
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_transactions_wallet ON transactions(wallet_id);
CREATE INDEX idx_transactions_type ON transactions(type);
CREATE INDEX idx_transactions_status ON transactions(status);
CREATE INDEX idx_transactions_date ON transactions(created_at);
CREATE INDEX idx_transactions_reference ON transactions(reference_type, reference_id);

-- ============================================
-- 20. EVENTS TABLE
-- ============================================
CREATE TABLE events (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    title VARCHAR(255) NOT NULL,
    description TEXT,
    short_description VARCHAR(500),
    event_type VARCHAR(50) NOT NULL, -- conference, workshop, seminar, social, sports, cultural
    category VARCHAR(50),
    organizer_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    department_id UUID REFERENCES departments(id) ON DELETE SET NULL,
    location VARCHAR(255),
    classroom_id UUID REFERENCES classrooms(id) ON DELETE SET NULL,
    online_link VARCHAR(500),
    is_online BOOLEAN DEFAULT false,
    is_hybrid BOOLEAN DEFAULT false,
    start_datetime TIMESTAMP WITH TIME ZONE NOT NULL,
    end_datetime TIMESTAMP WITH TIME ZONE NOT NULL,
    registration_start TIMESTAMP WITH TIME ZONE,
    registration_end TIMESTAMP WITH TIME ZONE,
    capacity INTEGER,
    registered_count INTEGER DEFAULT 0,
    waitlist_count INTEGER DEFAULT 0,
    is_free BOOLEAN DEFAULT true,
    price DECIMAL(10, 2) DEFAULT 0,
    status event_status NOT NULL DEFAULT 'draft',
    image_url VARCHAR(500),
    tags TEXT[],
    target_audience TEXT[], -- students, faculty, staff, public
    is_featured BOOLEAN DEFAULT false,
    requires_approval BOOLEAN DEFAULT false,
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    deleted_at TIMESTAMP WITH TIME ZONE,
    CONSTRAINT valid_event_dates CHECK (end_datetime > start_datetime)
);

CREATE INDEX idx_events_organizer ON events(organizer_id);
CREATE INDEX idx_events_department ON events(department_id);
CREATE INDEX idx_events_dates ON events(start_datetime, end_datetime);
CREATE INDEX idx_events_status ON events(status);
CREATE INDEX idx_events_type ON events(event_type);
CREATE INDEX idx_events_featured ON events(is_featured) WHERE is_featured = true;

-- ============================================
-- 21. EVENT_REGISTRATIONS TABLE
-- ============================================
CREATE TABLE event_registrations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    event_id UUID NOT NULL REFERENCES events(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    status VARCHAR(20) NOT NULL DEFAULT 'registered', -- registered, waitlist, cancelled, attended
    registration_type VARCHAR(20) DEFAULT 'participant', -- participant, speaker, volunteer, organizer
    ticket_number VARCHAR(50) UNIQUE,
    qr_code VARCHAR(255) UNIQUE,
    payment_status VARCHAR(20) DEFAULT 'not_required', -- not_required, pending, paid, refunded
    transaction_id UUID REFERENCES transactions(id),
    checked_in_at TIMESTAMP WITH TIME ZONE,
    feedback_submitted BOOLEAN DEFAULT false,
    notes TEXT,
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT unique_event_registration UNIQUE (event_id, user_id)
);

CREATE INDEX idx_event_registrations_event ON event_registrations(event_id);
CREATE INDEX idx_event_registrations_user ON event_registrations(user_id);
CREATE INDEX idx_event_registrations_status ON event_registrations(status);
CREATE INDEX idx_event_registrations_ticket ON event_registrations(ticket_number);

-- ============================================
-- 22. NOTIFICATIONS TABLE
-- ============================================
CREATE TABLE notifications (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    message TEXT NOT NULL,
    type notification_type NOT NULL DEFAULT 'info',
    category VARCHAR(50), -- academic, financial, event, system, etc.
    priority INTEGER DEFAULT 0 CHECK (priority >= 0 AND priority <= 10),
    action_url VARCHAR(500),
    action_text VARCHAR(100),
    is_read BOOLEAN DEFAULT false,
    read_at TIMESTAMP WITH TIME ZONE,
    is_archived BOOLEAN DEFAULT false,
    expires_at TIMESTAMP WITH TIME ZONE,
    sender_id UUID REFERENCES users(id),
    reference_type VARCHAR(50),
    reference_id UUID,
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_notifications_user ON notifications(user_id);
CREATE INDEX idx_notifications_read ON notifications(is_read) WHERE is_read = false;
CREATE INDEX idx_notifications_type ON notifications(type);
CREATE INDEX idx_notifications_category ON notifications(category);
CREATE INDEX idx_notifications_date ON notifications(created_at DESC);

-- ============================================
-- 23. NOTIFICATION_PREFERENCES TABLE
-- ============================================
CREATE TABLE notification_preferences (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
    email_enabled BOOLEAN DEFAULT true,
    push_enabled BOOLEAN DEFAULT true,
    sms_enabled BOOLEAN DEFAULT false,
    academic_notifications BOOLEAN DEFAULT true,
    financial_notifications BOOLEAN DEFAULT true,
    event_notifications BOOLEAN DEFAULT true,
    system_notifications BOOLEAN DEFAULT true,
    marketing_notifications BOOLEAN DEFAULT false,
    quiet_hours_start TIME,
    quiet_hours_end TIME,
    language VARCHAR(10) DEFAULT 'tr',
    digest_frequency VARCHAR(20) DEFAULT 'instant', -- instant, daily, weekly
    categories JSONB DEFAULT '{}',
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_notification_preferences_user ON notification_preferences(user_id);

-- ============================================
-- 24. IOT_SENSORS TABLE
-- ============================================
CREATE TABLE iot_sensors (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    sensor_code VARCHAR(50) NOT NULL UNIQUE,
    name VARCHAR(100) NOT NULL,
    type sensor_type NOT NULL,
    location VARCHAR(255),
    classroom_id UUID REFERENCES classrooms(id) ON DELETE SET NULL,
    building VARCHAR(100),
    floor INTEGER,
    is_active BOOLEAN DEFAULT true,
    last_reading_at TIMESTAMP WITH TIME ZONE,
    last_reading_value DECIMAL(10, 2),
    battery_level INTEGER CHECK (battery_level >= 0 AND battery_level <= 100),
    firmware_version VARCHAR(50),
    calibration_date DATE,
    next_maintenance_date DATE,
    thresholds JSONB DEFAULT '{}',
    configuration JSONB DEFAULT '{}',
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    deleted_at TIMESTAMP WITH TIME ZONE
);

CREATE INDEX idx_iot_sensors_code ON iot_sensors(sensor_code);
CREATE INDEX idx_iot_sensors_type ON iot_sensors(type);
CREATE INDEX idx_iot_sensors_classroom ON iot_sensors(classroom_id);
CREATE INDEX idx_iot_sensors_active ON iot_sensors(is_active) WHERE is_active = true;

-- ============================================
-- 25. SENSOR_DATA TABLE
-- ============================================
CREATE TABLE sensor_data (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    sensor_id UUID NOT NULL REFERENCES iot_sensors(id) ON DELETE CASCADE,
    reading_value DECIMAL(10, 2) NOT NULL,
    unit VARCHAR(20),
    quality_score INTEGER CHECK (quality_score >= 0 AND quality_score <= 100),
    is_anomaly BOOLEAN DEFAULT false,
    anomaly_type VARCHAR(50),
    recorded_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    processed_at TIMESTAMP WITH TIME ZONE,
    metadata JSONB DEFAULT '{}'
);

-- Partition by time for better performance
CREATE INDEX idx_sensor_data_sensor ON sensor_data(sensor_id);
CREATE INDEX idx_sensor_data_time ON sensor_data(recorded_at DESC);
CREATE INDEX idx_sensor_data_anomaly ON sensor_data(is_anomaly) WHERE is_anomaly = true;

-- ============================================
-- 26. AUDIT_LOGS TABLE
-- ============================================
CREATE TABLE audit_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    action VARCHAR(100) NOT NULL,
    entity_type VARCHAR(100) NOT NULL,
    entity_id UUID,
    old_values JSONB,
    new_values JSONB,
    ip_address VARCHAR(45),
    user_agent TEXT,
    session_id VARCHAR(255),
    request_id VARCHAR(255),
    http_method VARCHAR(10),
    endpoint VARCHAR(500),
    status_code INTEGER,
    response_time_ms INTEGER,
    error_message TEXT,
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_audit_logs_user ON audit_logs(user_id);
CREATE INDEX idx_audit_logs_action ON audit_logs(action);
CREATE INDEX idx_audit_logs_entity ON audit_logs(entity_type, entity_id);
CREATE INDEX idx_audit_logs_date ON audit_logs(created_at DESC);
CREATE INDEX idx_audit_logs_ip ON audit_logs(ip_address);

-- ============================================
-- 27. PASSWORD_RESETS TABLE
-- ============================================
CREATE TABLE password_resets (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    token VARCHAR(255) NOT NULL UNIQUE,
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
    used_at TIMESTAMP WITH TIME ZONE,
    ip_address VARCHAR(45),
    user_agent TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_password_resets_user ON password_resets(user_id);
CREATE INDEX idx_password_resets_token ON password_resets(token);
CREATE INDEX idx_password_resets_expires ON password_resets(expires_at);

-- ============================================
-- 28. EMAIL_VERIFICATIONS TABLE
-- ============================================
CREATE TABLE email_verifications (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    email VARCHAR(255) NOT NULL,
    token VARCHAR(255) NOT NULL UNIQUE,
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
    verified_at TIMESTAMP WITH TIME ZONE,
    ip_address VARCHAR(45),
    user_agent TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_email_verifications_user ON email_verifications(user_id);
CREATE INDEX idx_email_verifications_token ON email_verifications(token);
CREATE INDEX idx_email_verifications_email ON email_verifications(email);

-- ============================================
-- 29. SESSION_TOKENS TABLE
-- ============================================
CREATE TABLE session_tokens (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    token_hash VARCHAR(255) NOT NULL UNIQUE,
    refresh_token_hash VARCHAR(255) UNIQUE,
    device_name VARCHAR(100),
    device_type VARCHAR(50), -- desktop, mobile, tablet
    browser VARCHAR(100),
    os VARCHAR(100),
    ip_address VARCHAR(45),
    location JSONB,
    is_active BOOLEAN DEFAULT true,
    last_used_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
    revoked_at TIMESTAMP WITH TIME ZONE,
    revoked_reason VARCHAR(255),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_session_tokens_user ON session_tokens(user_id);
CREATE INDEX idx_session_tokens_token ON session_tokens(token_hash);
CREATE INDEX idx_session_tokens_refresh ON session_tokens(refresh_token_hash);
CREATE INDEX idx_session_tokens_active ON session_tokens(is_active) WHERE is_active = true;
CREATE INDEX idx_session_tokens_expires ON session_tokens(expires_at);

-- ============================================
-- 30. ANNOUNCEMENTS TABLE
-- ============================================
CREATE TABLE announcements (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    title VARCHAR(255) NOT NULL,
    content TEXT NOT NULL,
    short_content VARCHAR(500),
    author_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    department_id UUID REFERENCES departments(id) ON DELETE SET NULL,
    target_roles user_role[],
    target_departments UUID[],
    priority INTEGER DEFAULT 0 CHECK (priority >= 0 AND priority <= 10),
    is_pinned BOOLEAN DEFAULT false,
    is_published BOOLEAN DEFAULT false,
    published_at TIMESTAMP WITH TIME ZONE,
    expires_at TIMESTAMP WITH TIME ZONE,
    view_count INTEGER DEFAULT 0,
    attachment_urls TEXT[],
    tags TEXT[],
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    deleted_at TIMESTAMP WITH TIME ZONE
);

CREATE INDEX idx_announcements_author ON announcements(author_id);
CREATE INDEX idx_announcements_department ON announcements(department_id);
CREATE INDEX idx_announcements_published ON announcements(is_published) WHERE is_published = true;
CREATE INDEX idx_announcements_pinned ON announcements(is_pinned) WHERE is_pinned = true;
CREATE INDEX idx_announcements_date ON announcements(published_at DESC);

-- ============================================
-- 31. CLUBS TABLE
-- ============================================
CREATE TABLE clubs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL UNIQUE,
    description TEXT,
    short_description VARCHAR(500),
    category VARCHAR(50), -- academic, sports, cultural, social, technical
    logo_url VARCHAR(500),
    cover_image_url VARCHAR(500),
    advisor_id UUID REFERENCES faculty(id) ON DELETE SET NULL,
    president_id UUID REFERENCES students(id) ON DELETE SET NULL,
    founding_date DATE,
    email VARCHAR(100),
    website VARCHAR(255),
    social_links JSONB DEFAULT '{}',
    member_count INTEGER DEFAULT 0,
    max_members INTEGER,
    is_active BOOLEAN DEFAULT true,
    is_recruiting BOOLEAN DEFAULT true,
    meeting_schedule JSONB DEFAULT '{}',
    requirements TEXT,
    achievements TEXT[],
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    deleted_at TIMESTAMP WITH TIME ZONE
);

CREATE INDEX idx_clubs_name ON clubs(name);
CREATE INDEX idx_clubs_category ON clubs(category);
CREATE INDEX idx_clubs_advisor ON clubs(advisor_id);
CREATE INDEX idx_clubs_active ON clubs(is_active) WHERE is_active = true;

-- ============================================
-- 32. CLUB_MEMBERSHIPS TABLE
-- ============================================
CREATE TABLE club_memberships (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    club_id UUID NOT NULL REFERENCES clubs(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    role VARCHAR(50) NOT NULL DEFAULT 'member', -- member, board, president, vice_president, treasurer
    position VARCHAR(100),
    joined_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    left_at TIMESTAMP WITH TIME ZONE,
    is_active BOOLEAN DEFAULT true,
    contribution_score INTEGER DEFAULT 0,
    notes TEXT,
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT unique_club_membership UNIQUE (club_id, user_id)
);

CREATE INDEX idx_club_memberships_club ON club_memberships(club_id);
CREATE INDEX idx_club_memberships_user ON club_memberships(user_id);
CREATE INDEX idx_club_memberships_role ON club_memberships(role);
CREATE INDEX idx_club_memberships_active ON club_memberships(is_active) WHERE is_active = true;

-- ============================================
-- 33. GRADES TABLE (Detailed Grade History)
-- ============================================
CREATE TABLE grades (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    enrollment_id UUID NOT NULL REFERENCES enrollments(id) ON DELETE CASCADE,
    grade_type VARCHAR(50) NOT NULL, -- quiz, assignment, midterm, final, project, participation
    name VARCHAR(255) NOT NULL,
    max_score DECIMAL(6, 2) NOT NULL,
    score DECIMAL(6, 2) CHECK (score >= 0),
    weight DECIMAL(5, 2) CHECK (weight >= 0 AND weight <= 100),
    graded_at TIMESTAMP WITH TIME ZONE,
    graded_by UUID REFERENCES users(id),
    feedback TEXT,
    is_published BOOLEAN DEFAULT false,
    published_at TIMESTAMP WITH TIME ZONE,
    due_date TIMESTAMP WITH TIME ZONE,
    submitted_at TIMESTAMP WITH TIME ZONE,
    submission_url VARCHAR(500),
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_grades_enrollment ON grades(enrollment_id);
CREATE INDEX idx_grades_type ON grades(grade_type);
CREATE INDEX idx_grades_published ON grades(is_published) WHERE is_published = true;

-- ============================================
-- 34. ACADEMIC_CALENDAR TABLE
-- ============================================
CREATE TABLE academic_calendar (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    semester_id UUID REFERENCES semesters(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    event_type VARCHAR(50) NOT NULL, -- holiday, deadline, exam_period, registration, graduation
    start_date DATE NOT NULL,
    end_date DATE,
    is_holiday BOOLEAN DEFAULT false,
    affects_all_departments BOOLEAN DEFAULT true,
    affected_departments UUID[],
    is_recurring BOOLEAN DEFAULT false,
    recurrence_pattern JSONB,
    color VARCHAR(7), -- Hex color for calendar display
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_academic_calendar_semester ON academic_calendar(semester_id);
CREATE INDEX idx_academic_calendar_dates ON academic_calendar(start_date, end_date);
CREATE INDEX idx_academic_calendar_type ON academic_calendar(event_type);

-- ============================================
-- 35. LIBRARY_BOOKS TABLE
-- ============================================
CREATE TABLE library_books (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    isbn VARCHAR(20) UNIQUE,
    title VARCHAR(500) NOT NULL,
    authors TEXT[] NOT NULL,
    publisher VARCHAR(255),
    publication_year INTEGER,
    edition VARCHAR(50),
    language VARCHAR(50) DEFAULT 'Turkish',
    category VARCHAR(100),
    subcategory VARCHAR(100),
    description TEXT,
    cover_image_url VARCHAR(500),
    total_copies INTEGER NOT NULL DEFAULT 1 CHECK (total_copies > 0),
    available_copies INTEGER NOT NULL DEFAULT 1 CHECK (available_copies >= 0),
    location VARCHAR(100), -- Shelf location
    department_id UUID REFERENCES departments(id) ON DELETE SET NULL,
    is_reference_only BOOLEAN DEFAULT false,
    is_active BOOLEAN DEFAULT true,
    tags TEXT[],
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    deleted_at TIMESTAMP WITH TIME ZONE,
    CONSTRAINT valid_copies CHECK (available_copies <= total_copies)
);

CREATE INDEX idx_library_books_isbn ON library_books(isbn);
CREATE INDEX idx_library_books_title ON library_books USING gin(to_tsvector('english', title));
CREATE INDEX idx_library_books_category ON library_books(category);
CREATE INDEX idx_library_books_available ON library_books(available_copies) WHERE available_copies > 0;

-- ============================================
-- 36. LIBRARY_LOANS TABLE
-- ============================================
CREATE TABLE library_loans (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    book_id UUID NOT NULL REFERENCES library_books(id) ON DELETE RESTRICT,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
    borrowed_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    due_date TIMESTAMP WITH TIME ZONE NOT NULL,
    returned_at TIMESTAMP WITH TIME ZONE,
    renewed_count INTEGER DEFAULT 0 CHECK (renewed_count <= 3),
    status VARCHAR(20) NOT NULL DEFAULT 'borrowed', -- borrowed, returned, overdue, lost
    fine_amount DECIMAL(10, 2) DEFAULT 0,
    fine_paid BOOLEAN DEFAULT false,
    notes TEXT,
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_library_loans_book ON library_loans(book_id);
CREATE INDEX idx_library_loans_user ON library_loans(user_id);
CREATE INDEX idx_library_loans_status ON library_loans(status);
CREATE INDEX idx_library_loans_due ON library_loans(due_date) WHERE status = 'borrowed';

-- ============================================
-- 37. PARKING_SPOTS TABLE
-- ============================================
CREATE TABLE parking_spots (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    spot_number VARCHAR(20) NOT NULL UNIQUE,
    zone VARCHAR(50) NOT NULL, -- A, B, C, faculty, student, visitor
    floor INTEGER,
    building VARCHAR(100),
    spot_type VARCHAR(50) DEFAULT 'regular', -- regular, handicapped, electric, motorcycle
    is_covered BOOLEAN DEFAULT false,
    is_available BOOLEAN DEFAULT true,
    assigned_to UUID REFERENCES users(id) ON DELETE SET NULL,
    monthly_rate DECIMAL(10, 2),
    hourly_rate DECIMAL(10, 2),
    sensor_id UUID REFERENCES iot_sensors(id) ON DELETE SET NULL,
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_parking_spots_zone ON parking_spots(zone);
CREATE INDEX idx_parking_spots_available ON parking_spots(is_available) WHERE is_available = true;
CREATE INDEX idx_parking_spots_assigned ON parking_spots(assigned_to);

-- ============================================
-- 38. PARKING_RESERVATIONS TABLE
-- ============================================
CREATE TABLE parking_reservations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    spot_id UUID NOT NULL REFERENCES parking_spots(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    vehicle_plate VARCHAR(20) NOT NULL,
    reservation_date DATE NOT NULL,
    start_time TIME NOT NULL,
    end_time TIME NOT NULL,
    status reservation_status NOT NULL DEFAULT 'confirmed',
    total_cost DECIMAL(10, 2),
    transaction_id UUID REFERENCES transactions(id),
    checked_in_at TIMESTAMP WITH TIME ZONE,
    checked_out_at TIMESTAMP WITH TIME ZONE,
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT valid_parking_time CHECK (end_time > start_time)
);

CREATE INDEX idx_parking_reservations_spot ON parking_reservations(spot_id);
CREATE INDEX idx_parking_reservations_user ON parking_reservations(user_id);
CREATE INDEX idx_parking_reservations_date ON parking_reservations(reservation_date);
CREATE INDEX idx_parking_reservations_status ON parking_reservations(status);

-- ============================================
-- ADDITIONAL CONSTRAINTS AND TRIGGERS
-- ============================================

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Apply trigger to all tables with updated_at
DO $$
DECLARE
    t text;
BEGIN
    FOR t IN 
        SELECT table_name 
        FROM information_schema.columns 
        WHERE column_name = 'updated_at' 
        AND table_schema = 'public'
    LOOP
        EXECUTE format('
            CREATE TRIGGER update_%I_updated_at
            BEFORE UPDATE ON %I
            FOR EACH ROW
            EXECUTE FUNCTION update_updated_at_column();
        ', t, t);
    END LOOP;
END;
$$ LANGUAGE plpgsql;

-- Function to update enrolled_count in course_sections
CREATE OR REPLACE FUNCTION update_enrollment_count()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'INSERT' THEN
        UPDATE course_sections 
        SET enrolled_count = enrolled_count + 1 
        WHERE id = NEW.section_id AND NEW.status = 'enrolled';
    ELSIF TG_OP = 'UPDATE' THEN
        IF OLD.status = 'enrolled' AND NEW.status != 'enrolled' THEN
            UPDATE course_sections 
            SET enrolled_count = enrolled_count - 1 
            WHERE id = NEW.section_id;
        ELSIF OLD.status != 'enrolled' AND NEW.status = 'enrolled' THEN
            UPDATE course_sections 
            SET enrolled_count = enrolled_count + 1 
            WHERE id = NEW.section_id;
        END IF;
    ELSIF TG_OP = 'DELETE' THEN
        IF OLD.status = 'enrolled' THEN
            UPDATE course_sections 
            SET enrolled_count = enrolled_count - 1 
            WHERE id = OLD.section_id;
        END IF;
    END IF;
    RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER enrollment_count_trigger
AFTER INSERT OR UPDATE OR DELETE ON enrollments
FOR EACH ROW EXECUTE FUNCTION update_enrollment_count();

-- Function to update member_count in clubs
CREATE OR REPLACE FUNCTION update_club_member_count()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'INSERT' THEN
        UPDATE clubs SET member_count = member_count + 1 WHERE id = NEW.club_id;
    ELSIF TG_OP = 'DELETE' THEN
        UPDATE clubs SET member_count = member_count - 1 WHERE id = OLD.club_id;
    ELSIF TG_OP = 'UPDATE' THEN
        IF OLD.is_active = true AND NEW.is_active = false THEN
            UPDATE clubs SET member_count = member_count - 1 WHERE id = NEW.club_id;
        ELSIF OLD.is_active = false AND NEW.is_active = true THEN
            UPDATE clubs SET member_count = member_count + 1 WHERE id = NEW.club_id;
        END IF;
    END IF;
    RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER club_member_count_trigger
AFTER INSERT OR UPDATE OR DELETE ON club_memberships
FOR EACH ROW EXECUTE FUNCTION update_club_member_count();

-- Function to update available_copies in library_books
CREATE OR REPLACE FUNCTION update_book_availability()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'INSERT' THEN
        UPDATE library_books SET available_copies = available_copies - 1 WHERE id = NEW.book_id;
    ELSIF TG_OP = 'UPDATE' THEN
        IF OLD.status = 'borrowed' AND NEW.status = 'returned' THEN
            UPDATE library_books SET available_copies = available_copies + 1 WHERE id = NEW.book_id;
        END IF;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER book_availability_trigger
AFTER INSERT OR UPDATE ON library_loans
FOR EACH ROW EXECUTE FUNCTION update_book_availability();

-- ============================================
-- VIEWS FOR COMMON QUERIES
-- ============================================

-- View: Active students with department info
CREATE VIEW v_active_students AS
SELECT 
    s.id,
    s.student_number,
    u.full_name,
    u.email,
    d.name AS department_name,
    s.gpa,
    s.cgpa,
    s.current_semester
FROM students s
JOIN users u ON s.user_id = u.id
JOIN departments d ON s.department_id = d.id
WHERE u.status = 'active' AND u.deleted_at IS NULL AND s.deleted_at IS NULL;

-- View: Current semester sections with enrollment info
CREATE VIEW v_current_sections AS
SELECT 
    cs.id,
    c.code AS course_code,
    c.name AS course_name,
    cs.section_number,
    u.full_name AS instructor_name,
    cr.name AS classroom_name,
    cs.capacity,
    cs.enrolled_count,
    cs.capacity - cs.enrolled_count AS available_seats
FROM course_sections cs
JOIN courses c ON cs.course_id = c.id
JOIN faculty f ON cs.instructor_id = f.id
JOIN users u ON f.user_id = u.id
LEFT JOIN classrooms cr ON cs.classroom_id = cr.id
JOIN semesters sem ON cs.semester_id = sem.id
WHERE sem.is_current = true AND cs.is_active = true;

-- View: Upcoming events
CREATE VIEW v_upcoming_events AS
SELECT 
    e.id,
    e.title,
    e.event_type,
    e.start_datetime,
    e.end_datetime,
    e.location,
    e.capacity,
    e.registered_count,
    e.is_free,
    e.price,
    u.full_name AS organizer_name
FROM events e
JOIN users u ON e.organizer_id = u.id
WHERE e.status = 'published' 
AND e.start_datetime > CURRENT_TIMESTAMP
AND e.deleted_at IS NULL
ORDER BY e.start_datetime;

-- ============================================
-- GRANT STATEMENTS (Example for app user)
-- ============================================

-- Create app user if not exists
-- CREATE USER campus_app WITH PASSWORD 'secure_password';

-- Grant permissions
-- GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO campus_app;
-- GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO campus_app;

-- ============================================
-- COMMENTS
-- ============================================

COMMENT ON TABLE users IS 'Main user table for all system users';
COMMENT ON TABLE students IS 'Student-specific information linked to users';
COMMENT ON TABLE faculty IS 'Faculty/instructor-specific information linked to users';
COMMENT ON TABLE courses IS 'Course catalog with course definitions';
COMMENT ON TABLE course_sections IS 'Specific instances of courses offered in a semester';
COMMENT ON TABLE enrollments IS 'Student enrollments in course sections';
COMMENT ON TABLE attendance_sessions IS 'Individual class sessions for attendance tracking';
COMMENT ON TABLE attendance_records IS 'Student attendance records for each session';
COMMENT ON TABLE wallets IS 'Digital wallet for campus payments';
COMMENT ON TABLE transactions IS 'Financial transaction history';
COMMENT ON TABLE events IS 'Campus events and activities';
COMMENT ON TABLE notifications IS 'User notifications';
COMMENT ON TABLE iot_sensors IS 'IoT sensor device registry';
COMMENT ON TABLE sensor_data IS 'Time-series sensor readings';
COMMENT ON TABLE audit_logs IS 'System audit trail for all important actions';

-- ============================================
-- END OF SCHEMA
-- ============================================

