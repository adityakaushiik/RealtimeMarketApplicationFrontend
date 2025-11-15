import './App.css'
import Chart from './shared/Chart';
import { ChannelNames } from './shared/commonConstants';
import { useWebSocketStore } from './shared/websocketService';
import { useEffect } from 'react';

function App() {
    const { isConnected, connect } = useWebSocketStore();

    useEffect(() => {
        connect('ws://localhost:8000/ws',true); // Connect to WebSocket
    }, [connect]);
    
    useEffect(() => {
        if (isConnected) {
            for (const channel of ChannelNames) {
                useWebSocketStore.getState().sendMessage({ message_type: 'subscribe', channel: channel });
            }
        }
    }, [isConnected]);

    return (
        <div className='App container mx-auto p-4'>
            <Chart />
        </div>
    );
}

export default App;
