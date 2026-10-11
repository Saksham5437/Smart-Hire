# 🗄️ SmartHire Database Directory

This directory contains the complete database setup, schema definitions, migrations, and seed scripts for the **SmartHire** platform.

---

## 📁 Directory Structure

```
database/
├── schema.sql         # Full MySQL DDL schema (Tables, Indexes, Foreign Keys)
├── seed.sql           # Raw SQL seed data for MySQL CLI / Workbench import
├── connection.py      # SQLAlchemy connection engine, pool settings & session factory
├── models.py          # ORM models (User, Job, Application, Interview, SecurityEvent)
├── init_db.py         # Python initialization & auto-provisioning script
└── README.md          # Database guide & usage instructions
```

---

## 🛠️ Quick Setup Instructions

### Option 1: Automatic Setup via Python Script
Run the automated initialization script from the workspace root:

```bash
python database/init_db.py
```

This script will:
1. Connect to MySQL and create the `smarthire` database if it doesn't exist.
2. Create all relational tables (`users`, `jobs`, `applications`, `interviews`, `security_events`).
3. Seed default **HR** and **Candidate** demo accounts and job listings.

---

### Option 2: Manual Import via MySQL CLI / Workbench
You can also import the schema and seed files directly using the MySQL CLI or MySQL Workbench:

```bash
# 1. Create schema and tables
mysql -u root -p < database/schema.sql

# 2. Populate initial seed data
mysql -u root -p < database/seed.sql
```

---

## 📊 Database Schema Summary

| Table | Description | Key Relationships |
| :--- | :--- | :--- |
| **`users`** | Stores candidates and HR recruiters with role-based access | `has_many: applications`, `has_many: jobs` |
| **`jobs`** | Active and closed job requisitions created by HR | `belongs_to: users (created_by)`, `has_many: applications` |
| **`applications`** | Candidate job submissions and stage pipeline tracking | `belongs_to: users`, `belongs_to: jobs`, `has_one: interview` |
| **`interviews`** | AI round logs and scheduled human interview rounds | `belongs_to: applications` |
| **`security_events`** | Real-time proctoring telemetry & integrity violation logs | `belongs_to: applications` |

---

## 🔐 Default Demo Accounts

- **HR Recruiter Account**:
  - **Email**: `hr@smarthire.com`
  - **Password**: `admin123`
- **Candidate Account**:
  - **Email**: `rahul@example.com`
  - **Password**: `candidate123`
