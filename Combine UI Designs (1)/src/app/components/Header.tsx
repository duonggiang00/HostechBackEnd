import { Building2, Bell, User } from 'lucide-react';

export function Header() {
  const navItems = ['Dashboard', 'Analytics', 'Maintenance', 'Reports', 'Settings'];

  return (
    <header className="bg-white border-b border-gray-200 px-6 py-4 shadow-sm">
      <div className="flex items-center justify-between">
        {/* Logo and Brand */}
        <div className="flex items-center gap-3">
          <div className="bg-gradient-to-br from-blue-500 to-blue-600 p-2 rounded-lg">
            <Building2 className="w-6 h-6 text-white" />
          </div>
          <div>
            <div className="text-gray-900 font-semibold">M-Tower</div>
            <div className="text-gray-500 text-xs">Metro Tower</div>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex items-center gap-1">
          {navItems.map((item, index) => (
            <button
              key={item}
              className={`px-4 py-2 rounded-lg transition-colors ${
                index === 0
                  ? 'bg-blue-50 text-blue-600 border-b-2 border-blue-500'
                  : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
              }`}
            >
              {item}
            </button>
          ))}
        </nav>

        {/* User Section */}
        <div className="flex items-center gap-4">
          <button className="relative p-2 text-gray-600 hover:text-gray-900">
            <Bell className="w-5 h-5" />
            <span className="absolute top-1 right-1 bg-blue-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
              3
            </span>
          </button>
          <div className="flex items-center gap-2">
            <div className="text-right">
              <div className="text-gray-900 text-sm">Alex Chen</div>
              <div className="text-gray-500 text-xs">(Admin)</div>
            </div>
            <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-500 rounded-full flex items-center justify-center">
              <User className="w-5 h-5 text-white" />
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}