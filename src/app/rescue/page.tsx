'use client'

import { useState } from 'react'

export default function RescuePage() {
    const [pin, setPin] = useState('')
    const [status, setStatus] = useState('')

    const handleRescue = () => {
        if (pin === '2026') {
            setStatus('Success! Redirecting...')
            sessionStorage.setItem('founders_pass_auth', 'true')
            window.location.href = '/founderspass/dashboard'
        } else {
            setStatus('Invalid PIN')
        }
    }

    return (
        <div style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            height: '100vh',
            backgroundColor: '#000',
            color: '#fff',
            fontFamily: 'sans-serif'
        }}>
            <h1>Emergency Access</h1>
            <p style={{ marginBottom: '20px', color: '#888' }}>
                Bypass all systems. Enter PIN to force-enable Founder mode.
            </p>

            <input
                type="password"
                value={pin}
                onChange={(e) => setPin(e.target.value)}
                placeholder="PIN"
                style={{
                    padding: '12px',
                    borderRadius: '8px',
                    border: '1px solid #333',
                    background: '#111',
                    color: '#fff',
                    marginBottom: '10px',
                    width: '200px',
                    textAlign: 'center',
                    fontSize: '24px',
                    letterSpacing: '4px'
                }}
            />

            <button
                onClick={handleRescue}
                style={{
                    padding: '12px 24px',
                    borderRadius: '8px',
                    background: '#f59e0b',
                    color: '#000',
                    fontWeight: 'bold',
                    border: 'none',
                    cursor: 'pointer'
                }}
            >
                Force Entry
            </button>

            {status && <p style={{ marginTop: '20px', color: status.includes('Success') ? '#10b981' : '#ef4444' }}>{status}</p>}
        </div>
    )
}
