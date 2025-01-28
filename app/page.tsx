import Background from "@/components/Background";
import BingoBoard from "@/components/BingoBoard";
import BingoRoom from "@/components/BingoRoom";


export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-4 relative">
      <Background/>
      <BingoRoom/>
    </main>
  )
}

