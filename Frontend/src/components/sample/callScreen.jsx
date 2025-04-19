import React, { useEffect, useRef, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import SimplePeer from 'simple-peer';
import { useAuthStore } from '../../store/useAuthStore';
import toast from 'react-hot-toast';
import { X, Mic, MicOff, Camera, CameraOff, PhoneOff } from 'lucide-react';

function CallScreen() {
  const { roomID } = useParams();
  const navigate = useNavigate();
  
  const { socket, authUser, onlineUsers, incomingCall } = useAuthStore();

  const myVideoRef = useRef();
  const peerVideoRef = useRef();
  const connectionRef = useRef();

  const [stream, setStream] = useState(null);
  const [callStatus, setCallStatus] = useState('initializing'); // initializing, connecting, ongoing, ended
  const [isCallAccepted, setIsCallAccepted] = useState(false);
  const [isMicMuted, setIsMicMuted] = useState(false);
  const [isCameraOff, setIsCameraOff] = useState(false);
  const [permissionError, setPermissionError] = useState(false);
  const [callerInfo, setCallerInfo] = useState(null);

  // Debug logging
  useEffect(() => {
    console.log("CallScreen mounted with roomID:", roomID);
    console.log("Current socket ID:", socket?.id);
    console.log("Incoming call data:", incomingCall);
    
    // Cleanup when component unmounts
    return () => {
      console.log("CallScreen unmounting, cleaning up");
    };
  }, []);

  // Get user's media stream
  useEffect(() => {
    const getMediaStream = async () => {
      try {
        console.log("Requesting media stream...");
        
        // Request media directly - this will prompt for permissions if needed
        const mediaStream = await navigator.mediaDevices.getUserMedia({ 
          video: true, 
          audio: true 
        });
        
        console.log("Media stream obtained successfully");
        setStream(mediaStream);
        
        if (myVideoRef.current) {
          myVideoRef.current.srcObject = mediaStream;
        }
        
        setCallStatus('connecting');
      } catch (error) {
        console.error('Error accessing media devices:', error);
        
        // Handle different types of errors
        if (error.name === 'NotAllowedError') {
          setPermissionError(true);
          toast.error('Camera or microphone permission denied. Please allow access in your browser settings.');
        } else if (error.name === 'NotFoundError') {
          // Try audio only as fallback
          try {
            const audioOnlyStream = await navigator.mediaDevices.getUserMedia({ 
              video: false, 
              audio: true 
            });
            setStream(audioOnlyStream);
            setIsCameraOff(true);
            toast.warning('Camera not found. Proceeding with audio only.');
            setCallStatus('connecting');
          } catch (audioError) {
            setPermissionError(true);
            toast.error('No media devices available. Please check your hardware connections.');
          }
        } else {
          setPermissionError(true);
          toast.error(`Failed to access media: ${error.message}`);
        }
      }
    };

    getMediaStream();

    // Cleanup function
    return () => {
      console.log("Cleaning up media stream");
      if (stream) {
        stream.getTracks().forEach(track => {
          console.log("Stopping track:", track.kind);
          track.stop();
        });
      }
      if (connectionRef.current) {
        console.log("Destroying peer connection");
        connectionRef.current.destroy();
      }
    };
  }, []);

  // Handle socket events and call setup
  useEffect(() => {
    if (!socket || !stream) {
      console.log("Waiting for socket and stream to be ready...");
      return;
    }
    
    console.log("Socket and stream ready, setting up call handling");

    // Parse roomID to determine if we're the caller or callee
    const [firstPart, secondPart] = roomID.split('-');
   
    
    
    // Handle call accepted - for the caller
    socket.on('callAccepted', ({ signal }) => {
      console.log("Call accepted with signal", !!signal);
      if (connectionRef.current) {
        connectionRef.current.signal(signal);
        setIsCallAccepted(true);
        setCallStatus('ongoing');
        toast.success('Call connected');
      } else {
        console.error("Peer connection not initialized when receiving callAccepted");
      }
    });

    // Handle call declined - for the caller
    socket.on('callDeclined', () => {
      toast.error('Call declined');
      navigate('/');
    });

    // Handle call ended - for both parties
    socket.on('callEnded', () => {
      toast.error('Call ended by the other user');
      endCall(false); // Don't send the end call event again
    });
    
    const isCaller = firstPart  === socket.id;
    const isReceiver = !isCaller;
    
    const otherPersonId = isCaller ? secondPart : firstPart;
    // If we have a stored incoming call, use that data
    if (isReceiver && incomingCall && incomingCall.from === callerId) {
      console.log("We are the receiver with stored incoming call data");
      setCallerInfo({
        id: incomingCall.from,
        name: incomingCall.name,
        avatar: incomingCall.avatar
      });
      
      // Answer the call with the stored signal
      answerCall(incomingCall.signal, incomingCall.from);
    }
    // If we're the caller, initiate the call
    else if (isCaller) {
      
      initiateCall(otherPersonId);
    }
    // If we're the receiver but don't have stored data
    else if (isReceiver) {
      console.log("We are the receiver but don't have incoming call data, listening for it");
      
      // We're receiving the call but don't have stored data, listen for it
      socket.on('incomingCall', ({ signal, from, name, avatar }) => {
        console.log("Received incomingCall event during call", { from, signal: !!signal });
        if (from === firstPart) {
          setCallerInfo({
            id: from,
            name: name,
            avatar: avatar
          });
          answerCall(signal, from);
        }
      });
    }

    return () => {
      console.log("Cleaning up socket listeners");
      socket.off('callAccepted');
      socket.off('callDeclined');
      socket.off('callEnded');
      socket.off('incomingCall');
    };
  }, [socket, stream, roomID, navigate, incomingCall]);


  const initiateCall = (receiverId) => {
    if (!socket || !socket.connected || !stream) {
      toast.error('Connection not ready. Please try again.');
      navigate('/');
      return;
    }

    try {
      console.log("Creating peer as initiator for receiver:", receiverId);
      const peer = new SimplePeer({
        initiator: true,
        trickle: false,
        stream: stream
      });

      peer.on('signal', (data) => {
        console.log("Peer generated signal as initiator", !!data);
        if (socket && socket.connected) {
          console.log("Emitting callUser event to:", receiverId);
          socket.emit('callUser', {
            userToCall: receiverId,
            signalData: data,
            from: socket.id,
            name: authUser?.fullName || 'User',
            avatar: authUser?.profilePic || '/avatar.png'
          });
        }
      });

      peer.on('stream', (remoteStream) => {
        console.log("Received remote stream from peer");
        if (peerVideoRef.current) {
          peerVideoRef.current.srcObject = remoteStream;
        }
      });

      peer.on('connect', () => {
        console.log("Peer connection established");
        setCallStatus('ongoing');
        setIsCallAccepted(true);
      });

      peer.on('error', (err) => {
        console.error('Peer error:', err);
        toast.error('Call connection error');
        navigate('/');
      });

      connectionRef.current = peer;
    } catch (err) {
      console.error('Error creating peer:', err);
      toast.error('Failed to establish connection');
      navigate('/');
    }
  };


  const answerCall = (incomingSignal, from) => {
    if (!socket || !socket.connected || !stream) {
      toast.error('Connection not ready. Please try again.');
      navigate('/');
      return;
    }

    try {
      console.log("Creating peer as receiver for caller:", from);
      const peer = new SimplePeer({
        initiator: false,
        trickle: false,
        stream: stream
      });

      peer.on('signal', (data) => {
        console.log("Peer generated signal as receiver", !!data);
        if (socket && socket.connected) {
          console.log("Emitting answerCall event to:", from);
          socket.emit('answerCall', { signal: data, to: from });
        }
      });

      peer.on('stream', (remoteStream) => {
        console.log("Received remote stream from peer");
        if (peerVideoRef.current) {
          peerVideoRef.current.srcObject = remoteStream;
        }
      });

      peer.on('connect', () => {
        console.log("Peer connection established");
        setCallStatus('ongoing');
      });

      peer.on('error', (err) => {
        console.error('Peer error:', err);
        toast.error('Call connection error');
        navigate('/');
      });

      console.log("Signaling to peer with incoming data");
      peer.signal(incomingSignal);
      connectionRef.current = peer;
      setIsCallAccepted(true);
      setCallStatus('ongoing');
    } catch (err) {
      console.error('Error answering call:', err);
      toast.error('Failed to answer call');
      navigate('/');
    }
  };

  const endCall = (sendEvent = true) => {
    console.log("Ending call, sendEvent:", sendEvent);
    
    if (connectionRef.current) {
      console.log("Destroying peer connection");
      connectionRef.current.destroy();
    }
    
    if (sendEvent && roomID && socket && socket.connected) {
      const [firstPart, secondPart] = roomID.split('-');
      const isCaller = firstPart === socket.id;

       const recipientId = isCaller ? secondPart : firstPart;
      
      console.log("Emitting endCall event to:", recipientId);
      socket.emit('endCall', { to: recipientId });
    }
    
    if (stream) {
      console.log("Stopping all media tracks");
      stream.getTracks().forEach(track => {
        track.stop();
      });
    }
    
    // Clear the incoming call from store if it exists
    const store = useAuthStore.getState();
    if (store.incomingCall) {
      console.log("Clearing incoming call data from store");
      useAuthStore.setState({ incomingCall: null });
    }
    
    toast.error('Call ended');
    navigate('/');
  };

  const toggleMicrophone = () => {
    if (stream) {
      const audioTracks = stream.getAudioTracks();
      if (audioTracks.length === 0) {
        toast.error('No microphone available');
        return;
      }
      audioTracks.forEach(track => {
        track.enabled = !track.enabled;
      });
      setIsMicMuted(!isMicMuted);
    }
  };

  const toggleCamera = () => {
    if (stream) {
      const videoTracks = stream.getVideoTracks();
      if (videoTracks.length === 0) {
        toast.error('No camera available');
        return;
      }
      videoTracks.forEach(track => {
        track.enabled = !track.enabled;
      });
      setIsCameraOff(!isCameraOff);
    }
  };

  if (permissionError) {
    return (
      <div className="flex flex-col h-screen bg-gray-900 text-white p-8">
        <div className="bg-red-600/20 border border-red-600 rounded-lg p-6 max-w-md mx-auto mt-16">
          <h2 className="text-xl font-medium mb-4">Camera/Microphone Access Required</h2>
          <p className="mb-4">
            We need permission to access your camera and microphone for video calls.
            Your browser has previously denied these permissions.
          </p>
          <div className="mb-6 p-4 bg-gray-800 rounded-lg">
            <h3 className="text-lg font-medium mb-2">How to enable permissions:</h3>
            <ul className="list-disc list-inside space-y-2">
              <li><strong>Chrome:</strong> Click the padlock icon in the address bar → Site settings → Reset permissions</li>
              <li><strong>Firefox:</strong> Click the shield icon in the address bar → Connection secure → More information → Permissions</li>
              <li><strong>Safari:</strong> Click Safari menu → Preferences → Websites → Camera/Microphone</li>
              <li><strong>Edge:</strong> Click the padlock icon in the address bar → Site permissions → Reset permissions</li>
            </ul>
          </div>
          <div className="mt-6 flex gap-4">
            <button 
              onClick={() => navigate('/')}
              className="px-4 py-2 bg-gray-700 rounded hover:bg-gray-600"
            >
              Return Home
            </button>
            <button 
              onClick={() => window.location.reload()}
              className="px-4 py-2 bg-blue-600 rounded hover:bg-blue-500"
            >
              Try Again
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-screen bg-gray-900">
      {/* Header */}
      <div className="bg-gray-800 text-white p-4 flex justify-between items-center">
        <h2 className="text-xl font-medium">
          {callStatus === 'initializing' ? 'Initializing...' : 
           callStatus === 'connecting' ? 'Connecting...' : 
           callerInfo ? `Call with ${callerInfo.name}` : 'Video Call'}
        </h2>
        <button 
          onClick={() => endCall()}
          className="p-2 rounded-full hover:bg-gray-700"
        >
          <X size={24} />
        </button>
      </div>
      
      {/* Video container */}
      <div className="flex-1 flex flex-col md:flex-row p-4 gap-4 relative overflow-hidden">
        {/* My video (small) */}
        <div className="absolute bottom-20 right-4 w-1/4 md:w-1/5 aspect-video z-10 rounded-lg overflow-hidden border-2 border-blue-500 bg-black">
          <video 
            ref={myVideoRef} 
            autoPlay 
            playsInline 
            muted 
            className="w-full h-full object-cover"
          />
          {isCameraOff && (
            <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-70 text-white">
              <Camera size={24} />
            </div>
          )}
        </div>
        
        {/* Peer video (main) */}
        <div className="flex-1 rounded-lg overflow-hidden bg-black flex items-center justify-center">
          {isCallAccepted ? (
            <video 
              ref={peerVideoRef} 
              autoPlay 
              playsInline 
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="text-white text-center">
              <div className="animate-pulse mb-2">
                {callStatus === 'connecting' ? 'Connecting...' : 'Waiting for connection...'}
              </div>
              <div className="w-16 h-16 mx-auto rounded-full bg-blue-500 flex items-center justify-center">
                <Camera size={32} />
              </div>
            </div>
          )}
        </div>
      </div>
      
      {/* Controls */}
      <div className="bg-gray-800 p-4 flex justify-center items-center gap-4">
        <button 
          onClick={toggleMicrophone}
          className={`p-4 rounded-full ${isMicMuted ? 'bg-red-500' : 'bg-gray-700'} text-white`}
          disabled={!stream || stream.getAudioTracks().length === 0}
        >
          {isMicMuted ? <MicOff size={24} /> : <Mic size={24} />}
        </button>
        
        <button 
          onClick={() => endCall()}
          className="p-4 rounded-full bg-red-600 text-white"
        >
          <PhoneOff size={24} />
        </button>
        
        <button 
          onClick={toggleCamera}
          className={`p-4 rounded-full ${isCameraOff ? 'bg-red-500' : 'bg-gray-700'} text-white`}
          disabled={!stream || stream.getVideoTracks().length === 0}
        >
          {isCameraOff ? <CameraOff size={24} /> : <Camera size={24} />}
        </button>
      </div>
    </div>
  );
}

export default CallScreen;