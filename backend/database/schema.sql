-- HouseCom Database Schema
-- PostgreSQL Database for Supabase (Coastal Kenya Rental Platform)
-- Target: 500k+ students/workers across Mombasa, Kilifi, Kwale, and Lamu

-- Create ENUM types
CREATE TYPE role_enum AS ENUM ('tenant', 'landlord', 'admin');
CREATE TYPE auth_provider_enum AS ENUM ('email', 'google', 'apple');
CREATE TYPE user_status_enum AS ENUM ('active', 'suspended', 'deleted');
CREATE TYPE property_type_enum AS ENUM ('bedsitter', 'single', 'double', '1br', '2br', '3br', 'studio', 'mansion');
CREATE TYPE county_enum AS ENUM ('Mombasa', 'Kilifi', 'Kwale', 'Lamu');
CREATE TYPE availability_enum AS ENUM ('available', 'occupied', 'maintenance', 'unavailable');
CREATE TYPE property_status_enum AS ENUM ('active', 'pending', 'rejected', 'deleted');
CREATE TYPE viewing_status_enum AS ENUM ('pending', 'confirmed', 'cancelled', 'completed');
CREATE TYPE payment_type_enum AS ENUM ('rent', 'deposit', 'maintenance');
CREATE TYPE payment_method_enum AS ENUM ('mpesa', 'bank', 'cash');
CREATE TYPE payment_status_enum AS ENUM ('pending', 'completed', 'failed', 'refunded');
CREATE TYPE review_status_enum AS ENUM ('pending', 'approved', 'rejected');
CREATE TYPE fraud_reason_enum AS ENUM ('fake_listing', 'fake_photos', 'scam', 'impersonation', 'other');
CREATE TYPE fraud_reported_type_enum AS ENUM ('property', 'user');
CREATE TYPE fraud_status_enum AS ENUM ('pending', 'investigating', 'resolved', 'dismissed');

-- Drop existing tables if they exist (for fresh installation)
DROP TABLE IF EXISTS fraud_reports CASCADE;
DROP TABLE IF EXISTS payment_transactions CASCADE;
DROP TABLE IF EXISTS chat_messages CASCADE;
DROP TABLE IF EXISTS property_reviews CASCADE;
DROP TABLE IF EXISTS landlord_ratings CASCADE;
DROP TABLE IF EXISTS saved_properties CASCADE;
DROP TABLE IF EXISTS viewing_requests CASCADE;
DROP TABLE IF EXISTS property_images CASCADE;
DROP TABLE IF EXISTS properties CASCADE;
DROP TABLE IF EXISTS users CASCADE;
DROP TABLE IF EXISTS matatu_routes CASCADE;

-- Drop existing views
DROP VIEW IF EXISTS property_listings CASCADE;
DROP VIEW IF EXISTS landlord_stats CASCADE;

-- Users table (Tenants, Landlords, Admins)
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255),
    full_name VARCHAR(255) NOT NULL,
    phone VARCHAR(20),
    role role_enum DEFAULT 'tenant',
    university VARCHAR(255),
    student_id VARCHAR(50),
    id_number VARCHAR(20),
    profile_image VARCHAR(500),
    verified BOOLEAN DEFAULT FALSE,
    auth_provider auth_provider_enum DEFAULT 'email',
    google_id VARCHAR(255),
    apple_id VARCHAR(255),
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    last_login TIMESTAMPTZ NULL,
    status user_status_enum DEFAULT 'active'
);

-- Create indexes for users table
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_role ON users(role);
CREATE INDEX idx_users_verified ON users(verified);

