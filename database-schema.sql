-- TinkyBink Connect Pro Suite - MySQL Database Schema
-- Compatible with Bluehost MySQL hosting

-- Users and Authentication
CREATE TABLE users (
    id VARCHAR(36) PRIMARY KEY DEFAULT (UUID()),
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255),
    first_name VARCHAR(100),
    last_name VARCHAR(100),
    role ENUM('patient', 'therapist', 'admin', 'clinic_admin') DEFAULT 'patient',
    subscription_tier ENUM('free', 'professional', 'enterprise') DEFAULT 'free',
    subscription_status ENUM('active', 'cancelled', 'past_due', 'trialing') DEFAULT 'active',
    stripe_customer_id VARCHAR(100),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    last_login TIMESTAMP,
    email_verified BOOLEAN DEFAULT FALSE,
    phone VARCHAR(20),
    timezone VARCHAR(50) DEFAULT 'America/New_York',
    preferences JSON,
    INDEX idx_email (email),
    INDEX idx_role (role),
    INDEX idx_subscription (subscription_tier, subscription_status)
);

-- Therapist Profiles and Directory
CREATE TABLE therapist_profiles (
    id VARCHAR(36) PRIMARY KEY DEFAULT (UUID()),
    user_id VARCHAR(36) NOT NULL,
    npi_number VARCHAR(10) UNIQUE,
    license_number VARCHAR(50),
    license_state VARCHAR(2),
    practice_name VARCHAR(200),
    specializations JSON, -- Array of specialization areas
    bio TEXT,
    experience_years INT,
    education JSON, -- Array of education credentials
    certifications JSON, -- Array of certifications
    languages_spoken JSON, -- Array of languages
    
    -- Contact Information
    business_phone VARCHAR(20),
    business_email VARCHAR(255),
    website VARCHAR(255),
    
    -- Address
    street_address VARCHAR(255),
    city VARCHAR(100),
    state VARCHAR(2),
    zip_code VARCHAR(10),
    latitude DECIMAL(10, 8),
    longitude DECIMAL(11, 8),
    
    -- Directory Listing
    accepts_new_patients BOOLEAN DEFAULT TRUE,
    offers_telehealth BOOLEAN DEFAULT FALSE,
    insurance_accepted JSON, -- Array of insurance types
    hourly_rate_min DECIMAL(6,2),
    hourly_rate_max DECIMAL(6,2),
    
    -- Reviews and Ratings
    average_rating DECIMAL(3,2) DEFAULT 0.00,
    total_reviews INT DEFAULT 0,
    
    -- Professional Status
    is_verified BOOLEAN DEFAULT FALSE,
    verification_date TIMESTAMP NULL,
    pecos_enrolled BOOLEAN DEFAULT FALSE,
    
    -- Marketplace Participation
    accepts_leads BOOLEAN DEFAULT TRUE,
    lead_budget_monthly DECIMAL(8,2) DEFAULT 0.00,
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_npi (npi_number),
    INDEX idx_location (latitude, longitude),
    INDEX idx_specializations ((CAST(specializations AS CHAR(255) ARRAY))),
    INDEX idx_verified (is_verified),
    INDEX idx_accepts_leads (accepts_leads)
);

-- Lead Marketplace System
CREATE TABLE leads (
    id VARCHAR(36) PRIMARY KEY DEFAULT (UUID()),
    
    -- Lead Source (from AAC app)
    source_type ENUM('aac_app', 'directory_inquiry', 'referral') DEFAULT 'aac_app',
    source_user_id VARCHAR(36), -- Original AAC user
    
    -- Patient/Family Information
    patient_age INT,
    patient_diagnosis VARCHAR(200),
    communication_needs JSON, -- Array of specific needs
    urgency_level ENUM('low', 'medium', 'high', 'urgent') DEFAULT 'medium',
    
    -- Contact Information
    contact_name VARCHAR(200),
    contact_email VARCHAR(255),
    contact_phone VARCHAR(20),
    preferred_contact_method ENUM('email', 'phone', 'text') DEFAULT 'email',
    
    -- Location and Preferences
    zip_code VARCHAR(10),
    max_distance_miles INT DEFAULT 25,
    preferred_session_type ENUM('in_person', 'telehealth', 'both') DEFAULT 'both',
    insurance_type VARCHAR(100),
    budget_range VARCHAR(50),
    
    -- Lead Scoring and Pricing
    ai_quality_score DECIMAL(3,2) DEFAULT 0.00,
    estimated_value DECIMAL(8,2),
    base_price DECIMAL(6,2),
    current_price DECIMAL(6,2),
    
    -- Lead Status
    status ENUM('active', 'matched', 'closed', 'expired') DEFAULT 'active',
    expires_at TIMESTAMP,
    
    -- Matching Results
    matched_therapists JSON, -- Array of therapist IDs and scores
    total_matches INT DEFAULT 0,
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    INDEX idx_status (status),
    INDEX idx_location (zip_code),
    INDEX idx_urgency (urgency_level),
    INDEX idx_expires (expires_at),
    INDEX idx_source (source_type, source_user_id)
);

