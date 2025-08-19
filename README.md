# MERN Inventory Assignment

## Quick Start

### Server
```bash
cd server
cp .env.example .env
# edit .env to set MONGO_URI if needed
npm install
npm run dev
```
Server runs at `http://localhost:5000`

### Client
```bash
cd client
npm install
npm run dev
```
Client runs at Vite dev URL (usually `http://localhost:5173`).

## CSV format
Headers (case-insensitive accepted): `name, unit, category, brand, stock, image`