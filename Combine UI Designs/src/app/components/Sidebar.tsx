import { Building2, BarChart3, Users, Wrench, Bell, Settings, User } from 'lucide-react';

export function Sidebar() {
  const sidebarItems = [
    { icon: Building2, label: 'Overview', active: true },
    { icon: BarChart3, label: 'Analytics', active: false },
    { icon: Users, label: 'Tenants', active: false },
    { icon: Wrench, label: 'Maintenance', active: false },
    { icon: Bell, label: 'Notifications', active: false },
    { icon: Settings, label: 'Settings', active: false },
  ];

  return (
    <div className="bg-white w-32 flex flex-col items-center py-8 gap-6 border-r border-gray-200 shadow-sm">
      {/* Logo at top */}
      <div className="mb-4">
        <div className="w-12 h-12 flex items-center justify-center">
          <Building2 className="w-8 h-8 text-blue-500" />
        </div>
      </div>

      {/* Main navigation items */}
      {sidebarItems.map((item) => {
        const Icon = item.icon;
        return (
          <button
            key={item.label}
            className="group flex flex-col items-center gap-2 transition-all"
          >
            <div className={`w-16 h-16 rounded-xl flex items-center justify-center transition-all ${
              item.active
                ? 'bg-blue-50 border-2 border-blue-500'
                : 'bg-gray-50 hover:bg-gray-100 border-2 border-transparent'
            }`}>
              <Icon className={`w-6 h-6 ${item.active ? 'text-blue-600' : 'text-gray-600'}`} />
            </div>
            <span className={`text-xs ${item.active ? 'text-blue-600' : 'text-gray-600'}`}>
              {item.label}
            </span>
          </button>
        );
      })}

      {/* User profile at bottom */}
      <div className="mt-auto">
        <button className="group flex flex-col items-center gap-2">
          <div className="w-12 h-12 rounded-xl bg-gray-50 border-2 border-transparent flex items-center justify-center hover:bg-gray-100 transition-all">
            <User className="w-6 h-6 text-gray-600" />
          </div>
        </button>
      </div>
    </div>
  );
}