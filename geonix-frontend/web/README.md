# GEONIX Web Dashboard

React 18 + TypeScript + Vite + Tailwind CSS + shadcn/ui

## Getting Started

### Prerequisites
- Node.js 18+
- npm or yarn

### Installation

1. Install dependencies:
```bash
cd web
npm install
```

2. Create `.env` file:
```bash
cp .env.example .env
```

3. Update `.env` with your backend URL:
```
VITE_API_URL=http://localhost:8000
VITE_API_TIMEOUT=10000
```

### Development

```bash
npm run dev
```

Open http://localhost:3000 in your browser.

### Build

```bash
npm run build
```

### Type Checking

```bash
npm run type-check
```

### Linting

```bash
npm run lint
```

## Project Structure

```
src/
├── components/        # Reusable components
│   ├── Auth/         # Authentication components
│   ├── Dashboard/    # Dashboard components
│   ├── Attendance/   # Attendance management
│   ├── Reports/      # Reports & analytics
│   ├── Geofencing/   # Geofence management
│   └── Common/       # Common UI components (buttons, cards, etc)
├── pages/            # Page components (full page views)
├── services/         # API service layer
├── store/            # Redux store
│   └── slices/       # Redux slices
├── hooks/            # Custom React hooks
├── types/            # TypeScript type definitions
├── utils/            # Utility functions
├── styles/           # Global styles
└── App.tsx          # Main app component
```

## Features

- ✅ JWT Authentication with token refresh
- ✅ Role-based access control (Admin, Employee)
- ✅ Redux state management
- ✅ TypeScript for type safety
- ✅ shadcn/ui components with Tailwind CSS
- ✅ Responsive design
- ✅ Error handling with toast notifications
- ✅ API interceptors with auto token refresh

## Login Credentials (Demo)

### Admin
- Email: admin@test.com
- Password: testpass123

### Employee
- Email: emp@test.com
- Password: testpass123

## Tech Stack

- **React 18** - UI library
- **TypeScript** - Type safety
- **Vite** - Fast build tool
- **Tailwind CSS** - Styling
- **Redux Toolkit** - State management
- **Axios** - HTTP client
- **React Router** - Navigation
- **shadcn/ui** - Component library
- **react-hot-toast** - Notifications
- **Formik** - Form management
- **Yup** - Form validation
- **Radix UI** - Headless UI components
- **class-variance-authority** - Type-safe component variants
- **tailwind-merge** - Tailwind CSS merge utility

## Next Steps

1. Install dependencies: `npm install`
2. Setup environment variables
3. Run dev server: `npm run dev`
4. Start building dashboard components!

## Available Components (shadcn/ui)

To add more shadcn/ui components, use:
```bash
npx shadcn-ui@latest add [component-name]
```

Popular components:
- Button (done)
- Card
- Dialog
- Dropdown Menu
- Form
- Input
- Table
- Tabs
- Select
- Modal
- Checkbox
- Radio
- And many more...

## Documentation

- [React Documentation](https://react.dev)
- [TypeScript Documentation](https://www.typescriptlang.org)
- [Tailwind CSS Documentation](https://tailwindcss.com)
- [Vite Documentation](https://vitejs.dev)
- [shadcn/ui Documentation](https://ui.shadcn.com)
- [Redux Toolkit Documentation](https://redux-toolkit.js.org)
