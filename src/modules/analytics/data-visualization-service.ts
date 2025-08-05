// Data Visualization Service - Module 54
import { getDataService } from '../core/data-service';
import { getAnalyticsService } from '../core/analytics-service';
import { getPerformanceMetricsService } from './performance-metrics-service';
import { getUsagePatternsService } from './usage-patterns-service';

interface ChartConfig {
  type: 'line' | 'bar' | 'pie' | 'area' | 'scatter' | 'heatmap' | 'radar' | 'gauge';
  data: ChartData;
  options?: ChartOptions;
  responsive?: boolean;
  animations?: boolean;
}

interface ChartData {
  labels: string[];
  datasets: Dataset[];
}

interface Dataset {
  label: string;
  data: number[];
  backgroundColor?: string | string[];
  borderColor?: string | string[];
  borderWidth?: number;
  fill?: boolean;
  tension?: number;
  pointRadius?: number;
  yAxisID?: string;
}

interface ChartOptions {
  title?: string;
  subtitle?: string;
  xAxis?: AxisOptions;
  yAxis?: AxisOptions | AxisOptions[];
  legend?: LegendOptions;
  tooltip?: TooltipOptions;
  grid?: GridOptions;
  scales?: Record<string, any>;
}

interface AxisOptions {
  label?: string;
  min?: number;
  max?: number;
  ticks?: TickOptions;
  type?: 'linear' | 'logarithmic' | 'time' | 'category';
  position?: 'left' | 'right' | 'top' | 'bottom';
}

interface TickOptions {
  stepSize?: number;
  format?: (value: any) => string;
  autoSkip?: boolean;
  maxTicksLimit?: number;
}

interface LegendOptions {
  display?: boolean;
  position?: 'top' | 'bottom' | 'left' | 'right';
  align?: 'start' | 'center' | 'end';
}

interface TooltipOptions {
  enabled?: boolean;
  format?: (data: any) => string;
  callbacks?: Record<string, Function>;
}

interface GridOptions {
  display?: boolean;
  color?: string;
  lineWidth?: number;
}

interface Dashboard {
  id: string;
  name: string;
  description: string;
  widgets: Widget[];
  layout: LayoutConfig;
  refreshInterval?: number;
  filters?: DashboardFilter[];
}

interface Widget {
  id: string;
  type: 'chart' | 'metric' | 'table' | 'timeline' | 'map' | 'custom';
  title: string;
  dataSource: string;
  config: any;
  position: WidgetPosition;
  size: WidgetSize;
  refreshInterval?: number;
}

interface WidgetPosition {
  x: number;
  y: number;
}

interface WidgetSize {
  width: number;
  height: number;
}

interface LayoutConfig {
  type: 'grid' | 'flex' | 'absolute';
  columns?: number;
  rows?: number;
  gap?: number;
}

interface DashboardFilter {
  id: string;
  type: 'date' | 'select' | 'range' | 'search';
  label: string;
  field: string;
  options?: any;
  defaultValue?: any;
}

interface VisualizationTheme {
  name: string;
  colors: {
    primary: string[];
    secondary: string[];
    background: string;
    text: string;
    grid: string;
    accent: string;
  };
  fonts: {
    title: string;
    label: string;
    data: string;
  };
}

export class DataVisualizationService {
  private static instance: DataVisualizationService;
  private dataService = getDataService();
  private analyticsService = getAnalyticsService();
  private performanceMetricsService = getPerformanceMetricsService();
  private usagePatternsService = getUsagePatternsService();
  
  private dashboards: Map<string, Dashboard> = new Map();
  private activeWidgets: Map<string, Widget> = new Map();
  private chartCache: Map<string, ChartConfig> = new Map();
  private updateTimers: Map<string, NodeJS.Timeout> = new Map();
  
  private themes: Map<string, VisualizationTheme> = new Map();
  private currentTheme: string = 'default';
  
