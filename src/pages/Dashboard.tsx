import React from 'react';
import { useQuery } from 'react-query';
import { dashboardAPI } from '../services/api';
import { 
  Package, 
  Folder, 
  AlertTriangle, 
  DollarSign, 
  TrendingUp,
  TrendingDown,
  ShoppingCart
} from 'lucide-react';
import { format } from 'date-fns';

const Dashboard: React.FC = () => {
  const { data: stats, isLoading, error } = useQuery('dashboardStats', dashboardAPI.getStats);

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
        <div className="text-red-500 text-lg">Error loading dashboard data</div>
      </div>
    );
  }

  const statsData = stats?.data || {};

  const statCards = [
    {
      title: 'Total Products',
      value: statsData.totalProducts || 0,
      icon: Package,
      color: 'bg-blue-500',
      change: '+12%',
      changeType: 'increase'
    },
    {
      title: 'Categories',
      value: statsData.totalCategories || 0,
      icon: Folder,
      color: 'bg-green-500',
      change: '+2%',
      changeType: 'increase'
    },
    {
      title: 'Low Stock Items',
      value: statsData.lowStockCount || 0,
      icon: AlertTriangle,
      color: 'bg-yellow-500',
      change: '-5%',
      changeType: 'decrease'
    },
    {
      title: 'Total Sales',
      value: `$${(statsData.totalSales || 0).toLocaleString()}`,
      icon: DollarSign,
      color: 'bg-purple-500',
      change: '+18%',
      changeType: 'increase'
    }
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Dashboard</h1>
        <p className="text-gray-600 dark:text-gray-400">
          Welcome back! Here's what's happening in your store today.
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {statCards.map((stat, index) => {
          const Icon = stat.icon;
          const isIncrease = stat.changeType === 'increase';
          return (
            <div key={index} className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6 hover:shadow-md transition-shadow">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                    {stat.title}
                  </p>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white">
                    {stat.value}
                  </p>
                </div>
                <div className={`p-3 rounded-full ${stat.color}`}>
                  <Icon className="h-6 w-6 text-white" />
                </div>
              </div>
              <div className="mt-4 flex items-center">
                {isIncrease ? (
                  <TrendingUp className="h-4 w-4 text-green-500 mr-1" />
                ) : (
                  <TrendingDown className="h-4 w-4 text-red-500 mr-1" />
                )}
                <span className={`text-sm font-medium ${isIncrease ? 'text-green-600' : 'text-red-600'}`}>
                  {stat.change}
                </span>
                <span className="text-sm text-gray-500 dark:text-gray-400 ml-2">
                  from last month
                </span>
              </div>
            </div>
          );
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Sales */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
              Recent Sales
            </h3>
            <ShoppingCart className="h-5 w-5 text-gray-400" />
          </div>
          <div className="space-y-3">
            {statsData.recentSales?.slice(0, 5).map((sale: any) => (
              <div key={sale.id} className="flex items-center justify-between py-2 border-b border-gray-100 dark:border-gray-700 last:border-b-0">
                <div>
                  <p className="font-medium text-gray-900 dark:text-white">
                    {sale.customerName}
                  </p>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    {format(new Date(sale.createdAt), 'MMM dd, yyyy HH:mm')}
                  </p>
                </div>
                <div className="text-right">
                  <p className="font-medium text-gray-900 dark:text-white">
                    ${sale.total.toFixed(2)}
                  </p>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    {sale.paymentMethod}
                  </p>
                </div>
              </div>
            ))}
            {(!statsData.recentSales || statsData.recentSales.length === 0) && (
              <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                No recent sales found
              </div>
            )}
          </div>
        </div>

        {/* Low Stock Alert */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
              Low Stock Alert
            </h3>
            <AlertTriangle className="h-5 w-5 text-yellow-500" />
          </div>
          <div className="space-y-3">
            {statsData.lowStockProducts?.map((product: any) => (
              <div key={product.id} className="flex items-center justify-between py-2 border-b border-gray-100 dark:border-gray-700 last:border-b-0">
                <div>
                  <p className="font-medium text-gray-900 dark:text-white">
                    {product.name}
                  </p>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    SKU: {product.sku}
                  </p>
                </div>
                <div className="text-right">
                  <p className="font-medium text-red-600 dark:text-red-400">
                    {product.stock} left
                  </p>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    Reorder at {product.reorderPoint}
                  </p>
                </div>
              </div>
            ))}
            {(!statsData.lowStockProducts || statsData.lowStockProducts.length === 0) && (
              <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                All products are well stocked
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;