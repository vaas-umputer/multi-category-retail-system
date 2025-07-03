import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from 'react-query';
import { categoriesAPI } from '../services/api';
import { useForm } from 'react-hook-form';
import toast from 'react-hot-toast';
import { Plus, Edit2, Trash2, Save, X } from 'lucide-react';

interface Category {
  id: number;
  name: string;
  description: string;
  status: 'active' | 'inactive';
  createdAt: string;
  updatedAt?: string;
}

interface CategoryFormData {
  name: string;
  description: string;
  status: 'active' | 'inactive';
}

const Categories: React.FC = () => {
  const [isAddingCategory, setIsAddingCategory] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const queryClient = useQueryClient();

  const { data: categories, isLoading, error } = useQuery('categories', categoriesAPI.getAll);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors }
  } = useForm<CategoryFormData>();

  const {
    register: registerEdit,
    handleSubmit: handleEditSubmit,
    reset: resetEdit,
    setValue: setEditValue,
    formState: { errors: editErrors }
  } = useForm<CategoryFormData>();

  const createCategoryMutation = useMutation(categoriesAPI.create, {
    onSuccess: () => {
      queryClient.invalidateQueries('categories');
      toast.success('Category created successfully');
      reset();
      setIsAddingCategory(false);
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Error creating category');
    }
  });

  const updateCategoryMutation = useMutation(
    ({ id, data }: { id: number; data: CategoryFormData }) => categoriesAPI.update(id, data),
    {
      onSuccess: () => {
        queryClient.invalidateQueries('categories');
        toast.success('Category updated successfully');
        setEditingCategory(null);
        resetEdit();
      },
      onError: (error: any) => {
        toast.error(error.response?.data?.message || 'Error updating category');
      }
    }
  );

  const deleteCategoryMutation = useMutation(categoriesAPI.delete, {
    onSuccess: () => {
      queryClient.invalidateQueries('categories');
      toast.success('Category deleted successfully');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Error deleting category');
    }
  });

  const onSubmit = (data: CategoryFormData) => {
    createCategoryMutation.mutate(data);
  };

  const onEditSubmit = (data: CategoryFormData) => {
    if (editingCategory) {
      updateCategoryMutation.mutate({ id: editingCategory.id, data });
    }
  };

  const handleEdit = (category: Category) => {
    setEditingCategory(category);
    setEditValue('name', category.name);
    setEditValue('description', category.description);
    setEditValue('status', category.status);
  };

  const handleDelete = (id: number) => {
    if (window.confirm('Are you sure you want to delete this category?')) {
      deleteCategoryMutation.mutate(id);
    }
  };

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
        <div className="text-red-500 text-lg">Error loading categories</div>
      </div>
    );
  }

  const categoriesData = categories?.data || [];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Categories</h1>
          <p className="text-gray-600 dark:text-gray-400">
            Manage your product categories
          </p>
        </div>
        <button
          onClick={() => setIsAddingCategory(true)}
          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center space-x-2 transition-colors"
        >
          <Plus className="h-4 w-4" />
          <span>Add Category</span>
        </button>
      </div>

      {/* Add Category Form */}
      {isAddingCategory && (
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
              Add New Category
            </h3>
            <button
              onClick={() => {
                setIsAddingCategory(false);
                reset();
              }}
              className="text-gray-400 hover:text-gray-600 dark:text-gray-500 dark:hover:text-gray-300"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Category Name
                </label>
                <input
                  type="text"
                  {...register('name', { required: 'Category name is required' })}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                />
                {errors.name && (
                  <p className="text-red-500 text-sm mt-1">{errors.name.message}</p>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Status
                </label>
                <select
                  {...register('status')}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                >
                  <option value="active">Active</option>
                  <option value="inactive">Inactive</option>
                </select>
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Description
              </label>
              <textarea
                {...register('description')}
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
              />
            </div>
            <div className="flex justify-end space-x-2">
              <button
                type="button"
                onClick={() => {
                  setIsAddingCategory(false);
                  reset();
                }}
                className="px-4 py-2 text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={createCategoryMutation.isLoading}
                className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center space-x-2 transition-colors disabled:opacity-50"
              >
                <Save className="h-4 w-4" />
                <span>
                  {createCategoryMutation.isLoading ? 'Creating...' : 'Create Category'}
                </span>
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Categories Table */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 dark:bg-gray-700">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Name
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Description
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Created
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
              {categoriesData.map((category: Category) => (
                <tr key={category.id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                  <td className="px-6 py-4 whitespace-nowrap">
                    {editingCategory?.id === category.id ? (
                      <input
                        type="text"
                        {...registerEdit('name', { required: 'Category name is required' })}
                        className="w-full px-2 py-1 border border-gray-300 dark:border-gray-600 rounded focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                      />
                    ) : (
                      <div className="text-sm font-medium text-gray-900 dark:text-white">
                        {category.name}
                      </div>
                    )}
                  </td>
                  <td className="px-6 py-4">
                    {editingCategory?.id === category.id ? (
                      <textarea
                        {...registerEdit('description')}
                        rows={2}
                        className="w-full px-2 py-1 border border-gray-300 dark:border-gray-600 rounded focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                      />
                    ) : (
                      <div className="text-sm text-gray-900 dark:text-white">
                        {category.description}
                      </div>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {editingCategory?.id === category.id ? (
                      <select
                        {...registerEdit('status')}
                        className="px-2 py-1 border border-gray-300 dark:border-gray-600 rounded focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                      >
                        <option value="active">Active</option>
                        <option value="inactive">Inactive</option>
                      </select>
                    ) : (
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                        category.status === 'active'
                          ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                          : 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
                      }`}>
                        {category.status}
                      </span>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                    {new Date(category.createdAt).toLocaleDateString()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    {editingCategory?.id === category.id ? (
                      <div className="flex justify-end space-x-2">
                        <button
                          onClick={handleEditSubmit(onEditSubmit)}
                          disabled={updateCategoryMutation.isLoading}
                          className="text-green-600 hover:text-green-900 dark:text-green-400 dark:hover:text-green-200"
                        >
                          <Save className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => {
                            setEditingCategory(null);
                            resetEdit();
                          }}
                          className="text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-200"
                        >
                          <X className="h-4 w-4" />
                        </button>
                      </div>
                    ) : (
                      <div className="flex justify-end space-x-2">
                        <button
                          onClick={() => handleEdit(category)}
                          className="text-blue-600 hover:text-blue-900 dark:text-blue-400 dark:hover:text-blue-200"
                        >
                          <Edit2 className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(category.id)}
                          className="text-red-600 hover:text-red-900 dark:text-red-400 dark:hover:text-red-200"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {categoriesData.length === 0 && (
          <div className="text-center py-12">
            <p className="text-gray-500 dark:text-gray-400">No categories found</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default Categories;