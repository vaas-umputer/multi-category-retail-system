import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import rateLimit from 'express-rate-limit';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import fs from 'fs/promises';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import { body, validationResult } from 'express-validator';
import multer from 'multer';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3001;
const JWT_SECRET = process.env.JWT_SECRET || 'your-super-secret-jwt-key';

// Middleware
app.use(helmet());
app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));
app.use(morgan('combined'));

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100 // limit each IP to 100 requests per windowMs
});
app.use('/api', limiter);

// File upload configuration
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, 'uploads/');
  },
  filename: function (req, file, cb) {
    cb(null, Date.now() + '-' + file.originalname);
  }
});

const upload = multer({ 
  storage: storage,
  limits: { fileSize: 1024 * 1024 }, // 1MB limit
  fileFilter: function (req, file, cb) {
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Only image files are allowed!'));
    }
  }
});

// Data directory
const dataDir = join(__dirname, 'data');

// Initialize data files
async function initializeData() {
  try {
    await fs.mkdir(dataDir, { recursive: true });
    await fs.mkdir(join(__dirname, 'uploads'), { recursive: true });
    
    // Initialize users.json
    const usersFile = join(dataDir, 'users.json');
    try {
      await fs.access(usersFile);
    } catch {
      const defaultUsers = [
        {
          id: 1,
          username: 'admin',
          password: await bcrypt.hash('admin123', 10),
          role: 'ADMIN',
          email: 'admin@store.com',
          createdAt: new Date().toISOString()
        },
        {
          id: 2,
          username: 'cashier',
          password: await bcrypt.hash('cashier123', 10),
          role: 'CASHIER',
          email: 'cashier@store.com',
          createdAt: new Date().toISOString()
        }
      ];
      await fs.writeFile(usersFile, JSON.stringify(defaultUsers, null, 2));
    }
    
    // Initialize categories.json
    const categoriesFile = join(dataDir, 'categories.json');
    try {
      await fs.access(categoriesFile);
    } catch {
      const defaultCategories = [
        {
          id: 1,
          name: 'Electronics',
          description: 'Electronic devices and accessories',
          status: 'active',
          createdAt: new Date().toISOString()
        },
        {
          id: 2,
          name: 'Clothing',
          description: 'Apparel and fashion items',
          status: 'active',
          createdAt: new Date().toISOString()
        },
        {
          id: 3,
          name: 'Books',
          description: 'Books and educational materials',
          status: 'active',
          createdAt: new Date().toISOString()
        }
      ];
      await fs.writeFile(categoriesFile, JSON.stringify(defaultCategories, null, 2));
    }
    
    // Initialize products.json
    const productsFile = join(dataDir, 'products.json');
    try {
      await fs.access(productsFile);
    } catch {
      const defaultProducts = [
        {
          id: 1,
          name: 'Smartphone',
          sku: 'SP001',
          categoryId: 1,
          price: 699.99,
          stock: 25,
          reorderPoint: 10,
          description: 'Latest model smartphone with advanced features',
          lastUpdated: new Date().toISOString()
        },
        {
          id: 2,
          name: 'Laptop',
          sku: 'LP001',
          categoryId: 1,
          price: 1299.99,
          stock: 15,
          reorderPoint: 5,
          description: 'High-performance laptop for business and gaming',
          lastUpdated: new Date().toISOString()
        },
        {
          id: 3,
          name: 'T-Shirt',
          sku: 'TS001',
          categoryId: 2,
          price: 19.99,
          stock: 100,
          reorderPoint: 20,
          description: 'Comfortable cotton t-shirt',
          lastUpdated: new Date().toISOString()
        }
      ];
      await fs.writeFile(productsFile, JSON.stringify(defaultProducts, null, 2));
    }
    
    // Initialize sales.json
    const salesFile = join(dataDir, 'sales.json');
    try {
      await fs.access(salesFile);
    } catch {
      await fs.writeFile(salesFile, JSON.stringify([], null, 2));
    }
    
    console.log('Data files initialized successfully');
  } catch (error) {
    console.error('Error initializing data files:', error);
  }
}

// Authentication middleware
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];
  
  if (!token) {
    return res.status(401).json({ message: 'Access token required' });
  }
  
  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) {
      return res.status(403).json({ message: 'Invalid token' });
    }
    req.user = user;
    next();
  });
};

