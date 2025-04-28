import React, { useEffect, useState } from 'react'
import { useChatStore } from '../store/useChatStore'
import Sidebar from '../components/sample/sidebar'
import ChatContainer from '../components/sample/ChatContainer'
import NoChatSelected from '../components/sample/NoChatSelected'
import { ChevronLeft } from 'lucide-react'

const HomePage = () => {
  const {selectedUser, setSelectedUser} = useChatStore()
  const [isMobileView, setIsMobileView] = useState(false)
  
  useEffect(() => {
    const checkScreenSize = () => {
      setIsMobileView(window.innerWidth < 768) 
    }
      checkScreenSize()
      window.addEventListener('resize', checkScreenSize)
      return () => window.removeEventListener('resize', checkScreenSize)
    }, [])

    const handleBackToSidebar = () => {
      if (isMobileView) {
        setSelectedUser(null)
      }
    }
    return (
      <div className='h-screen bg-base-200'>
        <div className='flex items-center justify-center pt-20 px-4'>
          <div className='bg-base-100 rounded-lg shadow-lg w-full max-w-6xl h-[calc(100vh-8rem)]'>
            <div className='flex h-full rounded-lg overflow-hidden'>
              {/* Show sidebar when no user is selected OR we're not in mobile view */}
              {(!selectedUser || !isMobileView) && (
                <div className={`${isMobileView && !selectedUser ? 'w-full' : ''}`}>
                  <Sidebar />
                </div>
              )}
  
              {/* Show chat or no chat selected based on selection state */}
              {selectedUser ? (
                <div className="flex-1 flex flex-col">
                  {isMobileView && (
                    <button 
                      onClick={handleBackToSidebar}
                      className="flex items-center gap-2 p-2 bg-base-200 hover:bg-base-300"
                    >
                      <ChevronLeft size={20} />
                      <span>Back to chats</span>
                    </button>
                  )}
                  <ChatContainer />
                </div>
              ) : (
                !isMobileView && <NoChatSelected />
              )}
            </div>
          </div>
        </div>
      </div>
    )
}

export default HomePage