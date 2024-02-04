-- MySQL

--#region account and auth
CREATE TABLE IF NOT EXISTS accounts(
    id INT PRIMARY KEY AUTO_INCREMENT,
    username VARCHAR(20) UNIQUE NOT NULL,
    email TEXT NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    -- values below are intentionally left null
    -- they are to be set after account creation
    account_type ENUM('Volunteer', 'NPO'),
    name TEXT, 
    phone TEXT,
    description TEXT
);

CREATE TABLE IF NOT EXISTS passwords(
    id INT PRIMARY KEY AUTO_INCREMENT,
    account_id INT NOT NULL,
    password_hash VARCHAR(60) NOT NULL,
    FOREIGN KEY(account_id) REFERENCES accounts(id)
);
--#endregion


CREATE TABLE IF NOT EXISTS events(
    id INT PRIMARY KEY AUTO_INCREMENT,
    npo_id INT NOT NULL,
    name TEXT NOT NULL,
    description TEXT NOT NULL,
    start_time DATETIME NOT NULL,
    end_time DATETIME NOT NULL,
    status ENUM('Planning', 'Confirmed', 'Started', 'Completed', 'Cancelled') NOT NULL,
    FOREIGN KEY(npo_id) REFERENCES accounts(id)
);


CREATE TABLE IF NOT EXISTS skills(
    id INT PRIMARY KEY AUTO_INCREMENT,
    volunteer_id INT NOT NULL,
    skill TEXT NOT NULL,
    FOREIGN KEY(volunteer_id) REFERENCES accounts(id)
);
--#endregion


--#region relationship tables

CREATE TABLE IF NOT EXISTS event_skills(
    id INT PRIMARY KEY AUTO_INCREMENT,
    event_id INT NOT NULL,
    skill TEXT NOT NULL,
    FOREIGN KEY(event_id) REFERENCES events(id)
);

CREATE TABLE IF NOT EXISTS volunteer_skills(
    id INT PRIMARY KEY AUTO_INCREMENT,
    volunteer_id INT NOT NULL,
    skill TEXT NOT NULL,
    FOREIGN KEY(volunteer_id) REFERENCES accounts(id)
);

CREATE TABLE IF NOT EXISTS event_volunteers(
    id INT PRIMARY KEY AUTO_INCREMENT,
    event_id INT NOT NULL,
    volunteer_id INT NOT NULL,
    FOREIGN KEY(event_id) REFERENCES events(id),
    FOREIGN KEY(volunteer_id) REFERENCES accounts(id)
);

CREATE TABLE IF NOT EXISTS event_attendance (
    id INT PRIMARY KEY AUTO_INCREMENT,
    event_id INT NOT NULL,
    volunteer_id INT NOT NULL,
    attendance_date DATE NOT NULL,
    FOREIGN KEY(event_id) REFERENCES events(id),
    FOREIGN KEY(volunteer_id) REFERENCES accounts(id)
);

CREATE TABLE IF NOT EXISTS event_feedback (
    id INT PRIMARY KEY AUTO_INCREMENT,
    event_id INT NOT NULL,
    volunteer_id INT NOT NULL,
    feedback TEXT NOT NULL,
    FOREIGN KEY(event_id) REFERENCES events(id),
    FOREIGN KEY(volunteer_id) REFERENCES accounts(id)
);

CREATE TABLE IF NOT EXISTS chat_messages (
    id INT PRIMARY KEY AUTO_INCREMENT,
    sender_id INT NOT NULL,
    recipient_id INT NOT NULL,
    message TEXT NOT NULL,
    timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(sender_id) REFERENCES accounts(id),
    FOREIGN KEY(recipient_id) REFERENCES accounts(id)
);

--#endregion
