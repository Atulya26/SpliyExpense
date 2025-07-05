import React from 'react';
import { Plus, User } from 'lucide-react';

const Header = ({ userName = '', onNewGroup = () => {}, onAddExpense = () => {} }) => (
  <header className="w-full bg-white shadow-md rounded-2xl px-8 py-4 flex items-center justify-between mb-8">
    <div className="flex items-center gap-3">
      <span className="text-xl font-bold text-indigo-700">Spliy</span>
    </div>
    <div className="flex-1 flex items-center justify-center">
      <span className="text-gray-700 text-lg font-medium">Welcome{userName ? `, ${userName}` : ''} 👋</span>
    </div>
    <div className="flex items-center gap-3">
      <button onClick={onNewGroup} className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-full flex items-center gap-2 shadow-md transition-transform hover:scale-105 focus:ring-2 focus:ring-indigo-400">
        <Plus className="h-5 w-5" /> New Group
      </button>
      <button onClick={onAddExpense} className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-full flex items-center gap-2 shadow-md transition-transform hover:scale-105 focus:ring-2 focus:ring-green-400">
        <Plus className="h-5 w-5" /> Add Expense
      </button>
      <div className="ml-4 flex items-center gap-2">
        <User className="h-6 w-6 text-gray-400" />
      </div>
    </div>
  </header>
);

export default Header; 