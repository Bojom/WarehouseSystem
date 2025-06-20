// frontend/cypress/e2e/login.cy.js
describe('Authentication Flow', () => {
  beforeEach(() => {
    // 在每个测试用例开始前，都清理 localStorage，确保是干净的状态
    cy.clearLocalStorage();
    // 并且访问登录页
    cy.visit('/login');
  });

  it('should allow a user to log in and then log out', () => {
    // 访问登录页
    cy.visit('/login');

    // 输入用户名和密码
    cy.get('[data-cy="login-username-input"]').type('test_user');
    cy.get('[data-cy="login-password-input"]').type('password123');

    // 找到登录按钮并点击
    cy.get('[data-cy="login-submit-button"]').click();

    // 断言 (Assertion)
    // 验证URL是否包含了/dashboard，说明跳转成功
    cy.url().should('include', '/dashboard');

    // 验证页面上是否出现了"欢迎"字样
    cy.contains('欢迎').should('be.visible');

    // 登出流程
    // 找到并点击登出按钮
    cy.contains('退出登录').click();

    // 验证URL是否回到了登录页
    cy.url().should('include', '/login');

    // 验证 localStorage 中的 token 是否已被清除
    cy.window().then((win) => {
      expect(win.localStorage.getItem('token')).to.be.null;
    });
  });

  it('should show an error message with invalid credentials', () => {
    cy.visit('/login');
    cy.get('[data-cy="login-username-input"]').type('invaliduser');
    cy.get('[data-cy="login-password-input"]').type('wrongpassword');
    cy.get('[data-cy="login-submit-button"]').click();

    // 断言页面上出现了错误提示
    cy.contains('用户名或密码错误').should('be.visible');

    // 断言URL仍然在登录页
    cy.url().should('include', 'login');
  });
});