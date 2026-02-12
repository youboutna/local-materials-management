/**
 * Location Analytics Component
 * Provides comprehensive location-based analytics for projects
 * Following PROMPTS.md Rule #4: Use centralized DTOs, no type redefinition
 */

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  BarChart, 
  Bar, 
  PieChart, 
  Pie, 
  Cell, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend, 
  ResponsiveContainer 
} from 'recharts';
import { 
  MapPin, 
  TrendingUp, 
  Users, 
  Building, 
  DollarSign,
  Filter,
  Download,
  RefreshCw
} from 'lucide-react';
import LocationAutocomplete from '../location/LocationAutocomplete';
import { useLocationHex } from '@/hooks/hexagonal/useLocationHex';
import { LocationDTO } from '@/dtos/shared';

interface LocationAnalyticsProps {
  projects: Array<{
    id: string;
    title: string;
    location: string;
    regionCode?: string;
    cityCode?: string;
    budget?: number;
    progress?: number;
    status: string;
  }>;
  className?: string;
}

interface LocationStats {
  region: string;
  projectCount: number;
  totalBudget: number;
  avgProgress: number;
  activeProjects: number;
}

interface RegionalDistribution {
  name: string;
  value: number;
  percentage: number;
  color: string;
}

const LocationAnalytics: React.FC<LocationAnalyticsProps> = ({
  projects,
  className = ''
}) => {
  const { searchLocations, allRegions, allCities, isLoading } = useLocationHex();
  const [selectedRegion, setSelectedRegion] = useState<string>('');
  const [selectedCity, setSelectedCity] = useState<string>('');
  const [locationStats, setLocationStats] = useState<LocationStats[]>([]);
  const [regionalDistribution, setRegionalDistribution] = useState<RegionalDistribution[]>([]);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Calculate location statistics
  useEffect(() => {
    if (!projects || projects.length === 0) return;

    // Group projects by region
    const regionMap = new Map<string, {
      projectCount: number;
      totalBudget: number;
      totalProgress: number;
      activeProjects: number;
    }>();

    projects.forEach(project => {
      const region = project.regionCode || project.location || 'Unknown';
      const existing = regionMap.get(region) || {
        projectCount: 0,
        totalBudget: 0,
        totalProgress: 0,
        activeProjects: 0
      };

      regionMap.set(region, {
        projectCount: existing.projectCount + 1,
        totalBudget: existing.totalBudget + (project.budget || 0),
        totalProgress: existing.totalProgress + (project.progress || 0),
        activeProjects: existing.activeProjects + (project.status === 'en_cours' ? 1 : 0)
      });
    });

    // Convert to stats array
    const stats: LocationStats[] = Array.from(regionMap.entries()).map(([region, data]) => ({
      region,
      projectCount: data.projectCount,
      totalBudget: data.totalBudget,
      avgProgress: data.projectCount > 0 ? data.totalProgress / data.projectCount : 0,
      activeProjects: data.activeProjects
    }));

    setLocationStats(stats);

    // Calculate regional distribution for pie chart
    const totalProjects = projects.length;
    const distribution: RegionalDistribution[] = stats.map((stat, index) => ({
      name: stat.region,
      value: stat.projectCount,
      percentage: totalProjects > 0 ? (stat.projectCount / totalProjects) * 100 : 0,
      color: getColorByIndex(index)
    }));

    setRegionalDistribution(distribution);
  }, [projects]);

  // Filter projects by location
  const getFilteredProjects = () => {
    if (!projects) return [];

    return projects.filter(project => {
      const matchesRegion = !selectedRegion || project.regionCode === selectedRegion;
      const matchesCity = !selectedCity || project.cityCode === selectedCity;
      return matchesRegion && matchesCity;
    });
  };

  // Handle location search
  const handleLocationSearch = (address: string, locationData?: LocationDTO) => {
    if (locationData) {
      if (locationData.type === 'region') {
        setSelectedRegion(locationData.code);
        setSelectedCity('');
      } else if (locationData.type === 'city') {
        setSelectedCity(locationData.code);
        setSelectedRegion(locationData.parentCode || '');
      }
    } else {
      setSelectedRegion('');
      setSelectedCity('');
    }
  };

  // Refresh data
  const handleRefresh = async () => {
    setIsRefreshing(true);
    // Simulate refresh delay
    await new Promise(resolve => setTimeout(resolve, 1000));
    setIsRefreshing(false);
  };

  // Export analytics
  const handleExport = () => {
    const data = getFilteredProjects().map(project => ({
      title: project.title,
      location: project.location,
      region: project.regionCode,
      city: project.cityCode,
      budget: project.budget,
      progress: project.progress,
      status: project.status
    }));

    const csv = [
      ['Title', 'Location', 'Region', 'City', 'Budget', 'Progress', 'Status'],
      ...data.map(row => [
        row.title,
        row.location,
        row.region,
        row.city,
        row.budget?.toString() || '',
        row.progress?.toString() || '',
        row.status
      ])
    ].map(row => row.join(',')).join('\n');

    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `location-analytics-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // Get color for chart
  const getColorByIndex = (index: number): string => {
    const colors = [
      '#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6',
      '#06b6d4', '#84cc16', '#f97316', '#ec4899', '#6366f1'
    ];
    return colors[index % colors.length];
  };

  const filteredProjects = getFilteredProjects();
  const totalBudget = filteredProjects.reduce((sum, p) => sum + (p.budget || 0), 0);
  const avgProgress = filteredProjects.length > 0 
    ? filteredProjects.reduce((sum, p) => sum + (p.progress || 0), 0) / filteredProjects.length 
    : 0;

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <MapPin className="h-6 w-6" />
            Location Analytics
          </h2>
          <p className="text-muted-foreground">
            Comprehensive analysis of project distribution by location
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={handleRefresh} disabled={isRefreshing}>
            <RefreshCw className={`h-4 w-4 mr-2 ${isRefreshing ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
          <Button variant="outline" size="sm" onClick={handleExport}>
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
        </div>
      </div>

      {/* Location Search */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="h-5 w-5" />
            Location Filter
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <LocationAutocomplete
              value={selectedRegion || selectedCity}
              onChange={handleLocationSearch}
              placeholder="Filter by region or city..."
              filter="all"
              className="w-full"
            />
            {(selectedRegion || selectedCity) && (
              <div className="flex items-center gap-2">
                <Badge variant="outline">
                  {selectedRegion || selectedCity}
                </Badge>
                <Button variant="ghost" size="sm" onClick={() => handleLocationSearch('', undefined)}>
                  Clear
                </Button>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total Projects</p>
                <p className="text-2xl font-bold">{filteredProjects.length}</p>
              </div>
              <Building className="h-8 w-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total Budget</p>
                <p className="text-2xl font-bold">
                  ${totalBudget.toLocaleString()}
                </p>
              </div>
              <DollarSign className="h-8 w-8 text-green-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Avg Progress</p>
                <p className="text-2xl font-bold">{avgProgress.toFixed(1)}%</p>
              </div>
              <TrendingUp className="h-8 w-8 text-purple-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Active Projects</p>
                <p className="text-2xl font-bold">
                  {filteredProjects.filter(p => p.status === 'en_cours').length}
                </p>
              </div>
              <Users className="h-8 w-8 text-orange-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts */}
      <Tabs defaultValue="distribution" className="space-y-6">
        <TabsList>
          <TabsTrigger value="distribution">Regional Distribution</TabsTrigger>
          <TabsTrigger value="comparison">Location Comparison</TabsTrigger>
          <TabsTrigger value="details">Detailed Stats</TabsTrigger>
        </TabsList>

        <TabsContent value="distribution">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Projects by Region</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={regionalDistribution}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, percentage }) => `${name} ${percentage.toFixed(1)}%`}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {regionalDistribution.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Budget Distribution</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={locationStats}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="region" />
                    <YAxis />
                    <Tooltip />
                    <Bar dataKey="totalBudget" fill="#3b82f6" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="comparison">
          <Card>
            <CardHeader>
              <CardTitle>Location Performance Comparison</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={400}>
                <BarChart data={locationStats}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="region" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="projectCount" fill="#3b82f6" name="Projects" />
                  <Bar dataKey="avgProgress" fill="#10b981" name="Avg Progress" />
                  <Bar dataKey="activeProjects" fill="#f59e0b" name="Active" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="details">
          <Card>
            <CardHeader>
              <CardTitle>Detailed Location Statistics</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {locationStats.map((stat, index) => (
                  <div key={stat.region} className="p-4 border rounded-lg">
                    <div className="flex items-center justify-between mb-2">
                      <h3 className="font-semibold">{stat.region}</h3>
                      <Badge variant="outline">{stat.projectCount} projects</Badge>
                    </div>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                      <div>
                        <p className="text-muted-foreground">Total Budget</p>
                        <p className="font-medium">${stat.totalBudget.toLocaleString()}</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">Avg Progress</p>
                        <div className="flex items-center gap-2">
                          <Progress value={stat.avgProgress} className="flex-1 h-2" />
                          <span className="font-medium">{stat.avgProgress.toFixed(1)}%</span>
                        </div>
                      </div>
                      <div>
                        <p className="text-muted-foreground">Active Projects</p>
                        <p className="font-medium">{stat.activeProjects}</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">Completion Rate</p>
                        <p className="font-medium">
                          {stat.projectCount > 0 
                            ? ((stat.projectCount - stat.activeProjects) / stat.projectCount * 100).toFixed(1)
                            : 0}%
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default LocationAnalytics;
