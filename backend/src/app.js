// backend/src/app.js

// 1. 引入我们安装的依赖库
const express = require('express');
const sequelize = require('./config/db.config.js');
const cors = require('cors');
const userRoutes = require('./routes/user.routes.js');
const partRoutes = require('./routes/parts.routes');
const inventoryRoutes = require('./routes/inventory.routes');
const transactionRoutes = require('./routes/transaction.routes');
const dashboardRoutes = require('./routes/dashboard.routes');
const supplierRoutes = require('./routes/supplier.routes');

// 2. 初始化 Express 应用
const app = express();

app.use(cors());
app.use(express.json());

const PORT = process.env.PORT || 3001; // 从.env文件读取端口，如果没有则使用3001

// 3. 配置数据库连接 (使用Sequelize)
/*const sequelize = new Sequelize(
  process.env.DB_NAME,
  process.env.DB_USER,
  process.env.DB_PASSWORD,
  {
    host: process.env.DB_HOST,
    dialect: 'postgres' // 告诉Sequelize我们用的是PostgreSQL
  }
);*/

// 4. 定义一个函数来测试数据库连接
const testDbConnection = async () => {
  try {
    await sequelize.authenticate();
  } catch (error) {
    console.error('Unable to connect to the database:', error);
  }
};

// 5. 定义一个简单的根路由
app.get('/', (req, res) => {
  res.send(
    'Welcome to the EuroLink Technologie Warehouse Management System Backend'
  );
});

//新的api路由
app.get('/api/test', (req, res) => {
  res.json({ message: 'Hello from the Backend! Connection successful.' });
});

app.use('/api/users', userRoutes); //utilisation de routes pour user
app.use('/api/parts', partRoutes);
app.use('/api/inventory', inventoryRoutes);
app.use('/api/transactions', transactionRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/supplier', supplierRoutes);

// 6. 启动服务器并测试数据库连接
app.listen(PORT, () => {
  testDbConnection();
});

// catch 404 and forward to error handler
app.use(function (req, res, next) {
  // ... existing code ...
});
