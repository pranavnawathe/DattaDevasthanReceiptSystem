# Documentation Index

Welcome to the Datta Devasthan Receipt System documentation. This directory contains comprehensive technical and project documentation organized for easy navigation.

## 📚 Documentation Structure

```
docs/
├── README.md                    # This file - documentation index
├── PROJECT_OVERVIEW.md          # High-level project summary
├── PROJECT_STATUS.md            # Current status and roadmap
├── architecture/                # System architecture
│   └── ARCHITECTURE.md          # Detailed architecture documentation
├── components/                  # Component-specific docs
│   ├── BACKEND.md               # Backend technical documentation
│   ├── FRONTEND.md              # Frontend technical documentation
│   ├── DATA_MODEL.md            # Database schema (future)
│   └── PDF_GENERATION.md        # PDF generation (future)
└── archive/                     # Old/deprecated documentation
    ├── overall-design.md
    ├── IMPLEMENTATION_PLAN.md
    ├── DEPLOYMENT_RESULTS.md
    └── TESTING_GUIDE.md
```

## 🚀 Quick Start

### For New Developers
1. Start with [PROJECT_OVERVIEW.md](PROJECT_OVERVIEW.md) - Understand the project
2. Read [architecture/ARCHITECTURE.md](architecture/ARCHITECTURE.md) - Learn the system design
3. Choose your area:
   - Backend: [components/BACKEND.md](components/BACKEND.md)
   - Frontend: [components/FRONTEND.md](components/FRONTEND.md)

### For Project Managers
1. [PROJECT_OVERVIEW.md](PROJECT_OVERVIEW.md) - Business context and features
2. [PROJECT_STATUS.md](PROJECT_STATUS.md) - Current status and roadmap

### For Users
1. [../README.md](../README.md) - Quick start and setup
2. [../UI_DEMO_GUIDE.md](../UI_DEMO_GUIDE.md) - User guide with screenshots

## 📖 Documentation Guide

### High-Level Documentation

#### [PROJECT_OVERVIEW.md](PROJECT_OVERVIEW.md)
**Audience**: Everyone
**Purpose**: Comprehensive project summary

**Contents**:
- Executive summary and business context
- Key features (current and planned)
- Technology overview
- System architecture diagram
- Data flow
- Core entities
- Security and compliance
- Costs and scalability
- Success metrics
- Links and resources

**When to read**: First document for anyone new to the project

---

#### [PROJECT_STATUS.md](PROJECT_STATUS.md)
**Audience**: Project managers, developers, stakeholders
**Purpose**: Current status, roadmap, and progress tracking

**Contents**:
- Live deployment URLs and status
- Completed features (Phase 1)
- Development and performance metrics
- Known issues and limitations
- Technical debt
- Roadmap (Phases 2-4)
- Success criteria
- Risk assessment
- Change log

**When to read**: To understand what's done, what's next, and project health

---

### Architecture Documentation

#### [architecture/ARCHITECTURE.md](architecture/ARCHITECTURE.md)
**Audience**: Developers, architects, DevOps engineers
**Purpose**: Deep dive into system architecture

**Contents**:
- Detailed architecture diagrams
- AWS infrastructure (CDK stacks)
- Component interaction flows
- Data flow (write and read paths)
- Security architecture
- Scalability and performance
- Disaster recovery

**When to read**: Before making infrastructure changes or understanding system design

---

### Component Documentation

#### [components/BACKEND.md](components/BACKEND.md)
**Audience**: Backend developers
**Purpose**: Backend technical reference

**Contents**:
- Project structure
- CDK stacks (Foundation, API, UI)
- Lambda function architecture
- Services layer (DonationService, DonorResolver, ReceiptArtifact)
- Data access layer
- Utilities
- API contracts
- Error handling
- Testing
- Deployment

**When to read**: Working on backend code, Lambda functions, or infrastructure

---

#### [components/FRONTEND.md](components/FRONTEND.md)
**Audience**: Frontend developers
**Purpose**: Frontend technical reference

**Contents**:
- Project structure
- Technology stack (React, Vite, Tailwind)
- Component architecture
- State management
- API integration
- Styling and theming
- Form validation
- Build and deployment
- Future enhancements

**When to read**: Working on UI components, forms, or styling

---

#### [components/DATA_MODEL.md](components/DATA_MODEL.md) (Future)
**Audience**: Backend developers, database administrators
**Purpose**: Database schema and design patterns

**Contents** (Planned):
- DynamoDB table design
- Access patterns
- GSI design rationale
- Key structure
- Item types
- Query examples
- Migration strategy

---