  private readonly defaultColors = {
    primary: ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#EC4899'],
    secondary: ['#60A5FA', '#34D399', '#FBBF24', '#F87171', '#A78BFA', '#F472B6'],
    success: '#10B981',
    warning: '#F59E0B',
    error: '#EF4444',
    info: '#3B82F6'
  };

  private constructor() {
    this.initializeThemes();
    this.initializeDefaultDashboards();
  }

  static getInstance(): DataVisualizationService {
    if (!DataVisualizationService.instance) {
      DataVisualizationService.instance = new DataVisualizationService();
    }
    return DataVisualizationService.instance;
  }

  initialize(): void {
    console.log('DataVisualizationService initializing...');
    this.loadSavedDashboards();
    this.startAutoRefresh();
    this.setupEventListeners();
    console.log('DataVisualizationService initialized');
  }

  private initializeThemes(): void {
    // Default theme
    this.themes.set('default', {
      name: 'Default',
      colors: {
        primary: this.defaultColors.primary,
        secondary: this.defaultColors.secondary,
        background: '#FFFFFF',
        text: '#1F2937',
        grid: '#E5E7EB',
        accent: '#3B82F6'
      },
      fonts: {
        title: 'system-ui, -apple-system, sans-serif',
        label: 'system-ui, -apple-system, sans-serif',
        data: 'monospace'
      }
    });

    // Dark theme
    this.themes.set('dark', {
      name: 'Dark',
      colors: {
        primary: this.defaultColors.primary,
        secondary: this.defaultColors.secondary,
        background: '#1F2937',
        text: '#F9FAFB',
        grid: '#374151',
        accent: '#60A5FA'
      },
      fonts: {
        title: 'system-ui, -apple-system, sans-serif',
        label: 'system-ui, -apple-system, sans-serif',
        data: 'monospace'
      }
    });

    // High contrast theme
    this.themes.set('high-contrast', {
      name: 'High Contrast',
      colors: {
        primary: ['#000000', '#FFFFFF', '#FF0000', '#00FF00', '#0000FF', '#FFFF00'],
        secondary: ['#333333', '#CCCCCC', '#CC0000', '#00CC00', '#0000CC', '#CCCC00'],
        background: '#FFFFFF',
        text: '#000000',
        grid: '#000000',
        accent: '#0000FF'
      },
      fonts: {
        title: 'Arial, sans-serif',
        label: 'Arial, sans-serif',
        data: 'Courier New, monospace'
      }
    });
  }

