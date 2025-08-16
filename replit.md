# NariSuraksha - Women's Safety PWA

## Overview

NariSuraksha is a comprehensive Progressive Web Application designed to enhance women's safety during night commutes through real-time tracking, emergency alerts, and community reporting. The application provides a complete safety ecosystem with trip tracking, automatic SOS triggers, guardian notification systems, and community-driven unsafe area reporting with heatmap visualization.

The system is built as a mobile-first PWA with offline capabilities, multi-language support (English/Hindi), and demo mode for testing purposes. Core features include phone OTP authentication, real-time location tracking, automatic emergency alerts when ETA timers expire, guardian management with push notifications, and crowdsourced safety reporting with geospatial clustering.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture
- **Framework**: React 18 with TypeScript for type safety and modern component patterns
- **Routing**: Wouter for lightweight client-side routing with minimal bundle size
- **UI Components**: shadcn/ui component library built on Radix UI primitives with Tailwind CSS for consistent styling
- **State Management**: React Query for server state management and caching, with React Context for global app state
- **Maps Integration**: React Leaflet with OpenStreetMap tiles for mapping functionality without requiring paid API keys
- **PWA Features**: Service worker implementation for offline functionality and push notification support

### Backend Architecture
- **Server**: Express.js with TypeScript for API endpoints and middleware
- **Database Schema**: Drizzle ORM with PostgreSQL for type-safe database operations
- **Data Storage**: In-memory storage implementation with interface-based design for easy migration to persistent storage
- **API Design**: RESTful endpoints for CRUD operations on users, trips, incidents, and reports

### Authentication and Authorization
- **Firebase Authentication**: Phone OTP-based authentication for secure user verification
- **User Roles**: Support for "commuter", "guardian", or "both" role types
- **Session Management**: Firebase Auth state management with persistent sessions

### Real-time Features
- **Location Tracking**: Browser Geolocation API with fallback and demo mode simulation
- **Push Notifications**: Firebase Cloud Messaging (FCM) for real-time guardian alerts
- **WhatsApp Fallback**: Alternative notification system when push notifications are blocked
- **Live Trip Monitoring**: Continuous location updates with configurable intervals

### Geospatial Processing
- **Location Services**: Browser Geolocation API with high accuracy positioning
- **Geospatial Indexing**: ngeohash for efficient spatial data clustering and queries
- **Heatmap Generation**: Client-side clustering of unsafe area reports for visualization
- **Demo Mode**: Simulated location updates for testing without GPS dependencies

### Internationalization
- **Multi-language Support**: English and Hindi language support with JSON-based message files
- **Localized Content**: User interface, error messages, and notifications in preferred language
- **Persistent Language Settings**: User language preference stored in localStorage

### Accessibility and UX
- **Mobile-First Design**: Responsive design optimized for mobile devices
- **High Contrast Mode**: Accessibility option for users with visual impairments
- **Offline Capabilities**: Service worker caching for core functionality without network
- **Progressive Enhancement**: Works on basic browsers with enhanced features on modern devices

## External Dependencies

### Firebase Services
- **Firebase Authentication**: Phone OTP verification and user session management
- **Firebase Firestore**: Real-time document database for user profiles and app data
- **Firebase Cloud Messaging**: Push notification delivery to guardian devices
- **Firebase Cloud Functions**: Server-side processing for notifications and data validation

### Database and Storage
- **PostgreSQL**: Primary database through Neon serverless hosting
- **Drizzle ORM**: Type-safe database operations and schema management
- **Database Migrations**: Version-controlled schema changes through Drizzle Kit

### Mapping and Location Services
- **OpenStreetMap**: Free map tiles for displaying interactive maps
- **React Leaflet**: React wrapper for Leaflet mapping library
- **Browser Geolocation API**: Native location services for position tracking
- **ngeohash**: Geospatial hashing library for efficient location-based queries

### Development and Build Tools
- **Vite**: Fast development server and build tool for modern web apps
- **TypeScript**: Static type checking for improved code quality and developer experience
- **Tailwind CSS**: Utility-first CSS framework for rapid UI development
- **ESBuild**: Fast bundling for production builds

### UI and Component Libraries
- **Radix UI**: Unstyled, accessible component primitives
- **shadcn/ui**: Pre-styled component collection built on Radix UI
- **Lucide React**: Icon library for consistent iconography
- **React Hook Form**: Form handling with validation and error management
- **Zod**: Schema validation for form inputs and API data

### Hosting and Deployment
- **Replit**: Development environment and potential hosting platform
- **Neon Database**: Serverless PostgreSQL hosting with automatic scaling
- **Service Worker**: PWA capabilities for offline functionality and app installation