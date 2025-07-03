import React, { useState } from 'react';
import { useQuery } from 'react-query';
import { analyticsAPI } from '../services/api';
import { 
  Chart as ChartJS, 
  CategoryScale, 
  LinearScale, 
  BarElement, 
  Title, 
  Tooltip, 
  Legend,
  ArcElement,
  PointElement,
  LineElement
} from 'chart.js';
import { Bar, Doughnut, Line } from 'react-chartjs-2';
import { Calendar, TrendingUp, Download, Filter } from 'lucide-react';
import { format, subDays, addDays } from 'date-fns';

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
  PointElement,
  LineElement
);

const Analytics: React.FC = () => {
  const [startDate, setStartDate] = useState(format(subDays(new Date(), 30), 'yyyy-MM-dd'));
  const [endDate, setEndDate] = useState(format(addDays(new Date(),1), 'yyyy-MM-dd'));

  const { data: analytics, isLoading, error } = useQuery(
    ['analytics', startDate, endDate],
    () => analyticsAPI.getSalesData(startDate, endDate),
    {
      enabled: !!startDate && !!endDate
    }
  );

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-12">
        <div className="text-red-500 text-lg">Error loading analytics data</div>
      </div>
    );
  }

  const analyticsData = analytics?.data || {};

  // Sales by Category Chart
  const categoryData = {
    labels: Object.keys(analyticsData.salesByCategory || {}),
    datasets: [
      {
        label: 'Sales by Category',
        data: Object.values(analyticsData.salesByCategory || {}),
        backgroundColor: [
          '#3B82F6',
          '#10B981',
          '#F59E0B',
          '#EF4444',
          '#8B5CF6',
          '#F97316',
          '#06B6D4',
          '#84CC16'
        ],
        borderColor: [
          '#2563EB',
          '#059669',
          '#D97706',
          '#DC2626',
          '#7C3AED',
          '#EA580C',
          '#0891B2',
          '#65A30D'
        ],
        borderWidth: 1
      }
    ]
  };

  // Top Products Chart
  const topProductsData = {
    labels: analyticsData.topProducts?.map((product: any) => product.productName) || [],
    datasets: [
      {
        label: 'Units Sold',
        data: analyticsData.topProducts?.map((product: any) => product.quantity) || [],
        backgroundColor: '#3B82F6',
        borderColor: '#2563EB',
        borderWidth: 1
      }
    ]
  };

  const chartOptions = {
    responsive: true,
    plugins: {
      legend: {
        position: 'top' as const,
      },
      title: {
        display: true,
        text: 'Sales Analytics'
      }
    },
    scales: {
      y: {
        beginAtZero: true
      }
    }
  };

  const doughnutOptions = {
    responsive: true,
    plugins: {
      legend: {
        position: 'bottom' as const,
      },
      title: {
        display: true,
        text: 'Sales by Category'
      }
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Analytics</h1>
          <p className="text-gray-600 dark:text-gray-400">
            Sales insights and performance metrics
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <Calendar className="h-5 w-5 text-gray-400" />
          <input
            type="date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
          />
          <span className="text-gray-500 dark:text-gray-400">to</span>
          <input
            type="date"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
            className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
          />
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                Total Sales
              </p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">
                ${(analyticsData.totalSales || 0).toLocaleString()}
              </p>
            </div>
            <div className="p-3 rounded-full bg-blue-500">
              <TrendingUp className="h-6 w-6 text-white" />
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                Total Transactions
              </p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">
                {analyticsData.totalTransactions || 0}
              </p>
            </div>
            <div className="p-3 rounded-full bg-green-500">
              <Calendar className="h-6 w-6 text-white" />
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                Average Sale
              </p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">
                ${analyticsData.totalTransactions > 0 
                  ? ((analyticsData.totalSales || 0) / analyticsData.totalTransactions).toFixed(2)
                  : '0.00'}
              </p>
            </div>
            <div className="p-3 rounded-full bg-purple-500">
              <Download className="h-6 w-6 text-white" />
            </div>
          </div>
        </div>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Sales by Category */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            Sales by Category
          </h3>
          {Object.keys(analyticsData.salesByCategory || {}).length > 0 ? (
            <div className="h-80">
              <Doughnut data={categoryData} options={doughnutOptions} />
            </div>
          ) : (
            <div className="h-80 flex items-center justify-center text-gray-500 dark:text-gray-400">
              No sales data available
            </div>
          )}
        </div>

        {/* Top Products */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            Top Selling Products
          </h3>
          {analyticsData.topProducts?.length > 0 ? (
            <div className="h-80">
              <Bar data={topProductsData} options={chartOptions} />
            </div>
          ) : (
            <div className="h-80 flex items-center justify-center text-gray-500 dark:text-gray-400">
              No sales data available
            </div>
          )}
        </div>
      </div>

      {/* Top Products Table */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
          Top Selling Products Details
        </h3>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 dark:bg-gray-700">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Product
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Quantity Sold
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Total Sales
                </th>
              </tr>
            </thead>
            <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
              {analyticsData.topProducts?.map((product: any, index: number) => (
                <tr key={index} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900 dark:text-white">
                      {product.productName}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900 dark:text-white">
                      {product.quantity}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900 dark:text-white">
                      ${product.total.toFixed(2)}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {(!analyticsData.topProducts || analyticsData.topProducts.length === 0) && (
          <div className="text-center py-12">
            <p className="text-gray-500 dark:text-gray-400">No sales data available</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default Analytics;