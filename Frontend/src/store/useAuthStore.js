import {create} from "zustand"
import { axiosIntance } from "../lib/axios"
import toast from "react-hot-toast";
import { io } from "socket.io-client";
import { useChatStore } from "./useChatStore";


const BASE_URL = import.meta.env.MODE === "development" ? 'http://localhost:3000' : '/';

export const useAuthStore = create((set,get)=>({
  authUser: null,
  isSigningUp:false,
  isLoggingIn:false,
  isUpdatingProfile:false,
  isCheckingAuth: true,
  onlineUsers:[],
  blockedUsers: [],
  socket:null,
  incomingCall: null,
  authProvider: null,


  checkAuth:async()=>{
    try{
      const res = await axiosIntance.get('/auth/check');
      set({authUser:res.data});
      get().connectSocket();
    }catch(error){
      if (error.response && error.response.status === 401) {
        set({ authUser: null });
      } else {
        console.log("Error in checkAuth:", error);
        set({ authUser: null });
      }
    }finally{
        set({isCheckingAuth: false})
    }
  },

  signup: async (data) =>{
    set({isSigningUp: true})
    try{
       const res = await axiosIntance.post("/auth/signup", data);
       set({authUser: res.data})
       toast.success("Account created successfully");
       get().connectSocket();
    }catch(error){
    toast.error(error.response.data.message)
    }finally{
        set({isSigningUp: false})
    }
  },

  googleAuth: async (userData) => {
    set({isLoggingIn: true})
    try {
      console.log("Sending Google auth data:", userData);

      const res = await axiosIntance.post("/auth/google", {
        email: userData.email,
        fullName: userData.name,
        picture: userData.picture,
        googleId: userData.sub
      });
      
      console.log("Google auth response:", res.data);
      set({authUser: res.data, authProvider: 'google'});
      toast.success("Google authentication successful");
      get().connectSocket();
    } catch(error) {
      console.error("Google auth error:", error.response?.data || error.message);
      toast.error(error.response?.data?.message || "Google authentication failed");
    } finally {
      set({isLoggingIn: false});
    }
  },

  login:async(data)=>{
    set({isLoggingIn: true})
       try{
        const res = await axiosIntance.post("/auth/login", data);
        set({authUser: res.data})
        toast.success("Login successfull");

        get().connectSocket();
       }catch(error){
        toast.error(error.response.data.message)
       }finally{
        set({isLoggingIn: false})
    }
  },

  logout:async(auth0Logout = null)=>{
    try{
      get().disconnectSocket();

     await axiosIntance.post('/auth/logout');
     useChatStore.getState().resetChat();

     set({authUser: null, authProvider: null});
     toast.success("Logged out successfully");

     if (get().authProvider === 'google' && auth0Logout) {
      setTimeout(() => {
        auth0Logout({
          logoutParams: {
            returnTo: window.location.origin,
            federated: true
          }
        });
      }, 300);
    }
    }catch(error){
      set({authUser: null, authProvider: null});
      toast.error(error.response?.data?.message || "An error occurred during logout");
    }
  },

  getBlockedUsers: async () => {
    try {
      const res = await axiosIntance.get("/user/blocked");
      set({ blockedUsers: res.data });
    } catch (error) {
      console.error("Error getting blocked users:", error);
    }
  },

  profileUpdate:async(data)=>{
    set({isUpdatingProfile: true});
      try{
        const res = await axiosIntance.put("/auth/update-profile",data);
        set({authUser: res.data});
        toast.success("Profile updated successfully");
      }catch(error){
        toast.error(error.response.data.message);
      }finally{
        set({isUpdatingProfile: false});
      }
  },

  connectSocket: () => {
    const {authUser} = get();
    if(!authUser || get().socket?.connected) return;

    const socket = io(BASE_URL, {
      query: {
        userId: authUser._id,
      }
    });
    
    socket.connect();
    set({socket: socket});
    
    socket.on('getOnlineUsers', (userIds) => {
      set({onlineUsers: userIds})
    });

    socket.on("chatCleared", (data) => {
      const { senderId } = data;
      const { selectedUser, setMessages } = useChatStore.getState();
      
      // If the current selected chat is the one being cleared
      if (selectedUser && selectedUser._id === senderId) {
        setMessages([]);
        toast.info(`${selectedUser.fullName} cleared the chat`);
      }
    });
    // Set up video call event listeners
    socket.on('incomingCall', ({ from, name, signalData, avatar }) => {
      console.log("Incoming call received from:", name, from);
      set({ 
        incomingCall: { 
          from, 
          name, 
          signal: signalData,
          avatar,
          to: socket.id
        } 
      });

      try {
        const audio = new Audio('/call-ringtone.mp3'); 
        audio.loop = true;
        audio.play().catch(e => console.log('Audio play error:', e));
        
        window.incomingCallAudio = audio;
      } catch (error) {
        console.log("Error playing ringtone:", error);
      }
    });

    socket.on('callAccepted', (data) => {
      console.log("Call accepted by remote user", data);
      
      // This will be picked up by the caller's CallScreen component
      if (window.incomingCallAudio) {
        window.incomingCallAudio.pause();
        window.incomingCallAudio = null;
      }
    });
    
    socket.on('callEnded', () => {
      // Stop ringtone if playing
      if (window.incomingCallAudio) {
        window.incomingCallAudio.pause();
        window.incomingCallAudio = null;
      }
      
      set({ incomingCall: null });
    });
    
    socket.on('callDeclined', () => {
      toast.info('Call was declined');
      
      // Stop ringtone if playing
      if (window.incomingCallAudio) {
        window.incomingCallAudio.pause();
        window.incomingCallAudio = null;
      }
    });
  },

  disconnectSocket: ()=>{
     if(get().socket?.connected){
        get().socket.disconnect();
     }
  },

  acceptCall: () => {
    const { incomingCall, socket } = get();
    
    if (!incomingCall || !socket) {
      console.error("Cannot accept call: missing data", { incomingCall, socketConnected: !!socket?.connected });
      return;
    }
    
    console.log("Accepting call from:", incomingCall.name);
    
    // Send the acceptCall event to the caller
    socket.emit('acceptCall', {
      signal: incomingCall.signal, // Echo back the signal for confirmation
      to: incomingCall.from
    });
    
    // Stop ringtone
    if (window.incomingCallAudio) {
      window.incomingCallAudio.pause();
      window.incomingCallAudio = null;
    }
  },
  
  declineCall: () => {
    const { incomingCall, socket } = get();
    
    if (incomingCall && socket && socket.connected) {
      console.log("Declining call from:", incomingCall.name);
      socket.emit('callDeclined', { to: incomingCall.from });
      
      // Stop ringtone
      if (window.incomingCallAudio) {
        window.incomingCallAudio.pause();
        window.incomingCallAudio = null;
      }
      
      set({ incomingCall: null });
    }
  },
  setBlockedUsers: (blockedUsers) => set({ blockedUsers }),

}))