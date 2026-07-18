import ProfileClient from './ProfileClient'

export const metadata = {
  title: 'CliniQ | Mon Profil',
  description: 'Suivez vos performances et statistiques.',
}

export default function ProfilePage() {
  return (
    <main className="min-h-screen py-8 px-4">
      <ProfileClient />
    </main>
  )
}