#### [components/PDF_GENERATION.md](components/PDF_GENERATION.md) (Future)
**Audience**: Backend developers
**Purpose**: PDF generation technical details

**Contents** (Planned):
- PDFKit usage
- Font embedding (Noto Sans Devanagari)
- Layout algorithms
- Marathi text rendering
- Number to words conversion
- Template customization

---

## 🗂️ Archived Documentation

The `archive/` directory contains historical documentation from early development phases. These documents may be outdated but are kept for reference.

### Archive Contents

- **overall-design.md**: Original system design document
- **IMPLEMENTATION_PLAN.md**: Initial implementation plan
- **DEPLOYMENT_RESULTS.md**: Early deployment notes
- **TESTING_GUIDE.md**: Initial testing approach

**Note**: Refer to current documentation for up-to-date information.

---

## 🔍 Finding What You Need

### By Role

| Role | Start Here | Also Read |
|------|-----------|-----------|
| **New Developer** | PROJECT_OVERVIEW.md | ARCHITECTURE.md, BACKEND.md or FRONTEND.md |
| **Project Manager** | PROJECT_STATUS.md | PROJECT_OVERVIEW.md |
| **DevOps Engineer** | ARCHITECTURE.md | BACKEND.md |
| **UI/UX Designer** | FRONTEND.md | PROJECT_OVERVIEW.md |
| **End User** | ../UI_DEMO_GUIDE.md | ../README.md |
| **Stakeholder** | PROJECT_OVERVIEW.md | PROJECT_STATUS.md |

### By Task

| Task | Documentation |
|------|---------------|
| Understanding the project | PROJECT_OVERVIEW.md |
| Setting up development environment | ../README.md, BACKEND.md, FRONTEND.md |
| Deploying to AWS | BACKEND.md (Deployment section) |
| Modifying CDK infrastructure | BACKEND.md (CDK Stacks section) |
| Adding new UI components | FRONTEND.md (Component Architecture) |
| Understanding data model | ARCHITECTURE.md (Data Flow section) |
| Troubleshooting PDF generation | BACKEND.md (ReceiptArtifact section) |
| Planning next features | PROJECT_STATUS.md (Roadmap section) |

### By Keyword

| Keyword | Found In |
|---------|----------|
| AWS CDK, Lambda, DynamoDB, S3 | ARCHITECTURE.md, BACKEND.md |
| React, Vite, Tailwind | FRONTEND.md |
| PDF, PDFKit, Devanagari | BACKEND.md (ReceiptArtifact) |
| Donor, Receipt, Payment | PROJECT_OVERVIEW.md, BACKEND.md |
| Roadmap, Future features | PROJECT_STATUS.md |
| Deployment, CI/CD | BACKEND.md, FRONTEND.md |
| Security, Authentication | ARCHITECTURE.md (Security section) |
| Costs, Scalability | ARCHITECTURE.md, PROJECT_OVERVIEW.md |

---

## 📝 Documentation Standards

### Structure
- Use clear headings (H1, H2, H3)
- Include table of contents for long documents
- Use diagrams where helpful
- Provide code examples
- Link to related documentation

### Formatting
- **Marathi text**: Use Devanagari script in code blocks or inline
- **Code**: Use syntax highlighting (```typescript, ```bash, etc.)
- **Tables**: For comparisons and structured data
- **Lists**: For features, steps, and options
- **Callouts**: Use ⚠️ for warnings, ✅ for completed, 📋 for planned

### Maintenance
- Update "Last Updated" date when modifying
- Add changelog entries for major updates
- Archive deprecated documentation
- Link to related docs for context

---

## 🤝 Contributing to Documentation

### When to Update Documentation
- Adding new features
- Changing architecture
- Fixing bugs
- Deployment changes
- New dependencies
- API changes

### How to Update
1. Identify affected documentation files
2. Make changes inline with code changes
3. Update "Last Updated" date
4. Add changelog entry if significant
5. Commit with descriptive message: `docs: Update BACKEND.md with new service`

### Creating New Documentation
1. Determine appropriate location (`docs/`, `docs/architecture/`, `docs/components/`)
2. Follow existing structure and formatting
3. Add entry to this README.md index
4. Link from related documentation
5. Include "Last Updated" and "Version" at bottom

---

## 📞 Contact

**Repository**: https://github.com/pranavnawathe/DattaDevasthanReceiptSystem

**Issues**: https://github.com/pranavnawathe/DattaDevasthanReceiptSystem/issues

**Maintainer**: Pranav Nawathe

---

## 📄 License

Private project for Shri Datta Devasthan, Kondgaon (Sakharpa), Maharashtra, India.

---

**Last Updated**: October 26, 2025
**Documentation Version**: 1.0
