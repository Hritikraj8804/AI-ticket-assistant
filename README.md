# 🎫 AI-Powered Ticket Management System

A smart ticket management system that uses AI to automatically categorize, prioritize, and assign support tickets to the most appropriate moderators based on their skills.

## 🚀 Features

### 🤖 AI-Powered Automation
- **Automatic Ticket Analysis**: AI analyzes ticket content to determine priority and required skills
- **Smart Assignment**: Tickets are automatically assigned to moderators with matching skills
- **Priority Detection**: AI sets priority levels (low, medium, high) based on issue severity
- **Helpful Notes**: AI generates technical guidance for moderators

### 👥 User Management
- **Role-Based Access**: Users, Moderators, and Admins with different permissions
- **Skill-Based Matching**: Users can set their technical skills for better ticket routing
- **Profile Management**: Easy skill updates and profile customization

### 📊 Admin Dashboard
- **Real-time Statistics**: Track tickets, users, and system performance
- **User Management**: Create moderators, assign roles, and manage skills
- **Ticket Overview**: Monitor all tickets with status tracking
- **Bulk Operations**: Refresh old tickets and manage assignments

### 🎯 Ticket Workflow
- **Create Tickets**: Simple ticket creation with title and description
- **Status Tracking**: TODO → IN_PROGRESS → DONE → CANCELLED
- **Assignment History**: Track who created and who's assigned to each ticket
- **Email Notifications**: Automatic notifications when tickets are assigned

## 🛠️ Technology Stack

### Backend
- **Node.js + Express**: REST API server
- **MongoDB + Mongoose**: Database for users and tickets
- **JWT Authentication**: Secure user authentication
- **Inngest**: Background job processing for AI analysis
- **Google Gemini AI**: Ticket analysis and categorization
- **Nodemailer**: Email notifications

### Frontend
- **React + Vite**: Modern frontend framework
- **TailwindCSS + DaisyUI**: Beautiful, responsive UI components
- **React Router**: Client-side routing

### AI & Automation
- **Google Gemini API**: Natural language processing for ticket analysis
- **Background Processing**: Non-blocking AI analysis using Inngest
- **Skill Normalization**: Smart matching between AI output and user skills

## 📋 Prerequisites

- **Node.js** (v16 or higher)
- **MongoDB** (local or cloud)
- **Google Gemini API Key**
- **SMTP Email Service** (Mailtrap, Gmail, etc.)

## 🚀 Installation & Setup

### 1. Clone Repository
```bash
git clone https://github.com/Hritikraj8804/AI-ticket-assistant.git
cd ai-ticket-assistant
```

### 2. Backend Setup
```bash
cd ai-ticket-assistant
npm install
```

Create `.env` file in backend directory:
```env
# Database
MONGO_URI=mongodb://localhost:27017/ai-ticket-assistant

# Authentication
JWT_SECRET=your-super-secret-jwt-key

# Email Configuration
MAILTRAP_SMTP_HOST=sandbox.smtp.mailtrap.io
MAILTRAP_SMTP_PORT=2525
MAILTRAP_SMTP_USER=your-mailtrap-user
MAILTRAP_SMTP_PASS=your-mailtrap-password

# AI Configuration
GEMINI_API_KEY=your-google-gemini-api-key

# URLs
APP_URL=http://localhost:3000
FRONTEND_URL=http://localhost:5174
```

### 3. Frontend Setup
```bash
cd ../ai-ticket-frontend
npm install
```

Create `.env` file in frontend directory:
```env
VITE_SERVER_URL=http://localhost:3000/api
```

### 4. Database Setup
- Install and start MongoDB locally, or use MongoDB Atlas
- The application will create collections automatically

## 🏃‍♂️ Running the Application

### Start All Services (4 Terminals)

**Terminal 1 - Database:**
```bash
# Local MongoDB
mongod

# Or using Docker
docker run -d -p 27017:27017 --name mongodb mongo:latest
```

