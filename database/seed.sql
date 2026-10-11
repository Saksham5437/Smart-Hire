-- ==============================================================================
-- SmartHire Database Seed Data
-- ==============================================================================

USE `smarthire`;

-- Insert HR Account (Password: admin123)
-- Hash generated with bcrypt for 'admin123'
INSERT INTO `users` (`id`, `name`, `email`, `password_hash`, `role`, `company`, `department`, `designation`, `created_at`)
VALUES (
  1,
  'HR Manager',
  'hr@smarthire.com',
  '$2b$12$N.dZ0o.vF7V6gLq.p6p5rO9Q1GZ2z5w4/1Y5gqJ9C4h8p3h7o6qeq', 
  'hr',
  'SmartHire Tech',
  'Talent Acquisition',
  'Lead Technical Recruiter',
  NOW()
) ON DUPLICATE KEY UPDATE `email` = VALUES(`email`);

-- Insert Candidate Account (Password: candidate123)
INSERT INTO `users` (`id`, `name`, `email`, `password_hash`, `role`, `phone`, `location`, `education`, `experience`, `skills`, `profile_summary`, `created_at`)
VALUES (
  2,
  'Rahul Verma',
  'rahul@example.com',
  '$2b$12$R.vZ0o.vF7V6gLq.p6p5rO9Q1GZ2z5w4/1Y5gqJ9C4h8p3h7o6qeq',
  'candidate',
  '+91 9876543210',
  'Bengaluru, India',
  'B.Tech in Artificial Intelligence & Machine Learning',
  '1 Year - ML Intern',
  'Python, PyTorch, FastAPI, MySQL, Machine Learning, Docker',
  'Passionate AI/ML engineer focused on productionizing NLP pipelines and microservices.',
  NOW()
) ON DUPLICATE KEY UPDATE `email` = VALUES(`email`);

-- Insert Sample Job Listings
INSERT INTO `jobs` (`id`, `title`, `company`, `location`, `employment_type`, `description`, `skills`, `experience`, `education`, `deadline`, `status`, `created_by`, `created_at`)
VALUES 
(
  1,
  'AI / ML Engineer',
  'SmartHire Tech',
  'Bengaluru, India',
  'Full-time',
  'Design, deploy, and scale machine learning systems, LLM evaluation pipelines, and APIs.',
  'Python, PyTorch, FastAPI, Docker, NLP',
  '1-3 Years',
  'B.Tech / M.Tech in CS / AIML',
  '2026-12-31',
  'Active',
  1,
  NOW()
),
(
  2,
  'Data Analyst',
  'SmartHire Tech',
  'Bengaluru, India',
  'Full-time',
  'Analyze recruitment lifecycle data, candidate performance metrics, and build automated reports.',
  'Python, SQL, Tableau, Statistics',
  '0-2 Years',
  'Any STEM Graduate',
  '2026-11-30',
  'Active',
  1,
  NOW()
) ON DUPLICATE KEY UPDATE `title` = VALUES(`title`);
