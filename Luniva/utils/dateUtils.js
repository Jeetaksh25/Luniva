export const getTodayDateString = () => {
  // Get current date in LOCAL timezone
  const now = new Date();
  
  // Adjust for timezone offset to get the correct local date
  const timezoneOffset = now.getTimezoneOffset() * 60000; // offset in milliseconds
  const localDate = new Date(now.getTime() - timezoneOffset);
  
  return localDate.toISOString().split('T')[0];
};
  
  export const formatDateForDisplay = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString(); // This will use the device's locale
  };
  
  export const isToday = (dateString) => {
    const today = getTodayDateString();
    return today === dateString;
  };
  
  export const getStartOfDay = (date = new Date()) => {
    const newDate = new Date(date);
    newDate.setHours(0, 0, 0, 0);
    return newDate;
  };
  
  export const getEndOfDay = (date = new Date()) => {
    const newDate = new Date(date);
    newDate.setHours(23, 59, 59, 999);
    return newDate;
  };

  export const normalizeDate = (date) => {
    const d = new Date(date);
    d.setHours(0, 0, 0, 0);
    return d;
  };