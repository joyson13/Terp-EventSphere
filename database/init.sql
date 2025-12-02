-- Terp EventSphere Database Schema
-- This file initializes all tables and relationships

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================
-- USER TABLES (Inheritance Pattern)
-- ============================================

-- Base User table
CREATE TABLE IF NOT EXISTS users (
    user_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email VARCHAR(255) UNIQUE NOT NULL,
    name VARCHAR(255) NOT NULL,
    role VARCHAR(50) NOT NULL CHECK (role IN ('participant', 'event_organizer', 'administrator')),
    hashed_password VARCHAR(255) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    deleted_at TIMESTAMP NULL,
    CONSTRAINT users_email_unique UNIQUE (email)
);

-- Participant table (inherits from User)
CREATE TABLE IF NOT EXISTS participants (
    user_id UUID PRIMARY KEY REFERENCES users(user_id) ON DELETE CASCADE,
    passport_id UUID UNIQUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    deleted_at TIMESTAMP NULL
);

-- Event Organizer table (inherits from User)
CREATE TABLE IF NOT EXISTS event_organizers (
    user_id UUID PRIMARY KEY REFERENCES users(user_id) ON DELETE CASCADE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    deleted_at TIMESTAMP NULL
);

-- Administrator table (inherits from User)
CREATE TABLE IF NOT EXISTS administrators (
    user_id UUID PRIMARY KEY REFERENCES users(user_id) ON DELETE CASCADE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    deleted_at TIMESTAMP NULL
);

-- Password Reset Tokens table
CREATE TABLE IF NOT EXISTS password_reset_tokens (
    id SERIAL PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
    token UUID NOT NULL UNIQUE,
    expires_at TIMESTAMP NOT NULL,
    used BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT unique_active_token UNIQUE (user_id, token)
);

-- ============================================
-- EVENT TABLES
-- ============================================

-- Events table
CREATE TABLE IF NOT EXISTS events (
    event_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organizer_id UUID NOT NULL REFERENCES event_organizers(user_id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    location VARCHAR(255) NOT NULL,
    capacity INTEGER NOT NULL CHECK (capacity > 0),
    status VARCHAR(50) NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'published', 'cancelled', 'completed')),
    start_time TIMESTAMP NOT NULL,
    description TEXT,
    waitlist_enabled BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    deleted_at TIMESTAMP NULL
);

-- ============================================
-- REGISTRATION TABLES (Association Classes)
-- ============================================

-- Registrations table (Association between Participant and Event)
CREATE TABLE IF NOT EXISTS registrations (
    registration_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    participant_id UUID NOT NULL REFERENCES participants(user_id) ON DELETE CASCADE,
    event_id UUID NOT NULL REFERENCES events(event_id) ON DELETE CASCADE,
    status VARCHAR(50) NOT NULL DEFAULT 'initializing' CHECK (status IN ('initializing', 'confirmed', 'waitlisted', 'attended', 'cancelled_by_user', 'cancelled_by_event')),
    qr_code_data TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    deleted_at TIMESTAMP NULL,
    CONSTRAINT unique_participant_event_registration UNIQUE (participant_id, event_id)
);

-- Waitlist Entries table (Association between Participant and Event)
CREATE TABLE IF NOT EXISTS waitlist_entries (
    entry_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    participant_id UUID NOT NULL REFERENCES participants(user_id) ON DELETE CASCADE,
    event_id UUID NOT NULL REFERENCES events(event_id) ON DELETE CASCADE,
    added_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    deleted_at TIMESTAMP NULL,
    CONSTRAINT unique_participant_event_waitlist UNIQUE (participant_id, event_id)
);

-- ============================================
-- PASSPORT & BADGES TABLES
-- ============================================

-- Terrapin Passport table
CREATE TABLE IF NOT EXISTS terrapin_passports (
    passport_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    participant_id UUID NOT NULL UNIQUE REFERENCES participants(user_id) ON DELETE CASCADE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    deleted_at TIMESTAMP NULL
);

-- Update participants table to reference passport
-- Use DO block to check if constraint exists before adding
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint 
        WHERE conname = 'fk_participant_passport'
    ) THEN
        ALTER TABLE participants 
            ADD CONSTRAINT fk_participant_passport 
            FOREIGN KEY (passport_id) REFERENCES terrapin_passports(passport_id) ON DELETE SET NULL;
    END IF;