-- Properties table
CREATE TABLE properties (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    landlord_id UUID NOT NULL,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    property_type property_type_enum NOT NULL,
    price DECIMAL(10, 2) NOT NULL,
    county county_enum NOT NULL,
    location VARCHAR(255) NOT NULL,
    latitude DECIMAL(10, 8),
    longitude DECIMAL(11, 8),
    bedrooms INT NOT NULL,
    bathrooms INT NOT NULL,
    university_name VARCHAR(255),
    distance_to_uni DECIMAL(5, 2),
    beach_distance DECIMAL(5, 2),
    amenities JSONB,
    security_score DECIMAL(2, 1) DEFAULT 0,
    askari_24hr BOOLEAN DEFAULT FALSE,
    cctv BOOLEAN DEFAULT FALSE,
    fence BOOLEAN DEFAULT FALSE,
    compound_type VARCHAR(100),
    verified BOOLEAN DEFAULT FALSE,
    verification_date TIMESTAMPTZ NULL,
    verified_by UUID,
    mpesa_till_number VARCHAR(20),
    mpesa_paybill VARCHAR(20),
    availability availability_enum DEFAULT 'available',
    status property_status_enum DEFAULT 'pending',
    views_count INT DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (landlord_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Create indexes for properties table
CREATE INDEX idx_properties_landlord ON properties(landlord_id);
CREATE INDEX idx_properties_county ON properties(county);
CREATE INDEX idx_properties_price ON properties(price);
CREATE INDEX idx_properties_verified ON properties(verified);
CREATE INDEX idx_properties_availability ON properties(availability);
CREATE INDEX idx_properties_status ON properties(status);
CREATE INDEX idx_properties_location ON properties(latitude, longitude);

-- Property Images table
CREATE TABLE property_images (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    property_id UUID NOT NULL,
    image_url VARCHAR(500) NOT NULL,
    display_order INT DEFAULT 0,
    uploaded_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (property_id) REFERENCES properties(id) ON DELETE CASCADE
);

CREATE INDEX idx_property_images_property ON property_images(property_id);

-- Viewing Requests table
CREATE TABLE viewing_requests (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    property_id UUID NOT NULL,
    tenant_id UUID NOT NULL,
    requested_date DATE NOT NULL,
    requested_time TIME NOT NULL,
    status viewing_status_enum DEFAULT 'pending',
    landlord_response TEXT,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (property_id) REFERENCES properties(id) ON DELETE CASCADE,
    FOREIGN KEY (tenant_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE INDEX idx_viewing_requests_property ON viewing_requests(property_id);
CREATE INDEX idx_viewing_requests_tenant ON viewing_requests(tenant_id);
CREATE INDEX idx_viewing_requests_status ON viewing_requests(status);

-- Saved Properties table (Favorites)
CREATE TABLE saved_properties (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL,
    property_id UUID NOT NULL,
    saved_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (property_id) REFERENCES properties(id) ON DELETE CASCADE,
    UNIQUE(user_id, property_id)
);

CREATE INDEX idx_saved_properties_user ON saved_properties(user_id);
CREATE INDEX idx_saved_properties_property ON saved_properties(property_id);

-- Property Reviews table
CREATE TABLE property_reviews (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    property_id UUID NOT NULL,
    user_id UUID NOT NULL,
    rating INT NOT NULL CHECK (rating >= 1 AND rating <= 5),
    review_text TEXT,
    cleanliness_rating INT CHECK (cleanliness_rating >= 1 AND cleanliness_rating <= 5),
    security_rating INT CHECK (security_rating >= 1 AND security_rating <= 5),
    location_rating INT CHECK (location_rating >= 1 AND location_rating <= 5),
    value_rating INT CHECK (value_rating >= 1 AND value_rating <= 5),
    verified_tenant BOOLEAN DEFAULT FALSE,
    status review_status_enum DEFAULT 'pending',
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (property_id) REFERENCES properties(id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE INDEX idx_property_reviews_property ON property_reviews(property_id);
CREATE INDEX idx_property_reviews_user ON property_reviews(user_id);
CREATE INDEX idx_property_reviews_rating ON property_reviews(rating);

-- Landlord Ratings table
CREATE TABLE landlord_ratings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    landlord_id UUID NOT NULL,
    tenant_id UUID NOT NULL,
    rating INT NOT NULL CHECK (rating >= 1 AND rating <= 5),
    review_text TEXT,
    responsiveness_rating INT CHECK (responsiveness_rating >= 1 AND responsiveness_rating <= 5),
    professionalism_rating INT CHECK (professionalism_rating >= 1 AND professionalism_rating <= 5),
    maintenance_rating INT CHECK (maintenance_rating >= 1 AND maintenance_rating <= 5),
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (landlord_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (tenant_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE INDEX idx_landlord_ratings_landlord ON landlord_ratings(landlord_id);
CREATE INDEX idx_landlord_ratings_tenant ON landlord_ratings(tenant_id);

-- Chat Messages table
CREATE TABLE chat_messages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    sender_id UUID NOT NULL,
    receiver_id UUID NOT NULL,
    property_id UUID,
    message TEXT NOT NULL,
    is_read BOOLEAN DEFAULT FALSE,
    sent_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (sender_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (receiver_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (property_id) REFERENCES properties(id) ON DELETE SET NULL
);

CREATE INDEX idx_chat_messages_sender ON chat_messages(sender_id);
CREATE INDEX idx_chat_messages_receiver ON chat_messages(receiver_id);
CREATE INDEX idx_chat_messages_property ON chat_messages(property_id);
CREATE INDEX idx_chat_messages_sent_at ON chat_messages(sent_at);

-- Payment Transactions table (M-PESA)
CREATE TABLE payment_transactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    transaction_id VARCHAR(100) UNIQUE NOT NULL,
    property_id UUID NOT NULL,
    tenant_id UUID NOT NULL,
    landlord_id UUID NOT NULL,
    amount DECIMAL(10, 2) NOT NULL,
    payment_type payment_type_enum DEFAULT 'rent',
    payment_method payment_method_enum DEFAULT 'mpesa',
    mpesa_phone VARCHAR(20),
    mpesa_receipt VARCHAR(100),
    status payment_status_enum DEFAULT 'pending',
    payment_for_month DATE,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (property_id) REFERENCES properties(id) ON DELETE CASCADE,
    FOREIGN KEY (tenant_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (landlord_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE INDEX idx_payment_transactions_id ON payment_transactions(transaction_id);
CREATE INDEX idx_payment_transactions_property ON payment_transactions(property_id);
CREATE INDEX idx_payment_transactions_tenant ON payment_transactions(tenant_id);
CREATE INDEX idx_payment_transactions_landlord ON payment_transactions(landlord_id);
CREATE INDEX idx_payment_transactions_status ON payment_transactions(status);

-- Fraud Reports table
CREATE TABLE fraud_reports (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    reporter_id UUID NOT NULL,
    reported_type fraud_reported_type_enum NOT NULL,
    reported_property_id UUID,
    reported_user_id UUID,
    reason fraud_reason_enum NOT NULL,
    description TEXT,
    evidence_urls JSONB,
    status fraud_status_enum DEFAULT 'pending',
    admin_notes TEXT,
    resolved_by UUID,
    resolved_at TIMESTAMPTZ NULL,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (reporter_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (reported_property_id) REFERENCES properties(id) ON DELETE SET NULL,
    FOREIGN KEY (reported_user_id) REFERENCES users(id) ON DELETE SET NULL
);

CREATE INDEX idx_fraud_reports_reporter ON fraud_reports(reporter_id);
CREATE INDEX idx_fraud_reports_property ON fraud_reports(reported_property_id);
CREATE INDEX idx_fraud_reports_user ON fraud_reports(reported_user_id);
CREATE INDEX idx_fraud_reports_status ON fraud_reports(status);

-- Matatu Routes table (Static data for coastal Kenya)
CREATE TABLE matatu_routes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    county county_enum NOT NULL,
    start_location VARCHAR(255) NOT NULL,
    end_location VARCHAR(255) NOT NULL,
    cost_ksh DECIMAL(6, 2) NOT NULL,
    frequency_minutes INT,
    operating_hours VARCHAR(50),
    route_description TEXT,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_matatu_routes_county ON matatu_routes(county);

-- Create views for common queries

-- View: Property listing with landlord info and ratings
CREATE VIEW property_listings AS
SELECT 
    p.id,
    p.landlord_id,
    p.title,
    p.description,
    p.property_type,
    p.price,
    p.county,
    p.location,
    p.latitude,
    p.longitude,
    p.bedrooms,
    p.bathrooms,
    p.university_name,
    p.distance_to_uni,
    p.beach_distance,
    p.amenities,
    p.security_score,
    p.askari_24hr,
    p.cctv,
    p.fence,
    p.compound_type,
    p.verified,
    p.verification_date,
    p.verified_by,
    p.mpesa_till_number,
    p.mpesa_paybill,
    p.availability,
    p.status,
    p.views_count,
    p.created_at,
    p.updated_at,
    u.full_name as landlord_name,
    u.phone as landlord_phone,
    u.verified as landlord_verified,
    COUNT(DISTINCT pr.id) as review_count,
    AVG(pr.rating) as avg_rating,
    COUNT(DISTINCT pi.id) as image_count
FROM properties p
LEFT JOIN users u ON p.landlord_id = u.id
LEFT JOIN property_reviews pr ON p.id = pr.property_id AND pr.status = 'approved'
LEFT JOIN property_images pi ON p.id = pi.property_id
GROUP BY p.id, u.id;

-- View: Landlord stats
CREATE VIEW landlord_stats AS
SELECT 
    u.id as landlord_id,
    u.full_name,
    COUNT(DISTINCT p.id) as total_properties,
    COUNT(DISTINCT CASE WHEN p.availability = 'available' THEN p.id END) as available_properties,
    AVG(lr.rating) as avg_rating,
    COUNT(DISTINCT lr.id) as rating_count,
    SUM(p.views_count) as total_views
FROM users u
LEFT JOIN properties p ON u.id = p.landlord_id AND p.status = 'active'
LEFT JOIN landlord_ratings lr ON u.id = lr.landlord_id
WHERE u.role = 'landlord'
GROUP BY u.id;

-- Initial admin user (password: admin123 - hashed with bcrypt)
-- Password hash for 'admin123': $2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi
INSERT INTO users (id, email, password_hash, full_name, role, verified, status) 
VALUES (
    gen_random_uuid(),
    'admin@housecom.co.ke',
    '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi',
    'HouseCom Admin',
    'admin',
    TRUE,
    'active'
);
