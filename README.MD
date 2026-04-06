# MechaDex

MechaDex is a **web-based mecha database platform** where enthusiasts can explore different mecha series, read detailed specifications, and engage with the community through a Reddit-style comment and voting system.

The platform organizes fictional mecha information including lore, technical specifications, armaments, and design features while fostering community discussion.

---

## Features

### For Users
- Browse **Mecha Series** and their entries
- View detailed **Mech Specifications** (height, weight, armaments, lore, etc.)
- Leave **comments** on mech pages
- **Upvote/downvote** comments
- Reply to comments in **threaded discussions**
- Manage profile and avatar

### For Administrators
- Create, update, and delete **Series**
- Create, update, and delete **Mechs**
- Moderate comments through **soft deletion**

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| **Frontend** | React + Vite |
| **Backend** | Node.js + Express.js |
| **Database** | MySQL |

---

## Prerequisites

- [Node.js](https://nodejs.org/) (v18 or higher)
- [MySQL](https://dev.mysql.com/downloads/mysql/) or [XAMPP](https://www.apachefriends.org/)

---

## Installation

### 1. Clone the Repository


git clone https://github.com/yuukyrios/mechadex.git
cd mechadex
2. Database Setup
Option A: MySQL (Standalone)
Install MySQL and set a root password during setup
Verify installation: mysql --version
Option B: XAMPP (Recommended)
Download and install XAMPP
Open XAMPP Control Panel
Start MySQL service
(Optional) Open phpMyAdmin for GUI management
Create Database and Tables
Connect to MySQL and execute:
```
CREATE DATABASE mechadex;
USE mechadex;
```
Then run the following SQL to create all tables:
```bash
DROP TABLE IF EXISTS comment_votes;
DROP TABLE IF EXISTS comment_replies;
DROP TABLE IF EXISTS comments;
DROP TABLE IF EXISTS mechs;
DROP TABLE IF EXISTS series;
DROP TABLE IF EXISTS users;

-- ============================================
-- USERS TABLE
-- ============================================
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

-- ============================================
-- SERIES TABLE
-- ============================================
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

-- ============================================
-- MECHS TABLE
-- ============================================
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

-- ============================================
-- COMMENTS TABLE
-- ============================================
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

-- ============================================
-- COMMENT VOTES TABLE
-- ============================================
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
);

-- ============================================
-- COMMENT REPLIES TABLE
-- ============================================
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

``` 


Running the Application
Important: Ensure MySQL is running before starting the backend.
Backend Setup
bash

cd backend
npm install
Create a .env file in the backend directory:


```bash
PORT=3000
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=your_mysql_password
DB_NAME=mechadex
JWT_SECRET=your-secret-key-here
Start the server:
npm start
# or
node server.js
Backend runs at: http://localhost:3000
```

```bash
Frontend Setup
cd frontend
npm install
npm run dev
```
The application will open in your default browser.
Creating an Admin User
Run the admin creation script:

```
cd backend
node createAdmin.js
Follow the prompts to create your first administrator account.
Database Schema Overview


#
┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│    users    │────▶│   series    │◄────│    mechs    │
└─────────────┘     └─────────────┘     └─────────────┘
       │                                      │
       │                                      │
       └─────────────┐              ┌─────────┘
                     ▼              ▼
              ┌─────────────┐  ┌─────────────┐
              │   comments  │◄─┤comment_votes│
              └─────────────┘  └─────────────┘
                     │
                     ▼
              ┌─────────────┐
              │comment_replies
              └─────────────┘


Table
Table	Purpose
users	Account info, authentication, roles
series	Mecha franchises/shows
mechs	Detailed mecha specifications
comments	User comments on mechs
comment_votes	Upvote/downvote tracking
comment_replies	Threaded comment replies
API Documentation
Table
Endpoint	Method	Auth	Description
/api/auth/register	POST	No	Create new account
/api/auth/login	POST	No	Login
/api/auth/profile	GET	Yes	Get user profile
/api/series	GET	No	List all series
/api/series/:id	GET	No	Get series details
/api/series	POST	Admin	Create series
/api/mechs/search	GET	No	Search mechs
/api/mechs/:id	GET	No	Get mech details
/api/mechs	POST	Admin	Create mech
/api/comments/mech/:id	GET	Optional	Get comments
/api/comments/mech/:id	POST	Yes	Add comment
Security Features
Password Hashing: bcrypt with salt rounds
JWT Authentication: Stateless token-based auth
Soft Deletes: Preserves data integrity
Input Validation: Server-side validation on all inputs
File Upload Limits: 5MB max, images only
Troubleshooting
Table
Issue	Solution
Cannot connect to database	Verify MySQL is running and credentials are correct
Module not found	Run npm install in both frontend and backend directories
Port already in use	Change PORT in backend .env or kill existing process
CORS errors	Ensure backend is running and cors middleware is enabled
License
MIT
Acknowledgments
Built with passion for the mecha community. All series and mecha properties belong to their respective owners.