  private initializeDefaultDashboards(): void {
    // Performance Overview Dashboard
    this.dashboards.set('performance-overview', {
      id: 'performance-overview',
      name: 'Performance Overview',
      description: 'Key performance metrics and trends',
      layout: {
        type: 'grid',
        columns: 12,
        rows: 8,
        gap: 16
      },
      widgets: [
        {
          id: 'overall-score',
          type: 'metric',
          title: 'Overall Score',
          dataSource: 'performance.overall',
          config: {
            format: 'percentage',
            showTrend: true,
            size: 'large'
          },
          position: { x: 0, y: 0 },
          size: { width: 3, height: 2 }
        },
        {
          id: 'wpm-chart',
          type: 'chart',
          title: 'Words Per Minute',
          dataSource: 'performance.wpm',
          config: {
            type: 'line',
            timeRange: '7d',
            showAverage: true
          },
          position: { x: 3, y: 0 },
          size: { width: 6, height: 4 }
        },
        {
          id: 'accuracy-gauge',
          type: 'chart',
          title: 'Accuracy Rate',
          dataSource: 'performance.accuracy',
          config: {
            type: 'gauge',
            min: 0,
            max: 100,
            thresholds: [50, 70, 90]
          },
          position: { x: 9, y: 0 },
          size: { width: 3, height: 2 }
        }
      ],
      refreshInterval: 60000 // 1 minute
    });

    // Usage Patterns Dashboard
    this.dashboards.set('usage-patterns', {
      id: 'usage-patterns',
      name: 'Usage Patterns',
      description: 'Communication patterns and habits',
      layout: {
        type: 'grid',
        columns: 12,
        rows: 8,
        gap: 16
      },
      widgets: [
        {
          id: 'usage-heatmap',
          type: 'chart',
          title: 'Weekly Activity Heatmap',
          dataSource: 'patterns.heatmap',
          config: {
            type: 'heatmap',
            showLabels: true
          },
          position: { x: 0, y: 0 },
          size: { width: 8, height: 4 }
        },
        {
          id: 'category-distribution',
          type: 'chart',
          title: 'Category Usage',
          dataSource: 'patterns.categories',
          config: {
            type: 'pie',
            showPercentages: true
          },
          position: { x: 8, y: 0 },
          size: { width: 4, height: 4 }
        }
      ],
      refreshInterval: 300000 // 5 minutes
    });

    // Progress Tracking Dashboard
    this.dashboards.set('progress-tracking', {
      id: 'progress-tracking',
      name: 'Progress Tracking',
      description: 'Long-term progress and milestones',
      layout: {
        type: 'grid',
        columns: 12,
        rows: 10,
        gap: 16
      },
      widgets: [
        {
          id: 'milestone-timeline',
          type: 'timeline',
          title: 'Achievements Timeline',
          dataSource: 'progress.milestones',
          config: {
            groupBy: 'category',
            showDetails: true
          },
          position: { x: 0, y: 0 },
          size: { width: 12, height: 3 }
        },
        {
          id: 'goal-progress',
          type: 'chart',
          title: 'Goal Progress',
          dataSource: 'progress.goals',
          config: {
            type: 'bar',
            orientation: 'horizontal',
            showTargets: true
          },
          position: { x: 0, y: 3 },
          size: { width: 6, height: 4 }
        }
      ]
    });
  }

  private setupEventListeners(): void {
    // Listen for data updates
    window.addEventListener('performanceDataUpdated', () => {
      this.refreshActiveWidgets('performance');
    });

    window.addEventListener('patternDetected', () => {
      this.refreshActiveWidgets('patterns');
    });

    // Listen for theme changes
    window.addEventListener('themeChanged', (e: any) => {
      this.setTheme(e.detail.theme);
    });
  }

  private startAutoRefresh(): void {
    this.dashboards.forEach(dashboard => {
      if (dashboard.refreshInterval) {
        const timer = setInterval(() => {
          this.refreshDashboard(dashboard.id);
        }, dashboard.refreshInterval);
        
        this.updateTimers.set(dashboard.id, timer);
      }
    });
  }

  // Chart Creation Methods
  createChart(config: ChartConfig): string {
    const chartId = `chart-${Date.now()}`;
    this.chartCache.set(chartId, config);
    
    this.analyticsService.trackEvent('chart_created', {
      type: config.type,
      datasets: config.data.datasets.length
    });

    return chartId;
  }

  createPerformanceChart(
    metric: string,
    timeRange: 'day' | 'week' | 'month' = 'week'
  ): ChartConfig {
    const history = this.getMetricHistory(metric, timeRange);
    const theme = this.themes.get(this.currentTheme)!;
    
    return {
      type: 'line',
      data: {
        labels: history.labels,
        datasets: [{
          label: this.getMetricLabel(metric),
          data: history.values,
          borderColor: theme.colors.primary[0],
          backgroundColor: theme.colors.primary[0] + '20',
          fill: true,
          tension: 0.4,
          pointRadius: 3
        }]
      },
      options: {
        title: this.getMetricLabel(metric),
        xAxis: {
          type: 'time',
          label: 'Time'
        },
        yAxis: {
          label: this.getMetricUnit(metric),
          min: 0
        },
        tooltip: {
          enabled: true,
          format: (data: any) => `${data.value} ${this.getMetricUnit(metric)}`
        }
      },
      responsive: true,
      animations: true
    };
  }

