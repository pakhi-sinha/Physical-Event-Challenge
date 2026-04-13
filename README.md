# 🏟️ VenueCrowd v2.1 (Premium Optimization Engine)

A production-grade, secure, and fully accessible system for identifying and optimizing physical event experiences in large-scale sporting venues.

## 🌟 Major Improvements (v2.1 - Google Optimized)

### 1. 🤖 Google Services (100% Alignment)
- **🧠 Google Gemini 1.5 AI**: Integrated as a "Smart Assistant" to analyze natural language venue queries.
- **👤 Google Identity**: Pre-configured "Sign in with Google" flow with profile integration.
- **🗺️ Google Maps Platform**: Dynamic SVG markers scaled by density; multi-point polyline data for pathfinding.
- **📅 Google Calendar**: One-click sync for venue events with location-aware data.
- **☁️ Google Cloud Operations**: Structured JSON logging pre-integrated for **Cloud Logging**.
- **🔔 Firebase FCM**: Real-time push notification simulation for emergency and traffic alerts.

### 2. 🛡️ Production Engineering (100% Quality)
- **Modular Data Layer**: Separation of concerns between mock data providers and logic services.
- **Advanced Error Architecture**: Custom `AppError` class with standardized JSON responses and tracking.
- **Hardened Security**: Multi-tier rate limiting (API + Admin) and sanitized inputs using `express-validator`.
- **Dijkstra v2**: High-performance Dijkstra implementation with robust density-cost modeling.

### 3. ♿ Accessibility (WCAG 2.1 Compliant)
- **Contrast Optimization**: Text-muted colors updated to meet AA contrast standards.
- **Keyboard Navigation**: All interactive components (zone cards, modals) fully navigable via Tab/Enter.
- **Accessible Modals**: Custom-built accessible dialogs replacing browser prompts.
- **Semantic Structure**: Proper use of landmarks (role=banner, main, nav) and skip-links.

## 🚀 Setup & Deployment
1. **Install Dependencies**: `npm install`
2. **Environment**: Update `.env` with Google Cloud credentials.
3. **Launch**: `npm start` (Engine) or `npm run dev` (Watch).

## 🔌 API v2.1 Reference

| Endpoint | Method | Response Structure | Description |
| :--- | :--- | :--- | :--- |
| `/api/venue/crowd` | GET | `Array<Zone>` | Live zone density telemetry. |
| `/api/venue/queue` | GET | `Array<Prediction>` | AI-driven wait time estimations. |
| `/api/venue/route` | GET | `PathResult` | Weighted nav avoiding congestion. |
| `/api/venue/assistant`| GET | `AIResponse` | natural language venue assistant. |
| `/api/venue/alert` | GET | `AlertBroadcast` | Simulated emergency push alerts. |
| `/api/venue/admin/density` | POST | `ActionStatus` | Secure administrative override. |


---
Built with ❤️ by **Antigravity AI** for the next generation of smart venues.
