"use client"

import type React from "react"
import { useState, useEffect, useCallback } from "react"
import { DndContext, DragOverlay, useDraggable, useDroppable, pointerWithin } from "@dnd-kit/core"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { socket } from "@/socket"

const GRID_SIZE = 5
const TOTAL_NUMBERS = GRID_SIZE * GRID_SIZE

type Props = {
  userName: string
  roomName: string
  opponentName: string
}

const DraggableNumber = ({ number }: { number: number }) => {
  const { attributes, listeners, setNodeRef, transform } = useDraggable({
    id: `number-${number}`,
    data: { number },
  })

  const style = transform
    ? {
      transform: `translate3d(${transform.x}px, ${transform.y}px, 0)`,
    }
    : undefined

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...listeners}
      {...attributes}
      className="w-7 h-7 flex items-center justify-center bg-gradient-to-br from-purple-500 to-pink-500 text-white rounded-full cursor-move text-sm font-bold shadow-md transition-transform hover:scale-110"
    >
      {number}
    </div>
  )
}

const DroppableCell = ({
  rowIndex,
  colIndex,
  children,
  isOver,
}: {
  rowIndex: number
  colIndex: number
  children: React.ReactNode
  isOver?: boolean
}) => {
  const { setNodeRef, isOver: cellIsOver } = useDroppable({
    id: `cell-${rowIndex}-${colIndex}`,
    data: { rowIndex, colIndex },
  })

  return (
    <div
      ref={setNodeRef}
      className={`border ${cellIsOver ? "border-yellow-400" : "border-purple-300"} 
        rounded-md flex items-center justify-center aspect-square bg-white shadow-sm`}
    >
      {children}
    </div>
  )
}

