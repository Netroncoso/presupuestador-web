# Product Overview

## Purpose
Sistema Presupuestador Web is a comprehensive medical budget management system designed for healthcare organizations. It provides intelligent quotation management, automated auditing, version control, and real-time notifications for medical supplies, services, and equipment budgets.

## Value Proposition
- **Automated Compliance**: 4 automatic validation rules ensure budgets meet business requirements before approval
- **Complete Traceability**: Full version control with historical values preserved for audit trails
- **Multi-Level Governance**: 4 specialized management departments (Administrative, Prestational, General, Financial) with FCFS workflow
- **Real-Time Collaboration**: SSE (Server-Sent Events) for instant notifications and updates
- **Historical Accuracy**: Time-based pricing system maintains accurate historical records by period and branch
- **Intelligent Alerts**: Configurable alerts for outdated values and quantity thresholds by type

## Key Features

### Core Capabilities
- **Intelligent Quotation System**: Complete management of medical supplies, services, and equipment
- **Version Control**: Full change history with complete traceability
- **Historical Values (Timelapse)**: Price management by validity periods and branch
- **Automated Auditing**: 4 automatic rules for budget validation
- **Real-Time Notifications**: SSE for instant updates
- **Read-Only Mode**: Secure visualization of historical budgets with period-accurate values
- **Multi-Management System**: 4 specialized departments with FCFS flow and auto-release
- **Smart Alerts**: Outdated value alerts and configurable alerts by type
- **PDF Generation**: Export budgets in any state (draft, approved, rejected)
- **Session Management**: Automatic detection and notification of expired sessions (401)

### Business Rules (Configurable)
Budgets go to audit if they meet at least one condition:
1. **Profitability < 15%** - Very low profitability
2. **Total Cost > $150,000** - High amount
3. **Profitability with Term > 25%** - Possible overpricing
4. **Profit > $50,000** - High profit

All thresholds are configurable by super admin from Admin Panel > Business Rules.

### Multi-Management Audit Flow
1. **Administrative Management**: First review line, can approve or forward
2. **Prestational Management**: Technical review, can approve, observe, or escalate
3. **General Management**: Final decision on complex cases
4. **Financial Management**: Read-only dashboard, visualization without audit capability

**FCFS Assignment**: First available manager takes the case
**Auto-Release**: Inactive cases > 30 min return to available pool

## Target Users

### User Roles
1. **Normal User**: Create/edit budgets, view own history, request manual audit
2. **Administrative Management**: First audit line, approve/reject/forward
3. **Prestational Management**: Technical audit, approve/reject/observe/escalate
4. **General Management**: Final audit line, approve/reject/return, conditional approval
5. **Financial Management**: Read-only dashboard, visualization only
6. **Administrator**: Full system access, user management, configuration

## Use Cases

### Primary Workflows
1. **Create Budget**: User enters patient data and selects financier
2. **Add Items**: Select supplies, services, and equipment with current values
3. **Finalize**: System calculates totals and evaluates automatic rules
4. **Multi-Management Audit** (if applicable):
   - Administrative: First review, can approve or forward
   - Prestational: Technical review, can approve, observe, or escalate
   - General: Final decision on complex cases
5. **FCFS Assignment**: First available manager takes the case
6. **Auto-Release**: Inactive cases > 30 min return to available
7. **History**: Complete record with versioning, traceability, and period values

### Historical Values System
- Price management by validity periods
- Values differentiated by branch (general or specific)
- Automatic period closure when adding new values
- Query current values by date and branch
- Integration with historical budgets
- Priority: Specific value > General value
- Anti-obsolescence system (30 days)

### Equipment Management
- **Base Equipment**: CRUD with reference price (default value)
- **Equipment/Financier Agreements**: Specific agreements with historical values by branch
- All active equipment available for all financiers
- If no specific agreement, uses reference price
- Configurable alerts by equipment type

### Smart Alerts
- **Outdated Values**: Triggered when selecting items > 45 days without update
- **Configurable by Type**: Alerts for services (by unit type) and equipment (by equipment type)
- Parameters: max_quantity, alert_message, alert_color, active_alert
- Centralized management from Admin Panel > Alerts/Type

## Technical Highlights
- **Backend**: Node.js 18+ with TypeScript, Express, MySQL 8.0+
- **Frontend**: React 18 + TypeScript + Vite + Mantine UI
- **Real-Time**: SSE (Server-Sent Events) for notifications
- **Security**: JWT authentication, role-based access control, session management
- **Database**: MySQL with optimized indexes for high volume
- **Architecture**: REST API + SSE, modular controllers, service layer pattern
