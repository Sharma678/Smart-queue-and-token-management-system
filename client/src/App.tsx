import React, { useState } from 'react';
import './App.css';
import CustomerView from './components/CustomerView';
import AdminPanel from './components/AdminPanel';

function App() {
  const [view, setView] = useState<'customer' | 'admin'>('customer');

  return (
    <div className="App">
      <header className="app-header">
        <h1>Queue Management System</h1>
        <nav className="nav-tabs">
          <button 
            className={view === 'customer' ? 'active' : ''}
            onClick={() => setView('customer')}
          >
            Customer View
          </button>
          <button 
            className={view === 'admin' ? 'active' : ''}
            onClick={() => setView('admin')}
          >
            Admin Panel
          </button>
        </nav>
      </header>
      
      <main>
        {view === 'customer' ? <CustomerView /> : <AdminPanel />}
      </main>
    </div>
  );
}

export default App;
