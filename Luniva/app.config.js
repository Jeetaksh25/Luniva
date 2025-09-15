import "dotenv/config";

export default {
  expo: {
    name: "Luniva",
    slug: "Luniva",
    version: "1.0.0",
    orientation: "portrait",
    icon: "./assets/images/icon.png",
    scheme: "luniva",
    userInterfaceStyle: "automatic",
    newArchEnabled: true,
    ios: {
      supportsTablet: true,
      notifications: {
        iosDisplayInForeground: true,
        sound: true,
      },
    },
    android: {
      adaptiveIcon: {
        foregroundImage: "./assets/images/adaptive-icon.png",
        backgroundColor: "#1E1B24",
      },
      sound: true,
      useNextNotificationsApi: true,
      resources: {
        raw: ["./assets/sounds/notification.wav"]
      },
      edgeToEdgeEnabled: false,
      package: "com.jeetaksh.Luniva",
    },
    web: {
      bundler: "metro",
      output: "static",
      favicon: "./assets/images/icon.png",
    },
    plugins: [
      "expo-router",
      [
        "expo-splash-screen",
        {
          image: "./assets/images/splash.png",
          imageWidth: 150,
          resizeMode: "contain",
          backgroundColor: "#1E1B24",
        },
      ],
      "expo-background-task",
    ],
    experiments: {
      typedRoutes: true,
    },
    extra: {
      router: {},
      eas: {
        projectId: "fb0b601d-425e-4d02-b6ce-7d7e13244345",
        API_KEY_FIREBASE: process.env.API_KEY_FIREBASE,
        AUTH_DOMAIN_FIREBASE: process.env.AUTH_DOMAIN_FIREBASE,
        PROJECT_ID_FIREBASE: process.env.PROJECT_ID_FIREBASE,
        STORAGE_BUCKET_FIREBASE: process.env.STORAGE_BUCKET_FIREBASE,
        MESSAGING_SENDER_ID_FIREBASE: process.env.MESSAGING_SENDER_ID_FIREBASE,
        APP_ID_FIREBASE: process.env.APP_ID_FIREBASE,
        MEASUREMENT_ID_FIREBASE: process.env.MEASUREMENT_ID_FIREBASE,

        API_KEY_GEMINI: process.env.API_KEY_GEMINI,
      },
    },
  },
};
