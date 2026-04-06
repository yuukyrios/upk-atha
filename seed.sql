CREATE TABLE users (
    user_id INT AUTO_INCREMENT PRIMARY KEY,
    nickname VARCHAR(50) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    email VARCHAR(100) UNIQUE,
    profile_picture_url VARCHAR(500) DEFAULT 'default_avatar.png',
    user_type ENUM('normal', 'admin') DEFAULT 'normal',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    is_active BOOLEAN DEFAULT TRUE,
    last_login TIMESTAMP NULL
);

CREATE TABLE series (
    series_id INT AUTO_INCREMENT PRIMARY KEY,
    series_name VARCHAR(100) NOT NULL UNIQUE,
    description TEXT,
    release_year INT,
    created_by INT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    cover_image_url VARCHAR(500),
    
    FOREIGN KEY (created_by) REFERENCES users(user_id) ON DELETE RESTRICT
);

CREATE TABLE mechs (
    mech_id INT AUTO_INCREMENT PRIMARY KEY,
    mech_name VARCHAR(100) NOT NULL,
    series_id INT NOT NULL,
    lore_description TEXT NOT NULL,
    height DECIMAL(6,2),
    weight DECIMAL(8,2),
    armament TEXT,
    armor_material VARCHAR(200),
    power_source VARCHAR(200),
    max_speed VARCHAR(100),
    manufacturer VARCHAR(200),
    pilot VARCHAR(200),
    model_number VARCHAR(50),
    classification VARCHAR(100),
    design_features TEXT,
    image_url VARCHAR(500),
    created_by INT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    FOREIGN KEY (series_id) REFERENCES series(series_id) ON DELETE CASCADE,
    FOREIGN KEY (created_by) REFERENCES users(user_id) ON DELETE RESTRICT,
    
    INDEX idx_series_id (series_id),
    INDEX idx_mech_name (mech_name)
);

CREATE TABLE comments (
    comment_id INT AUTO_INCREMENT PRIMARY KEY,
    mech_id INT NOT NULL,
    user_id INT NOT NULL,
    content TEXT NOT NULL,
    is_admin_comment BOOLEAN DEFAULT FALSE,
    upvotes INT DEFAULT 0,
    downvotes INT DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    is_deleted BOOLEAN DEFAULT FALSE,
    deleted_by INT NULL,
    deleted_reason VARCHAR(500) NULL,
    
    FOREIGN KEY (mech_id) REFERENCES mechs(mech_id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE,
    FOREIGN KEY (deleted_by) REFERENCES users(user_id) ON DELETE SET NULL,
    
    INDEX idx_mech_id (mech_id),
    INDEX idx_user_id (user_id)
);

CREATE TABLE comment_votes (
    vote_id INT AUTO_INCREMENT PRIMARY KEY,
    comment_id INT NOT NULL,
    user_id INT NOT NULL,
    vote_type ENUM('upvote', 'downvote') NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    UNIQUE KEY unique_user_comment_vote (comment_id, user_id),
    
    FOREIGN KEY (comment_id) REFERENCES comments(comment_id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE,
    
    INDEX idx_comment_id (comment_id)

    CREATE TABLE comment_replies (
    reply_id INT AUTO_INCREMENT PRIMARY KEY,
    parent_comment_id INT NOT NULL,
    user_id INT NOT NULL,
    content TEXT NOT NULL,
    is_admin_reply BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    is_deleted BOOLEAN DEFAULT FALSE,
    deleted_by INT NULL,
    deleted_reason VARCHAR(500) NULL,
    
    FOREIGN KEY (parent_comment_id) REFERENCES comments(comment_id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE,
    FOREIGN KEY (deleted_by) REFERENCES users(user_id) ON DELETE SET NULL,
    
    INDEX idx_parent_comment (parent_comment_id)
);