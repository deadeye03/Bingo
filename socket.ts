"use client"

import { io } from "socket.io-client"

if(!process.env.NEXT_PUBLIC_SOCKET_URL) throw new Error("NEXT_PUBLIC_SOCKET_URL is not defined")
  
export const socket = io(process.env.NEXT_PUBLIC_SOCKET_URL, {
  transports: ["websocket", "polling"],
})