  createComparisonChart(
    metrics: string[],
    timeRange: 'day' | 'week' | 'month' = 'week'
  ): ChartConfig {
    const theme = this.themes.get(this.currentTheme)!;
    const datasets: Dataset[] = [];
    let labels: string[] = [];

    metrics.forEach((metric, index) => {
      const history = this.getMetricHistory(metric, timeRange);
      if (index === 0) {
        labels = history.labels;
      }
      
      datasets.push({
        label: this.getMetricLabel(metric),
        data: this.normalizeValues(history.values),
        borderColor: theme.colors.primary[index % theme.colors.primary.length],
        backgroundColor: 'transparent',
        borderWidth: 2,
        pointRadius: 2
      });
    });

    return {
      type: 'line',
      data: { labels, datasets },
      options: {
        title: 'Metric Comparison',
        yAxis: {
          label: 'Normalized Value',
          min: 0,
          max: 100
        },
        legend: {
          display: true,
          position: 'bottom'
        }
      },
      responsive: true
    };
  }

  createHeatmap(
    dataType: 'usage' | 'performance' | 'engagement'
  ): ChartConfig {
    const data = this.getHeatmapData(dataType);
    const theme = this.themes.get(this.currentTheme)!;
    
    return {
      type: 'heatmap',
      data: {
        labels: data.xLabels,
        datasets: data.yLabels.map((yLabel, yIndex) => ({
          label: yLabel,
          data: data.values[yIndex],
          backgroundColor: this.generateHeatmapColors(data.values[yIndex], theme)
        }))
      },
      options: {
        title: `${dataType.charAt(0).toUpperCase() + dataType.slice(1)} Heatmap`,
        xAxis: {
          label: data.xAxisLabel
        },
        yAxis: {
          label: data.yAxisLabel
        },
        tooltip: {
          enabled: true,
          format: (d: any) => `${d.value} ${data.unit}`
        }
      }
    };
  }

  createProgressRadar(userId?: string): ChartConfig {
    const metrics = this.performanceMetricsService.getAllMetrics();
    const theme = this.themes.get(this.currentTheme)!;
    
    const radarData = {
      labels: metrics.map(m => m.name),
      datasets: [{
        label: 'Current',
        data: metrics.map(m => this.normalizeMetricValue(m.id, m.value)),
        borderColor: theme.colors.primary[0],
        backgroundColor: theme.colors.primary[0] + '30',
        pointRadius: 4
      }]
    };

    // Add target values if goals exist
    const goals = this.performanceMetricsService.getGoals();
    if (goals.length > 0) {
      radarData.datasets.push({
        label: 'Target',
        data: metrics.map(m => {
          const goal = goals.find(g => g.metric === m.id);
          return goal ? this.normalizeMetricValue(m.id, goal.targetValue) : 100;
        }),
        borderColor: theme.colors.secondary[0],
        backgroundColor: 'transparent',
        borderWidth: 2,
        borderDash: [5, 5] as any,
        pointRadius: 3
      });
    }

    return {
      type: 'radar',
      data: radarData,
      options: {
        title: 'Performance Overview',
        scales: {
          r: {
            beginAtZero: true,
            max: 100,
            ticks: {
              stepSize: 20
            }
          }
        }
      }
    };
  }

  createMilestoneTimeline(
    limit: number = 20
  ): {
    milestones: Array<{
      date: Date;
      title: string;
      description: string;
      category: string;
      icon: string;
    }>;
  } {
    const milestones = this.performanceMetricsService.getMilestones(limit);
    
    return {
      milestones: milestones.map(m => ({
        date: m.achievedAt,
        title: m.name,
        description: m.description,
        category: this.getMetricCategory(m.metric),
        icon: this.getMilestoneIcon(m.metric)
      }))
    };
  }

