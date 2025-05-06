import React from 'react';

const SidebarTypingIndicator = () => {
  return (
    <div className="flex items-center">
      <div className="text-xs text-green-500 flex items-center font-medium">
        typing
        <div className="flex space-x-0.5 ml-1">
          <div className="w-1 h-1 rounded-full bg-green-500 animate-pulse" 
               style={{ animationDuration: '1s' }}>
          </div>
          <div className="w-1 h-1 rounded-full bg-green-500 animate-pulse" 
               style={{ animationDuration: '1s', animationDelay: '0.2s' }}>
          </div>
          <div className="w-1 h-1 rounded-full bg-green-500 animate-pulse" 
               style={{ animationDuration: '1s', animationDelay: '0.4s' }}>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SidebarTypingIndicator;