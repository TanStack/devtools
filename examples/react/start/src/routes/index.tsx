import { createFileRoute } from '@tanstack/react-router'
import logo from '../logo.svg'

export const Route = createFileRoute('/')({
  component: App,
  head() {
    return {
      meta: [
        { name: 'description', content: 'A basic example of using TanStack Devtools with React.' },
        { name: 'og:title', content: 'Basic Example - TanStack Devtools' },
        { name: 'og:description', content: 'A basic example of using TanStack Devtools with React.' },
        { name: 'og:image', content: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=800' },
        { name: 'og:url', content: 'https://example.com/basic' },
        { name: "twitter:title", content: "Basic Example - TanStack Devtools for twitter" },
        { name: "twitter:description", content: "A basic example of using TanStack Devtools with React and loading up the social previews" },
        { name: "twitter:image", content: "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=800" },
        { name: "twitter:url", content: "https://example.com/basic" },
      ]
    }
  }
})

function App() {
  return (
    <div className="text-center">
      <header className="min-h-screen flex flex-col items-center justify-center bg-[#282c34] text-white text-[calc(10px+2vmin)]">
        <img
          src={logo}
          className="h-[40vmin] pointer-events-none animate-[spin_20s_linear_infinite]"
          alt="logo"
        />
        <p>
          Edit <code>src/routes/index.tsx</code> and save to reload.
        </p>
        <a
          className="text-[#61dafb] hover:underline"
          href="https://reactjs.org"
          target="_blank"
          rel="noopener noreferrer"
        >
          Learn React
        </a>
        <a
          className="text-[#61dafb] hover:underline"
          href="https://tanstack.com"
          target="_blank"
          rel="noopener noreferrer"
        >
          Learn TanStack
        </a>
      </header>
    </div>
  )
}
