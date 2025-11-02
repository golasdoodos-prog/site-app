'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/components/AuthProvider';
import { useRouter } from 'next/navigation';
import { Navbar } from '@/components/Navbar';
// Динамический импорт для клиентской библиотеки
let pdfMake: any = null;
let pdfFonts: any = null;

if (typeof window !== 'undefined') {
  Promise.all([
    import('pdfmake/build/pdfmake'),
    import('pdfmake/build/vfs_fonts')
  ]).then(([pdfMakeModule, fontsModule]) => {
    pdfMake = pdfMakeModule.default;
    
    // Попробуем разные варианты доступа к vfs
    let vfs: any = null;
    if (fontsModule.default && fontsModule.default.pdfMake && fontsModule.default.pdfMake.vfs) {
      vfs = fontsModule.default.pdfMake.vfs;
    } else if (fontsModule.pdfMake && fontsModule.pdfMake.vfs) {
      vfs = fontsModule.pdfMake.vfs;
    } else if (fontsModule.default && fontsModule.default.vfs) {
      vfs = fontsModule.default.vfs;
    } else if ((fontsModule as any).vfs) {
      vfs = (fontsModule as any).vfs;
    } else if (fontsModule.default) {
      // Попробуем прямое обращение к default
      vfs = fontsModule.default;
    }
    
    if (vfs && typeof vfs === 'object' && Object.keys(vfs).length > 0) {
      pdfMake.vfs = vfs;
      // Проверяем наличие файлов шрифтов в vfs
      const hasRobotoRegular = vfs['Roboto-Regular.ttf'];
      const hasRobotoMedium = vfs['Roboto-Medium.ttf'];
      
      if (hasRobotoRegular && hasRobotoMedium) {
        // Настраиваем шрифты явно только если файлы есть в vfs
        pdfMake.fonts = {
          Roboto: {
            normal: 'Roboto-Regular.ttf',
            bold: 'Roboto-Medium.ttf',
            italics: 'Roboto-Italic.ttf',
            bolditalics: 'Roboto-MediumItalic.ttf'
          }
        };
        console.log('Шрифты Roboto успешно настроены');
      } else {
        console.warn('Файлы шрифтов Roboto не найдены в vfs. Доступные ключи:', Object.keys(vfs).slice(0, 10));
        // Настраиваем встроенные стандартные шрифты без файлов
        pdfMake.fonts = {
          Roboto: {
            normal: 'Courier',
            bold: 'Courier',
            italics: 'Courier',
            bolditalics: 'Courier'
          }
        };
      }
    } else {
      console.warn('vfs не загружен, структура модуля:', fontsModule);
      // Настраиваем встроенные стандартные шрифты без файлов
      pdfMake.fonts = {
        Roboto: {
          normal: 'Courier',
          bold: 'Courier',
          italics: 'Courier',
          bolditalics: 'Courier'
        }
      };
    }
    pdfFonts = pdfMake;
  }).catch((error) => {
    console.error('Ошибка загрузки pdfmake:', error);
  });
}

interface Application {
  _id: string;
  title: string;
  description: string;
  status: 'pending' | 'in_progress' | 'approved' | 'rejected';
  userId: { name: string; email: string } | null;
  adminId?: { _id?: string; name?: string; email?: string } | string;
  adminComment?: string;
  createdAt: string;
}

type TabType = 'applications' | 'create-user' | 'users' | 'reports';

