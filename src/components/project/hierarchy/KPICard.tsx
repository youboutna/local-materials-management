import React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { TrendingUp, TrendingDown, Minus } from "lucide-react";

interface KPICardProps {
  title: string;
  value: string | number;
  icon: React.ReactNode;
  color?: "primary" | "success" | "warning" | "destructive" | "info" | "muted";
  subtitle?: string;
  trend?: "positive" | "negative" | "neutral";
  trendValue?: string;
  className?: string;
}

const colorClasses = {
  primary: "bg-primary/10 text-primary",
  success: "bg-success/10 text-success",
  warning: "bg-warning/10 text-warning",
  destructive: "bg-destructive/10 text-destructive",
  info: "bg-info/10 text-info",
  muted: "bg-muted text-muted-foreground",
};

const iconBgClasses = {
  primary: "bg-primary text-primary-foreground",
  success: "bg-success text-success-foreground",
  warning: "bg-warning text-warning-foreground",
  destructive: "bg-destructive text-destructive-foreground",
  info: "bg-info text-info-foreground",
  muted: "bg-muted-foreground text-background",
};

export const KPICard: React.FC<KPICardProps> = ({
  title,
  value,
  icon,
  color = "primary",
  subtitle,
  trend,
  trendValue,
  className,
}) => {
  const getTrendIcon = () => {
    switch (trend) {
      case "positive":
        return <TrendingUp className="h-3 w-3 text-success" />;
      case "negative":
        return <TrendingDown className="h-3 w-3 text-destructive" />;
      default:
        return <Minus className="h-3 w-3 text-muted-foreground" />;
    }
  };

  const getTrendColor = () => {
    switch (trend) {
      case "positive":
        return "text-success";
      case "negative":
        return "text-destructive";
      default:
        return "text-muted-foreground";
    }
  };

  return (
    <Card className={cn("overflow-hidden border-none shadow-sm hover:shadow-md transition-shadow", className)}>
      <CardContent className="p-4">
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1 min-w-0">
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider truncate">
              {title}
            </p>
            <p className="text-2xl font-bold mt-1 truncate">{value}</p>
            {(subtitle || trendValue) && (
              <div className="flex items-center gap-2 mt-1">
                {trendValue && trend && (
                  <div className={cn("flex items-center gap-1 text-xs font-medium", getTrendColor())}>
                    {getTrendIcon()}
                    <span>{trendValue}</span>
                  </div>
                )}
                {subtitle && (
                  <p className="text-xs text-muted-foreground truncate">{subtitle}</p>
                )}
              </div>
            )}
          </div>
          <div className={cn("p-2.5 rounded-lg shrink-0", iconBgClasses[color])}>
            {icon}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default KPICard;
