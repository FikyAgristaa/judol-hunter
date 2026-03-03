-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- TABLE: websites
CREATE TABLE IF NOT EXISTS websites (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    url TEXT UNIQUE NOT NULL,
    domain TEXT,
    ip_address TEXT,
    hosting_provider TEXT,
    registrar TEXT,
    created_date DATE,
    status VARCHAR(50) DEFAULT 'pending',
    ai_score FLOAT,
    nlp_score FLOAT,
    vision_score FLOAT,
    verified_at TIMESTAMP,
    verified_by VARCHAR(50),
    screenshot_path TEXT,
    video_path TEXT,
    html_snapshot TEXT,
    metadata JSONB,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    last_checked_at TIMESTAMP
);

-- TABLE: payment_accounts
CREATE TABLE IF NOT EXISTS payment_accounts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    website_id UUID REFERENCES websites(id) ON DELETE CASCADE,
    bank_name VARCHAR(100),
    account_number VARCHAR(100),
    account_holder VARCHAR(200),
    ewallet_type VARCHAR(50),
    ewallet_number VARCHAR(100),
    ewallet_holder VARCHAR(200),
    qris_data TEXT,
    qris_image_path TEXT,
    source_url TEXT,
    screenshot_path TEXT,
    confidence FLOAT,
    metadata JSONB,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- TABLE: reports
CREATE TABLE IF NOT EXISTS reports (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    website_id UUID REFERENCES websites(id) ON DELETE CASCADE,
    payment_account_id UUID REFERENCES payment_accounts(id),
    reported_to VARCHAR(50),
    report_type VARCHAR(50),
    report_data JSONB,
    evidence_paths JSONB,
    status VARCHAR(50) DEFAULT 'pending',
    response_message TEXT,
    response_code VARCHAR(50),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    reported_at TIMESTAMP,
    confirmed_at TIMESTAMP
);

-- TABLE: keywords
CREATE TABLE IF NOT EXISTS keywords (
    id SERIAL PRIMARY KEY,
    keyword TEXT UNIQUE NOT NULL,
    category VARCHAR(50),
    weight FLOAT DEFAULT 1.0,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Insert default keywords
INSERT INTO keywords (keyword, category, weight) VALUES
    ('slot gacor', 'slot', 1.5),
    ('judi online', 'general', 1.2),
    ('casino online', 'casino', 1.3),
    ('poker online', 'poker', 1.2),
    ('togel online', 'togel', 1.4),
    ('deposit pulsa', 'payment', 1.1),
    ('withdraw dana', 'payment', 1.1),
    ('bonus new member', 'promo', 1.0),
    ('agen slot', 'slot', 1.3),
    ('bandar togel', 'togel', 1.4)
ON CONFLICT (keyword) DO NOTHING;

-- TABLE: logs
CREATE TABLE IF NOT EXISTS logs (
    id BIGSERIAL PRIMARY KEY,
    timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    level VARCHAR(20),
    module VARCHAR(50),
    action VARCHAR(100),
    message TEXT,
    metadata JSONB,
    duration INTEGER,
    status VARCHAR(20)
);

-- TABLE: statistics
CREATE TABLE IF NOT EXISTS statistics (
    id SERIAL PRIMARY KEY,
    date DATE UNIQUE NOT NULL,
    websites_found INTEGER DEFAULT 0,
    websites_verified INTEGER DEFAULT 0,
    websites_reported INTEGER DEFAULT 0,
    payment_accounts_found INTEGER DEFAULT 0,
    avg_verification_time FLOAT,
    avg_extraction_time FLOAT,
    success_rate FLOAT,
    details JSONB,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes
CREATE INDEX idx_websites_status ON websites(status);
CREATE INDEX idx_websites_domain ON websites(domain);
CREATE INDEX idx_websites_ai_score ON websites(ai_score);
CREATE INDEX idx_websites_created_at ON websites(created_at);
CREATE INDEX idx_payment_website_id ON payment_accounts(website_id);
CREATE INDEX idx_payment_bank ON payment_accounts(bank_name, account_number);
CREATE INDEX idx_payment_ewallet ON payment_accounts(ewallet_type, ewallet_number);
CREATE INDEX idx_reports_website_id ON reports(website_id);
CREATE INDEX idx_reports_status ON reports(status);
CREATE INDEX idx_logs_timestamp ON logs(timestamp);
CREATE INDEX idx_logs_module ON logs(module);
CREATE INDEX idx_statistics_date ON statistics(date);

-- Create view
CREATE OR REPLACE VIEW dashboard_summary AS
SELECT
    (SELECT COUNT(*) FROM websites) AS total_websites,
    (SELECT COUNT(*) FROM websites WHERE status = 'verified') AS verified_websites,
    (SELECT COUNT(*) FROM websites WHERE status = 'reported') AS reported_websites,
    (SELECT COUNT(*) FROM payment_accounts) AS total_payments,
    (SELECT COUNT(*) FROM reports WHERE status = 'success') AS successful_reports,
    (SELECT COUNT(*) FROM reports WHERE DATE(created_at) = CURRENT_DATE) AS today_reports;