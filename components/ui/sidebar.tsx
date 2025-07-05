import React from 'react';
import { Users, Layers, List, Settings, Home } from 'lucide-react';

interface Group {
  id: string;
  name: string;
}

interface SidebarProps {
  groups: Group[];
  activeGroupId: string;
  onGroupSelect: (id: string) => void;
}

const Sidebar: React.FC<SidebarProps> = ({ groups = [], activeGroupId = '', onGroupSelect = () => {} }) => (
  <aside className="h-full w-64 bg-white shadow-xl rounded-2xl p-6 flex flex-col gap-8 min-h-screen">
    <div className="flex items-center gap-3 mb-8">
      <Home className="h-7 w-7 text-indigo-600" />
      <span className="text-2xl font-bold text-gray-900">Spliy</span>
    </div>
    <nav className="flex-1 flex flex-col gap-4">
      <a href="#" className="flex items-center gap-3 text-gray-700 hover:bg-indigo-50 rounded-lg p-2 font-medium transition-colors">
        <Layers className="h-5 w-5 text-indigo-500" /> Dashboard
      </a>
      <div>
        <div className="text-xs text-gray-400 mb-2 ml-1">Groups</div>
        <ul className="space-y-1">
          {groups.map(group => (
            <li key={group.id}>
              <button
                className={`w-full flex items-center gap-2 p-2 rounded-lg text-left transition-colors ${activeGroupId === group.id ? 'bg-indigo-100 text-indigo-700 font-semibold' : 'hover:bg-indigo-50 text-gray-700'}`}
                onClick={() => onGroupSelect(group.id)}
              >
                <Users className="h-4 w-4" /> {group.name}
              </button>
            </li>
          ))}
        </ul>
      </div>
      <a href="#" className="flex items-center gap-3 text-gray-700 hover:bg-indigo-50 rounded-lg p-2 font-medium transition-colors">
        <List className="h-5 w-5 text-indigo-500" /> Expenses
      </a>
      <a href="#" className="flex items-center gap-3 text-gray-700 hover:bg-indigo-50 rounded-lg p-2 font-medium transition-colors">
        <Settings className="h-5 w-5 text-indigo-500" /> Settings
      </a>
    </nav>
    <div className="mt-auto text-xs text-gray-400">© 2024 Spliy</div>
  </aside>
);

export default Sidebar; 