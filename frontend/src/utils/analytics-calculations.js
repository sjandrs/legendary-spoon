/**
 * Advanced Analytics Calculations for Field Service Management
 * Business intelligence and KPI calculations for enhanced dashboard metrics
 */

// Advanced KPI calculators
export class FieldServiceAnalytics {
  /**
   * Calculate technician utilization rates with detailed breakdown
   */
  static calculateTechnicianUtilization(timeEntries, scheduledEvents, dateRange) {
    const utilizationData = {};

    timeEntries.forEach(entry => {
      const technicianId = entry.technician || entry.user;
      if (!utilizationData[technicianId]) {
        utilizationData[technicianId] = {
          totalHours: 0,
          billableHours: 0,
          scheduledHours: 0,
          overTimeHours: 0,
          efficiency: 0,
          productivity: 0
        };
      }

      const hours = parseFloat(entry.hours || 0);
      utilizationData[technicianId].totalHours += hours;

      if (entry.billable) {
        utilizationData[technicianId].billableHours += hours;
      }
    });

    // Calculate scheduled hours from events
    scheduledEvents.forEach(event => {
      const technicianId = event.technician;
      if (technicianId && utilizationData[technicianId]) {
        const duration = this.calculateEventDuration(event.scheduled_date, event.estimated_end_time);
        utilizationData[technicianId].scheduledHours += duration;
      }
    });

    // Calculate derived metrics
    Object.keys(utilizationData).forEach(technicianId => {
      const data = utilizationData[technicianId];
      data.efficiency = data.totalHours > 0 ? (data.billableHours / data.totalHours) * 100 : 0;
      data.productivity = data.scheduledHours > 0 ? (data.totalHours / data.scheduledHours) * 100 : 0;
      data.overTimeHours = Math.max(0, data.totalHours - (8 * this.getWorkingDays(dateRange)));
    });

    return utilizationData;
  }

  /**
   * Calculate service completion trends and patterns
   */
  static calculateServiceCompletionTrends(workOrders, timeRange = '30days') {
    const trends = {
      completionRate: 0,
      averageCompletionTime: 0,
      onTimeDelivery: 0,
      customerSatisfaction: 0,
      firstTimeFixRate: 0,
      trendsData: [],
      categoryBreakdown: {}
    };

    const completedOrders = workOrders.filter(order => order.status === 'completed');
    const totalOrders = workOrders.length;

    trends.completionRate = totalOrders > 0 ? (completedOrders.length / totalOrders) * 100 : 0;

    // Calculate average completion time
    let totalCompletionTime = 0;
    let onTimeCount = 0;
    let firstTimeFixCount = 0;

    completedOrders.forEach(order => {
      const createdDate = new Date(order.created_date);
      const completedDate = new Date(order.completion_date);
      const completionTime = (completedDate - createdDate) / (1000 * 60 * 60 * 24); // days

      totalCompletionTime += completionTime;

      // Check if completed on time (within estimated duration)
      const estimatedDays = order.estimated_duration || 1;
      if (completionTime <= estimatedDays) {
        onTimeCount++;
      }

      // Check first-time fix (no follow-up orders)
      if (!order.follow_up_required) {
        firstTimeFixCount++;
      }
    });

    trends.averageCompletionTime = completedOrders.length > 0 ? totalCompletionTime / completedOrders.length : 0;
    trends.onTimeDelivery = completedOrders.length > 0 ? (onTimeCount / completedOrders.length) * 100 : 0;
    trends.firstTimeFixRate = completedOrders.length > 0 ? (firstTimeFixCount / completedOrders.length) * 100 : 0;

    // Generate trends data for charting
    trends.trendsData = this.generateTrendsTimeSeries(workOrders, timeRange);

    // Category breakdown
    trends.categoryBreakdown = this.calculateCategoryBreakdown(workOrders);

    return trends;
  }