-- Lead Purchase Tracking
CREATE TABLE lead_purchases (
    id VARCHAR(36) PRIMARY KEY DEFAULT (UUID()),
    lead_id VARCHAR(36) NOT NULL,
    therapist_id VARCHAR(36) NOT NULL,
    purchase_price DECIMAL(6,2) NOT NULL,
    stripe_payment_intent VARCHAR(255),
    
    -- Contact Information Revealed
    contact_info_revealed BOOLEAN DEFAULT FALSE,
    revealed_at TIMESTAMP NULL,
    
    -- Follow-up Tracking
    initial_contact_made BOOLEAN DEFAULT FALSE,
    contact_made_at TIMESTAMP NULL,
    appointment_scheduled BOOLEAN DEFAULT FALSE,
    appointment_date TIMESTAMP NULL,
    conversion_successful BOOLEAN DEFAULT FALSE,
    
    -- Performance Metrics
    response_time_minutes INT,
    outcome ENUM('no_contact', 'contacted', 'scheduled', 'converted', 'declined') DEFAULT 'no_contact',
    outcome_date TIMESTAMP NULL,
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    FOREIGN KEY (lead_id) REFERENCES leads(id) ON DELETE CASCADE,
    FOREIGN KEY (therapist_id) REFERENCES therapist_profiles(id) ON DELETE CASCADE,
    UNIQUE KEY unique_lead_therapist (lead_id, therapist_id),
    INDEX idx_therapist (therapist_id),
    INDEX idx_outcome (outcome),
    INDEX idx_conversion (conversion_successful)
);

-- Billing and CPT Code Management
CREATE TABLE billing_sessions (
    id VARCHAR(36) PRIMARY KEY DEFAULT (UUID()),
    therapist_id VARCHAR(36) NOT NULL,
    patient_id VARCHAR(36),
    
    -- Session Details
    session_date DATE NOT NULL,
    start_time TIME NOT NULL,
    end_time TIME NOT NULL,
    duration_minutes INT NOT NULL,
    session_type ENUM('individual', 'group', 'evaluation', 'consultation') DEFAULT 'individual',
    modality ENUM('in_person', 'telehealth') DEFAULT 'in_person',
    
    -- CPT Coding
    primary_cpt_code VARCHAR(10) NOT NULL,
    secondary_cpt_codes JSON, -- Array of additional codes
    diagnosis_codes JSON, -- Array of ICD-10 codes
    
    -- Documentation
    soap_notes TEXT,
    auto_generated_notes TEXT,
    session_objectives JSON,
    progress_notes TEXT,
    homework_assigned TEXT,
    
    -- Billing Information
    fee_amount DECIMAL(8,2),
    insurance_claim_id VARCHAR(50),
    claim_status ENUM('draft', 'submitted', 'processing', 'paid', 'denied', 'appealed') DEFAULT 'draft',
    payment_received DECIMAL(8,2) DEFAULT 0.00,
    patient_copay DECIMAL(6,2) DEFAULT 0.00,
    
    -- AI Insights
    breakthrough_prediction_score DECIMAL(3,2),
    engagement_score DECIMAL(3,2),
    progress_indicators JSON,
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    FOREIGN KEY (therapist_id) REFERENCES therapist_profiles(id) ON DELETE CASCADE,
    INDEX idx_therapist_date (therapist_id, session_date),
    INDEX idx_claim_status (claim_status),
    INDEX idx_session_date (session_date),
    INDEX idx_cpt_code (primary_cpt_code)
);

-- Smart Scheduling System
CREATE TABLE appointments (
    id VARCHAR(36) PRIMARY KEY DEFAULT (UUID()),
    therapist_id VARCHAR(36) NOT NULL,
    patient_id VARCHAR(36),
    
    -- Appointment Details
    scheduled_date DATE NOT NULL,
    scheduled_time TIME NOT NULL,
    duration_minutes INT DEFAULT 60,
    appointment_type ENUM('evaluation', 'therapy', 'follow_up', 'consultation') DEFAULT 'therapy',
    modality ENUM('in_person', 'telehealth') DEFAULT 'in_person',
    
    -- Status Tracking
    status ENUM('scheduled', 'confirmed', 'arrived', 'in_progress', 'completed', 'cancelled', 'no_show') DEFAULT 'scheduled',
    confirmation_sent BOOLEAN DEFAULT FALSE,
    reminder_sent BOOLEAN DEFAULT FALSE,
    
    -- Calendar Integration
    google_event_id VARCHAR(255),
    outlook_event_id VARCHAR(255),
    apple_event_id VARCHAR(255),
    calendar_sync_status ENUM('synced', 'pending', 'failed') DEFAULT 'pending',
    
    -- AI Optimization Data
    optimal_slot_score DECIMAL(3,2),
    predicted_attendance DECIMAL(3,2),
    rescheduling_flexibility ENUM('low', 'medium', 'high') DEFAULT 'medium',
    
    -- Notes and Special Instructions
    appointment_notes TEXT,
    special_instructions TEXT,
    cancellation_reason TEXT,
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    FOREIGN KEY (therapist_id) REFERENCES therapist_profiles(id) ON DELETE CASCADE,
    INDEX idx_therapist_date (therapist_id, scheduled_date),
    INDEX idx_status (status),
    INDEX idx_date_time (scheduled_date, scheduled_time)
);

