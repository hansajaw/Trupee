
# Trupee App

**Trupee** is a comprehensive financial tracking mobile application built with **React Native**, designed to help users manage income, expenses, and loans efficiently. It features intuitive UI components, real-time data visualization, and persistent local data storage for offline capabilities.

---


## 📱 App UI Preview

![Trupee App UI](assets/trupee_ui.png)

This screenshot showcases the main dashboard of the Trupee App, featuring a clean layout with a balance tracker, categorized transaction cards, and intuitive navigation.


## Features

- **Transaction Management**
  - Add, edit, and delete income, expense, or loan transactions
  - Assign categories and notes to transactions
  - Attach receipts and capture geolocation

- **Financial Reports**
  - View real-time charts of income and expenses
  - Analyze cash flow trends with LineChart, PieChart, and BarChart

- **Loan Tracker**
  - Track loans given and taken
  - Mark loans as paid or unpaid

- **Category-Based Budgeting**
  - Define categories with budgets
  - Compare actual spending against plans

- **Themed UI & UX**
  - Light/Dark mode support via context
  - Custom modals and bottom sheets for enhanced interaction

---

## Project Structure

```
Trupee/
├── assets/                # App images and icons
├── components/            # UI components (FAB, charts, cards, etc.)
├── constants/             # App-wide constants
├── context/               # Global context providers (theme, categories, transactions)
├── screens/               # Main app screens (Home, Statistics, FinancialReport, etc.)
├── utils/                 # Utility functions (currency formatting, push notifications)
├── app/                   # Routing and localization
├── .gitignore             # Git ignored files
├── app.config.js          # Expo configuration
├── package.json           # Project dependencies and scripts
└── README.md              # Project documentation
```

---

## Getting Started

### Prerequisites

- Node.js (v14+)
- Expo CLI
- Android Studio or Xcode (for simulators)

### Installation

```bash
git clone https://github.com/your-org/trupee.git
cd trupee
npm install
npx expo start
```

---

## Technologies Used

- **React Native** with **Expo**
- **react-native-chart-kit** for data visualization
- **React Context API** for global state management
- **Firebase** (optional) for cloud features like image storage
- **MapView** and **Location APIs** for geolocation

---

## Contributing

1. Fork the repository
2. Create your branch: `git checkout -b feature-name`
3. Commit changes: `git commit -m "Add feature"`
4. Push to branch: `git push origin feature-name`
5. Open a Pull Request
