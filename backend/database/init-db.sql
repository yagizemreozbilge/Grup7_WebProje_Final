-- ============================================
-- Campus Management System - Database Initialization Script
-- Run this script to set up the complete database
-- ============================================

-- Drop database if exists and recreate (optional - comment out if not needed)
-- DROP DATABASE IF EXISTS campus_db;
-- CREATE DATABASE campus_db;

-- Connect to database
\c campus_db;

-- Start transaction
BEGIN;

-- ============================================
-- 1. Enable Extensions
-- ============================================
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ============================================
-- 2. Load Schema
-- ============================================
\echo 'Loading schema...'
\i schema.sql

-- ============================================
-- 3. Load Seed Data
-- ============================================
\echo 'Loading seed data...'
\i seed.sql

-- ============================================
-- 4. Verify Installation
-- ============================================
\echo '============================================'
\echo 'Database Installation Summary'
\echo '============================================'

-- Count all tables
SELECT 'Total Tables: ' || COUNT(*) as summary
FROM information_schema.tables 
WHERE table_schema = 'public' AND table_type = 'BASE TABLE';

-- Count all views
SELECT 'Total Views: ' || COUNT(*) as summary
FROM information_schema.views 
WHERE table_schema = 'public';

-- Count all indexes
SELECT 'Total Indexes: ' || COUNT(*) as summary
FROM pg_indexes 
WHERE schemaname = 'public';

-- Count all triggers
SELECT 'Total Triggers: ' || COUNT(*) as summary
FROM information_schema.triggers 
WHERE trigger_schema = 'public';

-- Count all functions
SELECT 'Total Functions: ' || COUNT(*) as summary
FROM information_schema.routines 
WHERE routine_schema = 'public';

\echo '============================================'
\echo 'Sample Data Counts'
\echo '============================================'

SELECT 'Departments: ' || COUNT(*) FROM departments;
SELECT 'Users: ' || COUNT(*) FROM users;
SELECT 'Students: ' || COUNT(*) FROM students;
SELECT 'Faculty: ' || COUNT(*) FROM faculty;
SELECT 'Courses: ' || COUNT(*) FROM courses;
SELECT 'Course Sections: ' || COUNT(*) FROM course_sections;
SELECT 'Classrooms: ' || COUNT(*) FROM classrooms;
SELECT 'Events: ' || COUNT(*) FROM events;
SELECT 'Clubs: ' || COUNT(*) FROM clubs;

-- Commit transaction
COMMIT;

\echo '============================================'
\echo 'Database initialization completed successfully!'
\echo '============================================'

