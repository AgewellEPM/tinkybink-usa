'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';

export function ElizaService() {
  const [isLoading, setIsLoading] = useState(true);
  
  useEffect(() => {
    // Initialize component
    setIsLoading(false);
  }, []);
  
  if (isLoading) {
    return <div>Loading ElizaService...</div>;
  }
  
  return (
    <div className="elizaservice-container">
      {/* Add UI here */}
    </div>
  );
}