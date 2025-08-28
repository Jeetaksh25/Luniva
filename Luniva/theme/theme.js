// theme.js
export const theme = {
    fontSize: {
      xs: 12, // Small captions
      sm: 14, // Secondary text
      md: 16, // Default body text
      lg: 18, // Subtitles
      xl: 20, // Section headers
      "2xl": 24, // Titles
      "3xl": 30, // Main headings
      "4xl": 36, // Large headers
    },
  
    padding: {
      xs: 4,
      sm: 8,
      md: 12,
      lg: 16, // Default container padding
      xl: 24,
      "2xl": 32,
    },
  
    margin: {
      xs: 4,
      sm: 8,
      md: 12,
      lg: 16, // Default container margin
      xl: 24,
      "2xl": 32,
    },

    gap: {
      xs: 4,
      sm: 8,
      md: 12,
      lg: 16, 
      xl: 24,
      "2xl": 32,
    },
  
    borderRadius: {
      sm: 4,
      md: 8,
      lg: 12,
      xl: 16,
      full: 9999, // Circular elements
    },
  
    shadow: {
      sm: {
        shadowOpacity: 0.1,
        shadowRadius: 2,
        elevation: 1,
      },
      md: {
        shadowOpacity: 0.15,
        shadowRadius: 4,
        elevation: 3,
      },
      lg: {
        shadowOpacity: 0.2,
        shadowRadius: 6,
        elevation: 6,
      },
      xl: {
        shadowOpacity: 0.25,
        shadowRadius: 8,
        elevation: 10,
      },
    },
  
    button: {
      paddingVertical: 12,
      paddingHorizontal: 16,
      borderRadius: 8,
      fontSize: 16,
      backgroundColor: "#007bff",
      color: "#fff",
      textAlign: "center",
      shadowOpacity: 0.2,
      elevation: 4,
    },
  
    input: {
      paddingVertical: 12,
      paddingHorizontal: 16,
      borderRadius: 8,
      fontSize: 16,
      borderWidth: 1,
      borderColor: "#ccc",
      backgroundColor: "#fff",
    },
  
    card: {
      padding: 16,
      borderRadius: 12,
      backgroundColor: "#fff",
      shadowOpacity: 0.2,
      shadowRadius: 6,
      elevation: 6,
    },

    lightTheme: {
      background: "#FFF8F3",
      primaryText: "#2D2D2D",
      secondaryText: "#555555",
      text: "#000000",
    },

    darkTheme: {
      background: "#1E1B24",
      primaryText: "#FFFFFF",
      secondaryText: "#CCCCCC",
      text: "#FFFFFF",
    },

    colors: {
      primaryColor: "#FF6F61",
      secondaryColor: "#6A4C93",
      successColor: "#4CAF50",
      warningColor: "#FFD166",
      errorColor: "#EF476F",
      infoColor: "#2196F3",
    }
  };
  