import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { FinanceProvider } from './context/FinanceContext.tsx';
import './index.css';
import App from './App.tsx';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <FinanceProvider>
      <App />
    </FinanceProvider>
  </StrictMode>,
);
