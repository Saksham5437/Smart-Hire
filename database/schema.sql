-- ==============================================================================
-- SmartHire AI Recruitment & Interview Platform
-- Database Schema Definition (MySQL 8.0+)
-- ==============================================================================

CREATE DATABASE IF NOT EXISTS `smarthire` 
  CHARACTER SET utf8mb4 
  COLLATE utf8mb4_unicode_ci;

USE `smarthire`;

-- ------------------------------------------------------------------------------
-- 1. Users Table (Candidates & HR Recruiters)
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `users` (
  `id` INT NOT NULL AUTO_INCREMENT,
  `name` VARCHAR(120) NOT NULL,
  `email` VARCHAR(150) NOT NULL,
  `password_hash` VARCHAR(255) NOT NULL,
  `role` ENUM('candidate', 'hr') NOT NULL DEFAULT 'candidate',
  `phone` VARCHAR(30) NULL DEFAULT NULL,
  `location` VARCHAR(180) NULL DEFAULT NULL,
  `education` VARCHAR(255) NULL DEFAULT NULL,
  `experience` VARCHAR(120) NULL DEFAULT NULL,
  `skills` TEXT NULL DEFAULT NULL,
  `profile_summary` TEXT NULL DEFAULT NULL,
  `company` VARCHAR(180) NULL DEFAULT NULL,
  `department` VARCHAR(120) NULL DEFAULT NULL,
  `designation` VARCHAR(120) NULL DEFAULT NULL,
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `idx_users_email` (`email`),
  KEY `idx_users_role` (`role`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ------------------------------------------------------------------------------
-- 2. Jobs Table (Job Postings Created by HR)
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `jobs` (
  `id` INT NOT NULL AUTO_INCREMENT,
  `title` VARCHAR(150) NOT NULL,
  `company` VARCHAR(180) NOT NULL,
  `location` VARCHAR(180) NOT NULL,
  `employment_type` VARCHAR(80) NOT NULL DEFAULT 'Full-time',
  `description` TEXT NOT NULL,
  `skills` TEXT NOT NULL,
  `experience` VARCHAR(100) NOT NULL,
  `education` VARCHAR(150) NOT NULL,
  `deadline` VARCHAR(80) NULL DEFAULT NULL,
  `status` ENUM('Active', 'Closed') NOT NULL DEFAULT 'Active',
  `created_by` INT NOT NULL,
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_jobs_created_by` (`created_by`),
  KEY `idx_jobs_status` (`status`),
  CONSTRAINT `fk_jobs_creator` 
    FOREIGN KEY (`created_by`) REFERENCES `users` (`id`) 
    ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ------------------------------------------------------------------------------
-- 3. Applications Table (Candidate Job Submissions & Pipeline Stages)
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `applications` (
  `id` INT NOT NULL AUTO_INCREMENT,
  `candidate_id` INT NOT NULL,
  `job_id` INT NOT NULL,
  `resume_path` VARCHAR(255) NULL DEFAULT NULL,
  `resume_text` LONGTEXT NULL DEFAULT NULL,
  `screening_score` FLOAT NULL DEFAULT NULL,
  `eligibility` ENUM('Eligible', 'Not Eligible', 'Under Review') NOT NULL DEFAULT 'Under Review',
  `stage` ENUM('Applied', 'Screening', 'Interview Scheduled', 'Interview Completed', 'HR Review', 'Selected', 'Rejected', 'On Hold') NOT NULL DEFAULT 'Applied',
  `ai_interview_score` FLOAT NULL DEFAULT NULL,
  `final_decision` VARCHAR(50) NULL DEFAULT NULL,
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_applications_candidate` (`candidate_id`),
  KEY `idx_applications_job` (`job_id`),
  KEY `idx_applications_stage` (`stage`),
  CONSTRAINT `fk_app_candidate` 
    FOREIGN KEY (`candidate_id`) REFERENCES `users` (`id`) 
    ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `fk_app_job` 
    FOREIGN KEY (`job_id`) REFERENCES `jobs` (`id`) 
    ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ------------------------------------------------------------------------------
-- 4. Interviews Table (AI Interviews & Scheduled Human Interviews)
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `interviews` (
  `id` INT NOT NULL AUTO_INCREMENT,
  `application_id` INT NOT NULL,
  `questions_json` JSON NULL DEFAULT NULL,
  `answers_json` JSON NULL DEFAULT NULL,
  `result_json` JSON NULL DEFAULT NULL,
  `status` VARCHAR(50) NOT NULL DEFAULT 'Scheduled',
  `scheduled_at` DATETIME NULL DEFAULT NULL,
  `interviewer` VARCHAR(150) NULL DEFAULT NULL,
  `interview_type` VARCHAR(100) NULL DEFAULT NULL,
  `interview_time` VARCHAR(50) NULL DEFAULT NULL,
  `duration` VARCHAR(50) NULL DEFAULT NULL,
  `interview_mode` VARCHAR(50) NULL DEFAULT NULL,
  `meeting_platform` VARCHAR(100) NULL DEFAULT NULL,
  `meeting_link` VARCHAR(255) NULL DEFAULT NULL,
  `notes` TEXT NULL DEFAULT NULL,
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `idx_interview_application` (`application_id`),
  CONSTRAINT `fk_interview_app` 
    FOREIGN KEY (`application_id`) REFERENCES `applications` (`id`) 
    ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ------------------------------------------------------------------------------
-- 5. Security Events Table (Proctoring & Anti-Cheat Telemetry Logs)
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `security_events` (
  `id` INT NOT NULL AUTO_INCREMENT,
  `application_id` INT NOT NULL,
  `event_type` VARCHAR(100) NOT NULL,
  `details` TEXT NULL DEFAULT NULL,
  `severity` VARCHAR(20) NOT NULL DEFAULT 'info',
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_sec_events_application` (`application_id`),
  KEY `idx_sec_events_type` (`event_type`),
  CONSTRAINT `fk_sec_event_app` 
    FOREIGN KEY (`application_id`) REFERENCES `applications` (`id`) 
    ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
