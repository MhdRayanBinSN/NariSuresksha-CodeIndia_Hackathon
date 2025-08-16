# NariSuraksha - Women's Safety PWA

A comprehensive Progressive Web Application designed to enhance women's safety during night commutes through real-time tracking, emergency alerts, and community reporting.

## 🚀 Problem Statement

Women face significant safety challenges during night-time commutes, with limited tools for real-time protection and emergency response. Traditional safety apps often lack seamless integration, real-time tracking, and reliable notification systems.

## 💡 Solution

NariSuraksha provides a comprehensive safety ecosystem with:

- **Real-time Trip Tracking**: Live location monitoring with automatic SOS triggers
- **Guardian Network**: Instant notifications to trusted contacts during emergencies
- **Community Safety Reports**: Crowdsourced unsafe area identification and mapping
- **Multi-language Support**: Available in English and Hindi
- **Offline Capabilities**: PWA architecture ensures functionality even with poor connectivity
- **WhatsApp Fallback**: Alternative notification system when push notifications fail

## ✨ Key Features

### Core Functionality
- ✅ Phone OTP authentication via Firebase
- ✅ Real-time location tracking with geolocation API
- ✅ Automatic SOS when ETA timer expires
- ✅ Manual emergency trigger
- ✅ Guardian management with push notifications
- ✅ Community unsafe spot reporting with heatmap clustering
- ✅ Multi-language support (EN/HI)
- ✅ Demo mode for testing
- ✅ WhatsApp fallback for blocked notifications
- ✅ PWA installation capabilities

### Technical Features
- ✅ Firebase integration (Auth, Firestore, Cloud Functions, Messaging)
- ✅ Interactive maps using React Leaflet + OpenStreetMap
- ✅ Geospatial clustering using ngeohash
- ✅ Form validation with Zod and React Hook Form
- ✅ State management with React Query
- ✅ Responsive design with Tailwind CSS and shadcn/ui
- ✅ Service worker for offline functionality and FCM
- ✅ High contrast accessibility mode

## 🛠 Tech Stack

### Frontend
- **React 18** with TypeScript
- **Wouter** for routing
- **Tailwind CSS** + **shadcn/ui** for styling
- **React Leaflet** + Leaflet for maps
- **React Query** for state management
- **React Hook Form** + Zod for forms
- **Framer Motion** for animations
- **Lucide React** for icons

### Backend
- **Express.js** server
- **Firebase SDK** (auth, firestore, messaging, functions)
- **ngeohash** for geospatial operations

### PWA Features
- **Service Worker** for offline support
- **Web App Manifest** for installation
- **Push Notifications** via FCM

## 📋 Prerequisites

Before running this application, ensure you have:

1. **Node.js** (v18 or higher)
2. **npm** or **yarn** package manager
3. **Firebase Project** with the following services enabled:
   - Authentication (Phone Sign-in)
   - Firestore Database
   - Cloud Functions
   - Cloud Messaging
4. **Git** for version control

## 🚀 Setup Instructions

### 1. Clone and Install

```bash
git clone <repository-url>
cd narisuraksha
npm install