export default function AdminDashboard() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<TabType>('applications');
  const [applications, setApplications] = useState<Application[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedApp, setSelectedApp] = useState<Application | null>(null);
  const [status, setStatus] = useState<'pending' | 'in_progress' | 'approved' | 'rejected'>('in_progress');
  const [comment, setComment] = useState('');
  
  // Форма создания пользователя
  const [userForm, setUserForm] = useState({
    email: '',
    password: '',
    name: '',
    role: 'user' as 'user' | 'admin' | 'senioradmin',
  });
  const [userError, setUserError] = useState('');
  const [userSuccess, setUserSuccess] = useState(false);
  const [userLoading, setUserLoading] = useState(false);

  // Управление пользователями (для главного специалиста и руководителя отдела)
  const [users, setUsers] = useState<any[]>([]);
  const [usersLoading, setUsersLoading] = useState(false);
  const [selectedUser, setSelectedUser] = useState<any | null>(null);
  const [editRole, setEditRole] = useState<'user' | 'admin' | 'senioradmin' | 'superadmin'>('user');
  const [newPassword, setNewPassword] = useState('');
  const [usersError, setUsersError] = useState('');
  const [usersSuccess, setUsersSuccess] = useState('');

  // Отчеты
  const [reportDateFrom, setReportDateFrom] = useState('');
  const [reportDateTo, setReportDateTo] = useState('');
  const [pdfGenerating, setPdfGenerating] = useState(false);

  // Удаление
  const [deleteConfirm, setDeleteConfirm] = useState<{
    type: 'user' | 'application' | null;
    id: string | null;
    name: string | null;
  }>({ type: null, id: null, name: null });
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/login');
    } else if (user && user.role === 'user') {
      router.push('/dashboard/user');
    } else if (user) {
      fetchApplications();
    }
  }, [user, authLoading, router]);

  // Загружаем пользователей когда открываем вкладку управления
  useEffect(() => {
    if (activeTab === 'users' && (user?.role === 'senioradmin' || user?.role === 'superadmin') && users.length === 0) {
      fetchUsers();
    }
  }, [activeTab, user]);

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

  const handleStatusChange = async (appId: string) => {
    try {
      const response = await fetch(`/api/applications/${appId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ status, adminComment: comment || undefined }),
      });

      if (response.ok) {
        setSelectedApp(null);
        setComment('');
        setStatus('in_progress');
        fetchApplications();
      } else {
        const data = await response.json();
        alert(data.error || 'Ошибка обработки заявки');
      }
    } catch (error) {
      alert('Ошибка обработки заявки');
    }
  };

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    setUserError('');
    setUserSuccess(false);
    setUserLoading(true);

    try {
      const response = await fetch('/api/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(userForm),
      });

      const data = await response.json();

      if (response.ok) {
        setUserSuccess(true);
        setUserForm({ email: '', password: '', name: '', role: 'user' });
        setTimeout(() => setUserSuccess(false), 3000);
        // Обновляем список пользователей если открыта вкладка управления
        if (activeTab === 'users') {
          fetchUsers();
        }
      } else {
        setUserError(data.error || 'Ошибка создания пользователя');
      }
    } catch (error) {
      setUserError('Ошибка создания пользователя');
    } finally {
      setUserLoading(false);
    }
  };

  const fetchUsers = async () => {
    setUsersLoading(true);
    try {
      const response = await fetch('/api/users', {
        credentials: 'include',
      });
      const data = await response.json();
      let filteredUsers = data.users || [];
      // Главный специалист не может видеть/редактировать руководителей отдела
      if (user?.role === 'senioradmin') {
        filteredUsers = filteredUsers.filter((u: any) => u.role !== 'superadmin');
      }
      setUsers(filteredUsers);
    } catch (error) {
      console.error('Ошибка загрузки пользователей:', error);
    } finally {
      setUsersLoading(false);
    }
  };

  const handleUpdateUser = async () => {
    if (!selectedUser) return;

    setUsersError('');
    setUsersSuccess('');

    const updateData: any = {};
    if (editRole !== selectedUser.role) {
      updateData.role = editRole;
    }
    if (newPassword.trim()) {
      if (newPassword.length < 6) {
        setUsersError('Пароль должен быть не менее 6 символов');
        return;
      }
      updateData.password = newPassword;
    }

    if (Object.keys(updateData).length === 0) {
      setUsersError('Нет изменений для сохранения');
      return;
    }

    try {
      const response = await fetch(`/api/users/${selectedUser._id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(updateData),
      });

      const data = await response.json();

      if (response.ok) {
        setUsersSuccess('Пользователь успешно обновлен');
        setSelectedUser(null);
        setNewPassword('');
        fetchUsers();
        setTimeout(() => setUsersSuccess(''), 3000);
      } else {
        setUsersError(data.error || 'Ошибка обновления пользователя');
      }
    } catch (error) {
      setUsersError('Ошибка обновления пользователя');
    }
  };

  const handleDeleteUser = async () => {
    if (!deleteConfirm.id || deleteConfirm.type !== 'user') return;

    setDeleting(true);
    setUsersError('');

    try {
      const response = await fetch(`/api/users/${deleteConfirm.id}`, {
        method: 'DELETE',
        credentials: 'include',
      });

      const data = await response.json();

      if (response.ok) {
        setUsersSuccess('Пользователь успешно удален');
        setDeleteConfirm({ type: null, id: null, name: null });
        fetchUsers();
        setTimeout(() => setUsersSuccess(''), 3000);
      } else {
        setUsersError(data.error || 'Ошибка удаления пользователя');
      }
    } catch (error) {
      setUsersError('Ошибка удаления пользователя');
    } finally {
      setDeleting(false);
    }
  };

  const handleDeleteApplication = async () => {
    if (!deleteConfirm.id || deleteConfirm.type !== 'application') return;

    setDeleting(true);

    try {
      const response = await fetch(`/api/applications/${deleteConfirm.id}`, {
        method: 'DELETE',
        credentials: 'include',
      });

      const data = await response.json();

      if (response.ok) {
        setDeleteConfirm({ type: null, id: null, name: null });
        fetchApplications();
      } else {
        alert(data.error || 'Ошибка удаления заявки');
      }
    } catch (error) {
      alert('Ошибка удаления заявки');
    } finally {
      setDeleting(false);
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

  // Функция для генерации и скачивания PDF отчета
  const generatePDFReport = async () => {
    if (pdfGenerating) return; // Предотвращаем множественные клики
    
    setPdfGenerating(true);
    try {
      // Загружаем pdfmake динамически если еще не загружен
      if (!pdfMake) {
        try {
          const [pdfMakeModule, fontsModule] = await Promise.all([
            import('pdfmake/build/pdfmake'),
            import('pdfmake/build/vfs_fonts')
          ]);
          pdfMake = pdfMakeModule.default;
          
          // Попробуем разные варианты доступа к vfs
          let vfs: any = null;
          if (fontsModule.default && fontsModule.default.pdfMake && fontsModule.default.pdfMake.vfs) {
            vfs = fontsModule.default.pdfMake.vfs;
          } else if (fontsModule.pdfMake && fontsModule.pdfMake.vfs) {
            vfs = fontsModule.pdfMake.vfs;
          } else if (fontsModule.default && fontsModule.default.vfs) {
            vfs = fontsModule.default.vfs;
          } else if ((fontsModule as any).vfs) {
            vfs = (fontsModule as any).vfs;
          } else if (fontsModule.default) {
            // Попробуем прямое обращение к default
            vfs = fontsModule.default;
          }
          
          if (vfs && typeof vfs === 'object' && Object.keys(vfs).length > 0) {
            pdfMake.vfs = vfs;
            // Проверяем наличие файлов шрифтов в vfs
            const hasRobotoRegular = vfs['Roboto-Regular.ttf'];
            const hasRobotoMedium = vfs['Roboto-Medium.ttf'];
            
            if (hasRobotoRegular && hasRobotoMedium) {
              // Настраиваем шрифты явно только если файлы есть в vfs
              pdfMake.fonts = {
                Roboto: {
                  normal: 'Roboto-Regular.ttf',
                  bold: 'Roboto-Medium.ttf',
                  italics: 'Roboto-Italic.ttf',
                  bolditalics: 'Roboto-MediumItalic.ttf'
                }
              };
              console.log('Шрифты Roboto успешно настроены');
            } else {
              console.warn('Файлы шрифтов Roboto не найдены в vfs. Доступные ключи:', Object.keys(vfs).slice(0, 10));
              // Настраиваем встроенные стандартные шрифты без файлов
              pdfMake.fonts = {
                Roboto: {
                  normal: 'Courier',
                  bold: 'Courier',
                  italics: 'Courier',
                  bolditalics: 'Courier'
                }
              };
            }
          } else {
            console.warn('vfs не загружен, структура модуля:', fontsModule);
            // Настраиваем встроенные стандартные шрифты без файлов
            pdfMake.fonts = {
              Roboto: {
                normal: 'Courier',
                bold: 'Courier',
                italics: 'Courier',
                bolditalics: 'Courier'
              }
            };
          }
        } catch (importError) {
          console.error('Ошибка загрузки pdfmake:', importError);
          alert('Ошибка загрузки библиотеки PDF. Попробуйте обновить страницу.');
          return;
        }
      }
    // Фильтруем заявки по датам если указаны
    let filteredApps = applications;
    if (reportDateFrom) {
      filteredApps = filteredApps.filter(app => 
        new Date(app.createdAt) >= new Date(reportDateFrom)
      );
    }
    if (reportDateTo) {
      filteredApps = filteredApps.filter(app => 
        new Date(app.createdAt) <= new Date(reportDateTo + 'T23:59:59')
      );
    }

    // Статистика
    const totalApps = filteredApps.length;
    const approvedApps = filteredApps.filter(app => app.status === 'approved').length;
    const rejectedApps = filteredApps.filter(app => app.status === 'rejected').length;
    const inProgressApps = filteredApps.filter(app => app.status === 'in_progress').length;
    const pendingApps = filteredApps.filter(app => app.status === 'pending').length;

    // Подсчет по специалистам
    const adminStats: { [key: string]: { name: string; count: number } } = {};
    filteredApps.forEach(app => {
      if (app.adminId && app.status !== 'pending') {
        const adminId = typeof app.adminId === 'string' 
          ? app.adminId 
          : (app.adminId._id || String(app.adminId));
        const adminName = typeof app.adminId === 'string' 
          ? 'Неизвестно' 
          : (app.adminId.name || 'Неизвестно');
        if (!adminStats[adminId]) {
          adminStats[adminId] = {
            name: adminName,
            count: 0
          };
        }
        adminStats[adminId].count++;
      }
    });

    // Период отчета
    const dateRange = reportDateFrom && reportDateTo 
      ? `Период: ${new Date(reportDateFrom).toLocaleDateString('ru-RU')} - ${new Date(reportDateTo).toLocaleDateString('ru-RU')}`
      : reportDateFrom
      ? `С: ${new Date(reportDateFrom).toLocaleDateString('ru-RU')}`
      : reportDateTo
      ? `До: ${new Date(reportDateTo).toLocaleDateString('ru-RU')}`
      : 'За весь период';

    // Вычисляем проценты
    const approvedPercent = totalApps > 0 ? ((approvedApps / totalApps) * 100).toFixed(1) : '0';
    const rejectedPercent = totalApps > 0 ? ((rejectedApps / totalApps) * 100).toFixed(1) : '0';
    const inProgressPercent = totalApps > 0 ? ((inProgressApps / totalApps) * 100).toFixed(1) : '0';
    const pendingPercent = totalApps > 0 ? ((pendingApps / totalApps) * 100).toFixed(1) : '0';

    // Создаем содержимое PDF
    const docDefinition: any = {
      pageMargins: [40, 60, 40, 60],
      header: {
        margin: [40, 20, 40, 0],
        columns: [
          {
            text: 'КГУ "Центр информационных технологий"\nГУ "Управление цифровых технологий области Абай"',
            fontSize: 10,
            color: '#666666',
            alignment: 'left',
            width: '*'
          },
          {
            text: 'ОТЧЕТ ПО ЗАЯВКАМ',
            fontSize: 16,
            bold: true,
            color: '#1e40af',
            alignment: 'right',
            width: 'auto'
          }
        ]
      },
      footer: function(currentPage: number, pageCount: number) {
        return {
          margin: [40, 10, 40, 0],
          text: `Страница ${currentPage} из ${pageCount}`,
          fontSize: 9,
          color: '#999999',
          alignment: 'center'
        };
      },
      content: [
        // Заголовок отчета
        {
          stack: [
            {
              text: 'ОТЧЕТ ПО ЗАЯВКАМ',
              style: 'mainTitle',
              alignment: 'center',
              margin: [0, 0, 0, 10]
            },
            {
              text: dateRange,
              style: 'subtitle',
              alignment: 'center',
              margin: [0, 0, 0, 5]
            },
            {
              text: `Дата формирования отчета: ${new Date().toLocaleString('ru-RU', { 
                day: '2-digit', 
                month: '2-digit', 
                year: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
              })}`,
              style: 'dateStyle',
              alignment: 'center',
              margin: [0, 0, 0, 30]
            }
          ]
        },
        
        // Общая статистика в виде таблицы
        {
          text: 'ОБЩАЯ СТАТИСТИКА',
          style: 'sectionTitle',
          margin: [0, 0, 0, 15]
        },
        {
          table: {
            widths: ['*', '*', '*', '*', '*'],
            body: [
              [
                { text: 'Всего заявок', style: 'tableHeader', fillColor: '#3b82f6' },
                { text: 'Одобрено', style: 'tableHeader', fillColor: '#10b981' },
                { text: 'Отклонено', style: 'tableHeader', fillColor: '#ef4444' },
                { text: 'В процессе', style: 'tableHeader', fillColor: '#06b6d4' },
                { text: 'На рассмотрении', style: 'tableHeader', fillColor: '#f59e0b' }
              ],
              [
                { 
                  text: totalApps.toString(), 
                  style: 'tableCellBold',
                  alignment: 'center',
                  fontSize: 16,
                  color: '#1e40af'
                },
                { 
                  text: `${approvedApps}\n(${approvedPercent}%)`, 
                  style: 'tableCell',
                  alignment: 'center',
                  fontSize: 14,
                  color: '#059669'
                },
                { 
                  text: `${rejectedApps}\n(${rejectedPercent}%)`, 
                  style: 'tableCell',
                  alignment: 'center',
                  fontSize: 14,
                  color: '#dc2626'
                },
                { 
                  text: `${inProgressApps}\n(${inProgressPercent}%)`, 
                  style: 'tableCell',
                  alignment: 'center',
                  fontSize: 14,
                  color: '#0891b2'
                },
                { 
                  text: `${pendingApps}\n(${pendingPercent}%)`, 
                  style: 'tableCell',
                  alignment: 'center',
                  fontSize: 14,
                  color: '#d97706'
                }
              ]
            ]
          },
          layout: {
            hLineWidth: function(i: number, node: any) {
              return i === 0 || i === node.table.body.length ? 1.5 : 0.5;
            },
            vLineWidth: function(i: number, node: any) {
              return 0.5;
            },
            hLineColor: function(i: number, node: any) {
              return i === 0 || i === node.table.body.length ? '#1e40af' : '#e5e7eb';
            },
            vLineColor: function() {
              return '#e5e7eb';
            },
            paddingLeft: function() { return 8; },
            paddingRight: function() { return 8; },
            paddingTop: function() { return 10; },
            paddingBottom: function() { return 10; }
          },
          margin: [0, 0, 0, 20]
        },
        
        // Выполнено заявок
        {
          stack: [
            {
              text: `Выполнено заявок (одобрено): ${approvedApps}`,
              style: 'highlightBox',
              margin: [0, 0, 0, 5]
            },
            {
              text: totalApps > 0 
                ? `Процент выполнения: ${approvedPercent}%`
                : 'Нет данных для расчета',
              style: 'highlightSubtext',
              margin: [0, 0, 0, 0]
            }
          ],
          margin: [0, 0, 0, 30]
        }
      ],
      styles: {
        mainTitle: {
          fontSize: 22,
          bold: true,
          color: '#1e40af'
        },
        subtitle: {
          fontSize: 13,
          color: '#4b5563'
        },
        dateStyle: {
          fontSize: 10,
          color: '#6b7280',
          italics: true
        },
        sectionTitle: {
          fontSize: 16,
          bold: true,
          color: '#1f2937',
          decoration: 'underline',
          decorationColor: '#3b82f6',
          decorationStyle: 'solid'
        },
        tableHeader: {
          bold: true,
          fontSize: 11,
          color: '#ffffff',
          alignment: 'center'
        },
        tableCell: {
          fontSize: 12
        },
        tableCellBold: {
          fontSize: 12,
          bold: true
        },
        highlightBox: {
          fontSize: 14,
          bold: true,
          color: '#059669',
          background: '#d1fae5',
          alignment: 'center',
          margin: [0, 5, 0, 5]
        },
        highlightSubtext: {
          fontSize: 11,
          color: '#047857',
          alignment: 'center'
        },
        statusApproved: {
          color: '#059669',
          bold: true
        },
        statusRejected: {
          color: '#dc2626',
          bold: true
        },
        statusInProgress: {
          color: '#0891b2',
          bold: true
        },
        statusPending: {
          color: '#d97706',
          bold: true
        },
        appTitle: {
          fontSize: 12,
          bold: true,
          color: '#1f2937'
        },
        appDescription: {
          fontSize: 10,
          color: '#4b5563'
        },
        appMeta: {
          fontSize: 9,
          color: '#6b7280',
          italics: true
        }
      },
      defaultStyle: {
        fontSize: 11,
        ...(pdfMake && pdfMake.fonts && pdfMake.fonts.Roboto ? { font: 'Roboto' } : {})
      }
    };

    // Добавляем статистику по специалистам
    const adminStatsEntries = Object.entries(adminStats);
    if (adminStatsEntries.length > 0) {
      docDefinition.content.push(
        {
          text: 'СТАТИСТИКА ПО СПЕЦИАЛИСТАМ',
          style: 'sectionTitle',
          margin: [0, 20, 0, 15]
        },
        {
          table: {
            widths: ['*', 'auto'],
            body: [
              [
                { text: 'Специалист', style: 'tableHeader', fillColor: '#6366f1' },
                { text: 'Обработано заявок', style: 'tableHeader', fillColor: '#6366f1' }
              ],
              ...adminStatsEntries.map(([_, stat]) => [
                { text: stat.name, style: 'tableCell' },
                { text: stat.count.toString(), style: 'tableCellBold', alignment: 'center', color: '#6366f1' }
              ])
            ]
          },
          layout: {
            hLineWidth: function(i: number, node: any) {
              return i === 0 || i === node.table.body.length ? 1.5 : 0.5;
            },
            vLineWidth: function() { return 0.5; },
            hLineColor: function(i: number, node: any) {
              return i === 0 || i === node.table.body.length ? '#6366f1' : '#e5e7eb';
            },
            vLineColor: function() { return '#e5e7eb'; },
            paddingLeft: function() { return 8; },
            paddingRight: function() { return 8; },
            paddingTop: function() { return 8; },
            paddingBottom: function() { return 8; }
          },
          margin: [0, 0, 0, 30]
        }
      );
    }

    // Добавляем список заявок в виде таблицы
    if (filteredApps.length > 0) {
      docDefinition.content.push({
        text: 'ДЕТАЛЬНЫЙ СПИСОК ЗАЯВОК',
        style: 'sectionTitle',
        margin: [0, 20, 0, 15]
      });

      const appsToShow = filteredApps.slice(0, 100);
      const tableBody: any[] = [
        [
          { text: '№', style: 'tableHeader', fillColor: '#3b82f6', width: 30 },
          { text: 'Название', style: 'tableHeader', fillColor: '#3b82f6' },
          { text: 'Статус', style: 'tableHeader', fillColor: '#3b82f6', width: 80 },
          { text: 'От пользователя', style: 'tableHeader', fillColor: '#3b82f6', width: 120 },
          { text: 'Дата создания', style: 'tableHeader', fillColor: '#3b82f6', width: 100 }
        ]
      ];

      appsToShow.forEach((app, index) => {
        const statusText = app.status === 'approved' ? 'Одобрена' : 
                          app.status === 'rejected' ? 'Отклонена' : 
                          app.status === 'in_progress' ? 'В процессе' : 
                          'На рассмотрении';
        const statusStyle = app.status === 'approved' ? 'statusApproved' : 
                           app.status === 'rejected' ? 'statusRejected' : 
                           app.status === 'in_progress' ? 'statusInProgress' : 
                           'statusPending';

        tableBody.push([
          { text: (index + 1).toString(), style: 'tableCell', alignment: 'center' },
          { 
            text: app.title.length > 40 ? app.title.substring(0, 37) + '...' : app.title, 
            style: 'appTitle',
            fontSize: 10
          },
          { text: statusText, style: statusStyle, fontSize: 9, alignment: 'center' },
          { 
            text: `${app.userId?.name || 'Неизвестно'}\n${app.userId?.email || 'N/A'}`,
            style: 'appMeta',
            fontSize: 8
          },
          { 
            text: new Date(app.createdAt).toLocaleDateString('ru-RU', {
              day: '2-digit',
              month: '2-digit',
              year: 'numeric'
            }),
            style: 'appMeta',
            fontSize: 9,
            alignment: 'center'
          }
        ]);
      });

      docDefinition.content.push({
        table: {
          widths: [30, '*', 80, 120, 100],
          body: tableBody
        },
        layout: {
          hLineWidth: function(i: number, node: any) {
            return i === 0 || i === node.table.body.length ? 1.5 : 0.5;
          },
          vLineWidth: function() { return 0.5; },
          hLineColor: function(i: number, node: any) {
            return i === 0 || i === node.table.body.length ? '#3b82f6' : '#e5e7eb';
          },
          vLineColor: function() { return '#e5e7eb'; },
          paddingLeft: function() { return 5; },
          paddingRight: function() { return 5; },
          paddingTop: function() { return 6; },
          paddingBottom: function() { return 6; }
        },
        margin: [0, 0, 0, 20]
      });

      if (filteredApps.length > 100) {
        docDefinition.content.push({
          text: `... и еще ${filteredApps.length - 100} заявок не показаны в данном отчете`,
          style: 'appMeta',
          alignment: 'center',
          margin: [0, 10, 0, 0]
        });
      }
    } else {
      docDefinition.content.push({
        text: 'За выбранный период заявок не найдено',
        style: 'appMeta',
        alignment: 'center',
        margin: [0, 20, 0, 0]
      });
    }

      // Генерируем и скачиваем PDF
      const fileName = `отчет_заявки_${new Date().toISOString().split('T')[0]}.pdf`;
      
      try {
        pdfMake.createPdf(docDefinition).download(fileName);
      } catch (pdfError) {
        console.error('Ошибка генерации PDF:', pdfError);
        alert('Ошибка при создании PDF файла. Проверьте консоль браузера для подробностей.');
      }
    } catch (error) {
      console.error('Ошибка генерации отчета:', error);
      alert('Произошла ошибка при генерации отчета. Попробуйте еще раз или обновите страницу.');
    } finally {
      setPdfGenerating(false);
    }
  };

  // Вычисляем статистику для отображения
  const getReportStats = () => {
    let filteredApps = applications;
    if (reportDateFrom) {
      filteredApps = filteredApps.filter(app => 
        new Date(app.createdAt) >= new Date(reportDateFrom)
      );
    }
    if (reportDateTo) {
      filteredApps = filteredApps.filter(app => 
        new Date(app.createdAt) <= new Date(reportDateTo + 'T23:59:59')
      );
    }

    const total = filteredApps.length;
    const approved = filteredApps.filter(app => app.status === 'approved').length;
    const rejected = filteredApps.filter(app => app.status === 'rejected').length;
    const inProgress = filteredApps.filter(app => app.status === 'in_progress').length;
    const pending = filteredApps.filter(app => app.status === 'pending').length;

    // Статистика по специалистам
    const adminStats: { [key: string]: { name: string; count: number } } = {};
    filteredApps.forEach(app => {
      if (app.adminId && app.status !== 'pending') {
        const adminId = typeof app.adminId === 'string' 
          ? app.adminId 
          : (app.adminId._id || String(app.adminId));
        const adminName = typeof app.adminId === 'string' 
          ? 'Неизвестно' 
          : (app.adminId.name || 'Неизвестно');
        if (!adminStats[adminId]) {
          adminStats[adminId] = {
            name: adminName,
            count: 0
          };
        }
        adminStats[adminId].count++;
      }
    });

    return { total, approved, rejected, inProgress, pending, adminStats };
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

  const pendingApps = applications.filter((app) => app.status === 'pending');
  const processedApps = applications.filter((app) => app.status !== 'pending');

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
          <div className="mb-8">
            <h2 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent mb-2">
              Панель управления
            </h2>
            <p className="text-gray-600">Управление заявками и пользователями</p>
          </div>
          
          {/* Вкладки */}
          <div className="bg-white rounded-xl shadow-md border border-gray-100 mb-6 overflow-hidden">
            <nav className="flex space-x-1 p-1" aria-label="Tabs">
              <button
                onClick={() => setActiveTab('applications')}
                className={`${
                  activeTab === 'applications'
                    ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-lg'
                    : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                } flex-1 px-6 py-3 rounded-lg font-medium text-sm transition-all duration-200 transform hover:scale-105`}
              >
                <div className="flex items-center justify-center space-x-2">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  <span>Заявки</span>
                </div>
              </button>
              {(user?.role === 'admin' || user?.role === 'senioradmin' || user?.role === 'superadmin') && (
                <button
                  onClick={() => setActiveTab('create-user')}
                  className={`${
                    activeTab === 'create-user'
                      ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-lg'
                      : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                  } flex-1 px-6 py-3 rounded-lg font-medium text-sm transition-all duration-200 transform hover:scale-105`}
                >
                  <div className="flex items-center justify-center space-x-2">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                    </svg>
                    <span>Создать пользователя</span>
                  </div>
                </button>
              )}
              {(user?.role === 'senioradmin' || user?.role === 'superadmin') && (
                <button
                  onClick={() => setActiveTab('users')}
                  className={`${
                    activeTab === 'users'
                      ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-lg'
                      : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                  } flex-1 px-6 py-3 rounded-lg font-medium text-sm transition-all duration-200 transform hover:scale-105`}
                >
                  <div className="flex items-center justify-center space-x-2">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                    </svg>
                    <span>Пользователи</span>
                  </div>
                </button>
              )}
              {(user?.role === 'admin' || user?.role === 'senioradmin' || user?.role === 'superadmin') && (
                <button
                  onClick={() => setActiveTab('reports')}
                  className={`${
                    activeTab === 'reports'
                      ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-lg'
                      : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                  } flex-1 px-6 py-3 rounded-lg font-medium text-sm transition-all duration-200 transform hover:scale-105`}
                >
                  <div className="flex items-center justify-center space-x-2">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                    <span>Отчеты</span>
                  </div>
                </button>
              )}
            </nav>
          </div>

          {/* Контент вкладки "Заявки" */}
          {activeTab === 'applications' && (
            <div className="space-y-6 animate-fade-in">
              <div>
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-xl font-bold text-gray-900">
                    Заявки на рассмотрении
                  </h3>
                  <span className="badge bg-yellow-100 text-yellow-800">
                    {pendingApps.length}
                  </span>
                </div>
                <div className="card overflow-hidden">
              <ul className="divide-y divide-gray-200">
                {pendingApps.length === 0 ? (
                  <li className="px-6 py-4 text-center text-gray-500">
                    Нет заявок на рассмотрении
                  </li>
                ) : (
                  pendingApps.map((app) => (
                    <li key={app._id} className="px-6 py-4">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <h4 className="text-lg font-medium text-gray-900">
                            {app.title}
                          </h4>
                          <p className="mt-1 text-sm text-gray-600">
                            {app.description}
                          </p>
                          <p className="mt-2 text-xs text-gray-500">
                            <span className="font-medium">От:</span> {app.userId ? `${app.userId.name} (${app.userId.email})` : 'Пользователь удален'}
                          </p>
                          <p className="mt-1 text-xs text-gray-500">
                            {new Date(app.createdAt).toLocaleString('ru-RU')}
                          </p>
                        </div>
                        <div className="flex items-center space-x-2 ml-4">
                          <button
                            onClick={() => setSelectedApp(app)}
                            className="btn-primary flex items-center space-x-2"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                            </svg>
                            <span>Обработать</span>
                          </button>
                          <button
                            onClick={() => setDeleteConfirm({ type: 'application', id: app._id, name: app.title })}
                            className="btn-danger flex items-center space-x-2"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                            </svg>
                            <span>Удалить</span>
                          </button>
                        </div>
                      </div>
                    </li>
                  ))
                )}
              </ul>
            </div>
          </div>

          <div>
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-xl font-bold text-gray-900">
                    Обработанные заявки
                  </h3>
                  <span className="badge bg-green-100 text-green-800">
                    {processedApps.length}
                  </span>
                </div>
                <div className="card overflow-hidden">
              <ul className="divide-y divide-gray-200">
                {processedApps.length === 0 ? (
                  <li className="px-6 py-4 text-center text-gray-500">
                    Нет обработанных заявок
                  </li>
                ) : (
                  processedApps.map((app) => (
                    <li key={app._id} className="px-6 py-4">
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <h4 className="text-lg font-medium text-gray-900">
                            {app.title}
                          </h4>
                          <p className="mt-1 text-sm text-gray-600">
                            {app.description}
                          </p>
                          {app.adminComment && (
                            <p className="mt-2 text-sm text-gray-500">
                              <span className="font-medium">Комментарий:</span> {app.adminComment}
                            </p>
                          )}
                          <p className="mt-2 text-xs text-gray-500">
                            <span className="font-medium">От:</span> {app.userId ? `${app.userId.name} (${app.userId.email})` : 'Пользователь удален'}
                          </p>
                          <p className="mt-1 text-xs text-gray-500">
                            {new Date(app.createdAt).toLocaleString('ru-RU')}
                          </p>
                        </div>
                        <div className="flex items-center space-x-2">
                          <span
                            className={`badge ${getStatusColor(app.status)} shadow-sm`}
                          >
                            {getStatusText(app.status)}
                          </span>
                          <button
                            onClick={() => {
                              setSelectedApp(app);
                              setStatus(app.status);
                              setComment(app.adminComment || '');
                            }}
                            className="btn-primary flex items-center space-x-1"
                            title="Изменить статус"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                            </svg>
                          </button>
                          <button
                            onClick={() => setDeleteConfirm({ type: 'application', id: app._id, name: app.title })}
                            className="btn-danger flex items-center space-x-1"
                            title="Удалить заявку"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                            </svg>
                          </button>
                        </div>
                      </div>
                    </li>
                  ))
                )}
              </ul>
            </div>
          </div>
            </div>
          )}

          {/* Контент вкладки "Создать пользователя" */}
          {activeTab === 'create-user' && (
            <div className="card p-8 animate-fade-in">
              <div className="mb-6">
                <h3 className="text-2xl font-bold text-gray-900 mb-2">
                  Создать нового пользователя
                </h3>
                <p className="text-gray-600">Заполните форму для создания нового пользователя</p>
              </div>

              {userError && (
                <div className="bg-red-50 border-l-4 border-red-500 text-red-700 px-4 py-3 rounded-r-lg mb-4 flex items-center space-x-2 animate-slide-up">
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                  </svg>
                  <span>{userError}</span>
                </div>
              )}

              {userSuccess && (
                <div className="bg-green-50 border-l-4 border-green-500 text-green-700 px-4 py-3 rounded-r-lg mb-4 flex items-center space-x-2 animate-slide-up">
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                  <span>Пользователь успешно создан!</span>
                </div>
              )}

              <form onSubmit={handleCreateUser}>
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Имя
                  </label>
                  <input
                    type="text"
                    value={userForm.name}
                    onChange={(e) =>
                      setUserForm({ ...userForm, name: e.target.value })
                    }
                    required
                    className="input-field"
                  />
                </div>

                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Email
                  </label>
                  <input
                    type="email"
                    value={userForm.email}
                    onChange={(e) =>
                      setUserForm({ ...userForm, email: e.target.value })
                    }
                    required
                    className="input-field"
                  />
                </div>

                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Пароль
                  </label>
                  <input
                    type="password"
                    value={userForm.password}
                    onChange={(e) =>
                      setUserForm({ ...userForm, password: e.target.value })
                    }
                    required
                    minLength={6}
                    className="input-field"
                  />
                </div>

                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Роль
                  </label>
                  <select
                    value={userForm.role}
                    onChange={(e) =>
                      setUserForm({
                        ...userForm,
                        role: e.target.value as 'user' | 'admin',
                      })
                    }
                    className="input-field"
                  >
                    <option value="user">Пользователь</option>
                    <option value="admin">Специалист</option>
                    {user?.role === 'superadmin' && <option value="senioradmin">Главный специалист</option>}
                  </select>
                </div>

                <button
                  type="submit"
                  disabled={userLoading}
                  className="btn-primary flex items-center space-x-2 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {userLoading ? (
                    <>
                      <svg className="animate-spin h-5 w-5" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      <span>Создание...</span>
                    </>
                  ) : (
                    <>
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                      </svg>
                      <span>Создать пользователя</span>
                    </>
                  )}
                </button>
              </form>
            </div>
          )}

          {/* Контент вкладки "Управление пользователями" */}
          {activeTab === 'users' && (user?.role === 'senioradmin' || user?.role === 'superadmin') && (
            <div className="animate-fade-in">
              {usersError && (
                <div className="bg-red-50 border-l-4 border-red-500 text-red-700 px-4 py-3 rounded-r-lg mb-4 flex items-center space-x-2 animate-slide-up">
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                  </svg>
                  <span>{usersError}</span>
                </div>
              )}

              {usersSuccess && (
                <div className="bg-green-50 border-l-4 border-green-500 text-green-700 px-4 py-3 rounded-r-lg mb-4 flex items-center space-x-2 animate-slide-up">
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                  <span>{usersSuccess}</span>
                </div>
              )}

              {usersLoading ? (
                <div className="flex items-center justify-center py-12">
                  <div className="animate-spin rounded-full h-12 w-12 border-4 border-blue-200 border-t-blue-600"></div>
                </div>
              ) : (
                <div className="card overflow-hidden">
                  <ul className="divide-y divide-gray-200">
                    {users.length === 0 ? (
                      <li className="px-6 py-4 text-center text-gray-500">
                        Нет пользователей
                      </li>
                    ) : (
                      users.map((u) => (
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
                            <div className="flex items-center space-x-2">
                              <button
                                onClick={() => {
                                  setSelectedUser(u);
                                  setEditRole(u.role);
                                  setNewPassword('');
                                  setUsersError('');
                                  setUsersSuccess('');
                                }}
                                className="btn-primary flex items-center space-x-2"
                              >
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                </svg>
                                <span>Изменить</span>
                              </button>
                              <button
                                onClick={() => setDeleteConfirm({ type: 'user', id: u._id, name: u.name })}
                                className="btn-danger flex items-center space-x-2"
                              >
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                </svg>
                                <span>Удалить</span>
                              </button>
                            </div>
                          </div>
                        </li>
                      ))
                    )}
                  </ul>
                </div>
              )}
            </div>
          )}

          {/* Контент вкладки "Отчеты" */}
          {activeTab === 'reports' && (
            <div className="card p-8 animate-fade-in">
              <div className="mb-6">
                <h3 className="text-2xl font-bold text-gray-900 mb-2">
                  Отчеты по заявкам
                </h3>
                <p className="text-gray-600">Просмотр статистики и экспорт отчетов</p>
              </div>

              {/* Фильтры по датам */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Дата с
                  </label>
                  <input
                    type="date"
                    value={reportDateFrom}
                    onChange={(e) => setReportDateFrom(e.target.value)}
                    className="input-field"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Дата по
                  </label>
                  <input
                    type="date"
                    value={reportDateTo}
                    onChange={(e) => setReportDateTo(e.target.value)}
                    className="input-field"
                  />
                </div>
              </div>

              {/* Статистика */}
              {(() => {
                const stats = getReportStats();
                return (
                  <div className="mb-6">
                    <h4 className="text-md font-medium text-gray-900 mb-4">
                      Статистика
                    </h4>
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4 mb-6">
                      <div className="bg-gradient-to-br from-blue-50 to-blue-100 p-6 rounded-xl border border-blue-200 shadow-md hover:shadow-lg transition-shadow">
                        <div className="flex items-center justify-between mb-2">
                          <div className="text-3xl font-bold text-blue-600">
                            {stats.total}
                          </div>
                          <div className="w-12 h-12 bg-blue-500/20 rounded-lg flex items-center justify-center">
                            <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                            </svg>
                          </div>
                        </div>
                        <div className="text-sm font-medium text-gray-700">Всего заявок</div>
                      </div>
                      <div className="bg-gradient-to-br from-green-50 to-emerald-100 p-6 rounded-xl border border-green-200 shadow-md hover:shadow-lg transition-shadow">
                        <div className="flex items-center justify-between mb-2">
                          <div className="text-3xl font-bold text-green-600">
                            {stats.approved}
                          </div>
                          <div className="w-12 h-12 bg-green-500/20 rounded-lg flex items-center justify-center">
                            <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                            </svg>
                          </div>
                        </div>
                        <div className="text-sm font-medium text-gray-700">Одобрено</div>
                      </div>
                      <div className="bg-gradient-to-br from-red-50 to-rose-100 p-6 rounded-xl border border-red-200 shadow-md hover:shadow-lg transition-shadow">
                        <div className="flex items-center justify-between mb-2">
                          <div className="text-3xl font-bold text-red-600">
                            {stats.rejected}
                          </div>
                          <div className="w-12 h-12 bg-red-500/20 rounded-lg flex items-center justify-center">
                            <svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                          </div>
                        </div>
                        <div className="text-sm font-medium text-gray-700">Отклонено</div>
                      </div>
                      <div className="bg-gradient-to-br from-cyan-50 to-blue-100 p-6 rounded-xl border border-cyan-200 shadow-md hover:shadow-lg transition-shadow">
                        <div className="flex items-center justify-between mb-2">
                          <div className="text-3xl font-bold text-cyan-600">
                            {stats.inProgress || 0}
                          </div>
                          <div className="w-12 h-12 bg-cyan-500/20 rounded-lg flex items-center justify-center">
                            <svg className="w-6 h-6 text-cyan-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                            </svg>
                          </div>
                        </div>
                        <div className="text-sm font-medium text-gray-700">В процессе</div>
                      </div>
                      <div className="bg-gradient-to-br from-yellow-50 to-orange-100 p-6 rounded-xl border border-yellow-200 shadow-md hover:shadow-lg transition-shadow">
                        <div className="flex items-center justify-between mb-2">
                          <div className="text-3xl font-bold text-yellow-600">
                            {stats.pending}
                          </div>
                          <div className="w-12 h-12 bg-yellow-500/20 rounded-lg flex items-center justify-center">
                            <svg className="w-6 h-6 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                          </div>
                        </div>
                        <div className="text-sm font-medium text-gray-700">На рассмотрении</div>
                      </div>
                    </div>

                    <div className="bg-gradient-to-r from-green-100 to-emerald-100 p-6 rounded-xl border border-green-300 shadow-md mb-4">
                      <div className="text-lg font-bold text-green-800">
                        Выполнено заявок: {stats.approved}
                      </div>
                      <div className="text-sm text-green-700">
                        {stats.total > 0 
                          ? `Процент выполнения: ${((stats.approved / stats.total) * 100).toFixed(1)}%`
                          : 'Нет данных'}
                      </div>
                    </div>

                    {/* Статистика по администраторам */}
                    {Object.keys(stats.adminStats).length > 0 && (
                      <div className="mb-6">
                        <h4 className="text-md font-medium text-gray-900 mb-3">
                          Статистика по специалистам
                        </h4>
                        <div className="bg-gray-50 p-4 rounded-lg">
                          <ul className="space-y-2">
                            {Object.entries(stats.adminStats).map(([id, stat]) => (
                              <li key={id} className="flex justify-between items-center">
                                <span className="text-gray-700">{stat.name}</span>
                                <span className="font-medium text-gray-900">
                                  {stat.count} заявок
                                </span>
                              </li>
                            ))}
                          </ul>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })()}

              {/* Кнопка скачивания PDF */}
              <button
                onClick={generatePDFReport}
                disabled={pdfGenerating}
                className="btn-primary flex items-center space-x-2 w-full sm:w-auto disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {pdfGenerating ? (
                  <>
                    <svg className="animate-spin h-5 w-5" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    <span>Генерация PDF...</span>
                  </>
                ) : (
                  <>
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                    <span>Скачать отчет в PDF</span>
                  </>
                )}
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Модальное окно для обработки заявки */}
      {selectedApp && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm overflow-y-auto h-full w-full z-50 flex items-center justify-center p-4 animate-fade-in">
          <div className="card p-6 w-full max-w-md animate-slide-up">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-2xl font-bold text-gray-900">
                {selectedApp.status === 'pending' ? 'Обработка заявки' : 'Изменение статуса заявки'}
              </h3>
              <button
                onClick={() => {
                  setSelectedApp(null);
                  setComment('');
                  setStatus('in_progress');
                }}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Статус
              </label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value as 'pending' | 'in_progress' | 'approved' | 'rejected')}
                className="input-field"
              >
                <option value="pending">На рассмотрении</option>
                <option value="in_progress">В процессе</option>
                <option value="approved">Одобрить</option>
                <option value="rejected">Отклонить</option>
              </select>
            </div>
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Комментарий (необязательно)
              </label>
              <textarea
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                rows={3}
                className="input-field"
                placeholder="Введите комментарий"
              />
            </div>
            <div className="flex justify-end space-x-3 mt-6">
              <button
                onClick={() => {
                  setSelectedApp(null);
                  setComment('');
                  setStatus('in_progress');
                }}
                className="btn-secondary"
              >
                Отмена
              </button>
              <button
                onClick={() => handleStatusChange(selectedApp._id)}
                className="btn-primary"
              >
                Сохранить
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Модальное окно для редактирования пользователя */}
      {selectedUser && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm overflow-y-auto h-full w-full z-50 flex items-center justify-center p-4 animate-fade-in">
          <div className="card p-6 w-full max-w-md animate-slide-up">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-2xl font-bold text-gray-900">
                Редактирование пользователя
              </h3>
              <button
                onClick={() => {
                  setSelectedUser(null);
                  setNewPassword('');
                  setUsersError('');
                  setUsersSuccess('');
                }}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <div className="mb-4 p-3 bg-blue-50 rounded-lg border border-blue-200">
              <p className="text-sm font-medium text-blue-900">{selectedUser.name}</p>
              <p className="text-xs text-blue-700">{selectedUser.email}</p>
            </div>

            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Роль
              </label>
              <select
                value={editRole}
                onChange={(e) =>
                  setEditRole(e.target.value as 'user' | 'admin' | 'senioradmin' | 'superadmin')
                }
                className="input-field"
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
                className="input-field"
                placeholder="Введите новый пароль"
              />
            </div>

            <div className="flex justify-end space-x-3 mt-6">
              <button
                onClick={() => {
                  setSelectedUser(null);
                  setNewPassword('');
                  setUsersError('');
                  setUsersSuccess('');
                }}
                className="btn-secondary"
              >
                Отмена
              </button>
              <button
                onClick={handleUpdateUser}
                className="btn-primary"
              >
                Сохранить
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Модальное окно подтверждения удаления */}
      {deleteConfirm.type && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm overflow-y-auto h-full w-full z-50 flex items-center justify-center p-4 animate-fade-in">
          <div className="card p-6 w-full max-w-md animate-slide-up">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-2xl font-bold text-gray-900">
                Подтверждение удаления
              </h3>
              <button
                onClick={() => setDeleteConfirm({ type: null, id: null, name: null })}
                className="text-gray-400 hover:text-gray-600 transition-colors"
                disabled={deleting}
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <div className="mb-6">
              <div className="bg-red-50 border-l-4 border-red-500 p-4 rounded-r-lg mb-4">
                <div className="flex items-center space-x-2">
                  <svg className="w-5 h-5 text-red-600" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                  </svg>
                  <span className="text-red-800 font-medium">Внимание!</span>
                </div>
              </div>
              <p className="text-gray-700">
                Вы уверены, что хотите удалить{' '}
                <span className="font-bold text-gray-900">
                  {deleteConfirm.type === 'user' ? 'пользователя' : 'заявку'} "{deleteConfirm.name}"?
                </span>
              </p>
              {deleteConfirm.type === 'user' && (
                <p className="text-sm text-gray-500 mt-2">
                  Это действие нельзя отменить. Все данные пользователя будут безвозвратно удалены.
                </p>
              )}
              {deleteConfirm.type === 'application' && (
                <p className="text-sm text-gray-500 mt-2">
                  Это действие нельзя отменить. Заявка будет безвозвратно удалена.
                </p>
              )}
            </div>
            <div className="flex justify-end space-x-3">
              <button
                onClick={() => setDeleteConfirm({ type: null, id: null, name: null })}
                className="btn-secondary"
                disabled={deleting}
              >
                Отмена
              </button>
              <button
                onClick={() => {
                  if (deleteConfirm.type === 'user') {
                    handleDeleteUser();
                  } else if (deleteConfirm.type === 'application') {
                    handleDeleteApplication();
                  }
                }}
                className="btn-danger flex items-center space-x-2"
                disabled={deleting}
              >
                {deleting ? (
                  <>
                    <svg className="animate-spin h-5 w-5" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    <span>Удаление...</span>
                  </>
                ) : (
                  <>
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                    <span>Удалить</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

