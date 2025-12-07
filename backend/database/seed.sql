-- ============================================
-- Campus Management System - Seed Data
-- PostgreSQL UUID format compatible
-- ============================================

-- ============================================
-- DEPARTMENTS
-- ============================================
INSERT INTO departments (id, name, code, faculty, description, building, email) VALUES
('11111111-1111-1111-1111-111111111111', 'Computer Engineering', 'CENG', 'Engineering', 'Computer Science and Engineering Department', 'Engineering Building A', 'ceng@campus.edu'),
('22222222-2222-2222-2222-222222222222', 'Electrical Engineering', 'EE', 'Engineering', 'Electrical and Electronics Engineering', 'Engineering Building B', 'ee@campus.edu'),
('33333333-3333-3333-3333-333333333333', 'Mathematics', 'MATH', 'Science', 'Mathematics Department', 'Science Building', 'math@campus.edu'),
('44444444-4444-4444-4444-444444444444', 'Physics', 'PHYS', 'Science', 'Physics Department', 'Science Building', 'physics@campus.edu'),
('55555555-5555-5555-5555-555555555555', 'Business Administration', 'BA', 'Management', 'Business and Management Studies', 'Management Building', 'ba@campus.edu');

-- ============================================
-- SEMESTERS
-- ============================================
INSERT INTO semesters (id, name, type, year, start_date, end_date, registration_start, registration_end, is_current) VALUES
('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'Fall 2024', 'fall', 2024, '2024-09-16', '2025-01-10', '2024-09-01', '2024-09-15', false),
('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 'Spring 2025', 'spring', 2025, '2025-02-10', '2025-06-06', '2025-01-27', '2025-02-09', true),
('cccccccc-cccc-cccc-cccc-cccccccccccc', 'Summer 2025', 'summer', 2025, '2025-07-01', '2025-08-15', '2025-06-15', '2025-06-30', false);

-- ============================================
-- USERS (password: Password123 - bcrypt hash)
-- Note: UUID must be valid hex characters only (0-9, a-f)
-- ============================================
INSERT INTO users (id, email, password_hash, role, status, full_name, phone, is_verified) VALUES
-- Admin
('a0000001-0000-0000-0000-000000000001', 'admin@campus.edu', '$2b$10$t/rTlzf/eYGq.JmtXNMc9uydA/F9pksDKVOjfusb8Sw4qNhg4Hv3S', 'admin', 'active', 'System Administrator', '+905551000001', true),
-- Faculty
('f0000001-0000-0000-0000-000000000001', 'prof.smith@campus.edu', '$2b$10$t/rTlzf/eYGq.JmtXNMc9uydA/F9pksDKVOjfusb8Sw4qNhg4Hv3S', 'faculty', 'active', 'Prof. John Smith', '+905551000002', true),
('f0000002-0000-0000-0000-000000000002', 'prof.johnson@campus.edu', '$2b$10$t/rTlzf/eYGq.JmtXNMc9uydA/F9pksDKVOjfusb8Sw4qNhg4Hv3S', 'faculty', 'active', 'Prof. Emily Johnson', '+905551000003', true),
('f0000003-0000-0000-0000-000000000003', 'dr.williams@campus.edu', '$2b$10$t/rTlzf/eYGq.JmtXNMc9uydA/F9pksDKVOjfusb8Sw4qNhg4Hv3S', 'faculty', 'active', 'Dr. Michael Williams', '+905551000004', true),
-- Students (changed 's' to '5' for valid hex)
('50000001-0000-0000-0000-000000000001', 'student1@campus.edu', '$2b$10$t/rTlzf/eYGq.JmtXNMc9uydA/F9pksDKVOjfusb8Sw4qNhg4Hv3S', 'student', 'active', 'Alice Brown', '+905552000001', true),
('50000002-0000-0000-0000-000000000002', 'student2@campus.edu', '$2b$10$t/rTlzf/eYGq.JmtXNMc9uydA/F9pksDKVOjfusb8Sw4qNhg4Hv3S', 'student', 'active', 'Bob Wilson', '+905552000002', true),
('50000003-0000-0000-0000-000000000003', 'student3@campus.edu', '$2b$10$t/rTlzf/eYGq.JmtXNMc9uydA/F9pksDKVOjfusb8Sw4qNhg4Hv3S', 'student', 'active', 'Carol Davis', '+905552000003', true),
('50000004-0000-0000-0000-000000000004', 'student4@campus.edu', '$2b$10$t/rTlzf/eYGq.JmtXNMc9uydA/F9pksDKVOjfusb8Sw4qNhg4Hv3S', 'student', 'active', 'David Miller', '+905552000004', true),
('50000005-0000-0000-0000-000000000005', 'student5@campus.edu', '$2b$10$t/rTlzf/eYGq.JmtXNMc9uydA/F9pksDKVOjfusb8Sw4qNhg4Hv3S', 'student', 'active', 'Eva Martinez', '+905552000005', true);

-- ============================================
-- FACULTY
-- ============================================
INSERT INTO faculty (id, user_id, employee_number, department_id, title, academic_rank, office_location) VALUES
('fac00001-0000-0000-0000-000000000001', 'f0000001-0000-0000-0000-000000000001', 'EMP001', '11111111-1111-1111-1111-111111111111', 'Professor', 'Full Professor', 'A-101'),
('fac00002-0000-0000-0000-000000000002', 'f0000002-0000-0000-0000-000000000002', 'EMP002', '11111111-1111-1111-1111-111111111111', 'Associate Professor', 'Associate Professor', 'A-102'),
('fac00003-0000-0000-0000-000000000003', 'f0000003-0000-0000-0000-000000000003', 'EMP003', '22222222-2222-2222-2222-222222222222', 'Assistant Professor', 'Assistant Professor', 'B-201');

-- Update department heads
UPDATE departments SET head_id = 'fac00001-0000-0000-0000-000000000001' WHERE id = '11111111-1111-1111-1111-111111111111';

-- ============================================
-- STUDENTS
-- ============================================
INSERT INTO students (id, user_id, student_number, department_id, admission_year, current_semester, gpa, cgpa) VALUES
('51000001-0000-0000-0000-000000000001', '50000001-0000-0000-0000-000000000001', '2021001', '11111111-1111-1111-1111-111111111111', 2021, 6, 3.50, 3.45),
('51000002-0000-0000-0000-000000000002', '50000002-0000-0000-0000-000000000002', '2021002', '11111111-1111-1111-1111-111111111111', 2021, 6, 3.75, 3.70),
('51000003-0000-0000-0000-000000000003', '50000003-0000-0000-0000-000000000003', '2022001', '22222222-2222-2222-2222-222222222222', 2022, 4, 3.25, 3.20),
('51000004-0000-0000-0000-000000000004', '50000004-0000-0000-0000-000000000004', '2023001', '33333333-3333-3333-3333-333333333333', 2023, 2, 3.90, 3.85),
('51000005-0000-0000-0000-000000000005', '50000005-0000-0000-0000-000000000005', '2023002', '11111111-1111-1111-1111-111111111111', 2023, 2, 3.60, 3.55);

-- ============================================
-- ADMINS
-- ============================================
INSERT INTO admins (id, user_id, employee_number, position, access_level, can_manage_users, can_manage_courses, can_manage_finance) VALUES
('ad000001-0000-0000-0000-000000000001', 'a0000001-0000-0000-0000-000000000001', 'ADM001', 'System Administrator', 10, true, true, true);

-- ============================================
-- CLASSROOMS
-- ============================================
INSERT INTO classrooms (id, name, code, building, floor, capacity, room_type, has_projector, has_computers) VALUES
('c1500001-0000-0000-0000-000000000001', 'Lecture Hall A101', 'A101', 'Engineering Building A', 1, 100, 'lecture', true, false),
('c1500002-0000-0000-0000-000000000002', 'Lecture Hall A102', 'A102', 'Engineering Building A', 1, 80, 'lecture', true, false),
('c1500003-0000-0000-0000-000000000003', 'Computer Lab B201', 'B201', 'Engineering Building B', 2, 40, 'lab', true, true),
('c1500004-0000-0000-0000-000000000004', 'Seminar Room C101', 'C101', 'Science Building', 1, 30, 'seminar', true, false),
('c1500005-0000-0000-0000-000000000005', 'Auditorium', 'AUD1', 'Main Building', 0, 500, 'auditorium', true, false);

-- ============================================
-- COURSES
-- ============================================
INSERT INTO courses (id, code, name, description, department_id, credits, level, is_elective) VALUES
('c0500001-0000-0000-0000-000000000001', 'CENG101', 'Introduction to Programming', 'Basic programming concepts using Python', '11111111-1111-1111-1111-111111111111', 4, 'undergraduate', false),
('c0500002-0000-0000-0000-000000000002', 'CENG201', 'Data Structures', 'Fundamental data structures and algorithms', '11111111-1111-1111-1111-111111111111', 4, 'undergraduate', false),
('c0500003-0000-0000-0000-000000000003', 'CENG301', 'Database Systems', 'Relational database design and SQL', '11111111-1111-1111-1111-111111111111', 3, 'undergraduate', false),
('c0500004-0000-0000-0000-000000000004', 'MATH101', 'Calculus I', 'Limits, derivatives, and integrals', '33333333-3333-3333-3333-333333333333', 4, 'undergraduate', false),
('c0500005-0000-0000-0000-000000000005', 'PHYS101', 'Physics I', 'Mechanics and thermodynamics', '44444444-4444-4444-4444-444444444444', 4, 'undergraduate', false);

-- ============================================
-- COURSE SECTIONS
-- ============================================
INSERT INTO course_sections (id, course_id, semester_id, section_number, instructor_id, classroom_id, capacity, enrolled_count) VALUES
('5ec00001-0000-0000-0000-000000000001', 'c0500001-0000-0000-0000-000000000001', 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', '01', 'fac00001-0000-0000-0000-000000000001', 'c1500001-0000-0000-0000-000000000001', 100, 5),
('5ec00002-0000-0000-0000-000000000002', 'c0500002-0000-0000-0000-000000000002', 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', '01', 'fac00002-0000-0000-0000-000000000002', 'c1500002-0000-0000-0000-000000000002', 80, 3),
('5ec00003-0000-0000-0000-000000000003', 'c0500003-0000-0000-0000-000000000003', 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', '01', 'fac00001-0000-0000-0000-000000000001', 'c1500003-0000-0000-0000-000000000003', 40, 2);

-- ============================================
-- SCHEDULES
-- ============================================
INSERT INTO schedules (id, section_id, classroom_id, day_of_week, start_time, end_time) VALUES
('5c000001-0000-0000-0000-000000000001', '5ec00001-0000-0000-0000-000000000001', 'c1500001-0000-0000-0000-000000000001', 'monday', '09:00', '10:50'),
('5c000002-0000-0000-0000-000000000002', '5ec00001-0000-0000-0000-000000000001', 'c1500001-0000-0000-0000-000000000001', 'wednesday', '09:00', '10:50'),
('5c000003-0000-0000-0000-000000000003', '5ec00002-0000-0000-0000-000000000002', 'c1500002-0000-0000-0000-000000000002', 'tuesday', '11:00', '12:50'),
('5c000004-0000-0000-0000-000000000004', '5ec00002-0000-0000-0000-000000000002', 'c1500002-0000-0000-0000-000000000002', 'thursday', '11:00', '12:50');

-- ============================================
-- ENROLLMENTS
-- ============================================
INSERT INTO enrollments (id, student_id, section_id, status, enrolled_at) VALUES
('e0000001-0000-0000-0000-000000000001', '51000001-0000-0000-0000-000000000001', '5ec00001-0000-0000-0000-000000000001', 'enrolled', CURRENT_TIMESTAMP),
('e0000002-0000-0000-0000-000000000002', '51000002-0000-0000-0000-000000000002', '5ec00001-0000-0000-0000-000000000001', 'enrolled', CURRENT_TIMESTAMP),
('e0000003-0000-0000-0000-000000000003', '51000003-0000-0000-0000-000000000003', '5ec00001-0000-0000-0000-000000000001', 'enrolled', CURRENT_TIMESTAMP),
('e0000004-0000-0000-0000-000000000004', '51000001-0000-0000-0000-000000000001', '5ec00002-0000-0000-0000-000000000002', 'enrolled', CURRENT_TIMESTAMP),
('e0000005-0000-0000-0000-000000000005', '51000002-0000-0000-0000-000000000002', '5ec00002-0000-0000-0000-000000000002', 'enrolled', CURRENT_TIMESTAMP);

-- ============================================
-- WALLETS
-- ============================================
INSERT INTO wallets (id, user_id, balance, currency) VALUES
('0a100001-0000-0000-0000-000000000001', '50000001-0000-0000-0000-000000000001', 500.00, 'TRY'),
('0a100002-0000-0000-0000-000000000002', '50000002-0000-0000-0000-000000000002', 750.00, 'TRY'),
('0a100003-0000-0000-0000-000000000003', '50000003-0000-0000-0000-000000000003', 300.00, 'TRY'),
('0a100004-0000-0000-0000-000000000004', '50000004-0000-0000-0000-000000000004', 1000.00, 'TRY'),
('0a100005-0000-0000-0000-000000000005', '50000005-0000-0000-0000-000000000005', 450.00, 'TRY');

-- ============================================
-- MEAL MENUS
-- ============================================
INSERT INTO meal_menus (id, menu_date, meal_type, menu_items, price, student_price, cafeteria_location) VALUES
('ae000001-0000-0000-0000-000000000001', CURRENT_DATE, 'lunch', '["Grilled Chicken", "Rice Pilaf", "Salad", "Soup"]', 50.00, 25.00, 'Main Cafeteria'),
('ae000002-0000-0000-0000-000000000002', CURRENT_DATE, 'dinner', '["Pasta", "Meatballs", "Vegetables", "Dessert"]', 55.00, 30.00, 'Main Cafeteria'),
('ae000003-0000-0000-0000-000000000003', CURRENT_DATE + 1, 'lunch', '["Fish", "Potatoes", "Salad", "Soup"]', 60.00, 35.00, 'Main Cafeteria');

-- ============================================
-- EVENTS
-- ============================================
INSERT INTO events (id, title, description, event_type, organizer_id, department_id, location, start_datetime, end_datetime, capacity, status, is_free) VALUES
('e0100001-0000-0000-0000-000000000001', 'Welcome Week Orientation', 'Introduction to campus life and resources', 'social', 'a0000001-0000-0000-0000-000000000001', NULL, 'Main Auditorium', CURRENT_TIMESTAMP + INTERVAL '7 days', CURRENT_TIMESTAMP + INTERVAL '7 days' + INTERVAL '3 hours', 500, 'published', true),
('e0100002-0000-0000-0000-000000000002', 'AI Workshop', 'Introduction to Machine Learning', 'workshop', 'f0000001-0000-0000-0000-000000000001', '11111111-1111-1111-1111-111111111111', 'Computer Lab B201', CURRENT_TIMESTAMP + INTERVAL '14 days', CURRENT_TIMESTAMP + INTERVAL '14 days' + INTERVAL '4 hours', 40, 'published', true),
('e0100003-0000-0000-0000-000000000003', 'Career Fair 2025', 'Meet top employers', 'conference', 'a0000001-0000-0000-0000-000000000001', NULL, 'Sports Complex', CURRENT_TIMESTAMP + INTERVAL '30 days', CURRENT_TIMESTAMP + INTERVAL '30 days' + INTERVAL '8 hours', 1000, 'published', true);

-- ============================================
-- CLUBS
-- ============================================
INSERT INTO clubs (id, name, description, category, advisor_id, is_active, is_recruiting) VALUES
('c1000001-0000-0000-0000-000000000001', 'Computer Science Club', 'Exploring latest trends in CS', 'technical', 'fac00001-0000-0000-0000-000000000001', true, true),
('c1000002-0000-0000-0000-000000000002', 'Robotics Club', 'Building and programming robots', 'technical', 'fac00003-0000-0000-0000-000000000003', true, true),
('c1000003-0000-0000-0000-000000000003', 'Photography Club', 'Capturing campus life', 'cultural', NULL, true, true);

-- ============================================
-- IOT SENSORS
-- ============================================
INSERT INTO iot_sensors (id, sensor_code, name, type, classroom_id, building, is_active) VALUES
('5e000001-0000-0000-0000-000000000001', 'TEMP-A101-01', 'Temperature Sensor A101', 'temperature', 'c1500001-0000-0000-0000-000000000001', 'Engineering Building A', true),
('5e000002-0000-0000-0000-000000000002', 'OCC-A101-01', 'Occupancy Sensor A101', 'occupancy', 'c1500001-0000-0000-0000-000000000001', 'Engineering Building A', true),
('5e000003-0000-0000-0000-000000000003', 'TEMP-B201-01', 'Temperature Sensor B201', 'temperature', 'c1500003-0000-0000-0000-000000000003', 'Engineering Building B', true);

-- ============================================
-- NOTIFICATION PREFERENCES (Default for all users)
-- ============================================
INSERT INTO notification_preferences (user_id, email_enabled, push_enabled, academic_notifications, event_notifications)
SELECT id, true, true, true, true FROM users WHERE deleted_at IS NULL;

-- ============================================
-- ACADEMIC CALENDAR
-- ============================================
INSERT INTO academic_calendar (semester_id, title, event_type, start_date, end_date, is_holiday) VALUES
('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 'Spring Semester Start', 'registration', '2025-02-10', '2025-02-10', false),
('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 'Add/Drop Deadline', 'deadline', '2025-02-24', '2025-02-24', false),
('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 'Midterm Exams', 'exam_period', '2025-04-07', '2025-04-18', false),
('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 'Spring Break', 'holiday', '2025-04-21', '2025-04-25', true),
('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 'Final Exams', 'exam_period', '2025-05-26', '2025-06-06', false);

-- ============================================
-- ATTENDANCE SESSIONS (Sample)
-- ============================================
INSERT INTO attendance_sessions (id, section_id, classroom_id, session_date, start_time, end_time, session_type, topic, is_mandatory, is_completed, total_students, present_count) VALUES
('a5500001-0000-0000-0000-000000000001', '5ec00001-0000-0000-0000-000000000001', 'c1500001-0000-0000-0000-000000000001', CURRENT_DATE - 7, '09:00', '10:50', 'lecture', 'Introduction to Python', true, true, 5, 4),
('a5500002-0000-0000-0000-000000000002', '5ec00001-0000-0000-0000-000000000001', 'c1500001-0000-0000-0000-000000000001', CURRENT_DATE - 5, '09:00', '10:50', 'lecture', 'Variables and Data Types', true, true, 5, 5);

-- ============================================
-- ATTENDANCE RECORDS (Sample)
-- ============================================
INSERT INTO attendance_records (id, session_id, student_id, status, check_in_time, check_in_method) VALUES
('a0500001-0000-0000-0000-000000000001', 'a5500001-0000-0000-0000-000000000001', '51000001-0000-0000-0000-000000000001', 'present', CURRENT_TIMESTAMP - INTERVAL '7 days', 'qr'),
('a0500002-0000-0000-0000-000000000002', 'a5500001-0000-0000-0000-000000000001', '51000002-0000-0000-0000-000000000002', 'present', CURRENT_TIMESTAMP - INTERVAL '7 days', 'qr'),
('a0500003-0000-0000-0000-000000000003', 'a5500001-0000-0000-0000-000000000001', '51000003-0000-0000-0000-000000000003', 'late', CURRENT_TIMESTAMP - INTERVAL '7 days', 'manual'),
('a0500004-0000-0000-0000-000000000004', 'a5500002-0000-0000-0000-000000000002', '51000001-0000-0000-0000-000000000001', 'present', CURRENT_TIMESTAMP - INTERVAL '5 days', 'qr'),
('a0500005-0000-0000-0000-000000000005', 'a5500002-0000-0000-0000-000000000002', '51000002-0000-0000-0000-000000000002', 'present', CURRENT_TIMESTAMP - INTERVAL '5 days', 'qr');

-- ============================================
-- LIBRARY BOOKS (Sample)
-- ============================================
INSERT INTO library_books (id, isbn, title, authors, publisher, publication_year, category, total_copies, available_copies, location, department_id) VALUES
('1b000001-0000-0000-0000-000000000001', '978-0134685991', 'Effective Java', ARRAY['Joshua Bloch'], 'Addison-Wesley', 2018, 'Programming', 5, 3, 'CS-101', '11111111-1111-1111-1111-111111111111'),
('1b000002-0000-0000-0000-000000000002', '978-0201633610', 'Design Patterns', ARRAY['Erich Gamma', 'Richard Helm', 'Ralph Johnson', 'John Vlissides'], 'Addison-Wesley', 1994, 'Software Engineering', 3, 2, 'CS-102', '11111111-1111-1111-1111-111111111111'),
('1b000003-0000-0000-0000-000000000003', '978-0262033848', 'Introduction to Algorithms', ARRAY['Thomas H. Cormen', 'Charles E. Leiserson'], 'MIT Press', 2009, 'Algorithms', 4, 4, 'CS-103', '11111111-1111-1111-1111-111111111111');

-- ============================================
-- ANNOUNCEMENTS (Sample)
-- ============================================
INSERT INTO announcements (id, title, content, author_id, department_id, priority, is_pinned, is_published, published_at) VALUES
('a0c00001-0000-0000-0000-000000000001', 'Welcome to Spring 2025 Semester', 'We are excited to welcome all students to the new semester. Please check your schedules and make sure you have registered for all required courses.', 'a0000001-0000-0000-0000-000000000001', NULL, 5, true, true, CURRENT_TIMESTAMP),
('a0c00002-0000-0000-0000-000000000002', 'Library Hours Extended', 'The library will be open until midnight during the exam period (April 7-18 and May 26-June 6).', 'a0000001-0000-0000-0000-000000000001', NULL, 3, false, true, CURRENT_TIMESTAMP);

-- ============================================
-- END OF SEED DATA
-- ============================================
