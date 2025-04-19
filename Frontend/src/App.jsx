import React, { useEffect } from 'react'
import { Navigate, Route, Routes } from 'react-router-dom'
import HomePage from './pages/HomePage'
import SignupPage from './pages/SignupPage'
import LoginPage from './pages/LoginPage'
import CallScreen from './components/sample/callScreen'
import SettingsPage from './pages/SettingsPage'
import UpdateProfile from './pages/ProfilePage'
import { useAuthStore } from './store/useAuthStore'
import { useThemeStore } from './store/useThemeStore'
import { AuthRoute, ProtectedRoute } from './lib/protect'
import {Toaster} from "react-hot-toast"
import Navbar from './components/sample/navbar'
import IncomingCallAlert from './components/sample/incomingCallAlert'

function App() {
    const {authUser,checkAuth, isCheckingAuth, onlineUsers, incomingCall, acceptCall, declineCall}  = useAuthStore();
    const {theme} = useThemeStore()

    console.log("onlineUsers",onlineUsers)
    useEffect(()=>{
        checkAuth()
    },[checkAuth]);

 return(
  <>
  <div data-theme={theme}>
  <Navbar/>
  
  {incomingCall && (
          <IncomingCallAlert 
            incomingCall={incomingCall} 
            onAccept={acceptCall} 
            onDecline={declineCall} 
          />
        )}
        
   <Routes>
    <Route path='/' element={<ProtectedRoute><HomePage /></ProtectedRoute>}/>
    <Route path='/call/:roomID' element={<ProtectedRoute><CallScreen /></ProtectedRoute>}/>
    <Route path='/signup' element={<AuthRoute><SignupPage /></AuthRoute>}/>
    <Route path='/login'  element={<AuthRoute><LoginPage /></AuthRoute>}/>
    <Route path='/settings' element={<SettingsPage />}/>
    <Route path='/profile' element={<ProtectedRoute><UpdateProfile /></ProtectedRoute>}/>
   </Routes>

   <Toaster
    position="top-center"
    reverseOrder={true}
    />
    </div>
  </>
 )
}

export default App