  // Dashboard Management
  async createDashboard(
    name: string,
    description: string,
    layout: LayoutConfig
  ): Promise<Dashboard> {
    const dashboard: Dashboard = {
      id: `dashboard-${Date.now()}`,
      name,
      description,
      layout,
      widgets: [],
      filters: []
    };

    this.dashboards.set(dashboard.id, dashboard);
    this.saveDashboards();
    
    this.analyticsService.trackEvent('dashboard_created', {
      dashboardId: dashboard.id,
      name
    });

    return dashboard;
  }

  addWidgetToDashboard(
    dashboardId: string,
    widget: Omit<Widget, 'id'>
  ): Widget {
    const dashboard = this.dashboards.get(dashboardId);
    if (!dashboard) {
      throw new Error(`Dashboard ${dashboardId} not found`);
    }

    const fullWidget: Widget = {
      ...widget,
      id: `widget-${Date.now()}`
    };

    dashboard.widgets.push(fullWidget);
    this.activeWidgets.set(fullWidget.id, fullWidget);
    this.saveDashboards();

    return fullWidget;
  }

  updateWidget(widgetId: string, updates: Partial<Widget>): void {
    const widget = this.activeWidgets.get(widgetId);
    if (!widget) return;

    Object.assign(widget, updates);
    this.saveDashboards();
  }

  removeWidget(dashboardId: string, widgetId: string): void {
    const dashboard = this.dashboards.get(dashboardId);
    if (!dashboard) return;

    dashboard.widgets = dashboard.widgets.filter(w => w.id !== widgetId);
    this.activeWidgets.delete(widgetId);
    this.saveDashboards();
  }

  getDashboard(dashboardId: string): Dashboard | undefined {
    return this.dashboards.get(dashboardId);
  }

  getAllDashboards(): Dashboard[] {
    return Array.from(this.dashboards.values());
  }

  // Data Processing Methods
  private getMetricHistory(
    metric: string, 
    timeRange: string
  ): { labels: string[]; values: number[] } {
    const performance = this.performanceMetricsService.exportPerformanceData();
    const history = performance.history || [];
    
    const cutoff = this.getTimeRangeCutoff(timeRange);
    const relevantHistory = history.filter((h: any) => 
      new Date(h.timestamp).getTime() > cutoff
    );

    const labels = relevantHistory.map((h: any) => 
      this.formatTimeLabel(new Date(h.timestamp))
    );
    
    const values = relevantHistory.map((h: any) => 
      h.metrics[metric] || 0
    );

    return { labels, values };
  }

  private getHeatmapData(dataType: string): {
    xLabels: string[];
    yLabels: string[];
    values: number[][];
    xAxisLabel: string;
    yAxisLabel: string;
    unit: string;
  } {
    switch (dataType) {
      case 'usage':
        return this.getUsageHeatmapData();
      case 'performance':
        return this.getPerformanceHeatmapData();
      case 'engagement':
        return this.getEngagementHeatmapData();
      default:
        throw new Error(`Unknown heatmap data type: ${dataType}`);
    }
  }

  private getUsageHeatmapData(): any {
    const sessions = this.usagePatternsService.getSessionHistory(100);
    const hourlyData: number[][] = Array(7).fill(null).map(() => Array(24).fill(0));
    
    sessions.forEach(session => {
      const day = session.startTime.getDay();
      const hour = session.startTime.getHours();
      hourlyData[day][hour] += session.duration / 60000; // Convert to minutes
    });

    return {
      xLabels: Array(24).fill(null).map((_, i) => `${i}:00`),
      yLabels: ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'],
      values: hourlyData,
      xAxisLabel: 'Hour of Day',
      yAxisLabel: 'Day of Week',
      unit: 'minutes'
    };
  }