END $$;

-- Badges table
CREATE TABLE IF NOT EXISTS badges (
    badge_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    passport_id UUID NOT NULL REFERENCES terrapin_passports(passport_id) ON DELETE CASCADE,
    event_id UUID NOT NULL REFERENCES events(event_id) ON DELETE CASCADE,
    event_name VARCHAR(255) NOT NULL,
    date_earned TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    deleted_at TIMESTAMP NULL
);

-- ============================================
-- INDEXES FOR PERFORMANCE
-- ============================================

-- User indexes
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_users_role ON users(role) WHERE deleted_at IS NULL;

-- Event indexes
CREATE INDEX IF NOT EXISTS idx_events_organizer ON events(organizer_id) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_events_status ON events(status) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_events_start_time ON events(start_time) WHERE deleted_at IS NULL;

-- Registration indexes
CREATE INDEX IF NOT EXISTS idx_registrations_participant ON registrations(participant_id) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_registrations_event ON registrations(event_id) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_registrations_status ON registrations(status) WHERE deleted_at IS NULL;

-- Waitlist indexes
CREATE INDEX IF NOT EXISTS idx_waitlist_participant ON waitlist_entries(participant_id) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_waitlist_event ON waitlist_entries(event_id) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_waitlist_added_at ON waitlist_entries(added_at) WHERE deleted_at IS NULL;

-- Badge indexes
CREATE INDEX IF NOT EXISTS idx_badges_passport ON badges(passport_id) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_badges_event ON badges(event_id) WHERE deleted_at IS NULL;

-- Password reset token indexes
CREATE INDEX IF NOT EXISTS idx_password_reset_tokens_user ON password_reset_tokens(user_id);
CREATE INDEX IF NOT EXISTS idx_password_reset_tokens_token ON password_reset_tokens(token) WHERE used = false;

-- ============================================
-- NOTIFICATIONS TABLE
-- ============================================

-- Notifications table
CREATE TABLE IF NOT EXISTS notifications (
    notification_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
    type VARCHAR(50) NOT NULL CHECK (type IN ('registration_confirmed', 'waitlist_confirmed', 'waitlist_success', 'event_cancelled', 'event_updated', 'event_published', 'registration_cancelled')),
    title VARCHAR(255) NOT NULL,
    message TEXT NOT NULL,
    event_id UUID REFERENCES events(event_id) ON DELETE SET NULL,
    read BOOLEAN NOT NULL DEFAULT false,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    deleted_at TIMESTAMP NULL
);

-- Notification indexes
CREATE INDEX IF NOT EXISTS idx_notifications_user ON notifications(user_id) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_notifications_read ON notifications(read) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_notifications_created_at ON notifications(created_at DESC) WHERE deleted_at IS NULL;

-- ============================================
-- FEEDBACK TABLE
-- ============================================

-- Event feedback table
CREATE TABLE IF NOT EXISTS event_feedback (
    feedback_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    event_id UUID NOT NULL REFERENCES events(event_id) ON DELETE CASCADE,
    participant_id UUID NOT NULL REFERENCES participants(user_id) ON DELETE CASCADE,
    rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
    comment TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    deleted_at TIMESTAMP NULL,
    CONSTRAINT unique_participant_event_feedback UNIQUE (participant_id, event_id)
);

-- Feedback indexes
CREATE INDEX IF NOT EXISTS idx_feedback_event ON event_feedback(event_id) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_feedback_participant ON event_feedback(participant_id) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_feedback_rating ON event_feedback(rating) WHERE deleted_at IS NULL;

-- Feedback updated_at trigger
CREATE TRIGGER update_event_feedback_updated_at BEFORE UPDATE ON event_feedback
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- TRIGGERS FOR UPDATED_AT
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
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_participants_updated_at BEFORE UPDATE ON participants
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_event_organizers_updated_at BEFORE UPDATE ON event_organizers
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_administrators_updated_at BEFORE UPDATE ON administrators
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_events_updated_at BEFORE UPDATE ON events
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_registrations_updated_at BEFORE UPDATE ON registrations
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_terrapin_passports_updated_at BEFORE UPDATE ON terrapin_passports
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

