import { render, createContext } from 'preact'
import { useContext, useState, useEffect } from 'preact/hooks'
import Devtools from './setup'
import { queryPlugin } from './plugin'
import { Button } from './button'
import { Feature } from './feature'

type Post = {
  id: number
  title: string
  body: string
}

function Posts({
  setPostId,
}: {
  setPostId: (id: number) => void
}) {
  const [posts, setPosts] = useState<Post[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)

  useEffect(() => {
    fetch('https://jsonplaceholder.typicode.com/posts')
      .then((res) => res.json())
      .then((data) => {
        setPosts(data)
        setLoading(false)
      })
      .catch((err) => {
        setError(err)
        setLoading(false)
      })
  }, [])

  return (
    <div>
      <h1>Posts</h1>
      <div>
        {loading ? (
          'Loading...'
        ) : error ? (
          <span>Error: {error.message}</span>
        ) : (
          <>
            <div>
              {posts.map((post) => (
                <p key={post.id}>
                  <a
                    onClick={() => setPostId(post.id)}
                    href="#"
                  >
                    {post.title}
                  </a>
                </p>
              ))}
            </div>
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

function Post({
  postId,
  setPostId,
}: {
  postId: number
  setPostId: (id: number) => void
}) {
  const [post, setPost] = useState<Post | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)

  useEffect(() => {
    if (postId > 0) {
      setLoading(true)
      getPostById(postId)
        .then((data) => {
          setPost(data)
          setLoading(false)
        })
        .catch((err) => {
          setError(err)
          setLoading(false)
        })
    }
  }, [postId])

  return (
    <div>
      <div>
        <a onClick={() => setPostId(-1)} href="#">
          Back
        </a>
      </div>
      {!postId || loading ? (
        'Loading...'
      ) : error ? (
        <span>Error: {error.message}</span>
      ) : post ? (
        <>
          <h1>{post.title}</h1>
          <div>
            <p>{post.body}</p>
          </div>
        </>
      ) : null}
    </div>
  )
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
  return (
    <div>
      <Context.Provider value={{ count: state, setCount: setState }}>
        <h1>TanStack Devtools Preact Basic Example</h1>
        current count: {state}
        <Button onClick={() => setState(state + 1)}>Click me</Button>
        <Button onClick={() => setWin(window.open('', '', 'popup'))}>
          Click me to open new window
        </Button>
        {win && render(<Mounted />, win.document.body)}
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
      </Context.Provider>
    </div>
  )
}

render(<App />, document.getElementById('root')!)
