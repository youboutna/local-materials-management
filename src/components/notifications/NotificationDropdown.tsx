import React from 'react';
import { Link } from 'react-router-dom';
import { Bell, Eye, EyeOff, CheckCheck } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useNotifications } from '@/hooks/useNotifications';
import { getTaskLink, getPriorityColor, getNotificationLink } from '@/utils/notificationUtils';
import { NotificationType } from '@/dtos/entities/ProjectReportDTO';
import { formatDistanceToNow } from 'date-fns';
import { fr } from 'date-fns/locale';
import { useAuth } from '@/contexts/use-auth';

export function NotificationDropdown() {
  const { user } = useAuth();
  const { notifications, unreadCount, markAsRead, markAllAsRead } = useNotifications(user?.id);

  const recentNotifications = notifications.slice(0, 10);

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="relative">
          <Bell className="h-5 w-5" />
          {unreadCount > 0 && (
            <Badge 
              variant="destructive" 
              className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-0 text-xs"
            >
              {unreadCount > 99 ? '99+' : unreadCount}
            </Badge>
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-80" align="end">
        <DropdownMenuLabel className="flex items-center justify-between">
          <span>Notifications</span>
          {unreadCount > 0 && (
            <Button
              variant="ghost"
              size="sm"
              onClick={markAllAsRead}
              className="h-auto p-1 text-xs"
            >
              <CheckCheck className="h-3 w-3 mr-1" />
              Tout marquer lu
            </Button>
          )}
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        
        {recentNotifications.length === 0 ? (
          <div className="p-4 text-center text-muted-foreground">
            Aucune notification
          </div>
        ) : (
          <ScrollArea className="h-96">
            {recentNotifications.map((notification) => {
              const notificationLink = getNotificationLink(
                notification.type as NotificationType,
                notification.metadata || {},
                notification.related_id || undefined
              );
              
              return (
                <DropdownMenuItem
                  key={notification.id}
                  className={`p-3 cursor-pointer ${!notification.read ? 'bg-blue-50' : ''}`}
                  asChild
                >
                  <Link
                    to={notificationLink}
                    onClick={() => !notification.read && markAsRead(notification.id)}
                  >
                  <div className="w-full">
                    <div className="flex items-center justify-between mb-1">
                      <h4 className="text-sm font-medium truncate flex-1">
                        {notification.title}
                      </h4>
                      <div className="flex items-center gap-1 ml-2">
                        {(notification.metadata as any)?.priority && (
                          <Badge 
                            variant="outline" 
                            className={`text-xs ${getPriorityColor(String((notification.metadata as any).priority))}`}
                          >
                            {String((notification.metadata as any).priority)}
                          </Badge>
                        )}
                        {!notification.read && (
                          <div className="w-2 h-2 bg-blue-500 rounded-full" />
                        )}
                      </div>
                    </div>
                    <p className="text-xs text-muted-foreground line-clamp-2 mb-1">
                      {notification.message}
                    </p>
                    {(notification.metadata as any)?.documents && ((notification.metadata as any).documents as any[])?.length > 0 && (
                      <div className="mt-2 space-y-1">
                        {((notification.metadata as any).documents as any[]).slice(0, 3).map((d: any, i: number) => (
                          <a
                            key={i}
                            href={d.file_url || d.fileUrl || d.url}
                            target="_blank"
                            rel="noreferrer"
                            className="text-xs text-blue-600 hover:underline block"
                          >
                            {d.file_name || d.name || `Document ${i + 1}`}
                          </a>
                        ))}
                      </div>
                    )}
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-muted-foreground">
                        {formatDistanceToNow(new Date(notification.created_at), { 
                          addSuffix: true, 
                          locale: fr 
                        })}
                      </span>
                      {(notification.metadata as any)?.task_type && (
                        <Badge variant="secondary" className="text-xs">
                          {String((notification.metadata as any).task_type)}
                        </Badge>
                      )}
                    </div>
                  </div>
                  </Link>
                </DropdownMenuItem>
              );
            })}
          </ScrollArea>
        )}
        
        {notifications.length > 10 && (
          <>
            <DropdownMenuSeparator />
            <DropdownMenuItem asChild>
              <Link to="/notifications" className="text-center w-full">
                Voir toutes les notifications
              </Link>
            </DropdownMenuItem>
          </>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
