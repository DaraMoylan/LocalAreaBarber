# LocalAreaBarber

A web application that connects customers with barbers. Barbers can manage their services and view appointments, while customers can browse barbers, book appointments, and manage their bookings.

## Tech Stack

- **Backend**: Node.js, Express.js
- **Database**: SQLite (via better-sqlite3)
- **Authentication**: JWT (JSON Web Tokens)
- **Frontend**: HTML, CSS, JavaScript
- **Password Hashing**: bcrypt

## Features

### For Customers
- Register and log in
- Browse available barbers
- View a barber's services with prices and durations
- Book appointments with time slot conflict prevention
- View upcoming bookings
- Cancel bookings

### For Barbers
- Register and log in
- Create, edit, and delete services
- View customer bookings and appointment details

## Getting Started

### Prerequisites
- [Node.js](https://nodejs.org/) installed on your machine

### Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/DaraMoylan/LocalAreaBarber.git
   cd LocalAreaBarber
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Create a `.env` file in the root directory:
   ```
   JWT_SECRET=your_secret_key_here
   ```

4. Start the server:
   ```bash
   node server.js
   ```

5. Open your browser and visit:
   ```
   http://localhost:8080
   ```

## API Endpoints

### Authentication
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/register` | Create a new account |
| POST | `/login` | Log in and receive a JWT token |

### Barber Services (requires barber auth)
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/services` | Create a new service |
| GET | `/services` | View your own services |
| PUT | `/services/:id` | Update a service |
| DELETE | `/services/:id` | Delete a service |

### Public Browsing
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/barbers` | List all barbers |
| GET | `/barbers/:id/services` | View a barber's services |

### Bookings (requires auth)
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/bookings` | Create a booking |
| GET | `/bookings` | View your bookings (customer) |
| GET | `/barber/bookings` | View your bookings (barber) |
| PATCH | `/bookings/:id` | Cancel a booking |

## Project Structure

```
LocalAreaBarber/
├── server.js              # Express server and API routes
├── middleware/
│   └── auth.js            # JWT authentication middleware
├── database/
│   └── barbers.db         # SQLite database
├── public/
│   ├── index.html         # Redirect to login
│   ├── login.html         # Login and registration page
│   ├── customer-dashboard.html
│   ├── barber-dashboard.html
│   ├── css/
│   │   └── styles.css
│   └── js/
│       ├── login.js
│       ├── customer.js
│       └── barber.js
├── .env                   # Environment variables (not tracked)
├── .gitignore
├── package.json
└── README.md
```
