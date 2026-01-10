'use client'

import { useEffect, useState, useRef } from 'react'
import { supabase } from '@/lib/supabase'
import DashboardLayout from '@/components/DashboardLayout'
import ReactMarkdown from 'react-markdown'
import { useTrialContext } from '@/context/TrialContext' // Import useTrialContext

export default function ChatPage() {
  const [userId, setUserId] = useState(null)
  const [messages, setMessages] = useState([
    { role: 'assistant', content: 'Hello! I am your AI assistant. How can I help you today?' },
  ])
  const [input, setInput] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const messagesEndRef = useRef(null)
  const { refreshTrialInfo } = useTrialContext() // Use the refreshTrialInfo from context

  useEffect(() => {
    async function getUserId() {
      const { data: { user } } = await supabase.auth.getUser()
      if (user) {
        setUserId(user.id)
      }
    }
    getUserId()
  }, [])

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])
  const handleSubmit = async (e) => { // Correctly define handleSubmit inside the component
    e.preventDefault()
    if (!input.trim() || isLoading || !userId) return

    // Prepare messages for API call
    const userMessage = { role: 'user', content: input }
    const messagesForApi = [
      {
        role: 'system',
        content: `
You are a helpful AI assistant.
Format all responses in Markdown.
- Use headings for sections
- Use numbered/bullet lists
- Use code blocks for examples
- Personalize responses if user info is known
`
      },
      ...messages, // Include existing messages
      userMessage // Add the new user message
    ]

    // Optimistically update UI with user's message
    setMessages((prevMessages) => [...prevMessages, userMessage])
    setInput('')
    setIsLoading(true)

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          messages: messagesForApi, // Use messagesForApi for the API call
          userId: userId,
        }),
      })

      if (!response.ok) {
        throw new Error(await response.text())
      }

      const reader = response.body.getReader()
      const decoder = new TextDecoder()
      let assistantResponse = ''

      // Start streaming assistant's response to UI
      // Use setMessages with a functional update to append to current state
      setMessages((prevMessages) => [...prevMessages, { role: 'assistant', content: '' }]) // Add an empty assistant message to start

      while (true) {
        const { done, value } = await reader.read()
        if (done) break

        assistantResponse += decoder.decode(value)
        setMessages((prevMessages) => {
          const lastMessage = prevMessages[prevMessages.length - 1]
          if (lastMessage && lastMessage.role === 'assistant') {
            return [
              ...prevMessages.slice(0, prevMessages.length - 1),
              { ...lastMessage, content: assistantResponse },
            ]
          }
          return [...prevMessages, { role: 'assistant', content: assistantResponse }]
        })
      }
    } catch (error) {
      console.error('Error:', error)
      setMessages((prevMessages) => [
        ...prevMessages,
        { role: 'assistant', content: `Error: ${error.message}` },
      ])
    } finally {
      setIsLoading(false)
      refreshTrialInfo() // Refresh trial info after chat interaction
    }
  } // End of handleSubmit

  const formDisabled = isLoading || !userId

  return (
    <DashboardLayout>
      <div className="container">
        <h1 style={{ fontSize: '32px', marginBottom: '20px' }}>AI Chat</h1>
        <div className="card" style={{ height: '600px', display: 'flex', flexDirection: 'column', padding: '0' }}>
          <div style={{ flex: 1, overflowY: 'auto', padding: '20px', background: '#0a0a0a' }}>
            {messages.map((m, index) => (
              <div
                key={index}
                style={{
                  display: 'flex', // Use flexbox for layout
                  justifyContent: m.role === 'user' ? 'flex-end' : 'flex-start', // Align based on role
                  marginBottom: '15px', // Spacing between messages
                }}
              >
                {m.role === 'assistant' && (
                  // AI Avatar
                  <div
                    style={{
                      width: '32px',
                      height: '32px',
                      borderRadius: '50%',
                      backgroundColor: '#43e97b', // AI avatar background color
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      marginRight: '10px',
                      flexShrink: 0, // Prevent shrinking
                    }}
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" style={{ width: '60%', height: '60%', color: '#0a0a0a' }}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09zm5.885-3.5L18 15.75l-1.996 1.996a3 3 0 00-1.996 1.996L12.25 21l-1.75-1.75a3 3 0 00-1.996-1.996L6 15.75l1.996-1.996a3 3 0 001.996-1.996L12.25 9l1.75 1.75a3 3 0 001.996 1.996z" />
                    </svg>
                  </div>
                )}

                <div
                  style={{
                    maxWidth: '70%', // Limit bubble width
                    padding: '12px 18px',
                    borderRadius: '20px',
                    backgroundColor: m.role === 'user' ? '#667eea' : '#1a1a1a', // User blue, AI dark
                    color: '#ffffff', // White text
                    wordBreak: 'break-word', // Ensure long words break
                    whiteSpace: 'pre-wrap', // Preserve whitespace and line breaks
                  }}
                >
                  <ReactMarkdown>{m.content}</ReactMarkdown>
                </div>

                {m.role === 'user' && (
                  // User Avatar
                  <div
                    style={{
                      width: '32px',
                      height: '32px',
                      borderRadius: '50%',
                      backgroundColor: '#667eea', // User avatar background color
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      marginLeft: '10px',
                      flexShrink: 0, // Prevent shrinking
                    }}
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" style={{ width: '60%', height: '60%', color: '#ffffff' }}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" />
                    </svg>
                  </div>
                )}
              </div>
            ))}
            <div ref={messagesEndRef} />
          </div>
          <form onSubmit={handleSubmit} style={{ padding: '20px', borderTop: '1px solid #333', display: 'flex', gap: '10px' }}>
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              className="input"
              placeholder="Type your message..."
              disabled={formDisabled}
            />
            <button type="submit" className="btn btn-primary" disabled={formDisabled}>
              {isLoading ? <span className="loading"></span> : 'Send'}
            </button>
          </form>
        </div>
      </div>
    </DashboardLayout>
  )
}