const BingoBoard: React.FC<Props> = ({ userName, roomName, opponentName }) => {
  const [numbers, setNumbers] = useState<number[]>([])
  const [board, setBoard] = useState<(number | null)[][]>(
    Array(GRID_SIZE)
      .fill(null)
      .map(() => Array(GRID_SIZE).fill(null)),
  )
  const [isComplete, setIsComplete] = useState(false)
  const [isStarted, setIsStarted] = useState(false)
  const [currentNumber, setCurrentNumber] = useState<number | null>(null)
  const [isConnected, setIsConnected] = useState(socket.connected)
  const [selectedNumbers, setSelectedNumbers] = useState<number[]>([])
  const [winnerIs, setWinnerIs] = useState("")
  const [userTurn, setUserTurn] = useState("")
  const [draggedNumber, setDraggedNumber] = useState<number | null>(null)
  const [activeDroppable, setActiveDroppable] = useState<string | null>(null)
  const [isWaiting, setIsWaiting] = useState(false)
  const [bingoNumber, setBingoNumber] = useState<number>(0)
  const [opponentBingoNumber, setOpponentBingoNumber] = useState<number>(0)
  const [completedLines, setCompletedLines] = useState<string[]>([])

  // useEffect(() => {
  //   const randomNumber = Math.floor(Math.random() * 100) + 1
  //   if (randomNumber > 5) {
  //     alert("opponents " + opponentName + "is ready")
  //     setUserTurn(opponentName)
  //   } else {
  //     alert("your " + opponentName + "is ready")
  //     setUserTurn(userName)
  //   }
  // }, [isStarted])
  // Added userName to dependencies
  useEffect(() => {
    function onConnect() {
      setIsConnected(true)
    }

    function onDisconnect() {
      setIsConnected(false)
    }

    socket.on("connect", onConnect)
    socket.on("disconnect", onDisconnect)

    return () => {
      socket.off("connect", onConnect)
      socket.off("disconnect", onDisconnect)
    }
  }, [])

  useEffect(() => {
    setNumbers(Array.from({ length: TOTAL_NUMBERS }, (_, i) => i + 1).sort(() => Math.random() - 0.5))
  }, [])

  const handleDragStart = (event: any) => {
    const { active } = event
    setDraggedNumber(Number.parseInt(active.id.split("-")[1]))
  }

  const handleDragOver = (event: any) => {
    const { over } = event
    setActiveDroppable(over?.id || null)
  }

  const handleDragEnd = (event: any) => {
    const { over } = event
    setDraggedNumber(null)
    setActiveDroppable(null)

    if (over && over.id.startsWith("cell-")) {
      const { rowIndex, colIndex } = over.data.current

      if (board[rowIndex][colIndex] === null) {
        const newBoard = [...board]
        newBoard[rowIndex][colIndex] = draggedNumber
        setBoard(newBoard)

        setNumbers((prevNumbers) => prevNumbers.filter((n) => n !== draggedNumber))
      }
    }
  }

  useEffect(() => {
    setIsComplete(board.every((row) => row.every((cell) => cell !== null)))
  }, [board])

  const handleStart = () => {
    setIsWaiting(true)
    socket.emit("ready_to_start", { userName, roomName })
  }

  const callNumber = (val: number) => {
    if (!isStarted || userTurn !== userName) {
      return
    }

    const newMsg = { userName, roomName, number: val }
    socket.emit("send_number", newMsg)
    setSelectedNumbers((prev) => {
      const newSelectedNumbers = [...prev, val]
      const newBingoNumber = checkForCompletedLines(newSelectedNumbers, bingoNumber)
      setBingoNumber(newBingoNumber)
      return newSelectedNumbers
    })

    setUserTurn(opponentName) // Set turn to opponent immediately after player's move
  }

  const callAutomaticNumber = () => {
    if (isStarted) {
      return
    }

    // Create array of numbers 1 to TOTAL_NUMBERS and shuffle it
    const shuffledNumbers = Array.from({ length: TOTAL_NUMBERS }, (_, i) => i + 1).sort(() => Math.random() - 0.5)

    // Create new board and fill it with shuffled numbers
    const newBoard = Array(GRID_SIZE)
      .fill(null)
      .map(() => Array(GRID_SIZE).fill(null))

    let numberIndex = 0
    for (let i = 0; i < GRID_SIZE; i++) {
      for (let j = 0; j < GRID_SIZE; j++) {
        newBoard[i][j] = shuffledNumbers[numberIndex]
        numberIndex++
      }
    }

    // Update the board and clear the numbers pool
    setBoard(newBoard)
    setNumbers([])
    setIsComplete(true)
  }

  useEffect(() => {
    function onWaitingForOpponent() {
      // setIsWaiting(true)
    }

    function onGameStart() {
      alert("Game started")
      setIsWaiting(false)
      setIsStarted(true)
      const randomNumber = Math.floor(Math.random() * 10) + 1
    if (randomNumber > 5) {
      // alert("opponents " + opponentName + "is ready")
      setUserTurn(opponentName)
    } else {
      // alert("your " + opponentName + "is ready")
      setUserTurn(userName)
    }
    }

    socket.on("waiting_for_opponent", onWaitingForOpponent)
    socket.on("game_start", onGameStart)

    return () => {
      socket.off("waiting_for_opponent", onWaitingForOpponent)
      socket.off("game_start", onGameStart)
    }
  }, [])

  const checkForCompletedLines = useCallback(
    (numbers: number[], currentBingoNumber: number) => {
      const newCompletedLines: string[] = []

      // Check rows
      board.forEach((row, rowIndex) => {
        if (row.every((cell) => numbers.includes(cell!))) {
          newCompletedLines.push(`row-${rowIndex}`)
        }
      })

      // Check columns
      for (let col = 0; col < GRID_SIZE; col++) {
        if (board.every((row) => numbers.includes(row[col]!))) {
          newCompletedLines.push(`col-${col}`)
        }
      }

      // Check main diagonal
      if (board.every((row, index) => numbers.includes(row[index]!))) {
        newCompletedLines.push("diag-main")
      }

      // Check anti-diagonal
      if (board.every((row, index) => numbers.includes(row[GRID_SIZE - 1 - index]!))) {
        newCompletedLines.push("diag-anti")
      }

      // Update state if new lines are completed
      const newLines = newCompletedLines.filter((line) => !completedLines.includes(line))
      if (newLines.length > 0) {
        setCompletedLines((prev) => [...prev, ...newLines])
        return currentBingoNumber + newLines.length
      }

      return currentBingoNumber
    },
    [board, completedLines],
  )

  useEffect(() => {
    function onReceiveNumber({
      userName: senderName,
      number,
      roomName: room,
    }: { userName: string; number: number; roomName: string }) {
      console.log(`Received number: ${number} by ${senderName} in room ${room}`)
      setCurrentNumber(number)


      setSelectedNumbers((prev) => {
        const newSelectedNumbers = [...prev, number]
        const newBingoNumber = checkForCompletedLines(newSelectedNumbers, bingoNumber)
        setBingoNumber(newBingoNumber)
        return newSelectedNumbers
      })
      // alert(`${userName} and ${opponentName} has called ${number}`)
       // Set turn to opponent after player's move
      if (senderName === userName) {
        setUserTurn(opponentName)       
      }
      else{
        setUserTurn(userName)
      }

    }

    socket.on("receive_number", onReceiveNumber)

    return () => {
      socket.off("receive_number", onReceiveNumber)
    }
  }, [userName, opponentName, checkForCompletedLines, bingoNumber,opponentBingoNumber])

  useEffect(() => {
    if (bingoNumber >= 5) {
      socket.emit("game_over", { userName, roomName })
      // Here you can add any additional logic for when a player wins
    } 
  }, [bingoNumber, opponentBingoNumber])

  useEffect(() => {
    function onWinnerIs(userName: string) {
      // alert(userName + " is the winner")
      setWinnerIs(userName)
      setIsStarted(false)
    }

    socket.on("winner_is", onWinnerIs)

    return () => {
      socket.off("winner_is", onWinnerIs)
    }
  },[])

  return (
    <Card className="w-full max-w-sm mx-auto p-3 space-y-3 bg-white/80 backdrop-blur-sm shadow-xl">
      <div className="">
        <div className="flex items-center gap-1 justify-center">
          
          {["B", "I", "N", "G", "O"].map((letter, index) => (
            <h1
              key={letter}
              className={`text-2xl font-bold ${index < bingoNumber ? "text-green-500" : "text-gray-700"}`}
            >
              {letter}
            </h1>
          ))}
        </div>       
      </div>
      {winnerIs && (
      <div className="flex items-center justify-between">
        <h2 className="font-bold text-lg from-pink-600 via-blue-600 to-cyan-600 bg-gradient-to-br text-transparent bg-clip-text uppercase"> 
          {winnerIs===userName ? "YOU WIN" : "YOU LOSE"}
        </h2>
        <Button onClick={() => window.location.reload()}>Play Again</Button>
      </div>
        
      )}
      <h2 className="font-bold text-lg flex gap-2 justify-center items-center uppercase">
        <span className="bg-gradient-to-r from-cyan-500 via-purple-500 to-red-500 text-transparent bg-clip-text">
          {userName}
        </span>{" "}
        vs{" "}
        <span className="bg-gradient-to-r from-teal-500 via-purple-500 to-pink-500 text-transparent bg-clip-text">
          {opponentName ? opponentName : "Waiting..."}
        </span>
      </h2>
      <DndContext
        onDragStart={handleDragStart}
        onDragOver={handleDragOver}
        onDragEnd={handleDragEnd}
        collisionDetection={pointerWithin}
      >
        {!isStarted && (
          <div className="flex flex-wrap justify-center gap-1 p-2 bg-purple-100 rounded-lg shadow-inner">
            {numbers.map((number) => (
              <DraggableNumber key={number} number={number} />
            ))}
          </div>
        )}
        <div className="grid grid-cols-5 gap-0.5 aspect-square bg-purple-200 p-1 rounded-lg shadow-inner">
          {board.map((row, rowIndex) =>
            row.map((cell, colIndex) => (
              <DroppableCell
                key={`cell-${rowIndex}-${colIndex}`}
                rowIndex={rowIndex}
                colIndex={colIndex}
                isOver={activeDroppable === `cell-${rowIndex}-${colIndex}`}
              >
                {cell !== null && (
                  <button
                    className={`w-full h-full flex items-center justify-center 
                                text-white rounded-md font-bold ${selectedNumbers.includes(cell) ? "bg-gradient-to-br from-lime-200 to-green-400" : "bg-gradient-to-br from-purple-500 to-pink-500"}`}
                    disabled={selectedNumbers.includes(cell) || !isStarted || userTurn === opponentName}
                    onClick={() => callNumber(cell)}
                  >
                    {cell}
                  </button>
                )}
              </DroppableCell>
            )),
          )}
        </div>
        <DragOverlay>{draggedNumber ? <DraggableNumber number={draggedNumber} /> : null}</DragOverlay>
      </DndContext>
      {isWaiting ? (
        <Button
          disabled={isWaiting}
          className="w-full font-bold py-2 px-4 rounded-full shadow-md transition-all duration-200 ease-in-out transform hover:scale-105 bg-gray-300 text-gray-500 cursor-not-allowed"
        >
          Waiting for opponent..
        </Button>
      ) : isStarted ? (
        <div className="text-center space-y-2">
          <p className="text-lg font-semibold text-purple-800">Current Number:</p>
          <div className="w-14 h-14 mx-auto flex items-center justify-center bg-gradient-to-br from-yellow-400 to-orange-500 text-white rounded-full text-2xl font-bold shadow-lg">
            {currentNumber}
          </div>
          <Button
            className={`w-full font-bold py-2 px-4 rounded-full shadow-md transition-all duration-200 ease-in-out transform hover:scale-105 
              ${userTurn === userName
                ? "bg-gradient-to-r from-green-400 to-blue-500 hover:from-green-500 hover:to-blue-600 text-white"
                : "bg-gray-300 text-gray-500 cursor-not-allowed"
              }`}
            disabled={userTurn === opponentName}
          >
            {userTurn !== opponentName ? "Your Turn" : "Opponent's Turn"}
          </Button>
        </div>
      ) : (
        <div>
          <Button
            onClick={handleStart}
            disabled={!isComplete || !opponentName}
            className={`w-full font-bold py-2 px-4 rounded-full shadow-md transition-all duration-200 ease-in-out transform hover:scale-105 ${isComplete
              ? "bg-gradient-to-r from-green-400 to-blue-500 hover:from-green-500 hover:to-blue-600 text-white"
              : "bg-gray-300 text-gray-500 cursor-not-allowed"
              }`}
          >
            {opponentName && isComplete && "Start Game"}
            {!opponentName && "Waiting for opponent.."}
            {!isComplete && "Fill all cells to start"}
          </Button>
          {!isComplete && (
            <Button disabled={!opponentName} onClick={callAutomaticNumber} className="w-full mt-2">
              {!opponentName ? "Waiting for opponent..." : "Automatic Fill Number"}
            </Button>
          )}
        </div>
      )}
    </Card>
  )
}

export default BingoBoard

