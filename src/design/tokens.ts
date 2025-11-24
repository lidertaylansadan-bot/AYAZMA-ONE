// src/design/tokens.ts

export const tokens = {
    colors: {
        background: {
            default: '#121212',
            paper: '#1E1E1E',
            subtle: '#2A2A2A',
        },
        text: {
            primary: '#FFFFFF',
            secondary: '#A0A0A0',
            disabled: '#666666',
        },
        primary: {
            main: '#3ECF8E', // Supabase Green-ish
            hover: '#34B27B',
            contrastText: '#000000',
        },
        border: {
            default: '#333333',
            focus: '#3ECF8E',
        },
        status: {
            success: '#3ECF8E',
            error: '#FF4D4F',
            warning: '#FAAD14',
            info: '#1890FF',
        },
    },
    spacing: {
        xs: '4px',
        sm: '8px',
        md: '16px',
        lg: '24px',
        xl: '32px',
    },
    typography: {
        fontFamily: '"Inter", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
        fontSize: {
            sm: '0.875rem',
            md: '1rem',
            lg: '1.25rem',
            xl: '1.5rem',
        },
        fontWeight: {
            regular: 400,
            medium: 500,
            bold: 700,
        },
    },
    borderRadius: {
        sm: '4px',
        md: '8px',
        lg: '12px',
    },
};
