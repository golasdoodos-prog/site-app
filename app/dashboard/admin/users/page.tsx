'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/components/AuthProvider';
import { useRouter } from 'next/navigation';
import { Navbar } from '@/components/Navbar';

interface User {
  _id: string;
  email: string;
  name: string;
  role: 'user' | 'admin' | 'senioradmin' | 'superadmin';
}

export default function UsersManagementPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [editRole, setEditRole] = useState<'user' | 'admin' | 'senioradmin' | 'superadmin'>('user');
  const [newPassword, setNewPassword] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    if (!authLoading && (!user || (user.role !== 'senioradmin' && user.role !== 'superadmin'))) {
      router.push('/login');
    } else if (user) {
      fetchUsers();
    }
  }, [user, authLoading, router]);

  const fetchUsers = async () => {
    try {
      const response = await fetch('/api/users', {
        credentials: 'include',
      });
      const data = await response.json();
      let filteredUsers = data.users || [];
      // Главный специалист не может видеть руководителей отдела
      if (user?.role === 'senioradmin') {
        filteredUsers = filteredUsers.filter((u: User) => u.role !== 'superadmin');
      }
      setUsers(filteredUsers);
    } catch (error) {
      console.error('Ошибка загрузки пользователей:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateUser = async () => {
    if (!selectedUser) return;

    setError('');
    setSuccess('');

    const updateData: any = {};
    if (editRole !== selectedUser.role) {
      updateData.role = editRole;
    }
    if (newPassword.trim()) {
      if (newPassword.length < 6) {
        setError('Пароль должен быть не менее 6 символов');
        return;
      }
      updateData.password = newPassword;
    }

    if (Object.keys(updateData).length === 0) {
      setError('Нет изменений для сохранения');
      return;
    }

    try {
      const response = await fetch(`/api/users/${selectedUser._id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updateData),
      });

      const data = await response.json();

      if (response.ok) {
        setSuccess('Пользователь успешно обновлен');
        setSelectedUser(null);
        setNewPassword('');
        fetchUsers();
        setTimeout(() => setSuccess(''), 3000);
      } else {
        setError(data.error || 'Ошибка обновления пользователя');
      }
    } catch (error) {
      setError('Ошибка обновления пользователя');
    }
  };

  const getRoleText = (role: string) => {
    switch (role) {
      case 'superadmin':
        return 'Руководитель отдела';
      case 'senioradmin':
        return 'Главный специалист';
      case 'admin':
        return 'Специалист';
      default:
        return 'Пользователь';
    }
  };

  if (authLoading || loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">
            Управление пользователями
          </h2>

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-4">
              {error}
            </div>
          )}

          {success && (
            <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded mb-4">
              {success}
            </div>
          )}

          <div className="bg-white shadow overflow-hidden sm:rounded-md">
            <ul className="divide-y divide-gray-200">
              {users.map((u) => (
                <li key={u._id} className="px-6 py-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-lg font-medium text-gray-900">
                        {u.name}
                      </h3>
                      <p className="text-sm text-gray-600">{u.email}</p>
                      <p className="text-xs text-gray-500 mt-1">
                        Роль: {getRoleText(u.role)}
                      </p>
                    </div>
                    <button
                      onClick={() => {
                        setSelectedUser(u);
                        setEditRole(u.role);
                        setNewPassword('');
                        setError('');
                        setSuccess('');
                      }}
                      className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md text-sm font-medium"
                    >
                      Изменить
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>

      {selectedUser && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
            <h3 className="text-lg font-medium text-gray-900 mb-4">
              Редактирование пользователя: {selectedUser.name}
            </h3>

            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Роль
              </label>
              <select
                value={editRole}
                onChange={(e) =>
                  setEditRole(e.target.value as 'user' | 'admin' | 'senioradmin' | 'superadmin')
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="user">Пользователь</option>
                <option value="admin">Специалист</option>
                <option value="senioradmin">Главный специалист</option>
                {user?.role === 'superadmin' && <option value="superadmin">Руководитель отдела</option>}
              </select>
            </div>

            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Новый пароль (оставьте пустым, если не нужно менять)
              </label>
              <input
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                placeholder="Введите новый пароль"
              />
            </div>

            <div className="flex justify-end space-x-3">
              <button
                onClick={() => {
                  setSelectedUser(null);
                  setNewPassword('');
                  setError('');
                  setSuccess('');
                }}
                className="px-4 py-2 bg-gray-300 text-gray-700 rounded-md hover:bg-gray-400"
              >
                Отмена
              </button>
              <button
                onClick={handleUpdateUser}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
              >
                Сохранить
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

