const commonTheme = {
  fontFamily: "'Plus Jakarta Sans', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
  primaryColor: '#2F6FED',
  primaryColorHover: '#255FDC',
  primaryColorPressed: '#1F53C0',
  primaryColorSuppl: '#60A5FA',
  infoColor: '#2F6FED',
  successColor: '#22C55E',
  warningColor: '#F59E0B',
  errorColor: '#EF4444',
  borderRadius: '12px',
  borderRadiusSmall: '10px',
}

export const lightThemeOverrides = {
  common: {
    ...commonTheme,
    bodyColor: '#F5F8FC',
    cardColor: '#FFFFFF',
    modalColor: '#FFFFFF',
    popoverColor: '#FFFFFF',
    tableColor: '#FFFFFF',
    dividerColor: '#D8E2EE',
    borderColor: '#D8E2EE',
    inputColorDisabled: '#EEF3F9',
  },
  Card: {
    borderRadius: '16px',
    color: '#FFFFFF',
    boxShadow: '0 8px 24px rgba(15, 23, 42, 0.08)',
  },
  Button: {
    borderRadiusMedium: '12px',
    borderRadiusSmall: '10px',
    textColorText: '#53657A',
    textColorTextHover: '#12263F',
  },
  Drawer: {
    color: '#FFFFFF',
  },
  Modal: {
    color: '#FFFFFF',
  },
  Input: {
    color: '#F7FAFD',
    borderHover: '#C6D3E1',
    borderFocus: '#2F6FED',
  },
  Switch: {
    railColor: '#CBD5E1',
    railColorActive: '#2F6FED',
  },
}

export const darkThemeOverrides = {
  common: {
    ...commonTheme,
    bodyColor: '#0C1522',
    cardColor: '#142133',
    modalColor: '#142133',
    popoverColor: '#142133',
    tableColor: '#142133',
    dividerColor: '#24364B',
    borderColor: '#24364B',
    textColorBase: '#EAF2FF',
    textColor1: '#EAF2FF',
    textColor2: '#A6B8CF',
    inputColorDisabled: '#111D2C',
  },
  Card: {
    borderRadius: '16px',
    color: '#142133',
    boxShadow: '0 24px 64px rgba(4, 10, 18, 0.32)',
  },
  Button: lightThemeOverrides.Button,
  Drawer: {
    color: '#142133',
  },
  Modal: {
    color: '#142133',
  },
  Input: {
    color: '#19283D',
    borderHover: '#34506E',
    borderFocus: '#60A5FA',
  },
  Switch: {
    railColor: '#24364B',
    railColorActive: '#60A5FA',
  },
}
