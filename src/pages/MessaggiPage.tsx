import MessageThread from '../components/MessageThread'
import { useAuth } from '../context/AuthContext'

export default function MessaggiPage() {
  const { user } = useAuth()
  if (!user) return null

  return (
    <div className="space-y-4">
      <div>
        <h1 className="page-title">Messaggi</h1>
        <p className="page-subtitle">Chat con l'amministratore</p>
      </div>
      <div className="card overflow-hidden">
        <MessageThread merchandiserId={user.id} maxHeight="calc(100vh - 220px)" />
      </div>
    </div>
  )
}
