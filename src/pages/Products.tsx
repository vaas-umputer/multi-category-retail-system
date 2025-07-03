import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from 'react-query';
import { productsAPI, categoriesAPI } from '../services/api';
import { useForm } from 'react-hook-form';
import toast from 'react-hot-toast';
import { Plus, Edit2, Trash2, Save, X, Search, Filter } from 'lucide-react';

interface Product {
  id: number;
  name: string;
  sku: string;
  categoryId: number;
  categoryName: string;
  price: number;
  stock: number;
  reorderPoint: number;
  description: string;
  lastUpdated: string;
}

interface ProductFormData {
  name: string;
  sku: string;
  categoryId: number;
  price: number;
  stock: number;
  reorderPoint: number;
  description: string;
}

const Products: React.FC = () => {
  const [isAddingProduct, setIsAddingProduct] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterCategory, setFilterCategory] = useState('');
  const queryClient = useQueryClient();

  const { data: products, isLoading, error } = useQuery('products', productsAPI.getAll);
  const { data: categories } = useQuery('categories', categoriesAPI.getAll);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors }
  } = useForm<ProductFormData>();

  const {
    register: registerEdit,
    handleSubmit: handleEditSubmit,
    reset: resetEdit,
    setValue: setEditValue,
    formState: { errors: editErrors }
  } = useForm<ProductFormData>();

  const createProductMutation = useMutation(productsAPI.create, {
    onSuccess: () => {
      queryClient.invalidateQueries('products');
      toast.success('Product created successfully');
      reset();
      setIsAddingProduct(false);
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Error creating product');
    }
  });

  const updateProductMutation = useMutation(
    ({ id, data }: { id: number; data: ProductFormData }) => productsAPI.update(id, data),
    {
      onSuccess: () => {
        queryClient.invalidateQueries('products');
        toast.success('Product updated successfully');
        setEditingProduct(null);
        resetEdit();
      },
      onError: (error: any) => {
        toast.error(error.response?.data?.message || 'Error updating product');
      }
    }
  );

  const deleteProductMutation = useMutation(productsAPI.delete, {
    onSuccess: () => {
      queryClient.invalidateQueries('products');
      toast.success('Product deleted successfully');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Error deleting product');
    }
  });

  const onSubmit = (data: ProductFormData) => {
    createProductMutation.mutate({
      ...data,
      categoryId: Number(data.categoryId),
      price: Number(data.price),
      stock: Number(data.stock),
      reorderPoint: Number(data.reorderPoint)
    });
  };

  const onEditSubmit = (data: ProductFormData) => {
    if (editingProduct) {
      updateProductMutation.mutate({ 
        id: editingProduct.id, 
        data: {
          ...data,
          categoryId: Number(data.categoryId),
          price: Number(data.price),
          stock: Number(data.stock),
          reorderPoint: Number(data.reorderPoint)
        }
      });
    }
  };

  const handleEdit = (product: Product) => {
    setEditingProduct(product);
    setEditValue('name', product.name);
    setEditValue('sku', product.sku);
    setEditValue('categoryId', product.categoryId);
    setEditValue('price', product.price);
    setEditValue('stock', product.stock);
    setEditValue('reorderPoint', product.reorderPoint);
    setEditValue('description', product.description);
  };

  const handleDelete = (id: number) => {
    if (window.confirm('Are you sure you want to delete this product?')) {
      deleteProductMutation.mutate(id);
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
        <div className="text-red-500 text-lg">Error loading products</div>
      </div>
    );
  }

  const productsData = products?.data || [];
  const categoriesData = categories?.data || [];

  // Filter products based on search and category
  const filteredProducts = productsData.filter((product: Product) => {
    const matchesSearch = product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         product.sku.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = filterCategory === '' || product.categoryId.toString() === filterCategory;
    return matchesSearch && matchesCategory;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Products</h1>
          <p className="text-gray-600 dark:text-gray-400">
            Manage your product inventory
          </p>
        </div>
        <button
          onClick={() => setIsAddingProduct(true)}
          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center space-x-2 transition-colors"
        >
          <Plus className="h-4 w-4" />
          <span>Add Product</span>
        </button>
      </div>

      {/* Search and Filter */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-4">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search products..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
            />
          </div>
          <div className="flex items-center space-x-2">
            <Filter className="h-4 w-4 text-gray-400" />
            <select
              value={filterCategory}
              onChange={(e) => setFilterCategory(e.target.value)}
              className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
            >
              <option value="">All Categories</option>
              {categoriesData.map((category: any) => (
                <option key={category.id} value={category.id}>
                  {category.name}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Add Product Form */}
      {isAddingProduct && (
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
              Add New Product
            </h3>
            <button
              onClick={() => {
                setIsAddingProduct(false);
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
                  Product Name
                </label>
                <input
                  type="text"
                  {...register('name', { required: 'Product name is required' })}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                />
                {errors.name && (
                  <p className="text-red-500 text-sm mt-1">{errors.name.message}</p>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  SKU
                </label>
                <input
                  type="text"
                  {...register('sku', { required: 'SKU is required' })}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                />
                {errors.sku && (
                  <p className="text-red-500 text-sm mt-1">{errors.sku.message}</p>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Category
                </label>
                <select
                  {...register('categoryId', { required: 'Category is required' })}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                >
                  <option value="">Select Category</option>
                  {categoriesData.map((category: any) => (
                    <option key={category.id} value={category.id}>
                      {category.name}
                    </option>
                  ))}
                </select>
                {errors.categoryId && (
                  <p className="text-red-500 text-sm mt-1">{errors.categoryId.message}</p>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Price
                </label>
                <input
                  type="number"
                  step="0.01"
                  {...register('price', { required: 'Price is required', min: 0 })}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                />
                {errors.price && (
                  <p className="text-red-500 text-sm mt-1">{errors.price.message}</p>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Stock
                </label>
                <input
                  type="number"
                  {...register('stock', { required: 'Stock is required', min: 0 })}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                />
                {errors.stock && (
                  <p className="text-red-500 text-sm mt-1">{errors.stock.message}</p>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Reorder Point
                </label>
                <input
                  type="number"
                  {...register('reorderPoint', { required: 'Reorder point is required', min: 0 })}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                />
                {errors.reorderPoint && (
                  <p className="text-red-500 text-sm mt-1">{errors.reorderPoint.message}</p>
                )}
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
                  setIsAddingProduct(false);
                  reset();
                }}
                className="px-4 py-2 text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={createProductMutation.isLoading}
                className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center space-x-2 transition-colors disabled:opacity-50"
              >
                <Save className="h-4 w-4" />
                <span>
                  {createProductMutation.isLoading ? 'Creating...' : 'Create Product'}
                </span>
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Products Table */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 dark:bg-gray-700">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Product
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  SKU
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Category
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Price
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Stock
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
              {filteredProducts.map((product: Product) => (
                <tr key={product.id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                  <td className="px-6 py-4">
                    {editingProduct?.id === product.id ? (
                      <div className="space-y-2">
                        <input
                          type="text"
                          {...registerEdit('name', { required: 'Product name is required' })}
                          className="w-full px-2 py-1 border border-gray-300 dark:border-gray-600 rounded focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white text-sm"
                        />
                        <textarea
                          {...registerEdit('description')}
                          rows={2}
                          className="w-full px-2 py-1 border border-gray-300 dark:border-gray-600 rounded focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white text-sm"
                        />
                      </div>
                    ) : (
                      <div>
                        <div className="text-sm font-medium text-gray-900 dark:text-white">
                          {product.name}
                        </div>
                        <div className="text-sm text-gray-500 dark:text-gray-400">
                          {product.description}
                        </div>
                      </div>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {editingProduct?.id === product.id ? (
                      <input
                        type="text"
                        {...registerEdit('sku', { required: 'SKU is required' })}
                        className="w-full px-2 py-1 border border-gray-300 dark:border-gray-600 rounded focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white text-sm"
                      />
                    ) : (
                      <div className="text-sm font-mono text-gray-900 dark:text-white">
                        {product.sku}
                      </div>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {editingProduct?.id === product.id ? (
                      <select
                        {...registerEdit('categoryId', { required: 'Category is required' })}
                        className="w-full px-2 py-1 border border-gray-300 dark:border-gray-600 rounded focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white text-sm"
                      >
                        {categoriesData.map((category: any) => (
                          <option key={category.id} value={category.id}>
                            {category.name}
                          </option>
                        ))}
                      </select>
                    ) : (
                      <div className="text-sm text-gray-900 dark:text-white">
                        {product.categoryName}
                      </div>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {editingProduct?.id === product.id ? (
                      <input
                        type="number"
                        step="0.01"
                        {...registerEdit('price', { required: 'Price is required', min: 0 })}
                        className="w-full px-2 py-1 border border-gray-300 dark:border-gray-600 rounded focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white text-sm"
                      />
                    ) : (
                      <div className="text-sm text-gray-900 dark:text-white">
                        ${product.price.toFixed(2)}
                      </div>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {editingProduct?.id === product.id ? (
                      <div className="space-y-2">
                        <input
                          type="number"
                          {...registerEdit('stock', { required: 'Stock is required', min: 0 })}
                          className="w-full px-2 py-1 border border-gray-300 dark:border-gray-600 rounded focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white text-sm"
                        />
                        <input
                          type="number"
                          {...registerEdit('reorderPoint', { required: 'Reorder point is required', min: 0 })}
                          className="w-full px-2 py-1 border border-gray-300 dark:border-gray-600 rounded focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white text-sm"
                          placeholder="Reorder point"
                        />
                      </div>
                    ) : (
                      <div className="text-sm text-gray-900 dark:text-white">
                        {product.stock} units
                      </div>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                      product.stock <= product.reorderPoint
                        ? 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
                        : product.stock <= product.reorderPoint * 2
                        ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200'
                        : 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                    }`}>
                      {product.stock <= product.reorderPoint 
                        ? 'Low Stock' 
                        : product.stock <= product.reorderPoint * 2 
                        ? 'Medium Stock' 
                        : 'In Stock'}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    {editingProduct?.id === product.id ? (
                      <div className="flex justify-end space-x-2">
                        <button
                          onClick={handleEditSubmit(onEditSubmit)}
                          disabled={updateProductMutation.isLoading}
                          className="text-green-600 hover:text-green-900 dark:text-green-400 dark:hover:text-green-200"
                        >
                          <Save className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => {
                            setEditingProduct(null);
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
                          onClick={() => handleEdit(product)}
                          className="text-blue-600 hover:text-blue-900 dark:text-blue-400 dark:hover:text-blue-200"
                        >
                          <Edit2 className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(product.id)}
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
        {filteredProducts.length === 0 && (
          <div className="text-center py-12">
            <p className="text-gray-500 dark:text-gray-400">No products found</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default Products;