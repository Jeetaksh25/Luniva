import { useEffect, useRef } from "react";

export const useDateChange = (onDateChange: (newDate: string) => void) => {
  const currentDateRef = useRef(new Date().toISOString().split("T")[0]);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    // Clear any existing interval
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
    }

    // Set up the interval
    intervalRef.current = setInterval(() => {
      const newDate = new Date().toISOString().split("T")[0];
      if (newDate !== currentDateRef.current) {
        currentDateRef.current = newDate;
        onDateChange(newDate);
      }
    }, 60000); // check every minute

    // Cleanup function
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [onDateChange]);
};