  /**
   * Calculate revenue and profitability metrics
   */
  static calculateRevenueMetrics(workOrders, expenses, timeEntries) {
    const metrics = {
      totalRevenue: 0,
      totalExpenses: 0,
      grossProfit: 0,
      profitMargin: 0,
      revenuePerTechnician: 0,
      costPerJob: 0,
      averageJobValue: 0,
      monthlyTrends: [],
      profitabilityByCategory: {}
    };

    // Calculate total revenue from completed work orders
    const completedOrders = workOrders.filter(order => order.status === 'completed');
    metrics.totalRevenue = completedOrders.reduce((sum, order) => sum + (parseFloat(order.total_amount) || 0), 0);

    // Calculate total expenses
    metrics.totalExpenses = expenses.reduce((sum, expense) => sum + (parseFloat(expense.amount) || 0), 0);

    // Calculate labor costs from time entries
    const laborCosts = timeEntries.reduce((sum, entry) => {
      const hours = parseFloat(entry.hours || 0);
      const rate = parseFloat(entry.hourly_rate || 50); // Default rate
      return sum + (hours * rate);
    }, 0);

    metrics.totalExpenses += laborCosts;

    // Calculate derived metrics
    metrics.grossProfit = metrics.totalRevenue - metrics.totalExpenses;
    metrics.profitMargin = metrics.totalRevenue > 0 ? (metrics.grossProfit / metrics.totalRevenue) * 100 : 0;
    metrics.averageJobValue = completedOrders.length > 0 ? metrics.totalRevenue / completedOrders.length : 0;
    metrics.costPerJob = completedOrders.length > 0 ? metrics.totalExpenses / completedOrders.length : 0;

    // Calculate revenue per technician
    const uniqueTechnicians = new Set(timeEntries.map(entry => entry.technician || entry.user));
    metrics.revenuePerTechnician = uniqueTechnicians.size > 0 ? metrics.totalRevenue / uniqueTechnicians.size : 0;

    // Generate monthly trends
    metrics.monthlyTrends = this.generateRevenueTimeSeries(workOrders, expenses, timeEntries);

    // Profitability by category
    metrics.profitabilityByCategory = this.calculateProfitabilityByCategory(workOrders, expenses);

    return metrics;
  }

  /**
   * Calculate customer satisfaction and feedback metrics
   */
  static calculateCustomerSatisfactionMetrics(workOrders, feedbackData = []) {
    const metrics = {
      averageRating: 0,
      npsScore: 0,
      responseRate: 0,
      satisfactionTrends: [],
      feedbackCategories: {},
      improvementAreas: [],
      topPerformers: []
    };

    const ordersWithFeedback = workOrders.filter(order => order.customer_rating > 0);

    if (ordersWithFeedback.length === 0) {
      return metrics;
    }

    // Calculate average rating
    const totalRating = ordersWithFeedback.reduce((sum, order) => sum + (order.customer_rating || 0), 0);
    metrics.averageRating = totalRating / ordersWithFeedback.length;

    // Calculate NPS Score (assuming 1-5 rating scale converted to 0-10 NPS scale)
    const npsRatings = ordersWithFeedback.map(order => (order.customer_rating - 1) * 2.5);
    const promoters = npsRatings.filter(rating => rating >= 9).length;
    const detractors = npsRatings.filter(rating => rating <= 6).length;
    metrics.npsScore = ((promoters - detractors) / npsRatings.length) * 100;

    // Calculate response rate
    const totalOrders = workOrders.filter(order => order.status === 'completed').length;
    metrics.responseRate = totalOrders > 0 ? (ordersWithFeedback.length / totalOrders) * 100 : 0;

    // Generate satisfaction trends
    metrics.satisfactionTrends = this.generateSatisfactionTimeSeries(ordersWithFeedback);

    // Categorize feedback
    metrics.feedbackCategories = this.categorizeFeedback(feedbackData);

    // Identify improvement areas
    metrics.improvementAreas = this.identifyImprovementAreas(ordersWithFeedback, feedbackData);

    // Identify top performers
    metrics.topPerformers = this.identifyTopPerformers(ordersWithFeedback);

    return metrics;
  }

  /**
   * Calculate equipment and inventory metrics
   */
  static calculateEquipmentMetrics(workOrders, warehouseItems) {
    const metrics = {
      equipmentUtilization: {},
      maintenanceSchedule: [],
      inventoryTurnover: 0,
      stockoutFrequency: 0,
      criticalItems: [],
      utilizationTrends: []
    };

    // Calculate equipment utilization from work orders
    const equipmentUsage = {};
    workOrders.forEach(order => {
      if (order.equipment_used) {
        const equipment = Array.isArray(order.equipment_used) ? order.equipment_used : [order.equipment_used];
        equipment.forEach(item => {
          equipmentUsage[item] = (equipmentUsage[item] || 0) + 1;
        });
      }
    });

    metrics.equipmentUtilization = equipmentUsage;

    // Calculate inventory metrics
    const totalItems = warehouseItems.length;
    const lowStockItems = warehouseItems.filter(item => item.quantity <= item.minimum_stock);
    const outOfStockItems = warehouseItems.filter(item => item.quantity === 0);

    metrics.stockoutFrequency = totalItems > 0 ? (outOfStockItems.length / totalItems) * 100 : 0;
    metrics.criticalItems = lowStockItems.map(item => ({
      name: item.name,
      currentStock: item.quantity,
      minimumStock: item.minimum_stock,
      urgency: item.quantity === 0 ? 'critical' : 'warning'
    }));

    // Calculate inventory turnover (placeholder - would need historical data)
    metrics.inventoryTurnover = this.calculateInventoryTurnover(warehouseItems);

    return metrics;
  }

