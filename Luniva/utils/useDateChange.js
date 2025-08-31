import { useEffect, useState } from 'react';

export const useDateChange = (onDateChange) => {
  useEffect(() => {
    const checkDateChange = () => {
      const now = new Date();
      const currentDate = now.toISOString().split('T')[0];
      
      // Check every minute if the date has changed
      const interval = setInterval(() => {
        const newNow = new Date();
        const newDate = newNow.toISOString().split('T')[0];
        
        if (newDate !== currentDate) {
          onDateChange(newDate);
          clearInterval(interval);
        }
      }, 60000); // Check every minute
      
      return () => clearInterval(interval);
    };

    checkDateChange();
  }, [onDateChange]);
};