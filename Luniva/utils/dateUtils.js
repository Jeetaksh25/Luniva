// In dateUtils.ts - FIXED version
export const getTodayDateString = () => {
  const now = new Date();
  // Use local date components instead of ISO string manipulation
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  
  return `${year}-${month}-${day}`;
};

export const isToday = (dateString) => {
  return getTodayDateString() === dateString;
};

export const isPastDate = (dateString) => {
  const today = new Date(getTodayDateString());
  const targetDate = new Date(dateString);
  
  // Reset both dates to midnight for accurate comparison
  today.setHours(0, 0, 0, 0);
  targetDate.setHours(0, 0, 0, 0);
  
  return targetDate < today;
};

export const isFutureDate = (dateString) => {
  const today = new Date(getTodayDateString());
  const targetDate = new Date(dateString);
  
  // Reset both dates to midnight for accurate comparison
  today.setHours(0, 0, 0, 0);
  targetDate.setHours(0, 0, 0, 0);
  
  return targetDate > today;
};