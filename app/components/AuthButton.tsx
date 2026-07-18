'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { supabase } from '@/lib/supabase'

type Profile = {
  display_name: string
  avatar_url: string
  streak: number
}

export default function AuthButton() {
  const [profile, setProfile] = useState<Profile | null>(null)
  const [loading, setLoading] = useState(true)
  const [showMenu, setShowMenu] = useState(false)

  useEffect(() => {
    checkUser()
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
      checkUser()
      if (event === 'SIGNED_IN' || event === 'INITIAL_SESSION') {
        if (window.location.hash.includes('access_token')) {
          window.history.replaceState(null, '', window.location.pathname)
        }
      }
    })
    return () => subscription.unsubscribe()
  }, [])

  const checkUser = async () => {
    const { data: { user } } = await supabase.auth.getUser()
    if (user) {
      const { data } = await supabase
        .from('profiles')
        .select('display_name, avatar_url, streak')
        .eq('id', user.id)
        .single()

      const localStreak = parseInt(localStorage.getItem('currentStreak') || '0')

      if (data) {
        if (localStreak > (data.streak || 0)) {
          await supabase
            .from('profiles')
            .update({ streak: localStreak })
            .eq('id', user.id)
          setProfile({ ...data, streak: localStreak })
        } else {
          setProfile(data)
        }
      } else {
        // First login — create profile from Google account data
        const display_name = user.user_metadata?.full_name || user.email || 'Utilisateur'
        const avatar_url = user.user_metadata?.avatar_url || ''
        await supabase.from('profiles').upsert({
          id: user.id,
          display_name,
          avatar_url,
          streak: localStreak,
        })
        setProfile({ display_name, avatar_url, streak: localStreak })
      }
    } else {
      setProfile(null)
    }
    setLoading(false)
  }

  const signInWithGoogle = async () => {
    await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: window.location.origin,
      },
    })
  }

  const signOut = async () => {
    await supabase.auth.signOut()
    setShowMenu(false)
  }

  if (loading) return null

  if (!profile) {
    return (
      <button
        onClick={signInWithGoogle}
        className="flex items-center gap-1.5 text-xs font-medium text-[#6E6E73] border border-[#E8E8ED] rounded-full px-3 py-1.5 hover:border-[#D2D2D7] hover:text-[#1D1D1F] transition-all bg-white"
      >
        <svg width="12" height="12" viewBox="0 0 24 24">
          <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
          <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
          <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
          <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
        </svg>
        Connexion
      </button>
    )
  }

  return (
    <div className="relative">
      <button
        onClick={() => setShowMenu(!showMenu)}
        className="flex items-center gap-2"
      >
        {profile.avatar_url ? (
          <img
            src={profile.avatar_url}
            alt={profile.display_name}
            className="w-7 h-7 rounded-full border border-[#E8E8ED]"
          />
        ) : (
          <div className="w-7 h-7 rounded-full bg-[#EBF4FF] border border-[#C7DEFF] flex items-center justify-center text-xs font-semibold text-[#0066CC]">
            {profile.display_name?.[0]?.toUpperCase()}
          </div>
        )}
      </button>

      {showMenu && (
        <div className="absolute right-0 top-9 bg-white border border-[#E8E8ED] rounded-xl shadow-[0_4px_16px_rgba(0,0,0,0.08)] p-3 w-52 z-20">
          <p className="text-xs font-semibold text-[#1D1D1F] mb-0.5 truncate">{profile.display_name}</p>
          <p className="text-xs text-[#AEAEB2] mb-3">🔥 {profile.streak} jour{profile.streak !== 1 ? 's' : ''} de série</p>
          <Link
            href="/profile"
            onClick={() => setShowMenu(false)}
            className="flex items-center gap-2 w-full text-xs font-medium text-[#1D1D1F] hover:text-[#0066CC] transition-colors mb-2.5"
          >
            <span className="text-[#AEAEB2]">👤</span>
            Mon profil
          </Link>
          <div className="h-px bg-[#F5F5F7] mb-2.5" />
          <button
            onClick={signOut}
            className="w-full text-left text-xs text-[#FF3B30] hover:text-[#CC0000] transition-colors font-medium"
          >
            Se déconnecter
          </button>
        </div>
      )}
    </div>
  )
}
