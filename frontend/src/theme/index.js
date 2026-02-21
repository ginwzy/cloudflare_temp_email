export const lightThemeOverrides = {
  common: {
    fontFamily: "'Plus Jakarta Sans', -apple-system, BlinkMacSystemFont, sans-serif",
    primaryColor: '#2563EB',
    primaryColorHover: '#1D4ED8',
    primaryColorPressed: '#1E40AF',
    primaryColorSuppl: '#3B82F6',
    borderRadius: '8px',
    borderRadiusSmall: '6px',
  },
  Card: {
    borderRadius: '12px',
    boxShadow: '0 1px 3px rgba(0,0,0,0.04), 0 1px 2px rgba(0,0,0,0.06)',
  },
  Button: {
    borderRadiusMedium: '8px',
    borderRadiusSmall: '6px',
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
