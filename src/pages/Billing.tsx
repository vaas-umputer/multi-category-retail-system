import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from 'react-query';
import { productsAPI, salesAPI } from '../services/api';
import { useForm } from 'react-hook-form';
import toast from 'react-hot-toast';
import { 
  Plus, 
  Minus, 
  ShoppingCart, 
  Search, 
  Trash2, 
  Calculator,
  FileText,
  CreditCard,
  DollarSign,
  Receipt,
  Percent
} from 'lucide-react';
import jsPDF from 'jspdf';

interface Product {
  id: number;
  name: string;
  sku: string;
  categoryName: string;
  price: number;
  stock: number;
}

interface CartItem {
  productId: number;
  productName: string;
  sku: string;
  price: number;
  quantity: number;
  total: number;
}

interface SaleFormData {
  customerName: string;
  paymentMethod: string;
  discountPercent: number;
  taxPercent: number;
}

const Billing: React.FC = () => {
  const [cart, setCart] = useState<CartItem[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const queryClient = useQueryClient();

  const { data: products, isLoading } = useQuery('products', productsAPI.getAll);

  const {
    register,
    handleSubmit,
    reset,
    watch,
    formState: { errors }
  } = useForm<SaleFormData>({
    defaultValues: {
      customerName: '',
      paymentMethod: 'cash',
      discountPercent: 0,
      taxPercent: 0
    }
  });

  const createSaleMutation = useMutation(salesAPI.create, {
    onSuccess: (data) => {
      queryClient.invalidateQueries('products');
      toast.success('Sale completed successfully');
      setCart([]);
      reset();
      generateInvoice(data.data);
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Error completing sale');
    }
  });

  const productsData = products?.data || [];
  const filteredProducts = productsData.filter((product: Product) =>
    product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    product.sku.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const addToCart = (product: Product) => {
    const existingItem = cart.find(item => item.productId === product.id);
    
    if (existingItem) {
      if (existingItem.quantity >= product.stock) {
        toast.error('Insufficient stock');
        return;
      }
      setCart(cart.map(item =>
        item.productId === product.id
          ? { ...item, quantity: item.quantity + 1, total: (item.quantity + 1) * item.price }
          : item
      ));
    } else {
      if (product.stock <= 0) {
        toast.error('Product out of stock');
        return;
      }
      setCart([...cart, {
        productId: product.id,
        productName: product.name,
        sku: product.sku,
        price: product.price,
        quantity: 1,
        total: product.price
      }]);
    }
  };

  const updateQuantity = (productId: number, change: number) => {
    const product = productsData.find((p: Product) => p.id === productId);
    if (!product) return;

    setCart(cart.map(item => {
      if (item.productId === productId) {
        const newQuantity = item.quantity + change;
        if (newQuantity <= 0) {
          return item;
        }
        if (newQuantity > product.stock) {
          toast.error('Insufficient stock');
          return item;
        }
        return {
          ...item,
          quantity: newQuantity,
          total: newQuantity * item.price
        };
      }
      return item;
    }));
  };

  const setQuantity = (productId: number, quantity: number) => {
    const product = productsData.find((p: Product) => p.id === productId);
    if (!product) return;

    if (quantity <= 0) {
      toast.error('Quantity must be greater than 0');
      return;
    }

    if (quantity > product.stock) {
      toast.error('Insufficient stock');
      return;
    }

    setCart(cart.map(item => {
      if (item.productId === productId) {
        return {
          ...item,
          quantity: quantity,
          total: quantity * item.price
        };
      }
      return item;
    }));
  };

  const removeFromCart = (productId: number) => {
    setCart(cart.filter(item => item.productId !== productId));
  };

  const discountPercent = watch('discountPercent') || 0;
  const taxPercent = watch('taxPercent') || 0;
  const subtotal = cart.reduce((sum, item) => sum + item.total, 0);
  const discountAmount = (subtotal * discountPercent) / 100;
  const taxableAmount = subtotal - discountAmount;
  const taxAmount = (taxableAmount * taxPercent) / 100;
  const total = taxableAmount + taxAmount;

  const onSubmit = (data: SaleFormData) => {
    if (cart.length === 0) {
      toast.error('Cart is empty');
      return;
    }

    const saleData = {
      items: cart.map(item => ({
        productId: item.productId,
        quantity: item.quantity
      })),
      customerName: data.customerName || 'Walk-in Customer',
      paymentMethod: data.paymentMethod,
      discount: discountAmount,
      tax: taxAmount
    };

    createSaleMutation.mutate(saleData);
  };

  const generateInvoice = (sale: any) => {
    const doc = new jsPDF();
    
    // Header
    doc.setFontSize(20);
    doc.text('RetailPro Invoice', 20, 20);
    
    // Sale details
    doc.setFontSize(12);
    doc.text(`Invoice #: ${sale.id}`, 20, 40);
    doc.text(`Date: ${new Date(sale.createdAt).toLocaleDateString()}`, 20, 50);
    doc.text(`Customer: ${sale.customerName}`, 20, 60);
    doc.text(`Payment Method: ${sale.paymentMethod}`, 20, 70);
    
    // Items table
    let yPosition = 90;
    doc.text('Items:', 20, yPosition);
    yPosition += 10;
    
    sale.items.forEach((item: any, index: number) => {
      doc.text(
        `${index + 1}. ${item.productName} (${item.sku}) - Qty: ${item.quantity} - $${item.total.toFixed(2)}`,
        20,
        yPosition
      );
      yPosition += 10;
    });
    
    // Totals
    yPosition += 10;
    doc.text(`Subtotal: $${sale.subtotal.toFixed(2)}`, 20, yPosition);
    if (sale.discount > 0) {
      yPosition += 10;
      doc.text(`Discount (${discountPercent}%): -$${sale.discount.toFixed(2)}`, 20, yPosition);
    }
    if (sale.tax > 0) {
      yPosition += 10;
      doc.text(`Tax (${taxPercent}%): $${sale.tax.toFixed(2)}`, 20, yPosition);
    }
    yPosition += 10;
    doc.setFontSize(14);
    doc.text(`Total: $${sale.total.toFixed(2)}`, 20, yPosition);
    
    // Save the PDF
    doc.save(`invoice-${sale.id}.pdf`);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Billing System</h1>
        <p className="text-gray-600 dark:text-gray-400">
          Process sales and manage transactions
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Products Section */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
              Products
            </h3>
            <ShoppingCart className="h-5 w-5 text-gray-400" />
          </div>
          
          {/* Search */}
          <div className="relative mb-4">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search products..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
            />
          </div>

          {/* Products List */}
          <div className="space-y-2 max-h-96 overflow-y-auto">
            {filteredProducts.map((product: Product) => (
              <div
                key={product.id}
                className="flex items-center justify-between p-3 border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 cursor-pointer"
                onClick={() => addToCart(product)}
              >
                <div className="flex-1">
                  <div className="font-medium text-gray-900 dark:text-white">
                    {product.name}
                  </div>
                  <div className="text-sm text-gray-500 dark:text-gray-400">
                    {product.sku} • {product.categoryName}
                  </div>
                  <div className="text-sm text-gray-500 dark:text-gray-400">
                    Stock: {product.stock}
                  </div>
                </div>
                <div className="text-right">
                  <div className="font-medium text-gray-900 dark:text-white">
                    ${product.price.toFixed(2)}
                  </div>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      addToCart(product);
                    }}
                    className="text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300"
                  >
                    <Plus className="h-4 w-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Cart Section */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
              Cart ({cart.length} items)
            </h3>
            <Calculator className="h-5 w-5 text-gray-400" />
          </div>

          {/* Cart Items */}
          <div className="space-y-2 max-h-64 overflow-y-auto mb-4">
            {cart.map((item) => (
              <div
                key={item.productId}
                className="flex items-center justify-between p-3 border border-gray-200 dark:border-gray-700 rounded-lg"
              >
                <div className="flex-1">
                  <div className="font-medium text-gray-900 dark:text-white">
                    {item.productName}
                  </div>
                  <div className="text-sm text-gray-500 dark:text-gray-400">
                    {item.sku} • ${item.price.toFixed(2)}
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => updateQuantity(item.productId, -1)}
                    className="text-gray-400 hover:text-gray-600 dark:text-gray-500 dark:hover:text-gray-300"
                  >
                    <Minus className="h-4 w-4" />
                  </button>
                  <input
                    type="number"
                    min="1"
                    max={productsData.find((p: Product) => p.id === item.productId)?.stock || 1}
                    value={item.quantity}
                    onChange={(e) => {
                      const newQuantity = parseInt(e.target.value) || 1;
                      setQuantity(item.productId, newQuantity);
                    }}
                    className="w-16 text-center px-2 py-1 border border-gray-300 dark:border-gray-600 rounded focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                  />
                  <button
                    onClick={() => updateQuantity(item.productId, 1)}
                    className="text-gray-400 hover:text-gray-600 dark:text-gray-500 dark:hover:text-gray-300"
                  >
                    <Plus className="h-4 w-4" />
                  </button>
                  <div className="w-20 text-right font-medium text-gray-900 dark:text-white">
                    ${item.total.toFixed(2)}
                  </div>
                  <button
                    onClick={() => removeFromCart(item.productId)}
                    className="text-red-600 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
            ))}
            {cart.length === 0 && (
              <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                Cart is empty
              </div>
            )}
          </div>

          {/* Sale Details Form */}
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Customer Name
              </label>
              <input
                type="text"
                {...register('customerName')}
                placeholder="Walk-in Customer"
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Payment Method
                </label>
                <select
                  {...register('paymentMethod')}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                >
                  <option value="cash">Cash</option>
                  <option value="card">Card</option>
                  <option value="check">Check</option>
                  <option value="digital">Digital Wallet</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  <div className="flex items-center space-x-1">
                    <span>Discount</span>
                    <Percent className="h-3 w-3" />
                  </div>
                </label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  max="100"
                  {...register('discountPercent', { min: 0, max: 100 })}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  <div className="flex items-center space-x-1">
                    <span>Tax</span>
                    <Percent className="h-3 w-3" />
                  </div>
                </label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  max="100"
                  {...register('taxPercent', { min: 0, max: 100 })}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                />
              </div>
            </div>

            {/* Totals */}
            <div className="border-t border-gray-200 dark:border-gray-700 pt-4">
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-gray-600 dark:text-gray-400">Subtotal:</span>
                  <span className="text-gray-900 dark:text-white">${subtotal.toFixed(2)}</span>
                </div>
                {discountPercent > 0 && (
                  <div className="flex justify-between">
                    <span className="text-gray-600 dark:text-gray-400">
                      Discount ({discountPercent}%):
                    </span>
                    <span className="text-red-600 dark:text-red-400">-${discountAmount.toFixed(2)}</span>
                  </div>
                )}
                {taxPercent > 0 && (
                  <div className="flex justify-between">
                    <span className="text-gray-600 dark:text-gray-400">
                      Tax ({taxPercent}%):
                    </span>
                    <span className="text-gray-900 dark:text-white">${taxAmount.toFixed(2)}</span>
                  </div>
                )}
                <div className="flex justify-between text-lg font-semibold border-t border-gray-200 dark:border-gray-700 pt-2">
                  <span className="text-gray-900 dark:text-white">Total:</span>
                  <span className="text-gray-900 dark:text-white">${total.toFixed(2)}</span>
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex space-x-2">
              <button
                type="button"
                onClick={() => setCart([])}
                className="flex-1 px-4 py-2 text-gray-600 dark:text-gray-400 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
              >
                Clear Cart
              </button>
              <button
                type="submit"
                disabled={cart.length === 0 || createSaleMutation.isLoading}
                className="flex-1 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center justify-center space-x-2 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Receipt className="h-4 w-4" />
                <span>
                  {createSaleMutation.isLoading ? 'Processing...' : 'Complete Sale'}
                </span>
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default Billing;