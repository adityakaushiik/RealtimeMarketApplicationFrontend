import {
    Card,
    CardAction,
    CardContent,
    CardDescription,
    CardFooter,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
import Chart from "@/shared/Components/Chart";
import { ChannelNames } from "@/shared/CommonConstants";
import { useWebSocketStore } from "@/shared/services/websocketService";
import { useEffect } from 'react';


export function StockPage() {


    const { isConnected, connect } = useWebSocketStore();

    useEffect(() => {
        connect('ws://localhost:8000/ws', true); // Connect to WebSocket
    }, [connect]);

    useEffect(() => {
        if (isConnected) {
            for (const channel of ChannelNames) {
                useWebSocketStore.getState().sendMessage({ message_type: 'subscribe', channel: channel });
            }
        }
    }, [isConnected]);



    return (
        <div>
            {
                ChannelNames.map((channel) => (
                    <div key={channel} className="mb-4">
                        <Card>
                            <CardHeader>
                                <CardTitle>{channel}</CardTitle>
                                <CardDescription>Updated: {Date.now()}</CardDescription>
                            </CardHeader>
                            <CardContent>
                                <Chart symbol={channel} />
                            </CardContent>
                            <CardFooter>
                                <CardDescription>Updated: {Date.now()}</CardDescription>
                            </CardFooter>
                        </Card>
                    </div>
                ))
            }
        </div>
    );
}