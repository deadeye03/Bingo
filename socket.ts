"use client"

import { io } from "socket.io-client"

if(!process.env.NEXT_PUBLIC_BACKEND_API) throw new Error("NEXT_PUBLIC_BACKEND_API is not defined")

export const socket = io(process.env.NEXT_PUBLIC_BACKEND_API, {
  transports: ["websocket", "polling"],
})

