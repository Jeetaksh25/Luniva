import { AppState } from 'react-native';
import { useStore } from '@/store/useAppStore';

let lastCheckedDate = null;

export const setupDateChangeListener = () => {
  // Check on app state change
  AppState.addEventListener('change', (nextAppState) => {
    if (nextAppState === 'active') {
      checkDateChange();
    }
  });

  // Also check periodically
  setInterval(checkDateChange, 300000);
};

const checkDateChange = () => {
  const currentDate = new Date().toISOString().split('T')[0];
  
  if (lastCheckedDate && lastCheckedDate !== currentDate) {
    // Date changed!
    const store = useStore.getState();
    store.handleDateChange(currentDate);
  }
  
  lastCheckedDate = currentDate;
};