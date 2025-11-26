/**
 * Project Management E2E Tests
 */

describe('Project Management', () => {
    beforeEach(() => {
        // Login before each test
        cy.login('test@example.com', 'password123')
        cy.visit('/dashboard')
    })

    it('should display projects list', () => {
        cy.contains('Projects').should('be.visible')
        cy.get('[data-testid="project-card"]').should('have.length.at.least', 0)
    })

    it('should create new project', () => {
        cy.contains('button', 'New Project').click()

        cy.get('input[name="name"]').type('Test Project')
        cy.get('textarea[name="description"]').type('This is a test project')
        cy.get('select[name="projectType"]').select('web_app')
        cy.contains('button', 'Create').click()

        // Should redirect to project detail
        cy.url().should('include', '/projects/')
        cy.contains('Test Project').should('be.visible')
    })

    it('should view project details', () => {
        // Assuming at least one project exists
        cy.get('[data-testid="project-card"]').first().click()

        cy.url().should('include', '/projects/')
        cy.get('[data-testid="project-name"]').should('be.visible')
        cy.get('[data-testid="project-description"]').should('be.visible')
    })

    it('should update project', () => {
        cy.get('[data-testid="project-card"]').first().click()

        cy.contains('button', 'Settings').click()
        cy.get('input[name="name"]').clear().type('Updated Project Name')
        cy.contains('button', 'Save').click()

        cy.contains('Updated Project Name').should('be.visible')
    })

    it('should delete project', () => {
        cy.get('[data-testid="project-card"]').first().click()

        cy.contains('button', 'Settings').click()
        cy.contains('button', 'Delete Project').click()
        cy.contains('button', 'Confirm').click()

        // Should redirect to dashboard
        cy.url().should('include', '/dashboard')
    })
})
