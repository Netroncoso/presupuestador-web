# Database Migration Guidelines

## CRITICAL: Always Update Schema Documentation

**EVERY TIME** you create or modify a database migration, you **MUST** update the database schema documentation.

## Required Actions After Each Migration

1. **Update `database-schema.md`**
   - Location: `.amazonq/rules/database-schema.md`
   - Add/modify table definitions
   - Update column information
   - Update foreign key relationships
   - Update constraints and indexes

2. **Update `Tablas-full2.csv`** (if possible)
   - Export updated schema from MySQL
   - Replace existing CSV file
   - Ensure all columns are included

## Migration Checklist

- [ ] Create migration SQL file in `backend/migrations/`
- [ ] Test migration on local database
- [ ] Update `.amazonq/rules/database-schema.md` with changes
- [ ] Document changes in migration file comments
- [ ] Commit both migration and schema documentation together

## Example Workflow

```bash
# 1. Create migration
backend/migrations/016_add_new_column.sql

# 2. Run migration locally
mysql -u root -p mh_1 < backend/migrations/016_add_new_column.sql

# 3. Update schema documentation
.amazonq/rules/database-schema.md

# 4. Commit together
git add backend/migrations/016_add_new_column.sql
git add .amazonq/rules/database-schema.md
git commit -m "Migration: Add new column and update schema docs"
```

## Why This Matters

- Amazon Q uses `database-schema.md` as reference for all database operations
- Outdated schema documentation leads to incorrect queries and bugs
- Schema documentation is the single source of truth for database structure
- Helps maintain consistency across the team

---

**Remember:** Schema documentation is NOT optional - it's a required part of every migration.