-- Enterprise Clinic Management
CREATE TABLE clinics (
    id VARCHAR(36) PRIMARY KEY DEFAULT (UUID()),
    
    -- Clinic Information
    name VARCHAR(200) NOT NULL,
    tax_id VARCHAR(20),
    npi_number VARCHAR(10),
    
    -- Contact Information
    email VARCHAR(255),
    phone VARCHAR(20),
    website VARCHAR(255),
    
    -- Address
    street_address VARCHAR(255),
    city VARCHAR(100),
    state VARCHAR(2),
    zip_code VARCHAR(10),
    
    -- Subscription and Billing
    subscription_tier ENUM('professional', 'enterprise') DEFAULT 'enterprise',
    monthly_fee DECIMAL(8,2),
    billing_cycle_start DATE,
    stripe_subscription_id VARCHAR(255),
    
    -- Settings
    clinic_settings JSON,
    compliance_settings JSON,
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    INDEX idx_npi (npi_number),
    INDEX idx_subscription (subscription_tier)
);

-- Clinic-Therapist Relationships
CREATE TABLE clinic_therapists (
    id VARCHAR(36) PRIMARY KEY DEFAULT (UUID()),
    clinic_id VARCHAR(36) NOT NULL,
    therapist_id VARCHAR(36) NOT NULL,
    role ENUM('owner', 'administrator', 'therapist', 'contractor') DEFAULT 'therapist',
    employment_type ENUM('employee', 'contractor', 'partner') DEFAULT 'employee',
    hire_date DATE,
    hourly_rate DECIMAL(6,2),
    commission_rate DECIMAL(3,2),
    
    -- Permissions
    can_manage_billing BOOLEAN DEFAULT FALSE,
    can_manage_scheduling BOOLEAN DEFAULT FALSE,
    can_view_reports BOOLEAN DEFAULT FALSE,
    can_manage_staff BOOLEAN DEFAULT FALSE,
    
    -- Status
    status ENUM('active', 'inactive', 'on_leave') DEFAULT 'active',
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    FOREIGN KEY (clinic_id) REFERENCES clinics(id) ON DELETE CASCADE,
    FOREIGN KEY (therapist_id) REFERENCES therapist_profiles(id) ON DELETE CASCADE,
    UNIQUE KEY unique_clinic_therapist (clinic_id, therapist_id),
    INDEX idx_clinic (clinic_id),
    INDEX idx_role (role)
);

-- Reviews and Ratings
CREATE TABLE therapist_reviews (
    id VARCHAR(36) PRIMARY KEY DEFAULT (UUID()),
    therapist_id VARCHAR(36) NOT NULL,
    reviewer_id VARCHAR(36), -- Can be anonymous
    
    -- Review Content
    rating INT NOT NULL CHECK (rating >= 1 AND rating <= 5),
    title VARCHAR(200),
    review_text TEXT,
    
    -- Review Categories
    communication_rating INT CHECK (communication_rating >= 1 AND communication_rating <= 5),
    professionalism_rating INT CHECK (professionalism_rating >= 1 AND professionalism_rating <= 5),
    effectiveness_rating INT CHECK (effectiveness_rating >= 1 AND effectiveness_rating <= 5),
    
    -- Verification
    verified_patient BOOLEAN DEFAULT FALSE,
    verification_method ENUM('email', 'phone', 'appointment_history') NULL,
    
    -- Moderation
    status ENUM('pending', 'approved', 'rejected', 'flagged') DEFAULT 'pending',
    moderated_by VARCHAR(36) NULL,
    moderated_at TIMESTAMP NULL,
    
    -- Helpful Votes
    helpful_votes INT DEFAULT 0,
    total_votes INT DEFAULT 0,
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    FOREIGN KEY (therapist_id) REFERENCES therapist_profiles(id) ON DELETE CASCADE,
    INDEX idx_therapist (therapist_id),
    INDEX idx_rating (rating),
    INDEX idx_status (status)
);

