// import { useState, useEffect } from 'react';
// import { useNavigate } from 'react-router-dom';
// import { ZegoUIKitPrebuilt } from '@zegocloud/zego-uikit-prebuilt';

// export const useZego = () => {
//   const [zegoToken, setZegoToken] = useState(null);
//   const navigate = useNavigate();

//   useEffect(() => {
//     // Initialize Zego Cloud on mount
//     const appID = import.meta.env.VITE_ZEGO_APP_ID;
//     const serverSecret = import.meta.env.VITE_ZEGO_SERVER_SECRET;
    
//     if (appID && serverSecret) {
//       try {
//         console.log("Initializing Zego Cloud with App ID:", appID);
//         // Don't initialize the SDK here, just store credentials for later use
//         setZegoToken({ appID, serverSecret });
//       } catch (error) {
//         console.error("Failed to initialize Zego Cloud:", error);
//       }
//     } else {
//       console.error("Zego Cloud credentials missing in environment variables");
//     }
//   }, []);

//   // Function to start a call
//   const startCall = (callInfo) => {
//     if (!zegoToken) {
//       console.error("Zego Cloud not initialized");
//       return;
//     }

//     try {
//       // Generate a unique room ID
//       const roomID = `call_${callInfo.callerId}_${callInfo.receiverId}_${Date.now()}`;
      
//       // Store call info in localStorage or state management
//       localStorage.setItem('currentCall', JSON.stringify({
//         ...callInfo,
//         roomID,
//         timestamp: Date.now()
//       }));
      
//       // Navigate to call page
//       navigate(`/call/${roomID}?type=${callInfo.callType}`);
//     } catch (error) {
//       console.error("Error starting call:", error);
//     }
//   };

//   // Function to join a call
//   const joinCall = (roomID, callType = 'video') => {
//     if (!zegoToken) {
//       console.error("Zego Cloud not initialized");
//       return;
//     }
    
//     // Navigate to call page
//     navigate(`/call/${roomID}?type=${callType}`);
//   };

//   // Function to end a call
//   const endCall = () => {
//     localStorage.removeItem('currentCall');
//     navigate(-1); // Go back to previous page
//   };

//   return {
//     startCall,
//     joinCall,
//     endCall,
//     zegoToken
//   };
// };