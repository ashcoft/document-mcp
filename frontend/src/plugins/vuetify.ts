import 'vuetify/styles';
import '@mdi/font/css/materialdesignicons.css';
import { createVuetify, type ThemeDefinition } from 'vuetify';

// ============================================================
// Orange & Blue Theme
// ============================================================

const lightTheme: ThemeDefinition = {
  dark: false,
  colors: {
    background: '#F5F7FA',
    surface: '#FFFFFF',
    'surface-variant': '#E8EDF2',
    'on-surface-variant': '#3D4F5E',

    primary: '#E65100', // Deep Orange 900
    'on-primary': '#FFFFFF',
    'primary-darken-1': '#BF360C',
    'primary-lighten-1': '#FF6E40',
    'primary-lighten-2': '#FF9E80',
    'primary-lighten-3': '#FFCCBC',
    'primary-lighten-4': '#FFE0B2',
    'primary-lighten-5': '#FFF3E0',

    secondary: '#1565C0', // Blue 800
    'on-secondary': '#FFFFFF',
    'secondary-darken-1': '#0D47A1',
    'secondary-lighten-1': '#1E88E5',
    'secondary-lighten-2': '#42A5F5',
    'secondary-lighten-3': '#90CAF9',
    'secondary-lighten-4': '#BBDEFB',
    'secondary-lighten-5': '#E3F2FD',

    accent: '#FF6F00', // Amber 900
    'on-accent': '#FFFFFF',

    error: '#D32F2F',
    warning: '#F9A825',
    info: '#1976D2',
    success: '#2E7D32',
  },
  variables: {
    'border-color': '#E0E0E0',
    'border-opacity': 0.12,
    'medium-emphasis-opacity': 0.7,
    'disabled-opacity': 0.38,
    'hover-opacity': 0.04,
    'focus-opacity': 0.12,
    'selected-opacity': 0.08,
  },
};

const darkTheme: ThemeDefinition = {
  dark: true,
  colors: {
    background: '#0D1B2A',
    surface: '#13293D',
    'surface-variant': '#1B3A5B',
    'on-surface-variant': '#B0C4DE',

    primary: '#FF6F00', // Orange
    'on-primary': '#FFFFFF',

    secondary: '#42A5F5', // Blue
    'on-secondary': '#000000',

    accent: '#FFAB40',
    'on-accent': '#000000',

    error: '#FF5252',
    warning: '#FFD740',
    info: '#40C4FF',
    success: '#69F0AE',
  },
};

export default createVuetify({
  theme: {
    defaultTheme: 'light',
    themes: {
      light: lightTheme,
      dark: darkTheme,
    },
  },
  defaults: {
    VCard: {
      rounded: 'lg',
      elevation: 2,
    },
    VBtn: {
      rounded: 'lg',
      style: 'text-transform: none; font-weight: 600;',
    },
    VTextField: {
      variant: 'outlined',
      density: 'comfortable',
      rounded: 'lg',
    },
    VSelect: {
      variant: 'outlined',
      density: 'comfortable',
      rounded: 'lg',
    },
    VTextarea: {
      variant: 'outlined',
      density: 'comfortable',
      rounded: 'lg',
    },
    VDataTable: {
      density: 'comfortable',
    },
    VChip: {
      rounded: 'lg',
    },
    VAlert: {
      rounded: 'lg',
    },
  },
});