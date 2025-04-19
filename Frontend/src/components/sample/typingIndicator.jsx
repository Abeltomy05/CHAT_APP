import React from 'react';

const TypingIndicator = () => {
  return (
    <div className="flex items-center ml-4 my-2">
      <div className="chat-bubble  py-2 px-4 bg-opacity-40 flex items-center">
        <div className="flex space-x-1.5">
          <div className="w-2 h-2 rounded-full bg-current animate-pulse transform transition-transform" 
               style={{ animationDuration: '1s' }}>
          </div>
          <div className="w-2 h-2 rounded-full bg-current animate-pulse transform transition-transform" 
               style={{ animationDuration: '1s', animationDelay: '0.2s' }}>
          </div>
          <div className="w-2 h-2 rounded-full bg-current animate-pulse transform transition-transform" 
               style={{ animationDuration: '1s', animationDelay: '0.4s' }}>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TypingIndicator;