  // Helper methods
  static calculateEventDuration(startDate, endDate) {
    const start = new Date(startDate);
    const end = new Date(endDate);
    return (end - start) / (1000 * 60 * 60); // hours
  }

  static getWorkingDays(dateRange) {
    // Simple calculation - would be enhanced with actual business logic
    const days = Math.ceil((dateRange.end - dateRange.start) / (1000 * 60 * 60 * 24));
    return Math.floor(days * 5/7); // Assuming 5-day work week
  }

  static generateTrendsTimeSeries(data, timeRange) {
    // Group data by time periods and calculate metrics
    const timeSeries = [];
    const now = new Date();
    const daysBack = timeRange === '30days' ? 30 : timeRange === '90days' ? 90 : 365;

    for (let i = daysBack; i >= 0; i--) {
      const date = new Date(now.getTime() - (i * 24 * 60 * 60 * 1000));
      const dayData = data.filter(item => {
        const itemDate = new Date(item.created_date || item.scheduled_date);
        return itemDate.toDateString() === date.toDateString();
      });

      timeSeries.push({
        date: date.toISOString().split('T')[0],
        count: dayData.length,
        completed: dayData.filter(item => item.status === 'completed').length,
        value: dayData.reduce((sum, item) => sum + (parseFloat(item.total_amount) || 0), 0)
      });
    }

    return timeSeries;
  }

  static calculateCategoryBreakdown(workOrders) {
    const breakdown = {};
    workOrders.forEach(order => {
      const category = order.category || 'Other';
      if (!breakdown[category]) {
        breakdown[category] = { count: 0, revenue: 0, avgRating: 0 };
      }
      breakdown[category].count++;
      breakdown[category].revenue += parseFloat(order.total_amount) || 0;
      breakdown[category].avgRating += order.customer_rating || 0;
    });

    // Calculate averages
    Object.keys(breakdown).forEach(category => {
      breakdown[category].avgRating = breakdown[category].avgRating / breakdown[category].count;
    });

    return breakdown;
  }

  static generateRevenueTimeSeries(workOrders, expenses, _timeEntries) {
    // Monthly revenue and expense trends
    const monthlyData = {};

    // Group revenue by month
    workOrders.forEach(order => {
      if (order.status === 'completed' && order.completion_date) {
        const month = new Date(order.completion_date).toISOString().substring(0, 7); // YYYY-MM
        if (!monthlyData[month]) {
          monthlyData[month] = { revenue: 0, expenses: 0, profit: 0 };
        }
        monthlyData[month].revenue += parseFloat(order.total_amount) || 0;
      }
    });

    // Group expenses by month
    expenses.forEach(expense => {
      const month = new Date(expense.date).toISOString().substring(0, 7);
      if (!monthlyData[month]) {
        monthlyData[month] = { revenue: 0, expenses: 0, profit: 0 };
      }
      monthlyData[month].expenses += parseFloat(expense.amount) || 0;
    });

    // Calculate profit
    Object.keys(monthlyData).forEach(month => {
      monthlyData[month].profit = monthlyData[month].revenue - monthlyData[month].expenses;
    });

    // Convert to array and sort by month
    return Object.keys(monthlyData)
      .sort()
      .map(month => ({
        month,
        ...monthlyData[month]
      }));
  }

  static generateSatisfactionTimeSeries(ordersWithFeedback) {
    const monthlyRatings = {};

    ordersWithFeedback.forEach(order => {
      const month = new Date(order.completion_date).toISOString().substring(0, 7);
      if (!monthlyRatings[month]) {
        monthlyRatings[month] = { ratings: [], count: 0 };
      }
      monthlyRatings[month].ratings.push(order.customer_rating);
      monthlyRatings[month].count++;
    });

    return Object.keys(monthlyRatings)
      .sort()
      .map(month => ({
        month,
        averageRating: monthlyRatings[month].ratings.reduce((a, b) => a + b, 0) / monthlyRatings[month].count,
        responseCount: monthlyRatings[month].count
      }));
  }

  static categorizeFeedback(feedbackData) {
    const categories = {
      positive: [],
      negative: [],
      suggestions: [],
      complaints: []
    };

    feedbackData.forEach(feedback => {
      if (feedback.rating >= 4) {
        categories.positive.push(feedback);
      } else if (feedback.rating <= 2) {
        categories.negative.push(feedback);
      }

      if (feedback.type === 'suggestion') {
        categories.suggestions.push(feedback);
      } else if (feedback.type === 'complaint') {
        categories.complaints.push(feedback);
      }
    });

    return categories;
  }

