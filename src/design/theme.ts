// src/design/theme.ts
import { tokens } from './tokens';

/**
 * Generates CSS variables from tokens for global usage.
 * Can be injected into a global style or root element.
 */
export const themeCssVariables = `
  :root {
    --color-bg-default: ${tokens.colors.background.default};
    --color-bg-paper: ${tokens.colors.background.paper};
    --color-bg-subtle: ${tokens.colors.background.subtle};
    
    --color-text-primary: ${tokens.colors.text.primary};
    --color-text-secondary: ${tokens.colors.text.secondary};
    --color-text-disabled: ${tokens.colors.text.disabled};
    
    --color-primary-main: ${tokens.colors.primary.main};
    --color-primary-hover: ${tokens.colors.primary.hover};
    --color-primary-contrast: ${tokens.colors.primary.contrastText};
    
    --color-border: ${tokens.colors.border.default};
    
    --spacing-xs: ${tokens.spacing.xs};
    --spacing-sm: ${tokens.spacing.sm};
    --spacing-md: ${tokens.spacing.md};
    --spacing-lg: ${tokens.spacing.lg};
    --spacing-xl: ${tokens.spacing.xl};
    
    --font-family: ${tokens.typography.fontFamily};
    --radius-md: ${tokens.borderRadius.md};
  }
`;

export const theme = {
    ...tokens,
    // Helper to get a spacing value
    space: (multiplier: number) => `${multiplier * 4}px`,
};
