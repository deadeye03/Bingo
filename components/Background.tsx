import type React from "react"

const Background: React.FC = () => {
  return (
    <div className="fixed inset-0 z-[-1]">
      <div className="absolute inset-0 bg-gradient-to-br from-purple-400 via-pink-500 to-red-500 opacity-50" />
      <div className="absolute inset-0 bg-[url('data:image/svg+xml;charset=utf-8,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20viewBox%3D%220%200%2032%2032%22%20width%3D%2232%22%20height%3D%2232%22%20fill%3D%22none%22%20stroke%3D%22%23fff%22%3E%3Cpath%20d%3D%22M0%2016h32M16%200v32%22%2F%3E%3C%2Fsvg%3E')] opacity-10" />
    </div>
  )
}

export default Background

