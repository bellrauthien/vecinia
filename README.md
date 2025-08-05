# VecinAI - Connecting Seniors with Volunteers

VecinAI is an AI-powered assistant designed to connect seniors with volunteers who can help them with medical appointments, shopping, and other daily needs, making it easier to organize their daily lives in a simple and intuitive way.

## ✨ Project Purpose

The main goal of VecinAI is to offer a user-friendly technological tool that combats loneliness and facilitates the organization of seniors' daily lives, allowing them to maintain their independence and quality of life by connecting them with volunteers willing to help.

## 🚀 Main Features

### For Seniors

- **Appointment Management**: Allows users to create, view, and delete appointments for medical visits, shopping, or any other task.
- **Volunteer Selection**: View volunteer profiles with ratings and select the most suitable one.
- **Appointment Tracking**: Track the status of appointments (pending, accepted, completed).
- **Rating System**: Rate volunteers after completing appointments to help build trust in the community.
- **Virtual Assistant**: Chat with a virtual assistant for help and guidance.

### For Volunteers

- **Request Management**: View and accept requests from seniors in their area.
- **Schedule Management**: Manage accepted appointments and mark them as completed.
- **Profile Management**: Update skills, availability, and contact information.
- **Rating System**: Receive ratings from seniors and build a reputation.
- **Completed Activities**: View history of completed activities and ratings received.

### General Features

- **Modern Interface**: Clean, accessible, and responsive design optimized for all devices.
- **Secure Authentication**: Registration and login system to protect each user's information.
- **Notifications**: Real-time notifications for appointment updates.
- **Accessibility**: High contrast mode, keyboard navigation, and screen reader support.
- **Multilingual Support**: Available in English and Spanish.

## 🎨 New UI/UX Design

The project has been completely redesigned to offer a modern and accessible user experience:

- **Component System**: Cards, buttons, forms, and tabs with consistent styling.
- **Color Palette**: Accessible colors with good contrast ratios.
- **Typography**: Nunito and Poppins fonts for better readability.
- **Iconography**: Font Awesome icons for clear visual cues.
- **Responsive Design**: Complete adaptation to mobile devices, tablets, and desktop.
- **Dark Mode**: Support for system color preferences.

## 🛠️ Technologies Used

- **Frontend**: HTML5, CSS3, JavaScript (Vanilla)
- **UI Framework**: Custom CSS system with responsive design
- **Icons**: Font Awesome 6.4.0
- **Backend**: Node.js, Express.js
- **Database**: SQLite
- **Authentication**: bcrypt
- **Artificial Intelligence**: OpenAI API

## ⚙️ Installation and Local Deployment Guide

Follow these steps to download and run the project in your local environment.

### Prerequisites

Make sure you have [Node.js](https://nodejs.org/) (which includes npm) installed on your system.

### Steps

1. **Clone the repository**:
   ```bash
   git clone https://github.com/bellrauthien/vecinia.git
   cd vecinia
   ```

2. **Install dependencies**:
   Run the following command in the project root to install all necessary libraries.
   ```bash
   npm install
   ```

3. **Configure environment variables**:
   Create a file named `.env` in the project root and add your OpenAI API key.
   ```
   OPENAI_API_KEY='your_api_key_here'
   ```

4. **Start the server**:
   ```bash
   npm start
   ```

5. **Access the application**:
   Open your browser and visit `http://localhost:3000`

## 📁 Project Structure

```
vecinia/
├── assets/                # Images, icons, and other static resources
├── auth.html              # Authentication page
├── auth-style.css         # Styles for authentication pages
├── chat.html              # Virtual assistant chat interface
├── completed_activities.html # Completed activities page for volunteers
├── completed_activities.js  # JavaScript for completed activities
├── completed_history.html # History of completed appointments
├── index.html            # Main entry point
├── login.html            # Login page
├── modern-style.css      # Main stylesheet with modern design
├── new_reminder.html     # Create/edit appointment page
├── new_reminder.js       # JavaScript for appointment creation
├── ratings.js            # Rating system functionality
├── reminder-actions.css  # Styles for reminder actions
├── reminders.html        # Appointments listing page
├── reminders.js          # JavaScript for appointments
├── request-detail.html   # Request details page for volunteers
├── request-detail.js     # JavaScript for request details
├── requests.html         # Requests listing page for volunteers
├── senior_profile.html   # Senior profile page
├── tabs-style.css        # Styles for tab components
├── tabs.js               # Tab functionality
└── volunteer_profile.html # Volunteer profile page
```

## 👥 User Flows

### Senior User Flow

1. **Registration/Login**: Senior creates an account or logs in
2. **Dashboard**: Views pending, accepted, and completed appointments
3. **Create Appointment**: Creates a new appointment with details
4. **Appointment Management**: Tracks status of appointments
5. **Complete & Rate**: Marks appointments as complete and rates volunteers

### Volunteer User Flow

1. **Registration/Login**: Volunteer creates an account or logs in
2. **Dashboard**: Views available requests and accepted appointments
3. **Request Management**: Accepts or declines requests from seniors
4. **Appointment Fulfillment**: Assists seniors with their needs
5. **Completion**: Marks appointments as complete

## 🔄 Recent Improvements

- **New UI/UX Design**: Complete implementation of a modern and accessible design.
- **Tab System**: Better organization of content in logical sections.
- **Rating Flow**: Improvement in the process of completing tasks and rating volunteers.
- **Bug Fixes**: Solution to the problem of duplicate completed activities.
- **Accessibility Improvements**: Higher contrast, more readable typography, and screen reader support.

## 🤝 Contributing

We welcome contributions to VecinAI! To contribute:

1. Fork the repository
2. Create a branch for your feature: `git checkout -b feature/my-feature`
3. Commit your changes: `git commit -m 'Add my feature'`
4. Push to the branch: `git push origin feature/my-feature`
5. Submit a pull request

### Coding Standards

- Use meaningful variable and function names
- Add comments for complex logic
- Follow the existing code style
- Write tests for new features

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

---

Developed with ❤️ by the VecinAI Team
