import { createRoot } from 'react-dom/client'
import { createContext, useContext, useEffect, useState } from 'react'
import { createPortal } from 'react-dom'
import {
  QueryClient,
  QueryClientProvider,
  useQuery,
  useQueryClient,
} from '@tanstack/react-query'
import Devtools from './setup'
import { queryPlugin } from './plugin'
import { Button } from './button'
import { Feature } from './feature'

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      gcTime: 1000 * 60 * 60 * 24, // 24 hours
    },
  },
})

type Post = {
  id: number
  title: string
  body: string
}

function Posts({
  setPostId,
}: {
  setPostId: React.Dispatch<React.SetStateAction<number>>
}) {
  const queryClient = useQueryClient()
  const { status, data, error, isFetching } = usePosts()

  return (
    <div>
      <h1>Posts</h1>
      <div>
        {status === 'pending' ? (
          'Loading...'
        ) : status === 'error' ? (
          <span>Error: {error.message}</span>
        ) : (
          <>
            <div>
              {data.map((post) => (
                <p key={post.id}>
                  <a
                    onClick={() => setPostId(post.id)}
                    href="#"
                    style={
                      // We can access the query data here to show bold links for
                      // ones that are cached
                      queryClient.getQueryData(['post', post.id])
                        ? {
                            fontWeight: 'bold',
                            color: 'green',
                          }
                        : {}
                    }
                  >
                    {post.title}
                  </a>
                </p>
              ))}
            </div>
            <div>{isFetching ? 'Background Updating...' : ' '}</div>
          </>
        )}
      </div>
    </div>
  )
}

const getPostById = async (id: number): Promise<Post> => {
  const response = await fetch(
    `https://jsonplaceholder.typicode.com/posts/${id}`,
  )
  return await response.json()
}

function usePost(postId: number) {
  return useQuery({
    queryKey: ['post', postId],
    queryFn: () => getPostById(postId),
    enabled: !!postId,
  })
}

function Post({
  postId,
  setPostId,
}: {
  postId: number
  setPostId: React.Dispatch<React.SetStateAction<number>>
}) {
  const { status, data, error, isFetching } = usePost(postId)

  return (
    <div>
      <div>
        <a onClick={() => setPostId(-1)} href="#">
          Back
        </a>
      </div>
      {!postId || status === 'pending' ? (
        'Loading...'
      ) : status === 'error' ? (
        <span>Error: {error.message}</span>
      ) : (
        <>
          <h1>{data.title}</h1>
          <div>
            <p>{data.body}</p>
          </div>
          <div>{isFetching ? 'Background Updating...' : ' '}</div>
        </>
      )}
    </div>
  )
}
function usePosts() {
  return useQuery({
    queryKey: ['posts'],
    queryFn: async (): Promise<Array<Post>> => {
      const response = await fetch('https://jsonplaceholder.typicode.com/posts')
      return await response.json()
    },
  })
}

const Context = createContext<{
  count: number
  setCount: (count: number) => void
}>({ count: 0, setCount: () => {} })

setTimeout(() => {
  queryPlugin.emit('test', {
    title: 'Test Event',
    description:
      'This is a test event from the TanStack Query Devtools plugin.',
  })
}, 1000)

queryPlugin.on('test', (event) => {
  console.log('Received test event:', event)
})

function Mounted() {
  const c = useContext(Context)
  console.log(c)
  return (
    <p
      onClick={() => {
        c.setCount(c.count + 1)
      }}
    >
      {c.count}
      <hr />
    </p>
  )
}

function App() {
  const [state, setState] = useState(1)
  const [win, setWin] = useState<Window | null>(null)
  const [postId, setPostId] = useState(-1)
  const [value, setValue] = useState<any>({
    initial: 'value',
    should: 'change',
    in: 2,
    array: [1, 2, 3],
  })
  useEffect(() => {
    setTimeout(() => {
      setValue({ title: 'Test Event', description: 'This is a test event.' })
    }, 2000)
  }, [])
  return (
    <div>
      <Context.Provider value={{ count: state, setCount: setState }}>
        <QueryClientProvider client={queryClient}>
          <h1>TanStack Devtools React Basic Example</h1>
          current count: {state}
          <Button onClick={() => setState(state + 1)}>Click me</Button>
          <Button onClick={() => setWin(window.open('', '', 'popup'))}>
            Click me to open new window
          </Button>
          <tsd-json-tree value={value} />
          <tsd-button
            text="test"
            ghost={true}
            disabled
            value="test"
            variant="secondary"
            onClick={() => console.log('Button clicked!')}
          />
          {win && createPortal(<Mounted />, win.document.body)}
          <Feature />
          <p>
            As you visit the posts below, you will notice them in a loading
            state the first time you load them. However, after you return to
            this list and click on any posts you have already visited again, you
            will see them load instantly and background refresh right before
            your eyes!{' '}
            <strong>
              (You may need to throttle your network speed to simulate longer
              loading sequences)
            </strong>
          </p>
          {postId > -1 ? (
            <Post postId={postId} setPostId={setPostId} />
          ) : (
            <Posts setPostId={setPostId} />
          )}
          <Devtools />
        </QueryClientProvider>
      </Context.Provider>
    </div>
  )
}

const root = createRoot(document.getElementById('root')!)
root.render(<App />)
