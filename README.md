# Openr

**Openr** is a web application that helps University of Waterloo students quickly find available classrooms across campus 🏫. When libraries and popular study spaces are full, Openr offers an easy way to locate open classrooms in real time, making it simpler to find a quiet place to study or meet.

By combining official scheduling data with an interactive campus map, Openr provides a clear and intuitive view of classroom availability throughout the day.

## ✨ Features

- 🏫 Displays available classrooms across the University of Waterloo campus  
- ⏱️ Real-time classroom availability based on official schedules  
- 🗺️ Interactive campus map with clear visual status indicators  
- 📋 List view of buildings and rooms with current time windows  

## 🛠️ Tech Stack

### Frontend

- ⚛️ **Next.js** – React-based framework for building the frontend and handling routing
- 🗺️ **Mapbox GL JS** – Interactive campus map visualization
- 🎨 **Tailwind CSS** – Utility-first styling for a clean and responsive UI
- 📍 **Geolocation API** – Sorts buildings by proximity to the user

### Backend

- 🐍 **Flask** – Lightweight Python backend for API handling
- 🌐 **Requests** – Fetches official classroom data from external APIs
- 📏 **Haversine Formula** – Calculates distance between the user and buildings

## 🚀 Future Enhancements

- ⭐ Save favorite classrooms
- 🔔 Availability notifications for upcoming openings
- 📆 Improved schedule awareness for better accuracy