-- Analytics and Reporting
CREATE TABLE revenue_tracking (
    id VARCHAR(36) PRIMARY KEY DEFAULT (UUID()),
    
    -- Revenue Source
    source_type ENUM('subscription', 'lead_purchase', 'billing_toolkit', 'enterprise_features') NOT NULL,
    user_id VARCHAR(36),
    therapist_id VARCHAR(36),
    clinic_id VARCHAR(36),
    
    -- Financial Details
    amount DECIMAL(10,2) NOT NULL,
    currency VARCHAR(3) DEFAULT 'USD',
    stripe_transaction_id VARCHAR(255),
    
    -- Time Period
    revenue_date DATE NOT NULL,
    billing_period_start DATE,
    billing_period_end DATE,
    
    -- Categorization
    category VARCHAR(100),
    subcategory VARCHAR(100),
    
    -- Metrics
    customer_lifetime_value DECIMAL(10,2),
    acquisition_cost DECIMAL(8,2),
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    INDEX idx_source_type (source_type),
    INDEX idx_revenue_date (revenue_date),
    INDEX idx_user (user_id),
    INDEX idx_therapist (therapist_id)
);

-- System Configuration
CREATE TABLE system_settings (
    id VARCHAR(36) PRIMARY KEY DEFAULT (UUID()),
    setting_key VARCHAR(100) UNIQUE NOT NULL,
    setting_value JSON NOT NULL,
    setting_type ENUM('string', 'number', 'boolean', 'object', 'array') NOT NULL,
    description TEXT,
    is_public BOOLEAN DEFAULT FALSE,
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    INDEX idx_key (setting_key),
    INDEX idx_public (is_public)
);

-- Insert Default Settings
INSERT INTO system_settings (setting_key, setting_value, setting_type, description, is_public) VALUES
('lead_marketplace_enabled', 'true', 'boolean', 'Enable lead marketplace functionality', true),
('billing_toolkit_enabled', 'true', 'boolean', 'Enable billing toolkit features', true),
('enterprise_features_enabled', 'true', 'boolean', 'Enable enterprise clinic management', true),
('ai_features_enabled', 'true', 'boolean', 'Enable AI-powered features', true),
('default_lead_price', '45.00', 'number', 'Default price for marketplace leads', false),
('max_lead_matches', '5', 'number', 'Maximum therapists matched per lead', false),
('subscription_tiers', '{"free": {"price": 0, "features": ["basic_aac"]}, "professional": {"price": 25, "features": ["billing_toolkit", "lead_marketplace"]}, "enterprise": {"price": 199, "features": ["clinic_management", "advanced_analytics"]}}', 'object', 'Subscription tier configuration', true);

-- Create Indexes for Performance
CREATE INDEX idx_users_subscription ON users(subscription_tier, subscription_status);
CREATE INDEX idx_therapist_location ON therapist_profiles(latitude, longitude, accepts_leads);
CREATE INDEX idx_leads_active ON leads(status, expires_at) WHERE status = 'active';
CREATE INDEX idx_appointments_upcoming ON appointments(scheduled_date, scheduled_time, status) WHERE status IN ('scheduled', 'confirmed');
CREATE INDEX idx_billing_sessions_recent ON billing_sessions(therapist_id, session_date) WHERE session_date >= DATE_SUB(CURRENT_DATE, INTERVAL 30 DAY);

-- Performance and Maintenance Views
CREATE VIEW active_therapists AS
SELECT 
    tp.*,
    u.email,
    u.subscription_tier,
    u.subscription_status
FROM therapist_profiles tp
JOIN users u ON tp.user_id = u.id
WHERE u.subscription_status = 'active' 
AND tp.accepts_new_patients = TRUE;

CREATE VIEW lead_performance_summary AS
SELECT 
    DATE_FORMAT(created_at, '%Y-%m') as month,
    COUNT(*) as total_leads,
    AVG(ai_quality_score) as avg_quality_score,
    AVG(current_price) as avg_price,
    SUM(CASE WHEN status = 'matched' THEN 1 ELSE 0 END) as successful_matches,
    AVG(total_matches) as avg_matches_per_lead
FROM leads 
GROUP BY DATE_FORMAT(created_at, '%Y-%m')
ORDER BY month DESC;

CREATE VIEW monthly_revenue_summary AS
SELECT 
    DATE_FORMAT(revenue_date, '%Y-%m') as month,
    source_type,
    SUM(amount) as total_revenue,
    COUNT(*) as transaction_count,
    AVG(amount) as avg_transaction_value
FROM revenue_tracking 
GROUP BY DATE_FORMAT(revenue_date, '%Y-%m'), source_type
ORDER BY month DESC, source_type;