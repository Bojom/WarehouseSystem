describe('Full Part Management Flow', () => {
  const partNumber = `CY-TEST-${Date.now()}`;
  const partName = 'Cypress Test Part';
  const partSpec = 'S-1';
  const partStock = '100';

  beforeEach(() => {
    // Cypress commands are chained and will run in order.
    // The login logic will complete before moving on to the test body.
    cy.visit('/login');
    cy.get('[data-cy="login-username-input"]').type('test_admin');
    cy.get('[data-cy="login-password-input"]').type('password123');
    cy.get('[data-cy="login-submit-button"]').click();
    // Ensure login is successful and we are on the dashboard
    cy.url().should('include', '/dashboard');
  });

  it('should allow a user to create, verify, and delete a part, then log out', () => {
    // 1. Navigate to Parts Management
    // We assume there's a navigation link to the parts page.
    // Let's look for a link with the text "配件管理".
    cy.contains('配件管理').click();
    cy.url().should('include', '/parts');

    // 2. Add a new part
    cy.get('[data-cy="add-part-button"]').click();

    // The dialog should be visible
    cy.get('.el-dialog').should('be.visible');

    // Fill out the form
    cy.get('[data-cy="part-form-number-input"]').type(partNumber);
    cy.get('[data-cy="part-form-name-input"]').type(partName);
    cy.get('[data-cy="part-form-spec-input"]').type(partSpec);
    cy.get('[data-cy="part-form-stock-input"]').clear().type(partStock);

    // Select a supplier
    cy.get('[data-cy="part-form-supplier-select"]').click();
    // This assumes there's at least one supplier and selects the first one.
    // '.el-select-dropdown' is the class for the dropdown that appears.
    cy.get('.el-select-dropdown').first().find('.el-select-dropdown__item').first().click();

    // Submit the form
    cy.get('[data-cy="part-form-submit-button"]').click();

    // 3. Verify the part appears in the list
    cy.get('[data-cy="parts-table"]').should('contain', partNumber);
    cy.get('[data-cy="parts-table"]').should('contain', partName);

    // 4. Delete the part
    // Find the row with the new part and click the delete button in that row
    cy.get('[data-cy="parts-table"]')
      .contains('tr', partNumber)
      .find('[data-cy="delete-part-button"]')
      .click();

    // The confirmation dialog should appear
    cy.get('.el-message-box').should('be.visible');
    // Click the confirm delete button
    cy.get('.el-message-box__btns .el-button--primary').click();

    // Verify the part is gone from the list
    cy.get('[data-cy="parts-table"]').should('not.contain', partNumber);

    // 5. Logout
    cy.contains('退出登录').click();
    cy.url().should('include', '/login');
  });
});
