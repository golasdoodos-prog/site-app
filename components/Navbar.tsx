'use client';

import { useAuth } from './AuthProvider';
import { useRouter } from 'next/navigation';

export function Navbar() {
  const { user, logout } = useAuth();
  const router = useRouter();

  const handleLogout = () => {
    logout();
    router.push('/login');
  };

  if (!user) return null;

  const getRoleBadgeColor = () => {
    switch (user.role) {
      case 'superadmin':
        return 'bg-gradient-to-r from-purple-500 to-indigo-600';
      case 'senioradmin':
        return 'bg-gradient-to-r from-blue-500 to-cyan-600';
      case 'admin':
        return 'bg-gradient-to-r from-green-500 to-emerald-600';
      default:
        return 'bg-gradient-to-r from-gray-500 to-gray-600';
    }
  };

  return (
    <nav className="bg-white/80 backdrop-blur-lg shadow-lg border-b border-gray-200/50 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <button
            onClick={() => {
              if (user.role === 'user') {
                router.push('/dashboard/user');
              } else {
                router.push('/dashboard/admin');
              }
            }}
            className="flex items-center space-x-3 hover:opacity-80 transition-opacity cursor-pointer"
          >
            <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-lg flex items-center justify-center shadow-lg">
              <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
            <h1 className="text-xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
              <span className="hidden lg:inline">КГУ "Центр информационных технологий" ГУ "Управление цифровых технологий области Абай"</span>
              <span className="lg:hidden">КГУ "ЦИТ"</span>
            </h1>
          </button>
          <div className="flex items-center space-x-4">
            <button
              onClick={() => router.push('/profile')}
              className="hidden sm:flex items-center space-x-3 px-4 py-2 bg-gray-50 rounded-lg border border-gray-200 hover:bg-gray-100 transition-colors cursor-pointer"
            >
              <div className="w-8 h-8 bg-gradient-to-br from-blue-400 to-indigo-500 rounded-full flex items-center justify-center text-white font-semibold text-sm">
                {user.name.charAt(0).toUpperCase()}
              </div>
              <div className="flex flex-col">
                <span className="text-sm font-semibold text-gray-900">{user.name}</span>
                <span className={`text-xs ${getRoleBadgeColor()} text-white px-2 py-0.5 rounded-full font-medium`}>
                  {user.role === 'user' ? 'Пользователь' : user.role === 'admin' ? 'Специалист' : user.role === 'senioradmin' ? 'Главный специалист' : 'Руководитель отдела'}
                </span>
              </div>
            </button>
            <button
              onClick={() => router.push('/profile')}
              className="sm:hidden w-10 h-10 bg-gradient-to-br from-blue-400 to-indigo-500 rounded-full flex items-center justify-center text-white font-semibold text-sm hover:opacity-80 transition-opacity"
            >
              {user.name.charAt(0).toUpperCase()}
            </button>
            <button
              onClick={() => router.push('/profile')}
              className="btn-secondary flex items-center space-x-2"
              title="Профиль"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
              <span className="hidden sm:inline">Профиль</span>
            </button>
            <button
              onClick={handleLogout}
              className="btn-danger flex items-center space-x-2"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
              </svg>
              <span className="hidden sm:inline">Выйти</span>
            </button>
          </div>
        </div>
      </div>
    </nav>
  );
}