  private getPerformanceHeatmapData(): any {
    const metrics = ['words_per_minute', 'accuracy_rate', 'communication_efficiency'];
    const days = 30;
    const values: number[][] = [];
    
    metrics.forEach(metric => {
      const history = this.getMetricHistory(metric, 'month');
      values.push(history.values.slice(-days));
    });

    return {
      xLabels: Array(days).fill(null).map((_, i) => `Day ${i + 1}`),
      yLabels: metrics.map(m => this.getMetricLabel(m)),
      values,
      xAxisLabel: 'Days',
      yAxisLabel: 'Metrics',
      unit: 'normalized'
    };
  }

  private getEngagementHeatmapData(): any {
    const categories = ['People', 'Actions', 'Objects', 'Feelings', 'Places'];
    const days = 7;
    const values: number[][] = [];
    
    // Simulate engagement data per category
    categories.forEach(() => {
      const dayValues = Array(days).fill(null).map(() => 
        Math.floor(Math.random() * 100)
      );
      values.push(dayValues);
    });

    return {
      xLabels: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
      yLabels: categories,
      values,
      xAxisLabel: 'Day',
      yAxisLabel: 'Category',
      unit: 'interactions'
    };
  }

  private generateHeatmapColors(values: number[], theme: VisualizationTheme): string[] {
    const max = Math.max(...values);
    const min = Math.min(...values);
    const range = max - min || 1;
    
    return values.map(value => {
      const intensity = (value - min) / range;
      const color = theme.colors.primary[0];
      return this.hexToRgba(color, 0.2 + intensity * 0.8);
    });
  }

  private normalizeValues(values: number[]): number[] {
    const max = Math.max(...values);
    const min = Math.min(...values);
    const range = max - min || 1;
    
    return values.map(v => ((v - min) / range) * 100);
  }

  private normalizeMetricValue(metricId: string, value: number): number {
    const ranges: Record<string, [number, number]> = {
      words_per_minute: [0, 50],
      accuracy_rate: [0, 100],
      sentence_completion_time: [30, 1],
      vocabulary_growth: [0, 1000],
      communication_efficiency: [0, 10],
      independence_score: [0, 100]
    };
    
    const range = ranges[metricId] || [0, 100];
    
    if (metricId === 'sentence_completion_time') {
      // Invert for metrics where lower is better
      return ((range[0] - value) / (range[0] - range[1])) * 100;
    }
    
    return ((value - range[0]) / (range[1] - range[0])) * 100;
  }

  // Widget Data Providers
  async getWidgetData(widget: Widget): Promise<any> {
    const [category, metric] = widget.dataSource.split('.');
    
    switch (category) {
      case 'performance':
        return this.getPerformanceWidgetData(metric, widget.config);
      case 'patterns':
        return this.getPatternsWidgetData(metric, widget.config);
      case 'progress':
        return this.getProgressWidgetData(metric, widget.config);
      default:
        return null;
    }
  }

  private async getPerformanceWidgetData(metric: string, config: any): Promise<any> {
    switch (metric) {
      case 'overall':
        const report = await this.performanceMetricsService.generatePerformanceReport();
        return {
          value: report.summary.overallScore,
          trend: report.summary.improvementRate > 0 ? 'up' : 'down',
          change: report.summary.improvementRate
        };
        
      case 'wpm':
        return this.createPerformanceChart('words_per_minute', config.timeRange);
        
      case 'accuracy':
        const accuracy = this.performanceMetricsService.getMetric('accuracy_rate');
        return {
          value: accuracy?.value || 0,
          min: 0,
          max: 100,
          thresholds: config.thresholds || [50, 70, 90]
        };
        
      default:
        return null;
    }
  }

  private async getPatternsWidgetData(metric: string, config: any): Promise<any> {
    switch (metric) {
      case 'heatmap':
        return this.createHeatmap('usage');
        
      case 'categories':
        const patterns = await this.usagePatternsService.analyzeUsagePatterns();
        const categoryData = this.aggregateCategoryData(patterns.patterns);
        return {
          type: 'pie',
          data: {
            labels: Object.keys(categoryData),
            datasets: [{
              data: Object.values(categoryData),
              backgroundColor: this.themes.get(this.currentTheme)!.colors.primary
            }]
          }
        };
        
      default:
        return null;
    }
  }

