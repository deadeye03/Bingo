import Background from "@/components/Background";
import BingoRoom from "@/components/BingoRoom";


export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center md:justify-center  px-4 md:p-4 relative">
      <Background/>
      <BingoRoom/>
    </main>
  )
}

