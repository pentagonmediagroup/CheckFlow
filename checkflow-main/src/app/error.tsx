'use client'
import { useEffect } from 'react'

export default function Error({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => { console.error('App error:', error) }, [error])
  return (
    <div style={{ minHeight:'100dvh', background:'#080B14', display:'flex', alignItems:'center', justifyContent:'center', padding:24 }}>
      <div style={{ textAlign:'center', maxWidth:400 }}>
        <div style={{ fontSize:40, marginBottom:12 }}>⚠️</div>
        <h2 style={{ fontSize:18, fontWeight:700, color:'#E8ECF4', marginBottom:8 }}>Something went wrong</h2>
        <p style={{ fontSize:13, color:'#6B7280', marginBottom:20 }}>{error.message || 'An unexpected error occurred.'}</p>
        <button onClick={reset}
          style={{ padding:'10px 24px', background:'linear-gradient(135deg,#6B21A8,#4C1D95)', color:'#EAB308', border:'none', borderRadius:10, fontSize:14, fontWeight:700, cursor:'pointer' }}>
          Try Again
        </button>
      </div>
    </div>
  )
}
