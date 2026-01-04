export const WebSocketMessageType = {
    // Message Types from clients to server
    SUBSCRIBE: 1,
    UNSUBSCRIBE: 2,

    // Message Updates from server to clients
    SNAPSHOT: 10,
    UPDATE: 11,

    // Log Levels
    INFO: 100,
    ERROR: 101
}

export const ChannelNames = [
    "stocks:ASML.AS",
    "stocks:MC.PA",
    "stocks:SAP.DE",
    "stocks:NESN.SW",
];


export const UserRoles = {
    ADMIN: 1,
    USER: 2
}

export const UserStatus = {
    PENDING: 0,
    ACTIVE: 1,
    REJECTED: 2
}
