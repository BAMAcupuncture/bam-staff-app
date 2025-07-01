# BAM Acupuncture Task Management System v2.0

A secure, modern, and robust task management application built specifically for BAM Acupuncture clinic. This is a complete rebuild of the original system with enhanced security, improved architecture, and better user experience.

## 🚀 Key Improvements in v2.0

### Security Enhancements
- **Environment Variables**: Firebase configuration now uses secure environment variables instead of hard-coded keys
- **Unified Architecture**: Single React SPA eliminates security vulnerabilities from the previous dual-app structure
- **Secure Authentication**: Streamlined Firebase authentication with proper error handling

### Technical Improvements
- **Modern React Router**: Client-side routing for seamless navigation
- **Enhanced Notifications**: Clean in-app notification system replaces browser alerts
- **Improved Data Model**: Consistent Firestore data structure for reliable profile loading
- **Better Error Handling**: Comprehensive error handling throughout the application

### User Experience
- **Responsive Design**: Mobile-first design that works on all devices
- **Intuitive Navigation**: Clean, modern interface with clear navigation
- **Real-time Updates**: Live data synchronization across all users
- **Professional UI**: Production-ready design with attention to detail

## 🔧 Setup Instructions

### 1. Environment Configuration (CRITICAL)

Create a `.env` file in the root directory with your Firebase credentials:

```env
VITE_FIREBASE_API_KEY="your-api-key"
VITE_FIREBASE_AUTH_DOMAIN="your-auth-domain"
VITE_FIREBASE_PROJECT_ID="your-project-id"
VITE_FIREBASE_STORAGE_BUCKET="your-storage-bucket"
VITE_FIREBASE_MESSAGING_SENDER_ID="your-sender-id"
VITE_FIREBASE_APP_ID="your-app-id"
VITE_FIREBASE_MEASUREMENT_ID="your-measurement-id"
```

**Important**: 
- The `VITE_` prefix is required by Vite
- Never commit the `.env` file to version control
- Add the same variables to your Netlify deployment settings

### 2. Firestore Data Model

For reliable operation, ensure your Firestore `team` collection follows this structure:

- **Document ID**: Must be the user's Firebase Authentication UID
- **Required Fields**:
  ```json
  {
    "name": "User Full Name",
    "email": "user@example.com",
    "role": "Admin" | "Staff",
    "uid": "firebase-auth-uid",
    "status": "active",
    "phone": "optional-phone-number"
  }
  ```

### 3. Local Development

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Open http://localhost:5173
```

### 4. Deployment

The application is configured for Netlify deployment:

1. Push code to your GitHub repository
2. Connect repository to Netlify
3. Configure environment variables in Netlify settings
4. Deploy automatically with the included `netlify.toml` configuration

## 🏗️ Architecture

### Core Technologies
- **React 18** with TypeScript for type safety
- **Firebase v10** for authentication and database
- **React Router v6** for client-side routing
- **Tailwind CSS** for styling
- **Vite** for fast development and building

### Key Features
- **Dashboard**: Overview of tasks, goals, and team activity
- **Task Management**: Create, assign, and track tasks with priorities
- **Calendar View**: Visual calendar with task scheduling
- **Goals System**: Set and track business objectives
- **Team Management**: User roles and permissions
- **Analytics**: Performance metrics and insights
- **To-Do Lists**: Specialized lists for different workflows

### Security Features
- Environment-based configuration
- Role-based access control
- Secure Firebase authentication
- Protected routes and data access

## 📱 User Roles

### Admin
- Full access to all features
- Team member management
- Analytics and reporting
- System configuration

### Staff
- Task management
- Calendar access
- Goal tracking
- Personal to-do lists

## 🔒 Security Best Practices

1. **Environment Variables**: All sensitive configuration is stored in environment variables
2. **Authentication**: Firebase Authentication with secure session management
3. **Authorization**: Role-based access control throughout the application
4. **Data Validation**: Input validation and sanitization
5. **HTTPS**: All communications encrypted via Firebase and Netlify

## 🚀 Deployment

The application includes production-ready configuration:

- **Build Optimization**: Vite optimizes the build for production
- **CDN Distribution**: Netlify provides global CDN distribution
- **Automatic Deployments**: Git-based deployment workflow
- **Environment Management**: Separate environment configurations

## 📊 Monitoring

- **Real-time Data**: Live updates via Firebase Firestore
- **Error Handling**: Comprehensive error catching and user feedback
- **Performance**: Optimized loading and caching strategies
- **Analytics**: Built-in usage analytics and reporting

## 🤝 Support

For technical support or questions about the BAM Acupuncture Task Management System:

1. Check the application's built-in help documentation
2. Review the setup instructions in this README
3. Contact your system administrator for access issues

---

**Built with modern web technologies for BAM Acupuncture clinic**