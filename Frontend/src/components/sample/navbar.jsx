import React,{useEffect} from 'react'
import { useAuthStore } from '../../store/useAuthStore'
import { Link } from "react-router-dom";
import { Settings, User, LogOut } from 'lucide-react';
import { useAuth0 } from '@auth0/auth0-react';

const Navbar = () => {
  const { logout: storeLogout, authUser, authProvider  } = useAuthStore();
  const { logout: auth0Logout, isAuthenticated  } = useAuth0();

  useEffect(() => {
    if (!authUser && isAuthenticated) {
      auth0Logout({ returnTo: window.location.origin });
    }
  }, [authUser, isAuthenticated, auth0Logout]);

  const handleLogout = () => {
    storeLogout(auth0Logout);
};
    return (
        <header className='bg-base-100 fixed w-full top-0 z-40'>
          <div className='container mx-auto px-4 h-16'>
            <div className='flex items-center justify-between h-full'>
              <div className='flex items-center gap-8'>
                <Link to="/" className="flex items-center gap-2.5 hover:opacity-80 transition-all">
                  <h1 className='text-2xl font-bold '>F L I C K</h1>
                </Link>
              </div>
              <div className='flex items-center gap-4'>
                <Link 
                  to="/settings" 
                  className="btn btn-ghost btn-sm  "
                  title="Settings"
                >
                  <Settings size={25} />
                </Link>
                {authUser && (<Link 
                  to="/profile" 
                  className="btn btn-ghost btn-sm p-2 "
                  title="Profile"
                >
                  <User size={20} />
                </Link>
                )}
                {authUser && (<button 
                  className="btn btn-ghost btn-sm p-2 "
                  title="Logout"
                  onClick={handleLogout}
                >
                  <LogOut size={20} />
                </button>
                )}
              </div>
            </div>
          </div>
        </header>
      );
}

export default Navbar