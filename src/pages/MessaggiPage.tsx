import MessageThread from '../components/MessageThread'

export default function MessaggiPage() {
  return (
    <div className="space-y-4">
      <div>
        <h1 className="page-title">Messaggi</h1>
        <p className="page-subtitle">Comunicazioni interne tra admin, clienti e merchandiser</p>
      </div>
      <div className="card overflow-hidden">
        <MessageThread maxHeight="calc(100vh - 220px)" />
      </div>
    </div>
  )
}
