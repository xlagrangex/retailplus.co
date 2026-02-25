const BREVO_API_KEY = import.meta.env.VITE_BREVO_API_KEY

export async function sendWelcomeEmail(to: { email: string; nome: string }) {
  if (!BREVO_API_KEY) {
    console.warn('Brevo API key not configured, skipping welcome email')
    return
  }

  const res = await fetch('https://api.brevo.com/v3/smtp/email', {
    method: 'POST',
    headers: {
      'accept': 'application/json',
      'api-key': BREVO_API_KEY,
      'content-type': 'application/json',
    },
    body: JSON.stringify({
      sender: { name: 'LogPlus Farma', email: 'noreply@logplusfarma.it' },
      to: [{ email: to.email, name: to.nome }],
      subject: 'Benvenuto in LogPlus Farma — Account attivato',
      htmlContent: `
        <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; max-width: 600px; margin: 0 auto; padding: 32px;">
          <div style="background: #273E3A; padding: 16px 24px; border-radius: 4px; margin-bottom: 24px;">
            <span style="color: white; font-weight: bold; font-size: 18px;">LogPlus</span>
            <span style="color: #329083; font-weight: bold; font-size: 18px;">Farma</span>
          </div>
          <h2 style="color: #1a2e2a; margin-bottom: 8px;">Ciao ${to.nome},</h2>
          <p style="color: #4a6360; line-height: 1.6;">La tua registrazione come <strong>Merchandiser</strong> su LogPlus Farma è stata <strong style="color: #329083;">approvata</strong>!</p>
          <p style="color: #4a6360; line-height: 1.6;">Puoi accedere alla piattaforma con il tuo indirizzo email:</p>
          <p style="background: #f0faf8; padding: 12px 16px; border-radius: 4px; font-weight: 600; color: #273E3A;">${to.email}</p>
          <a href="https://esposiotori500farmacie.vercel.app" style="display: inline-block; background: #329083; color: white; padding: 12px 24px; border-radius: 4px; text-decoration: none; font-weight: 600; margin-top: 16px;">Accedi a LogPlus Farma</a>
          <hr style="border: none; border-top: 1px solid #e5ebe9; margin: 32px 0;" />
          <p style="color: #8a9e9b; font-size: 13px;">Il team LogPlus Farma</p>
        </div>
      `,
    }),
  })

  if (!res.ok) {
    const err = await res.text()
    console.error('Brevo email error:', err)
  }
}
