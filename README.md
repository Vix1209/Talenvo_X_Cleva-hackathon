# Edulite - Educational Platform with Offline Learning Support

<p align="center">
  <img src="https://via.placeholder.com/200x200?text=Edulite" width="200" alt="Edulite Logo" />
</p>

<p align="center">A modern educational platform built with NestJS that supports offline learning, progress tracking, and real-time updates.</p>

## Table of Contents

- [Overview](#overview)
- [Features](#features)
- [API Documentation](#api-documentation)
  - [Course Management](#course-management)
  - [Downloadable Resources](#downloadable-resources)
  - [Progress Tracking](#progress-tracking)
  - [Offline Access](#offline-access)
- [System Flows](#system-flows)
  - [Content Creation Flow](#content-creation-flow)
  - [Learning Flow (Online)](#learning-flow-online)
  - [Offline Access Flow](#offline-access-flow)
  - [Real-time Update Flow](#real-time-update-flow)
  <!-- - [Frontend Implementation](#frontend-implementation)
  - [Offline Storage](#offline-storage)
  - [Progress Tracking](#progress-tracking-1)
  - [Synchronization](#synchronization) -->
- [Setup and Installation](#setup-and-installation)
- [Development](#development)
- [Testing](#testing)
- [Deployment](#deployment)

## Overview

Edulite is an educational platform designed to provide seamless learning experiences both online and offline. The system allows teachers to create courses with downloadable resources, enables students to access these courses offline, tracks progress across devices, and synchronizes data when connectivity is restored.

## Features

- **Course Management**: Create, update, and delete courses with rich content
- **Downloadable Resources**: Add, update, and manage resources for offline access
- **Progress Tracking**: Track student progress across courses
- **Offline Access**: Download courses for offline learning
- **Progress Synchronization**: Sync progress made offline when back online
- **Real-time Updates**: Receive notifications about course changes via WebSockets
- **Device Awareness**: Track and manage content across multiple devices
- **Role-Based Access**: Separate teacher and student permissions
- **Email Notifications**: Automated email communications for user events
- **File Upload**: Secure file uploads with Cloudinary integration
- **Storage Management**: Client-side storage validation and management
- **Category Management**: Organize courses by categories
- **Quiz System**: Interactive quizzes with submission tracking
- **Comment System**: Course-specific discussions and feedback
- **Additional Resources**: Supplementary materials for courses

## API Documentation

### Course Management

#### Create Course

- **Endpoint**: `POST /courses`
- **Access**: Teachers only
- **Purpose**: Creates a new course
- **Request Body**: `CreateCourseDto` (title, description, videoUrl, topics, duration, userId)
- **Response**: Created course object

#### Get All Courses

- **Endpoint**: `GET /courses`
- **Access**: All authenticated users
- **Purpose**: Retrieves all available courses
- **Response**: Array of course objects with related entities

#### Get Course by ID

- **Endpoint**: `GET /courses/:id`
- **Access**: All authenticated users
- **Purpose**: Retrieves detailed information about a specific course
- **Response**: Course object with related entities

#### Update Course

- **Endpoint**: `PATCH /courses/:id`
- **Access**: Teachers only
- **Purpose**: Updates course information
- **Request Body**: `UpdateCourseDto` (partial course properties)
- **Response**: Updated course object

#### Delete Course

- **Endpoint**: `DELETE /courses/:id`
- **Access**: Teachers only
- **Purpose**: Deletes a course
- **Response**: No content (204)

### Downloadable Resources

#### Add Downloadable Resource

- **Endpoint**: `POST /courses/:courseId/resources`
- **Access**: Teachers only
- **Purpose**: Adds a downloadable resource to a course
- **Request Body**: `CreateDownloadableResourceDto` (name, url, type, size)
- **Response**: Created resource object

#### Update Downloadable Resource

- **Endpoint**: `PATCH /courses/resources/:id`
- **Access**: Teachers only
- **Purpose**: Updates an existing downloadable resource
- **Request Body**: `UpdateDownloadableResourceDto` (partial resource properties)
- **Response**: Updated resource object

#### Delete Downloadable Resource

- **Endpoint**: `DELETE /courses/resources/:id`
- **Access**: Teachers only
- **Purpose**: Removes a downloadable resource
- **Response**: No content (204)

### Progress Tracking

#### Update Progress

- **Endpoint**: `POST /courses/progress`
- **Access**: All authenticated users
- **Purpose**: Tracks a student's progress through a course
- **Request Body**: `UpdateProgressDto` (userId, courseId, progressPercentage, isCompleted, lastPosition)
- **Response**: Updated progress object

#### Get User's Progress Across All Courses

- **Endpoint**: `GET /courses/progress/user/:userId`
- **Access**: Authenticated user (own progress) or admin
- **Purpose**: Retrieves a student's progress across all courses
- **Response**: Array of progress objects with related course information

#### Get User's Progress for a Specific Course

- **Endpoint**: `GET /courses/progress/:courseId/user/:userId`
- **Access**: Authenticated user (own progress) or admin
- **Purpose**: Retrieves a student's progress for a specific course
- **Response**: Progress object for the specified course

### Offline Access

#### Download Course

- **Endpoint**: `POST /courses/download`
- **Access**: All authenticated users
- **Purpose**: Initiates the process of downloading a course for offline access
- **Request Body**: `DownloadCourseDto` (userId, courseId, deviceInfo)
- **Response**: Course and progress information

#### Sync Offline Progress

- **Endpoint**: `POST /courses/sync`
- **Access**: All authenticated users
- **Purpose**: Synchronizes progress made while offline back to the server
- **Request Body**: `SyncOfflineProgressDto` (userId, courseId, progressPercentage, isCompleted, lastPosition, deviceInfo, lastModifiedOffline)
- **Response**: Updated progress object

### Authentication

#### Register User

- **Endpoint**: `POST /auth/register`
- **Access**: Public
- **Purpose**: Register a new user
- **Request Body**: `RegisterDto` (firstName, lastName, email, password, role)
- **Response**: Created user object with verification token

#### Login User

- **Endpoint**: `POST /auth/login`
- **Access**: Public
- **Purpose**: Authenticate user and get access token
- **Request Body**: `LoginDto` (email, password)
- **Response**: JWT token and user information

#### Verify Email

- **Endpoint**: `GET /auth/verify-email`
- **Access**: Public
- **Purpose**: Verify user's email address
- **Query Parameters**: token, email
- **Response**: Success message

#### Reset Password

- **Endpoint**: `POST /auth/reset-password`
- **Access**: Public
- **Purpose**: Request password reset
- **Request Body**: `ResetPasswordDto` (email)
- **Response**: Success message

### User Management

#### Get User Profile

- **Endpoint**: `GET /users/profile`
- **Access**: Authenticated users
- **Purpose**: Get current user's profile
- **Response**: User profile object

#### Update User Profile

- **Endpoint**: `PATCH /users/profile`
- **Access**: Authenticated users
- **Purpose**: Update user profile information
- **Request Body**: `UpdateUserDto` (partial user properties)
- **Response**: Updated user object

### Category Management

#### Create Category

- **Endpoint**: `POST /courses/categories`
- **Access**: Teachers and admins
- **Purpose**: Create a new course category
- **Request Body**: `CreateCategoryDto` (name, description)
- **Response**: Created category object

#### Get Categories

- **Endpoint**: `GET /courses/categories`
- **Access**: All authenticated users
- **Purpose**: Get all course categories
- **Response**: Array of category objects

#### Update Category

- **Endpoint**: `PATCH /courses/categories/:id`
- **Access**: Teachers and admins
- **Purpose**: Update category information
- **Request Body**: `UpdateCategoryDto` (partial category properties)
- **Response**: Updated category object

#### Delete Category

- **Endpoint**: `DELETE /courses/categories/:id`
- **Access**: Teachers and admins
- **Purpose**: Delete a category
- **Response**: No content (204)

### Quiz Management

#### Create Quiz

- **Endpoint**: `POST /courses/:courseId/quizzes`
- **Access**: Teachers and admins
- **Purpose**: Create a new quiz for a course
- **Request Body**: `CreateQuizDto` (title, questions, duration)
- **Response**: Created quiz object

#### Submit Quiz

- **Endpoint**: `POST /courses/quizzes/:quizId/submit`
- **Access**: All authenticated users
- **Purpose**: Submit answers for a quiz
- **Request Body**: `SubmitQuizDto` (answers)
- **Response**: Quiz submission result

## System Flows

### Content Creation Flow

```
Teacher creates course → Teacher adds downloadable resources → Course becomes available for offline access
```

1. Teachers create courses with basic information
2. They add downloadable resources (PDFs, videos, etc.)
3. The system automatically marks courses as offline accessible
4. WebSocket notifications alert students about new or updated content

### Learning Flow (Online)

```
Student browses courses → Student selects course → Student consumes content → System tracks progress
```

1. Students browse the course catalog
2. They select courses to view details
3. They consume content (videos, resources)
4. The system continuously tracks their progress
5. WebSocket notifications keep progress in sync across devices

### Offline Access Flow

```
Student initiates download → Backend records download → Frontend downloads resources → Student consumes offline → Progress is tracked locally → Student comes online → Progress syncs to server
```

1. **Download Initiation**:

   - Student clicks "Download for Offline Access"
   - Backend records the download event and device information
   - Frontend receives course and resource information

2. **Resource Download**:

   - Frontend downloads all resources (videos, PDFs, etc.)
   - Frontend stores course data and resources locally
   - Frontend tracks download progress

3. **Offline Consumption**:

   - Student accesses course without internet
   - Content is loaded from local storage
   - Progress is tracked locally
   - Changes are queued for synchronization

4. **Synchronization**:
   - When internet connection returns
   - Frontend sends queued progress updates to server
   - Backend updates progress records
   - Backend records sync information
   - WebSocket notifications update other devices

### Real-time Update Flow

```
Change occurs (new resource, progress update) → WebSocket notification → Connected clients update
```

1. When changes occur (new resources, progress updates)
2. WebSocket service emits events
3. Connected clients receive notifications
4. Clients update their UI or data accordingly
5. This ensures a consistent experience across devices

### Category Management Flow

```
Category Creation → Course Association → Category Updates → Course Reorganization
```

1. Admin/Teacher creates a category
2. Courses are assigned to categories
3. Categories can be updated or deleted
4. Course organization is maintained
5. Users can filter courses by category

<!-- ## Frontend Implementation

### Offline Storage

The frontend uses a combination of storage mechanisms:

1. **IndexedDB**: For structured course data and progress information

   ```javascript
   // Store course data
   async function storeCourseOffline(course) {
     const db = await openDatabase();
     await db
       .transaction('courses', 'readwrite')
       .objectStore('courses')
       .put(course);
   }
   ```

2. **Cache API**: For course resources (videos, PDFs, etc.)

   ```javascript
   // Cache resources
   async function cacheResources(resources) {
     const cache = await caches.open('course-resources');
     for (const resource of resources) {
       await cache.put(resource.url, await fetch(resource.url));
     }
   }
   ```

3. **LocalStorage**: For user preferences and small metadata
   ```javascript
   // Save user preferences
   function savePreferences(preferences) {
     localStorage.setItem('userPreferences', JSON.stringify(preferences));
   }
   ```

### Progress Tracking

Progress is tracked both online and offline:

```javascript
// Handle video progress updates
async function handleVideoProgress(videoData) {
  const { currentTime, duration, isCompleted } = videoData;
  const progressPercentage = Math.round((currentTime / duration) * 100);

  // Update local state
  setProgress(progressPercentage);

  // Create progress data
  const progressData = {
    userId: currentUser.id,
    courseId: course.id,
    progressPercentage,
    lastPosition: currentTime,
    isCompleted: isCompleted || progressPercentage >= 100,
  };

  // If online, send to server immediately
  if (navigator.onLine) {
    try {
      await updateProgressOnServer(progressData);
    } catch (error) {
      // If server update fails, store locally
      await storeProgressLocally(progressData);
    }
  } else {
    // If offline, store locally and queue for sync
    await storeProgressLocally(progressData);
  }
}
```

### Synchronization

When coming back online, the system synchronizes offline changes:

```javascript
// Sync offline data
async function syncOfflineData() {
  const db = await openDatabase();
  const syncItems = await db
    .transaction('syncQueue')
    .objectStore('syncQueue')
    .getAll();

  for (const item of syncItems) {
    try {
      if (item.type === 'progress') {
        await syncProgressToServer(item.data);
      }

      // Remove from queue after successful sync
      await db
        .transaction('syncQueue', 'readwrite')
        .objectStore('syncQueue')
        .delete(item.id);
    } catch (error) {
      // Leave in queue to try again later
      console.error(`Failed to sync item ${item.id}:`, error);
    }
  }
}
``` -->

## Setup and Installation

```bash
# Clone the repository
$ git clone https://github.com/Vix1209/Talenvo_X_Cleva-hackathon.git

# Install dependencies
$ npm install

# Set up environment variables
$ cp .env.example .env
# Edit .env with your configuration

# Run database migrations
$ npm run migration:run

# Start the development server
$ npm run start
```

## Development

```bash
# Run in development mode with hot-reload
$ npm run dev

# Lint the code
$ npm run lint

# Format the code
$ npm run format
```

## Testing

```bash
# Run unit tests
$ npm run test

# Run e2e tests
$ npm run test:e2e

# Generate test coverage
$ npm run test:cov
```

## Deployment

```bash
# Build for production
$ npm run build

# Start production server
$ npm run start:prod
```

---

Built with ❤️ by [Uchenna Ofor](https://github.com/Vix1209) using [NestJS](https://nestjs.com/), a Node.js Framework