  private async getProgressWidgetData(metric: string, config: any): Promise<any> {
    switch (metric) {
      case 'milestones':
        return this.createMilestoneTimeline(config.limit || 20);
        
      case 'goals':
        const goals = this.performanceMetricsService.getGoals();
        return {
          type: 'bar',
          data: {
            labels: goals.map(g => this.getMetricLabel(g.metric)),
            datasets: [{
              label: 'Progress',
              data: goals.map(g => g.progress),
              backgroundColor: this.themes.get(this.currentTheme)!.colors.primary[0]
            }]
          }
        };
        
      default:
        return null;
    }
  }

  // Helper Methods
  private formatTimeLabel(date: Date): string {
    const now = new Date();
    const diffHours = (now.getTime() - date.getTime()) / (1000 * 60 * 60);
    
    if (diffHours < 24) {
      return date.toLocaleTimeString('en-US', { 
        hour: 'numeric', 
        minute: '2-digit' 
      });
    } else if (diffHours < 168) { // 7 days
      return date.toLocaleDateString('en-US', { 
        weekday: 'short', 
        hour: 'numeric' 
      });
    } else {
      return date.toLocaleDateString('en-US', { 
        month: 'short', 
        day: 'numeric' 
      });
    }
  }

  private getTimeRangeCutoff(timeRange: string): number {
    const now = Date.now();
    const ranges = {
      day: 24 * 60 * 60 * 1000,
      week: 7 * 24 * 60 * 60 * 1000,
      month: 30 * 24 * 60 * 60 * 1000
    };
    return now - (ranges[timeRange as keyof typeof ranges] || ranges.week);
  }

  private getMetricLabel(metricId: string): string {
    const metric = this.performanceMetricsService.getMetric(metricId);
    return metric?.name || metricId;
  }

  private getMetricUnit(metricId: string): string {
    const metric = this.performanceMetricsService.getMetric(metricId);
    return metric?.unit || '';
  }

  private getMetricCategory(metricId: string): string {
    const metric = this.performanceMetricsService.getMetric(metricId);
    return metric?.category || 'other';
  }

  private getMilestoneIcon(metricId: string): string {
    const category = this.getMetricCategory(metricId);
    const icons = {
      speed: '🚀',
      accuracy: '🎯',
      engagement: '💡',
      progress: '📈',
      system: '⚙️'
    };
    return icons[category as keyof typeof icons] || '🏆';
  }

  private aggregateCategoryData(patterns: any[]): Record<string, number> {
    const categories: Record<string, number> = {};
    
    patterns.forEach(pattern => {
      if (pattern.type === 'contextual' && pattern.id.startsWith('category-')) {
        const category = pattern.id.replace('category-', '');
        categories[category] = pattern.frequency;
      }
    });
    
    return categories;
  }

  private hexToRgba(hex: string, alpha: number): string {
    const r = parseInt(hex.slice(1, 3), 16);
    const g = parseInt(hex.slice(3, 5), 16);
    const b = parseInt(hex.slice(5, 7), 16);
    return `rgba(${r}, ${g}, ${b}, ${alpha})`;
  }

  private refreshDashboard(dashboardId: string): void {
    const dashboard = this.dashboards.get(dashboardId);
    if (!dashboard) return;
    
    dashboard.widgets.forEach(widget => {
      this.refreshWidget(widget.id);
    });
  }

  private refreshActiveWidgets(category?: string): void {
    this.activeWidgets.forEach(widget => {
      if (!category || widget.dataSource.startsWith(category)) {
        this.refreshWidget(widget.id);
      }
    });
  }

