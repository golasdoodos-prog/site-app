'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/components/AuthProvider';
import { useRouter } from 'next/navigation';
import { Navbar } from '@/components/Navbar';

interface Application {
  _id: string;
  title: string;
  description: string;
  status: 'pending' | 'in_progress' | 'approved' | 'rejected';
  adminComment?: string;
  createdAt: string;
}

export default function UserDashboard() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const [applications, setApplications] = useState<Application[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/login');
    } else if (user && user.role !== 'user') {
      router.push('/dashboard/admin');
    } else if (user) {
      fetchApplications();
    }
  }, [user, authLoading, router]);

  const fetchApplications = async () => {
    try {
      const response = await fetch('/api/applications', {
        credentials: 'include',
      });
      const data = await response.json();
      setApplications(data.applications || []);
    } catch (error) {
      console.error('Ошибка загрузки заявок:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const response = await fetch('/api/applications', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ title, description }),
      });

      if (response.ok) {
        setTitle('');
        setDescription('');
        setShowForm(false);
        fetchApplications();
      } else {
        const data = await response.json();
        alert(data.error || 'Ошибка создания заявки');
      }
    } catch (error) {
      alert('Ошибка создания заявки');
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'approved':
        return 'bg-gradient-to-r from-green-500 to-emerald-600 text-white';
      case 'rejected':
        return 'bg-gradient-to-r from-red-500 to-rose-600 text-white';
      case 'in_progress':
        return 'bg-gradient-to-r from-blue-500 to-cyan-600 text-white';
      default:
        return 'bg-gradient-to-r from-yellow-400 to-orange-500 text-white';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'approved':
        return 'Одобрена';
      case 'rejected':
        return 'Отклонена';
      case 'in_progress':
        return 'В процессе';
      default:
        return 'На рассмотрении';
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
    <div className="min-h-screen">
      <Navbar />
      <div className="max-w-7xl mx-auto py-8 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          <div className="flex justify-between items-center mb-8">
            <div>
              <h2 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent mb-2">
                Мои заявки
              </h2>
              <p className="text-gray-600">Управление вашими заявками</p>
            </div>
            <button
              onClick={() => setShowForm(!showForm)}
              className="btn-primary flex items-center space-x-2"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={showForm ? "M6 18L18 6M6 6l12 12" : "M12 6v6m0 0v6m0-6h6m-6 0H6"} />
              </svg>
              <span>{showForm ? 'Отменить' : 'Создать заявку'}</span>
            </button>
          </div>

          {showForm && (
            <div className="card p-6 mb-6 animate-slide-up">
              <h3 className="text-xl font-bold text-gray-900 mb-4">Новая заявка</h3>
              <form onSubmit={handleSubmit}>
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Название
                  </label>
                  <input
                    type="text"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    required
                    className="input-field"
                    placeholder="Введите название заявки"
                  />
                </div>
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Описание
                  </label>
                  <textarea
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    required
                    rows={4}
                    className="input-field"
                    placeholder="Введите описание заявки"
                  />
                </div>
                <button
                  type="submit"
                  className="btn-primary"
                >
                  Создать заявку
                </button>
              </form>
            </div>
          )}

          <div className="card overflow-hidden">
            <ul className="divide-y divide-gray-200">
              {applications.length === 0 ? (
                <li className="px-6 py-4 text-center text-gray-500">
                  Нет заявок
                </li>
              ) : (
                applications.map((app) => (
                  <li key={app._id} className="px-6 py-4">
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <h3 className="text-lg font-medium text-gray-900">
                          {app.title}
                        </h3>
                        <p className="mt-1 text-sm text-gray-600">
                          {app.description}
                        </p>
                        {app.adminComment && (
                          <p className="mt-2 text-sm text-gray-500">
                            <span className="font-medium">Комментарий специалиста:</span> {app.adminComment}
                          </p>
                        )}
                        <p className="mt-2 text-xs text-gray-500">
                          {new Date(app.createdAt).toLocaleString('ru-RU')}
                        </p>
                      </div>
                      <span
                        className={`badge ${getStatusColor(app.status)} shadow-sm`}
                      >
                        {getStatusText(app.status)}
                      </span>
                    </div>
                  </li>
                ))
              )}
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}