**Terminal 2 - Backend API:**
```bash
cd ai-ticket-assistant
npm run dev
```

**Terminal 3 - Background Jobs:**
```bash
cd ai-ticket-assistant
npm run inngest-dev
```

**Terminal 4 - Frontend:**
```bash
cd ai-ticket-frontend
npm run dev
```

### 5. Access Application
- **Frontend**: http://localhost:5174
- **Backend API**: http://localhost:3000/api
- **Inngest Dashboard**: http://localhost:8288

## 👤 Initial Setup

### Create Admin User
The first user to sign up automatically becomes an admin, or create one manually:

```bash
curl -X POST http://localhost:3000/api/auth/create-admin \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@example.com","password":"securepassword"}'
```

### Create Moderators
Use the admin panel or API to create moderators with skills:

```bash
curl -X POST http://localhost:3000/api/auth/create-moderator \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN" \
  -d '{
    "email":"moderator@example.com",
    "password":"password123",
    "skills":["React","Node.js","MongoDB"]
  }'
```

## 📖 Usage Guide

### For Users
1. **Sign Up**: Create account at `/signup`
2. **Set Skills**: Go to `/profile` and select your technical skills
3. **Create Tickets**: Submit support requests with detailed descriptions
4. **Track Progress**: Monitor your tickets and their status

### For Moderators
1. **Receive Assignments**: Get tickets matching your skills automatically
2. **Email Notifications**: Receive notifications when tickets are assigned
3. **Update Status**: Change ticket status as you work on them
4. **View Details**: Access full ticket information and AI-generated notes

### For Admins
1. **Dashboard**: Monitor system statistics and performance
2. **User Management**: Create moderators, assign roles, manage skills
3. **Ticket Overview**: View all tickets with assignment details
4. **System Maintenance**: Refresh old tickets, manage assignments

## 🔧 Configuration

### AI Settings
- Modify skill detection in `utils/ai.js`
- Adjust priority rules in AI prompts
- Configure skill normalization mapping

### Email Templates
- Customize email templates in `utils/mailer.js`
- Configure SMTP settings for different providers

### UI Customization
- Modify themes in `tailwind.config.js`
- Customize components in DaisyUI

## 🚨 Troubleshooting

### Common Issues

**AI Not Working:**
- Verify Gemini API key is valid
- Check Inngest service is running
- Review backend logs for AI errors

**Tickets Not Assigning:**
- Ensure moderators have matching skills
- Check user roles are set correctly
- Verify skill normalization is working

**Email Not Sending:**
- Validate SMTP configuration
- Check email service credentials
- Review email logs in backend

**Database Connection:**
- Verify MongoDB is running
- Check connection string format
- Ensure database permissions

## 📊 API Endpoints

### Authentication
- `POST /api/auth/signup` - User registration
- `POST /api/auth/login` - User login
- `POST /api/auth/create-admin` - Create admin user
- `POST /api/auth/create-moderator` - Create moderator (admin only)

### Tickets
- `GET /api/tickets` - List tickets (filtered by role)
- `POST /api/tickets` - Create new ticket
- `GET /api/tickets/:id` - Get ticket details
- `PATCH /api/tickets/:id/status` - Update ticket status

### Users
- `GET /api/auth/users` - List all users (admin only)
- `POST /api/auth/update-user` - Update user role/skills (admin only)
- `POST /api/auth/update-profile` - Update own profile
- `POST /api/auth/refresh-tickets` - Refresh old tickets (admin only)

## 🤝 Contributing

1. Fork the repository
2. Create feature branch (`git checkout -b feature/amazing-feature`)
3. Commit changes (`git commit -m 'Add amazing feature'`)
4. Push to branch (`git push origin feature/amazing-feature`)
5. Open Pull Request

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🙏 Acknowledgments

- Google Gemini AI for intelligent ticket analysis
- Inngest for reliable background job processing
- DaisyUI for beautiful UI components
- MongoDB for flexible data storage

---

**Built with ❤️ for efficient ticket management and AI-powered automation**