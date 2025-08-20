import React from 'react';
import RoleBasedNotificationCenter from '@/components/alerts/RoleBasedNotificationCenter';

const NotificationsCenterPage = () => {
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-8 pt-20">
        <div className="max-w-6xl mx-auto">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900">📬 Centre de Notifications</h1>
            <p className="text-gray-600 mt-2">
              Système de notifications basé sur les rôles avec alertes automatiques et escalade
            </p>
          </div>
          
          <RoleBasedNotificationCenter />
        </div>
      </div>
    </div>
  );
};

export default NotificationsCenterPage;