import BingoBoard from "./BingoBoard"
import Background from "./components/Background"

export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-4 relative">
      <Background />
      <BingoBoard />
    </main>
  )
}

