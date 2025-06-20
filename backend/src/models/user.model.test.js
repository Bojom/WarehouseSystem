// backend/src/models/user.model.test.js
const sequelize = require('../config/db.config');
const User = require('./user.model');

// describe 用于将一组相关的测试打包
describe('User Model', () => {

  // 在所有测试开始前，同步数据库（清空并重建表）
  beforeAll(async () => {
    await sequelize.sync({ force: true });
  });

  // 测试用例 1: 应该能成功创建一个新用户
  test('should create a new user successfully', async () => {
    const userData = {
      user_name: 'testuser',
      password_hash: 'some_hash',
      user_role: 'operator'
    };
    const user = await User.create(userData);

    // 断言 (Assertion): 检查结果是否符合预期
    expect(user.id).toBe(1);
    expect(user.user_name).toBe(userData.user_name);
    expect(user.user_role).toBe(userData.user_role);
  });
  
  // 测试用例 2: 不应该允许创建重复的用户名
  test('should not allow duplicate usernames', async () => {
    // 我们期望这段代码会抛出一个错误
    await expect(User.create({
      user_name: 'testuser', // 'testuser' 在上一个测试中已创建
      password_hash: 'another_hash',
      user_role: 'admin'
    })).rejects.toThrow(); // 断言它会抛出错误
  });

  // 测试用-例 3: 必填字段不能为空
  test('should require a username and password_hash', async () => {
    await expect(User.create({
      user_role: 'admin'
    })).rejects.toThrow();
  });

  // 在所有测试结束后，关闭数据库连接
  afterAll(async () => {
    await sequelize.close();
  });
});