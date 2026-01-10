'use client'

import { useState, useEffect } from 'react'
import dynamic from 'next/dynamic'
import DashboardLayout from '@/components/DashboardLayout'
import { supabase } from '@/lib/supabase'
import ReactMarkdown from 'react-markdown'

function SavedContentPage() {
  const [savedItems, setSavedItems] = useState([])
  const [loading, setLoading] = useState(true)
  const [selectedItem, setSelectedItem] = useState(null)

  useEffect(() => {
    loadSavedContent()
  }, [])

  async function loadSavedContent() {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const { data, error } = await supabase
        .from('saved_content')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })

      if (error) throw error
      setSavedItems(data || [])
    } catch (error) {
      alert('Error loading saved content: ' + error.message)
    } finally {
      setLoading(false)
    }
  }

  async function handleDelete(id) {
    if (!confirm('Are you sure you want to delete this item?')) return

    try {
      const { error } = await supabase
        .from('saved_content')
        .delete()
        .eq('id', id)

      if (error) throw error
      setSavedItems(prev => prev.filter(item => item.id !== id))
      if (selectedItem?.id === id) {
        setSelectedItem(null)
      }
    } catch (error) {
      alert('Error deleting item: ' + error.message)
    }
  }

  function getToolIcon(toolType) {
    const icons = {
      chat: '💬',
      book_outline: '📚',
      murder_mystery: '🔍',
      game_story: '🎮'
    }
    return icons[toolType] || '📄'
  }

  function formatContent(content) {
    // Styling for AI avatar
    const aiAvatar = (
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
          flexShrink: 0,
        }}
      >
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" style={{ width: '60%', height: '60%', color: '#0a0a0a' }}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09zm5.885-3.5L18 15.75l-1.996 1.996a3 3 0 00-1.996 1.996L12.25 21l-1.75-1.75a3 3 0 00-1.996-1.996L6 15.75l1.996-1.996a3 3 0 001.996-1.996L12.25 9l1.75 1.75a3 3 0 001.996 1.996z" />
        </svg>
      </div>
    );

    // Styling for User avatar
    const userAvatar = (
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
          flexShrink: 0,
        }}
      >
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" style={{ width: '60%', height: '60%', color: '#ffffff' }}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" />
        </svg>
      </div>
    );

    if (content.messages) {
      return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
          {content.messages.map((msg, idx) => (
            <div
              key={idx}
              style={{
                display: 'flex',
                justifyContent: msg.role === 'user' ? 'flex-end' : 'flex-start',
              }}
            >
              {msg.role === 'assistant' && aiAvatar}
              <div
                style={{
                  maxWidth: '70%',
                  padding: '12px 18px',
                  borderRadius: '20px',
                  backgroundColor: msg.role === 'user' ? '#667eea' : '#1a1a1a',
                  color: '#ffffff',
                  wordBreak: 'break-word',
                  whiteSpace: 'pre-wrap',
                }}
              >
                <ReactMarkdown>{msg.content}</ReactMarkdown>
              </div>
              {msg.role === 'user' && userAvatar}
            </div>
          ))}
        </div>
      );
    }
    if (content.outline || content.mystery || content.story) {
      return (
        <div
          style={{
            display: 'flex',
            justifyContent: 'flex-start',
            marginBottom: '15px', // Consistent spacing
          }}
        >
          {aiAvatar}
          <div
            style={{
              maxWidth: '90%', // Adjust width as needed for single output
              padding: '12px 18px',
              borderRadius: '20px',
              backgroundColor: '#1a1a1a', // AI dark background
              color: '#ffffff', // White text
              wordBreak: 'break-word',
              whiteSpace: 'pre-wrap',
              flex: 1, // Allow content to take available space
            }}
          >
            <ReactMarkdown>{content.outline || content.mystery || content.story}</ReactMarkdown>
          </div>
        </div>
      );
    }
    return <pre>{JSON.stringify(content, null, 2)}</pre>
  }

  if (loading) {
    return (
      <DashboardLayout>
        <div className="container">
          <div style={{ textAlign: 'center', padding: '40px' }}>
            <div className="loading"></div>
          </div>
        </div>
      </DashboardLayout>
    )
  }

  return (
    <DashboardLayout>
      <div className="container">
        <h1 style={{ fontSize: '32px', marginBottom: '30px' }}>Saved Content</h1>

        <div style={{ display: 'grid', gridTemplateColumns: '300px 1fr', gap: '20px' }}>
          <div className="card" style={{ maxHeight: '700px', overflowY: 'auto' }}>
            <h2 style={{ marginBottom: '20px' }}>Your Saved Items</h2>
            {savedItems.length === 0 ? (
              <p style={{ color: '#888', textAlign: 'center', padding: '20px' }}>
                No saved content yet
              </p>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {savedItems.map(item => (
                  <div
                    key={item.id}
                    onClick={() => setSelectedItem(item)}
                    style={{
                      padding: '16px',
                      background: selectedItem?.id === item.id ? '#252525' : '#0a0a0a',
                      borderRadius: '8px',
                      cursor: 'pointer',
                      border: selectedItem?.id === item.id ? '2px solid #667eea' : '1px solid #333',
                      transition: 'all 0.2s'
                    }}
                  >
                    <div style={{ fontSize: '24px', marginBottom: '8px' }}>
                      {getToolIcon(item.tool_type)}
                    </div>
                    <div style={{ fontWeight: 'bold', marginBottom: '4px' }}>
                      {item.title}
                    </div>
                    <div style={{ fontSize: '12px', color: '#888' }}>
                      {new Date(item.created_at).toLocaleDateString()}
                    </div>
                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        handleDelete(item.id)
                      }}
                      style={{
                        marginTop: '8px',
                        padding: '4px 8px',
                        background: '#ff4444',
                        color: 'white',
                        border: 'none',
                        borderRadius: '4px',
                        cursor: 'pointer',
                        fontSize: '12px'
                      }}
                    >
                      Delete
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="card" style={{ maxHeight: '700px', overflowY: 'auto' }}>
            {selectedItem ? (
              <>
                <div style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  marginBottom: '20px'
                }}>
                  <h2>{selectedItem.title}</h2>
                  <span style={{ color: '#888', fontSize: '14px' }}>
                    {new Date(selectedItem.created_at).toLocaleString()}
                  </span>
                </div>
                <div style={{
                  background: '#0a0a0a',
                  padding: '24px',
                  borderRadius: '8px',
                  lineHeight: '1.8'
                }}>
                  {formatContent(selectedItem.content)}
                </div>
              </>
            ) : (
              <div style={{
                textAlign: 'center',
                padding: '60px 20px',
                color: '#888'
              }}>
                Select an item to view its content
              </div>
            )}
          </div>
        </div>
      </div>
    </DashboardLayout>
  )
}
export default dynamic(() => Promise.resolve(SavedContentPage), { ssr: false })
