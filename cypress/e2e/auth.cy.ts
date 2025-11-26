/**
 * Authentication E2E Tests
 */

describe('Authentication Flow', () => {
    beforeEach(() => {
        cy.visit('/')
    })

    it('should display login page', () => {
        cy.contains('Sign In').should('be.visible')
        cy.get('input[type="email"]').should('be.visible')
        cy.get('input[type="password"]').should('be.visible')
    })

    it('should show validation errors for invalid email', () => {
        cy.get('input[type="email"]').type('invalid-email')
        cy.get('input[type="password"]').type('password123')
        cy.contains('button', 'Sign In').click()

        cy.contains('Invalid email').should('be.visible')
    })

    it('should login with valid credentials', () => {
        cy.get('input[type="email"]').type('test@example.com')
        cy.get('input[type="password"]').type('password123')
        cy.contains('button', 'Sign In').click()

        // Should redirect to dashboard
        cy.url().should('include', '/dashboard')
        cy.contains('Welcome').should('be.visible')
    })

    it('should logout successfully', () => {
        // Login first
        cy.login('test@example.com', 'password123')

        // Logout
        cy.get('[data-testid="user-menu"]').click()
        cy.contains('Logout').click()

        // Should redirect to login
        cy.url().should('include', '/login')
    })

    it('should navigate to register page', () => {
        cy.contains('Sign Up').click()
        cy.url().should('include', '/register')
        cy.contains('Create Account').should('be.visible')
    })

    it('should register new user', () => {
        cy.visit('/register')

        cy.get('input[name="email"]').type('newuser@example.com')
        cy.get('input[name="password"]').type('SecurePass123!')
        cy.get('input[name="confirmPassword"]').type('SecurePass123!')
        cy.contains('button', 'Create Account').click()

        // Should redirect to dashboard or verification page
        cy.url().should('not.include', '/register')
    })
})
