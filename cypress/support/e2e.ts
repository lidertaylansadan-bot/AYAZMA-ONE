/**
 * Cypress Support File
 * Custom commands and global configuration
 */

import '@testing-library/cypress/add-commands'

// Custom command for login
Cypress.Commands.add('login', (email: string, password: string) => {
    cy.session([email, password], () => {
        cy.visit('/login')
        cy.get('input[type="email"]').type(email)
        cy.get('input[type="password"]').type(password)
        cy.contains('button', 'Sign In').click()
        cy.url().should('include', '/dashboard')
    })
})

// Custom command for API requests with auth
Cypress.Commands.add('apiRequest', (method: string, url: string, body?: any) => {
    return cy.window().then((win) => {
        const token = win.localStorage.getItem('supabase.auth.token')
        return cy.request({
            method,
            url: `${Cypress.env('apiUrl')}${url}`,
            headers: {
                Authorization: `Bearer ${token}`,
                'Content-Type': 'application/json'
            },
            body
        })
    })
})

// Declare custom commands for TypeScript
declare global {
    namespace Cypress {
        interface Chainable {
            login(email: string, password: string): Chainable<void>
            apiRequest(method: string, url: string, body?: any): Chainable<Response>
        }
    }
}

export { }
