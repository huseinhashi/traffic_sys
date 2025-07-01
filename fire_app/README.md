# Fire Emergency Mobile App

A Flutter mobile application for fire emergency response and management.

## Overview

The Fire Emergency mobile app provides functionality for both clients and staff:

### For Clients

- Register and login to the system
- Report fire emergencies with location and details
- Track the status of their emergency reports
- View assigned staff and their status

### For Staff

- View and manage assigned emergencies
- Update the status of emergency assignments
- Navigate to emergency locations
- View completed emergency history

## Technical Details

- Built with Flutter for cross-platform compatibility (iOS and Android)
- Uses Firebase for authentication and database
- Implements real-time updates with websockets
- Integrates with mapping services for location tracking
- Connects to a Node.js + Express backend API

## Getting Started

1. Clone the repository
2. Install Flutter (see [Flutter installation](https://docs.flutter.dev/get-started/install))
3. Run `flutter pub get` to install dependencies
4. Configure your environment variables (see `.env.example`)
5. Run the app with `flutter run`

## Architecture

The app follows a clean architecture approach with:

- Providers for state management
- Services for API communication
- Models for data structures
- Screens and widgets for UI

## Backend

This app connects to a Node.js/Express backend with MySQL database through a RESTful API.
