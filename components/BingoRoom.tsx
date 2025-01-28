"use client"
import React, { useEffect, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card"
import { socket } from "@/socket"
import BingoBoard from "./BingoBoard"

function BingoRoom() {
  const [userName, setUserName] = useState("")
  const [roomName, setRoomName] = useState("")
  const [error, setError] = useState("")
  const [boardVisible, setBoardVisible] = useState(false)
  const [opponentName, setOpponentName] = useState("")
  const [users, setUsers] = useState<string[]>([])

  const handleEnterRoom = () => {
    if (!userName || !roomName) {
      setError("Please enter username and room name")
      return
    }
    socket.emit("join_room", { userName, roomName })
    setBoardVisible(true)
  }

  useEffect(() => {
    function onRoomUsers(roomUsers: string[]) {
      setUsers(roomUsers)
      if (roomUsers.length === 2) {
        const opponent = roomUsers.find((user) => user !== userName)
        if (opponent) {
          setOpponentName(opponent)
        }
      }
    }

    socket.on("room_users", onRoomUsers)

    return () => {
      socket.off("room_users", onRoomUsers)
    }
  }, [userName])

  if (boardVisible) {
    return <BingoBoard userName={userName} roomName={roomName} opponentName={opponentName} />
  }

  return (
    <div className="flex items-center justify-center h-screen">
      <Card className="min-w-[400px]">
        <CardHeader>
          <CardTitle className="text-center bg-gradient-to-r from-cyan-500 via-purple-500 to-blue-500 text-transparent bg-clip-text text-2xl">
            Let's Revive Your Childhood
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col gap-4">
            <input
              type="text"
              placeholder="User Name"
              className="border border-gray-300 rounded-md p-2"
              onChange={(e) => {
                setUserName(e.target.value)
                setError("")
              }}
            />
            <input
              type="text"
              placeholder="Room Name"
              className="border border-gray-300 rounded-md p-2"
              onChange={(e) => {
                setRoomName(e.target.value)
                setError("")
              }}
            />
            {error && <p className="text-xs text-red-500">{error}</p>}
            <button
              className="bg-gradient-to-r from-cyan-500 via-purple-500 to-blue-500 text-white p-2 rounded-md"
              onClick={handleEnterRoom}
            >
              Enter Room
            </button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

export default BingoRoom

