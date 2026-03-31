# EventConnect

**EventConnect** is a web application that helps users **search for events, concerts, and holidays** happening locally or worldwide. It integrates with **Ticketmaster** for event data and **Nager.Date API** for public holidays. Users can filter by city, category, and date, and see event details with images, price, and venue info.

---

## Table of Contents

- [Features](#features)  
- [Tech Stack](#tech-stack)  
- [Installation](#installation)  
- [Usage](#usage)  
- [API](#api)  
- [Folder Structure](#folder-structure)  
- [Future Improvements](#future-improvements)  
- [License](#license)  

---

## Features

- Search for events by keyword, city, category, or date.  
- View event details: name, date, time, venue, city, country, category, genre, price, image, and URL.  
- Pagination for browsing multiple pages of events.  
- Tab to view public holidays by country and year.  
- Responsive, mobile-friendly layout.  
- Error handling and loading indicators for better UX.

---

## Tech Stack

- **Frontend:** HTML, CSS, JavaScript  
- **Backend:** Node.js, Express.js  
- **APIs:**  
  - **Ticketmaster Discovery API** – fetches events from **North America, Europe, parts of Asia and Australia**.  
  - **Nager.Date API** – public holidays & countries worldwide.  
- **Others:** Axios for HTTP requests, CORS, dotenv for environment variables

---

## Installation

1. **Clone the repository:**

```bash
git clone https://github.com/nlydivine/eventconnect.git
cd eventconnect

Backend setup: 
cd backend 
npm install

Frontend setup: 
cd ../frontend 
# no special setup needed for HTML/JS/CSS

Environment variables: 
Create a .env file in backend/:
 TICKETMASTER_API_KEY=your_ticketmaster_api_key_here
 PORT=3000

Run the server:
cd backend
node server.js

The backend will start at http://localhost:3000.


How to Access

There are two ways to access EventConnect:

Locally (for development or testing):
Follow the Installation
 steps above.
Open frontend/index.html in your browser.
The frontend will automatically connect to the backend running on http://localhost:3000.

Via your domain:
If deployed on a domain (e.g., https://lydivine.tech), users can access the app directly by visiting the URL.
No local setup is needed for users.
Ensure the backend API is running and accessible from the internet.
HTTPS is recommended with a valid SSL certificate for security.
Open the frontend:

Open frontend/index.html in your browser. It will connect to the backend automatically.

Usage

Enter a keyword (event name), city, or select a category.
Press Enter or change the sort dropdown to search.
Switch to the Holidays tab to view public holidays for any country/year.
Click event cards to visit the Ticketmaster page for tickets.
Use the pagination buttons to navigate through multiple pages.

DEMO Video Link:
https://youtu.be/nW11AODZQ4A