// Role-based access control
const requireRole = (roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ message: 'Insufficient permissions' });
    }
    next();
  };
};

// Utility functions
const readDataFile = async (filename) => {
  try {
    const data = await fs.readFile(join(dataDir, filename), 'utf-8');
    return JSON.parse(data);
  } catch (error) {
    console.error(`Error reading ${filename}:`, error);
    return [];
  }
};

const writeDataFile = async (filename, data) => {
  try {
    await fs.writeFile(join(dataDir, filename), JSON.stringify(data, null, 2));
  } catch (error) {
    console.error(`Error writing ${filename}:`, error);
    throw error;
  }
};

// Authentication routes
app.post('/api/auth/login', [
  body('username').notEmpty().withMessage('Username is required'),
  body('password').notEmpty().withMessage('Password is required')
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }
  
  try {
    const { username, password } = req.body;
    const users = await readDataFile('users.json');
    
    const user = users.find(u => u.username === username);
    if (!user) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }
    
    const validPassword = await bcrypt.compare(password, user.password);
    if (!validPassword) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }
    
    const token = jwt.sign(
      { id: user.id, username: user.username, role: user.role },
      JWT_SECRET,
      { expiresIn: '24h' }
    );
    
    res.json({
      token,
      user: {
        id: user.id,
        username: user.username,
        role: user.role,
        email: user.email
      }
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

// Dashboard routes
app.get('/api/dashboard/stats', authenticateToken, async (req, res) => {
  try {
    const products = await readDataFile('products.json');
    const categories = await readDataFile('categories.json');
    const sales = await readDataFile('sales.json');
    
    const totalProducts = products.length;
    const totalCategories = categories.filter(c => c.status === 'active').length;
    const lowStockProducts = products.filter(p => p.stock <= p.reorderPoint);
    const totalSales = sales.reduce((sum, sale) => sum + sale.total, 0);
    
    const recentSales = sales
      .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
      .slice(0, 10);
    
    res.json({
      totalProducts,
      totalCategories,
      lowStockCount: lowStockProducts.length,
      totalSales,
      recentSales,
      lowStockProducts: lowStockProducts.slice(0, 5)
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

// Category routes
app.get('/api/categories', authenticateToken, async (req, res) => {
  try {
    const categories = await readDataFile('categories.json');
    res.json(categories);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

app.post('/api/categories', authenticateToken, requireRole(['ADMIN']), [
  body('name').notEmpty().withMessage('Category name is required'),
  body('description').optional()
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }
  
  try {
    const categories = await readDataFile('categories.json');
    const { name, description } = req.body;
    
    const existingCategory = categories.find(c => c.name.toLowerCase() === name.toLowerCase());
    if (existingCategory) {
      return res.status(400).json({ message: 'Category already exists' });
    }
    
    const newCategory = {
      id: Math.max(...categories.map(c => c.id), 0) + 1,
      name,
      description: description || '',
      status: 'active',
      createdAt: new Date().toISOString()
    };
    
    categories.push(newCategory);
    await writeDataFile('categories.json', categories);
    
    res.status(201).json(newCategory);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

app.put('/api/categories/:id', authenticateToken, requireRole(['ADMIN']), [
  body('name').notEmpty().withMessage('Category name is required'),
  body('description').optional()
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }
  
  try {
    const categories = await readDataFile('categories.json');
    const categoryId = parseInt(req.params.id);
    const { name, description, status } = req.body;
    
    const categoryIndex = categories.findIndex(c => c.id === categoryId);
    if (categoryIndex === -1) {
      return res.status(404).json({ message: 'Category not found' });
    }
    
    categories[categoryIndex] = {
      ...categories[categoryIndex],
      name,
      description: description || categories[categoryIndex].description,
      status: status || categories[categoryIndex].status,
      updatedAt: new Date().toISOString()
    };
    
    await writeDataFile('categories.json', categories);
    res.json(categories[categoryIndex]);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

app.delete('/api/categories/:id', authenticateToken, requireRole(['ADMIN']), async (req, res) => {
  try {
    const categories = await readDataFile('categories.json');
    const products = await readDataFile('products.json');
    const categoryId = parseInt(req.params.id);
    
    const hasProducts = products.some(p => p.categoryId === categoryId);
    if (hasProducts) {
      return res.status(400).json({ message: 'Cannot delete category with existing products' });
    }
    
    const filteredCategories = categories.filter(c => c.id !== categoryId);
    if (filteredCategories.length === categories.length) {
      return res.status(404).json({ message: 'Category not found' });
    }
    
    await writeDataFile('categories.json', filteredCategories);
    res.json({ message: 'Category deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

// Product routes
app.get('/api/products', authenticateToken, async (req, res) => {
  try {
    const products = await readDataFile('products.json');
    const categories = await readDataFile('categories.json');
    
    const productsWithCategories = products.map(product => {
      const category = categories.find(c => c.id === product.categoryId);
      return {
        ...product,
        categoryName: category ? category.name : 'Unknown'
      };
    });
    
    res.json(productsWithCategories);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

app.post('/api/products', authenticateToken, requireRole(['ADMIN']), [
  body('name').notEmpty().withMessage('Product name is required'),
  body('sku').notEmpty().withMessage('SKU is required'),
  body('categoryId').isInt().withMessage('Valid category ID is required'),
  body('price').isFloat({ min: 0 }).withMessage('Valid price is required'),
  body('stock').isInt({ min: 0 }).withMessage('Valid stock quantity is required'),
  body('reorderPoint').isInt({ min: 0 }).withMessage('Valid reorder point is required')
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }
  
  try {
    const products = await readDataFile('products.json');
    const { name, sku, categoryId, price, stock, reorderPoint, description } = req.body;
    
    const existingProduct = products.find(p => p.sku === sku);
    if (existingProduct) {
      return res.status(400).json({ message: 'SKU already exists' });
    }
    
    const newProduct = {
      id: Math.max(...products.map(p => p.id), 0) + 1,
      name,
      sku,
      categoryId: parseInt(categoryId),
      price: parseFloat(price),
      stock: parseInt(stock),
      reorderPoint: parseInt(reorderPoint),
      description: description || '',
      lastUpdated: new Date().toISOString()
    };
    
    products.push(newProduct);
    await writeDataFile('products.json', products);
    
    res.status(201).json(newProduct);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

app.put('/api/products/:id', authenticateToken, requireRole(['ADMIN']), [
  body('name').notEmpty().withMessage('Product name is required'),
  body('sku').notEmpty().withMessage('SKU is required'),
  body('categoryId').isInt().withMessage('Valid category ID is required'),
  body('price').isFloat({ min: 0 }).withMessage('Valid price is required'),
  body('stock').isInt({ min: 0 }).withMessage('Valid stock quantity is required'),
  body('reorderPoint').isInt({ min: 0 }).withMessage('Valid reorder point is required')
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }
  
  try {
    const products = await readDataFile('products.json');
    const productId = parseInt(req.params.id);
    const { name, sku, categoryId, price, stock, reorderPoint, description } = req.body;
    
    const productIndex = products.findIndex(p => p.id === productId);
    if (productIndex === -1) {
      return res.status(404).json({ message: 'Product not found' });
    }
    
    const existingProduct = products.find(p => p.sku === sku && p.id !== productId);
    if (existingProduct) {
      return res.status(400).json({ message: 'SKU already exists' });
    }
    
    products[productIndex] = {
      ...products[productIndex],
      name,
      sku,
      categoryId: parseInt(categoryId),
      price: parseFloat(price),
      stock: parseInt(stock),
      reorderPoint: parseInt(reorderPoint),
      description: description || products[productIndex].description,
      lastUpdated: new Date().toISOString()
    };
    
    await writeDataFile('products.json', products);
    res.json(products[productIndex]);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

app.delete('/api/products/:id', authenticateToken, requireRole(['ADMIN']), async (req, res) => {
  try {
    const products = await readDataFile('products.json');
    const productId = parseInt(req.params.id);
    
    const filteredProducts = products.filter(p => p.id !== productId);
    if (filteredProducts.length === products.length) {
      return res.status(404).json({ message: 'Product not found' });
    }
    
    await writeDataFile('products.json', filteredProducts);
    res.json({ message: 'Product deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

// Sales routes
app.get('/api/sales', authenticateToken, async (req, res) => {
  try {
    const sales = await readDataFile('sales.json');
    res.json(sales);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

app.post('/api/sales', authenticateToken, [
  body('items').isArray().withMessage('Items must be an array'),
  body('items.*.productId').isInt().withMessage('Valid product ID is required'),
  body('items.*.quantity').isInt({ min: 1 }).withMessage('Valid quantity is required'),
  body('paymentMethod').notEmpty().withMessage('Payment method is required'),
  body('customerName').optional(),
  body('discount').optional().isFloat({ min: 0 }),
  body('tax').optional().isFloat({ min: 0 })
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }
  
  try {
    const products = await readDataFile('products.json');
    const sales = await readDataFile('sales.json');
    const { items, paymentMethod, customerName, discount = 0, tax = 0 } = req.body;
    
    let subtotal = 0;
    const saleItems = [];
    
    // Validate items and calculate subtotal
    for (const item of items) {
      const product = products.find(p => p.id === item.productId);
      if (!product) {
        return res.status(400).json({ message: `Product with ID ${item.productId} not found` });
      }
      
      if (product.stock < item.quantity) {
        return res.status(400).json({ message: `Insufficient stock for ${product.name}` });
      }
      
      const itemTotal = product.price * item.quantity;
      subtotal += itemTotal;
      
      saleItems.push({
        productId: product.id,
        productName: product.name,
        sku: product.sku,
        price: product.price,
        quantity: item.quantity,
        total: itemTotal
      });
    }
    
    const total = subtotal - discount + tax;
    
    const newSale = {
      id: Math.max(...sales.map(s => s.id), 0) + 1,
      items: saleItems,
      subtotal,
      discount,
      tax,
      total,
      paymentMethod,
      customerName: customerName || 'Walk-in Customer',
      cashierId: req.user.id,
      cashierName: req.user.username,
      createdAt: new Date().toISOString()
    };
    
    // Update product stock
    for (const item of items) {
      const productIndex = products.findIndex(p => p.id === item.productId);
      products[productIndex].stock -= item.quantity;
      products[productIndex].lastUpdated = new Date().toISOString();
    }
    
    sales.push(newSale);
    
    await writeDataFile('products.json', products);
    await writeDataFile('sales.json', sales);
    
    res.status(201).json(newSale);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

// Analytics routes
app.get('/api/analytics/sales', authenticateToken, async (req, res) => {
  try {
    const sales = await readDataFile('sales.json');
    const products = await readDataFile('products.json');
    const categories = await readDataFile('categories.json');
    
    const { startDate, endDate } = req.query;
    
    let filteredSales = sales;
    if (startDate && endDate) {
      filteredSales = sales.filter(sale => {
        const saleDate = new Date(sale.createdAt);
        return saleDate >= new Date(startDate) && saleDate <= new Date(endDate);
      });
    }
    
    const totalSales = filteredSales.reduce((sum, sale) => sum + sale.total, 0);
    const totalTransactions = filteredSales.length;
    
    // Sales by category
    const salesByCategory = {};
    filteredSales.forEach(sale => {
      sale.items.forEach(item => {
        const product = products.find(p => p.id === item.productId);
        if (product) {
          const category = categories.find(c => c.id === product.categoryId);
          if (category) {
            salesByCategory[category.name] = (salesByCategory[category.name] || 0) + item.total;
          }
        }
      });
    });
    
    // Top selling products
    const productSales = {};
    filteredSales.forEach(sale => {
      sale.items.forEach(item => {
        if (productSales[item.productId]) {
          productSales[item.productId].quantity += item.quantity;
          productSales[item.productId].total += item.total;
        } else {
          productSales[item.productId] = {
            productName: item.productName,
            quantity: item.quantity,
            total: item.total
          };
        }
      });
    });
    
    const topProducts = Object.entries(productSales)
      .sort(([, a], [, b]) => b.quantity - a.quantity)
      .slice(0, 10)
      .map(([productId, data]) => ({
        productId: parseInt(productId),
        ...data
      }));
    
    res.json({
      totalSales,
      totalTransactions,
      salesByCategory,
      topProducts
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

// Start server
initializeData().then(() => {
  app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
  });
});