# Global Sumud Flotilla Tracker

A secure web application for tracking activists from the Global Sumud Flotilla, featuring crowdsourced information submission and comprehensive timeline management.

## Features

### 🔍 **Public Activist Directory**
- Searchable and sortable table of all activists
- Filter by status (detained, released, missing, safe)
- Quick access to individual profiles
- Real-time status updates

### 📅 **Detailed Timeline System**
- Daily timeline events for each activist
- Chronological event tracking
- Source attribution for all information
- Rich event descriptions

### 👥 **Crowdsourced Information**
- Public submission form for new information
- Admin review system for all submissions
- Email notifications for submitters
- Secure data validation

### 🔒 **Security Features**
- Rate limiting to prevent abuse
- Input validation and sanitization
- Secure headers and CORS protection
- Database encryption at rest

## Technology Stack

- **Frontend**: Next.js 14 with TypeScript, Tailwind CSS
- **Backend**: Next.js API Routes with Prisma ORM
- **Database**: PostgreSQL with encryption
- **Security**: Rate limiting, input validation, secure headers
- **Deployment**: Vercel-ready with environment configuration

## Quick Start

### Prerequisites
- Node.js 18+ 
- PostgreSQL database
- npm or yarn

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd tracker-detained-flotilla
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   ```bash
   cp env.example .env.local
   ```
   
   Edit `.env.local` with your database URL and configuration:
   ```env
   DATABASE_URL="postgresql://username:password@localhost:5432/flotilla_tracker"
   ADMIN_EMAIL="admin@example.com"
   ADMIN_PASSWORD="your-secure-password"
   NEXTAUTH_SECRET="your-nextauth-secret-key"
   NEXTAUTH_URL="http://localhost:3000"
   ```

4. **Set up the database**
   ```bash
   npm run setup
   ```

5. **Add sample data (optional)**
   ```bash
   npm run db:seed
   ```

6. **Start the development server**
   ```bash
   npm run dev
   ```

7. **Open your browser**
   Navigate to [http://localhost:3000](http://localhost:3000)

## Project Structure

```
├── app/                    # Next.js 14 app directory
│   ├── api/               # API routes
│   │   ├── activists/     # Activist data endpoints
│   │   ├── submit/        # Public submission endpoint
│   │   └── admin/         # Admin panel endpoints
│   ├── activist/[id]/     # Individual activist profiles
│   ├── admin/             # Admin panel
│   ├── submit/            # Public submission form
│   └── globals.css        # Global styles
├── components/            # React components
│   ├── ActivistsTable.tsx # Main activists table
│   ├── TimelineView.tsx   # Timeline display
│   └── AdminSubmissions.tsx # Admin submission management
├── lib/                   # Utility libraries
│   ├── prisma.ts         # Database client
│   └── rate-limit.ts     # Rate limiting utility
├── prisma/               # Database schema
│   └── schema.prisma     # Prisma schema definition
└── scripts/              # Setup and seeding scripts
    ├── seed.ts           # Sample data seeding
    └── setup.ts          # Database setup
```

## Database Schema

### Activists Table
- `id`: Unique identifier
- `name`: Activist's full name
- `nationality`: Country of origin
- `boatName`: Associated boat name
- `status`: Current status (detained, released, missing, safe)
- `createdAt`/`updatedAt`: Timestamps

### Timeline Events Table
- `id`: Unique identifier
- `activistId`: Reference to activist
- `eventDate`: Date of the event
- `sourceTitle`: Title/source of information
- `description`: Detailed event description
- `createdAt`: When added to timeline

### Submissions Table
- `id`: Unique identifier
- `activistId`: Reference to activist (optional)
- `eventDate`: Date of the event
- `sourceTitle`: Title/source of information
- `description`: Detailed event description
- `submitterEmail`: Email of person submitting
- `status`: Review status (pending, approved, rejected)
- `createdAt`/`reviewedAt`: Timestamps

## Usage

### For Public Users
1. **Browse Activists**: Visit the homepage to see all activists
2. **View Profiles**: Click on any activist to see their detailed timeline
3. **Submit Information**: Use the "Submit Info" form to share new information
4. **Search & Filter**: Use the search bar and status filters to find specific activists

### For Administrators
1. **Review Submissions**: Visit `/admin` to review pending submissions
2. **Approve/Reject**: Review each submission and approve or reject it
3. **Monitor Activity**: Track submission statistics and review history

## Security Considerations

- **Rate Limiting**: 5 submissions per 5 minutes per IP
- **Input Validation**: All inputs are validated and sanitized
- **SQL Injection Protection**: Prisma ORM provides built-in protection
- **XSS Protection**: React's built-in XSS protection + CSP headers
- **CSRF Protection**: Next.js built-in CSRF protection
- **Secure Headers**: Comprehensive security headers in next.config.js

## Deployment

### Vercel (Recommended)
1. Connect your GitHub repository to Vercel
2. Set environment variables in Vercel dashboard
3. Deploy automatically on push to main branch

### Other Platforms
- **Railway**: Supports PostgreSQL and Next.js
- **Heroku**: Requires PostgreSQL addon
- **DigitalOcean**: Use App Platform with managed database

### Environment Variables for Production
```env
DATABASE_URL="your-production-database-url"
ADMIN_EMAIL="your-admin-email"
ADMIN_PASSWORD="secure-production-password"
NEXTAUTH_SECRET="secure-random-string"
NEXTAUTH_URL="https://your-domain.com"
```

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Support

For support or questions, please contact the project administrators or create an issue in the repository.

---

**Note**: This application is designed to track activists and their status. Please ensure all information is accurate and verified before submission. The admin review process helps maintain data quality and reliability.
