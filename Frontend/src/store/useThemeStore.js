import {create} from "zustand"



export const useThemeStore = create((set) => ({
   // Check localStorage first, fallback to "dracula" if not found
   theme: typeof localStorage !== "undefined" 
     ? localStorage.getItem("chat-theme") || "dracula" 
     : "dracula",
     
   setTheme: (theme) => {
     // Ensure localStorage is available (for SSR compatibility)
     if (typeof localStorage !== "undefined") {
       localStorage.setItem("chat-theme", theme);
     }
     set({ theme });
   },
   
   // Initialize theme at app startup
   initializeTheme: () => {
     const savedTheme = 
       typeof localStorage !== "undefined" 
         ? localStorage.getItem("chat-theme") 
         : null;
     
     if (!savedTheme) {
       // Set default theme if none exists
       if (typeof localStorage !== "undefined") {
         localStorage.setItem("chat-theme", "dracula");
       }
       set({ theme: "dracula" });
     } else {
       set({ theme: savedTheme });
     }
   }
 }))