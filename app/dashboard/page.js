'use client'

import { useEffect, useState, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import DashboardLayout from '@/components/DashboardLayout'
import Link from 'next/link'

function DashboardContent() {
  const searchParams = useSearchParams()
  const [showSuccess, setShowSuccess] = useState(false)

  useEffect(() => {
    if (searchParams.get('success') === 'true') {
      setShowSuccess(true)
      setTimeout(() => setShowSuccess(false), 5000)
    }
  }, [searchParams])

  const tools = [
    {
      title: 'AI Chat',
      description: 'ChatGPT-style conversation with AI',
      icon: '💬',
      href: '/dashboard/chat',
      color: '#667eea'
    },
    {
      title: 'Book Outline Generator',
      description: 'Generate detailed book outlines',
      icon: '📚',
      href: '/dashboard/book-outline',
      color: '#f093fb'
    },
    {
      title: 'Murder Mystery Generator',
      description: 'Create engaging murder mystery stories',
      icon: '🔍',
      href: '/dashboard/murder-mystery',
      color: '#4facfe'
    },
    {
      title: 'Game Story + Characters',
      description: 'Generate game stories and character profiles',
      icon: '🎮',
      href: '/dashboard/game-story',
      color: '#43e97b'
    },
  ]

  return (
    <DashboardLayout>
      <div className="container" style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
        {showSuccess && (
          <div style={{
            background: '#14532d',
            color: '#d1fae5',
            padding: '16px',
            borderRadius: '12px',
            border: '1px solid #22c55e66',
            textAlign: 'center',
            fontWeight: '600'
          }}>
            ✓ Subscription successful! You now have premium access.
          </div>
        )}

        <section style={{
          background: 'radial-gradient(circle at top, rgba(99,102,241,0.25), transparent 50%)',
          border: '1px solid #1f1f2e',
          padding: '32px',
          borderRadius: '24px',
          display: 'flex',
          flexDirection: 'column',
          gap: '16px'
        }}>
          <p style={{ color: '#a1a1aa', letterSpacing: '0.2em', textTransform: 'uppercase', fontSize: '12px' }}>
            Creative Suite
          </p>
          <h1 style={{ fontSize: '42px', maxWidth: '720px', lineHeight: 1.2 }}>
            Build stories, characters, and outlines in one unified AI workspace.
          </h1>
          <p style={{ color: '#9ca3af', maxWidth: '600px' }}>
            Explore each specialized generator below. Every output is crafted with premium GPT models and saved directly to your library.
          </p>
          <div style={{ display: 'flex', gap: '24px', flexWrap: 'wrap' }}>
            <div style={{ background: '#0f0f17', padding: '16px 24px', borderRadius: '16px', border: '1px solid #252538' }}>
              <p style={{ color: '#a5b4fc', fontSize: '14px', marginBottom: '4px' }}>Tools Active</p>
              <p style={{ fontSize: '28px', fontWeight: '600' }}>{tools.length}</p>
            </div>
            <div style={{ background: '#0f0f17', padding: '16px 24px', borderRadius: '16px', border: '1px solid #252538' }}>
              <p style={{ color: '#a5b4fc', fontSize: '14px', marginBottom: '4px' }}>Save & Resume</p>
              <p style={{ fontSize: '28px', fontWeight: '600' }}>Unlimited drafts</p>
            </div>
          </div>
        </section>

        <section style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '24px' }}>
          {tools.map(tool => (
            <Link key={tool.href} href={tool.href}>
              <div
                className="card"
                style={{
                  cursor: 'pointer',
                  borderColor: '#1f1f2e',
                  background: '#0b0b14',
                  borderRadius: '20px',
                  padding: '24px',
                  transition: 'transform 0.25s ease, box-shadow 0.25s ease',
                  minHeight: '220px'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = 'translateY(-6px)'
                  e.currentTarget.style.boxShadow = `0 20px 45px ${tool.color}25`
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = 'translateY(0)'
                  e.currentTarget.style.boxShadow = 'none'
                }}
              >
                <div style={{
                  width: '48px',
                  height: '48px',
                  borderRadius: '14px',
                  background: `${tool.color}33`,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '24px',
                  marginBottom: '16px'
                }}>
                  {tool.icon}
                </div>
                <h2 style={{ fontSize: '22px', marginBottom: '8px' }}>{tool.title}</h2>
                <p style={{ color: '#9ca3af', fontSize: '15px', marginBottom: '16px', lineHeight: 1.5 }}>
                  {tool.description}
                </p>
                <span style={{ color: tool.color, fontWeight: 600, fontSize: '14px' }}>
                  Open tool →
                </span>
              </div>
            </Link>
          ))}
        </section>
      </div>
    </DashboardLayout>
  )
}

export default function Dashboard() {
  return (
    <Suspense fallback={
      <DashboardLayout>
        <div className="container">
          <div style={{ textAlign: 'center', padding: '40px' }}>
            <div className="loading"></div>
          </div>
        </div>
      </DashboardLayout>
    }>
      <DashboardContent />
    </Suspense>
  )
}