  static identifyImprovementAreas(ordersWithFeedback) {
    const lowRatedOrders = ordersWithFeedback.filter(order => order.customer_rating <= 3);
    const areas = {};

    lowRatedOrders.forEach(order => {
      const category = order.category || 'General';
      if (!areas[category]) {
        areas[category] = { count: 0, avgRating: 0, issues: [] };
      }
      areas[category].count++;
      areas[category].avgRating += order.customer_rating;
      if (order.feedback_comments) {
        areas[category].issues.push(order.feedback_comments);
      }
    });

    // Calculate averages and sort by priority
    return Object.keys(areas)
      .map(category => ({
        category,
        count: areas[category].count,
        avgRating: areas[category].avgRating / areas[category].count,
        priority: areas[category].count * (4 - areas[category].avgRating / areas[category].count)
      }))
      .sort((a, b) => b.priority - a.priority);
  }

  static identifyTopPerformers(ordersWithFeedback) {
    const technicianRatings = {};

    ordersWithFeedback.forEach(order => {
      const technicianId = order.technician;
      if (technicianId) {
        if (!technicianRatings[technicianId]) {
          technicianRatings[technicianId] = { ratings: [], count: 0 };
        }
        technicianRatings[technicianId].ratings.push(order.customer_rating);
        technicianRatings[technicianId].count++;
      }
    });

    return Object.keys(technicianRatings)
      .map(technicianId => ({
        technicianId,
        averageRating: technicianRatings[technicianId].ratings.reduce((a, b) => a + b, 0) / technicianRatings[technicianId].count,
        jobCount: technicianRatings[technicianId].count
      }))
      .filter(performer => performer.jobCount >= 5) // Minimum 5 jobs
      .sort((a, b) => b.averageRating - a.averageRating)
      .slice(0, 5); // Top 5
  }

  static calculateInventoryTurnover(warehouseItems) {
    // Simplified calculation - would need historical usage data
    const totalValue = warehouseItems.reduce((sum, item) => sum + (item.quantity * item.unit_cost), 0);
    const averageValue = totalValue / warehouseItems.length;

    // Placeholder calculation
    return totalValue > 0 ? (averageValue * 12) / totalValue : 0; // Annualized turnover
  }

  static calculateProfitabilityByCategory(workOrders, _expenses) {
    const categoryData = {};

    workOrders.forEach(order => {
      const category = order.category || 'Other';
      if (!categoryData[category]) {
        categoryData[category] = { revenue: 0, directCosts: 0 };
      }
      categoryData[category].revenue += parseFloat(order.total_amount) || 0;
      // Add category-specific cost allocation logic here
    });

    return categoryData;
  }
}

// Real-time data processing utilities
export class RealTimeAnalytics {
  /**
   * Process streaming data updates for dashboard
   */
  static processDataUpdate(newData, currentMetrics) {
    const updatedMetrics = { ...currentMetrics };

    // Update relevant metrics based on data type
    switch (newData.type) {
      case 'work_order_completed':
        updatedMetrics.completionRate = this.recalculateCompletionRate(newData, currentMetrics);
        break;
      case 'technician_check_in':
        updatedMetrics.utilizationData = this.updateUtilizationData(newData, currentMetrics);
        break;
      case 'customer_feedback':
        updatedMetrics.satisfactionMetrics = this.updateSatisfactionMetrics(newData, currentMetrics);
        break;
    }

    return updatedMetrics;
  }

  /**
   * Set up WebSocket connection for real-time updates
   */
  static setupRealTimeConnection(_onUpdate) {
    // WebSocket implementation would go here
    // For now, return a mock connection
    return {
      subscribe: (eventType, callback) => {
        console.log(`Subscribed to ${eventType}`);
        // Mock real-time updates
        setInterval(() => {
          callback({
            type: eventType,
            timestamp: new Date().toISOString(),
            data: this.generateMockUpdate(eventType)
          });
        }, 30000); // Update every 30 seconds
      },
      unsubscribe: (eventType) => {
        console.log(`Unsubscribed from ${eventType}`);
      }
    };
  }

  static generateMockUpdate(eventType) {
    // Generate realistic mock data for testing
    switch (eventType) {
      case 'work_order_completed':
        return { orderId: Math.random().toString(36), completionTime: Date.now() };
      case 'technician_status':
        return { technicianId: Math.random().toString(36), status: 'active' };
      default:
        return {};
    }
  }

  static recalculateCompletionRate(newData, currentMetrics) {
    // Incremental update logic
    return currentMetrics.completionRate + 0.1; // Placeholder
  }

  static updateUtilizationData(newData, currentMetrics) {
    // Incremental update logic
    return { ...currentMetrics.utilizationData }; // Placeholder
  }

  static updateSatisfactionMetrics(newData, currentMetrics) {
    // Incremental update logic
    return { ...currentMetrics.satisfactionMetrics }; // Placeholder
  }
}