  private async refreshWidget(widgetId: string): Promise<void> {
    const widget = this.activeWidgets.get(widgetId);
    if (!widget) return;
    
    try {
      const data = await this.getWidgetData(widget);
      
      // Dispatch update event
      window.dispatchEvent(new CustomEvent('widgetDataUpdated', {
        detail: { widgetId, data }
      }));
    } catch (error) {
      console.error(`Error refreshing widget ${widgetId}:`, error);
    }
  }

  private loadSavedDashboards(): void {
    const saved = this.dataService.getData('visualization_dashboards');
    if (saved) {
      Object.entries(saved).forEach(([id, dashboard]: [string, any]) => {
        this.dashboards.set(id, dashboard);
        dashboard.widgets.forEach((widget: Widget) => {
          this.activeWidgets.set(widget.id, widget);
        });
      });
    }
  }

  private saveDashboards(): void {
    const dashboardData: Record<string, Dashboard> = {};
    this.dashboards.forEach((dashboard, id) => {
      dashboardData[id] = dashboard;
    });
    this.dataService.setData('visualization_dashboards', dashboardData);
  }

  // Public API
  setTheme(themeName: string): void {
    if (this.themes.has(themeName)) {
      this.currentTheme = themeName;
      
      // Update all active charts
      this.chartCache.forEach((chart, id) => {
        this.updateChartTheme(id);
      });
      
      this.analyticsService.trackEvent('theme_changed', { theme: themeName });
    }
  }

  private updateChartTheme(chartId: string): void {
    const chart = this.chartCache.get(chartId);
    if (!chart) return;
    
    const theme = this.themes.get(this.currentTheme)!;
    
    // Update colors
    chart.data.datasets.forEach((dataset, index) => {
      if (dataset.borderColor) {
        dataset.borderColor = theme.colors.primary[index % theme.colors.primary.length];
      }
      if (dataset.backgroundColor && typeof dataset.backgroundColor === 'string') {
        dataset.backgroundColor = theme.colors.primary[index % theme.colors.primary.length] + '20';
      }
    });
    
    // Dispatch update event
    window.dispatchEvent(new CustomEvent('chartThemeUpdated', {
      detail: { chartId, theme }
    }));
  }

  getChart(chartId: string): ChartConfig | undefined {
    return this.chartCache.get(chartId);
  }

  updateChart(chartId: string, updates: Partial<ChartConfig>): void {
    const chart = this.chartCache.get(chartId);
    if (!chart) return;
    
    Object.assign(chart, updates);
    
    window.dispatchEvent(new CustomEvent('chartUpdated', {
      detail: { chartId, chart }
    }));
  }

  exportChart(chartId: string, format: 'png' | 'svg' | 'pdf' = 'png'): string {
    // This would integrate with a chart library's export functionality
    // For now, return a placeholder
    this.analyticsService.trackEvent('chart_exported', { chartId, format });
    return `chart-export-${chartId}.${format}`;
  }

  exportDashboard(dashboardId: string): any {
    const dashboard = this.dashboards.get(dashboardId);
    if (!dashboard) return null;
    
    return {
      dashboard,
      exportDate: new Date().toISOString(),
      theme: this.currentTheme
    };
  }

  importDashboard(data: any): Dashboard {
    const dashboard = data.dashboard;
    dashboard.id = `dashboard-${Date.now()}`; // Generate new ID
    
    this.dashboards.set(dashboard.id, dashboard);
    dashboard.widgets.forEach((widget: Widget) => {
      widget.id = `widget-${Date.now()}-${Math.random()}`;
      this.activeWidgets.set(widget.id, widget);
    });
    
    this.saveDashboards();
    return dashboard;
  }

  // Cleanup
  destroy(): void {
    // Clear all timers
    this.updateTimers.forEach(timer => clearInterval(timer));
    this.updateTimers.clear();
    
    // Clear caches
    this.chartCache.clear();
    this.activeWidgets.clear();
    
    // Save state
    this.saveDashboards();
  }
}

export function getDataVisualizationService(): DataVisualizationService {
  return DataVisualizationService.getInstance();
}