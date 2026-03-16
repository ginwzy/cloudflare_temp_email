export const lightThemeOverrides = {
  common: {
    fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, sans-serif",
    primaryColor: '#3B82F6',
    primaryColorHover: '#2563EB',
    primaryColorPressed: '#1D4ED8',
    primaryColorSuppl: '#60A5FA',
    borderRadius: '10px',
    borderRadiusSmall: '8px',
  },
  Card: {
    borderRadius: '14px',
    boxShadow: '0 1px 3px rgba(0,0,0,0.03), 0 1px 2px rgba(0,0,0,0.04)',
  },
  Button: {
    borderRadiusMedium: '10px',
    borderRadiusSmall: '8px',
  },
}

export const darkThemeOverrides = {
  common: {
    ...lightThemeOverrides.common,
    bodyColor: '#0F172A',
    cardColor: '#1E293B',
    modalColor: '#1E293B',
    popoverColor: '#1E293B',
  },
  Card: {
    ...lightThemeOverrides.Card,
    boxShadow: '0 1px 3px rgba(0,0,0,0.2), 0 1px 2px rgba(0,0,0,0.3)',
  },
  Button: lightThemeOverrides.Button,
}
