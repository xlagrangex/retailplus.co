const BREVO_API_KEY = import.meta.env.VITE_BREVO_API_KEY

const ADMIN_EMAILS = [
  { email: 'vincenzopetronebiz@gmail.com', name: 'Vincenzo Petrone' },
  { email: 'direzione.logplus@gmail.com', name: 'Direzione LogPlus' },
]

const LOGO_URL = 'https://retailplus.co/Retaillogo.png'
const LOGO_WHITE_URL = 'https://retailplus.co/Retaillogobianco.png'

const emailHeader = `
  <div style="text-align: center; background-color: #273E3A; padding: 28px 24px; border-radius: 6px 6px 0 0;">
    <img src="${LOGO_WHITE_URL}" alt="Retail+ Pharma" style="height: 52px; max-width: 200px;" />
  </div>
`

const emailFooter = `
  <hr style="border: none; border-top: 1px solid #e5ebe9; margin: 32px 0 24px;" />
  <div style="text-align: center;">
    <img src="${LOGO_URL}" alt="Retail+ Pharma" style="height: 36px; max-width: 140px; opacity: 0.5; margin-bottom: 12px;" />
    <p style="color: #8a9e9b; font-size: 12px; margin: 0;">Retail+ Pharma — Gestione merchandising farmacie</p>
    <p style="color: #a0bfb9; font-size: 11px; margin: 4px 0 0;">retailplus.co</p>
  </div>
`

export async function sendNewRegistrationNotification(candidato: {
  nome: string
  cognome: string
  email: string
  telefono: string
  citta: string
  provincia: string
}) {
  if (!BREVO_API_KEY) {
    console.warn('Brevo API key not configured, skipping registration notification')
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
      sender: { name: 'Retail+ Pharma', email: 'no-reply@retailplus.co' },
      to: ADMIN_EMAILS,
      subject: `Nuova registrazione merchandiser: ${candidato.nome} ${candidato.cognome}`,
      htmlContent: `
        <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; max-width: 600px; margin: 0 auto; padding: 32px; background: #ffffff;">
          ${emailHeader}
          <h2 style="color: #273E3A; margin-bottom: 8px; font-size: 20px;">Nuova richiesta di registrazione</h2>
          <p style="color: #4a6360; line-height: 1.6;">Un nuovo candidato merchandiser ha inviato la richiesta di registrazione:</p>
          <table style="width: 100%; border-collapse: collapse; margin: 16px 0; border-radius: 6px; overflow: hidden; border: 1px solid #e5ebe9;">
            <tr><td style="padding: 10px 14px; color: #5d8a82; font-size: 13px; width: 120px; background: #f7f9fc;">Nome</td><td style="padding: 10px 14px; font-weight: 600; color: #273E3A;">${candidato.nome} ${candidato.cognome}</td></tr>
            <tr><td style="padding: 10px 14px; color: #5d8a82; font-size: 13px; background: #f7f9fc;">Email</td><td style="padding: 10px 14px; font-weight: 600; color: #273E3A;"><a href="mailto:${candidato.email}" style="color: #329083; text-decoration: none;">${candidato.email}</a></td></tr>
            <tr><td style="padding: 10px 14px; color: #5d8a82; font-size: 13px; background: #f7f9fc;">Telefono</td><td style="padding: 10px 14px; font-weight: 600; color: #273E3A;">${candidato.telefono}</td></tr>
            <tr><td style="padding: 10px 14px; color: #5d8a82; font-size: 13px; background: #f7f9fc;">Città</td><td style="padding: 10px 14px; font-weight: 600; color: #273E3A;">${candidato.citta} (${candidato.provincia})</td></tr>
          </table>
          <div style="text-align: center; margin-top: 24px;">
            <a href="https://retailplus.co/admin/merchandiser" style="display: inline-block; background: #329083; color: white; padding: 14px 32px; border-radius: 6px; text-decoration: none; font-weight: 600; font-size: 14px;">Rivedi la richiesta</a>
          </div>
          ${emailFooter}
        </div>
      `,
    }),
  })

  if (!res.ok) {
    const err = await res.text()
    console.error('Brevo registration notification error:', err)
  }
}

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
      sender: { name: 'Retail+ Pharma', email: 'no-reply@retailplus.co' },
      to: [{ email: to.email, name: to.nome }],
      subject: 'Benvenuto in Retail+ Pharma — Account attivato',
      htmlContent: `
        <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; max-width: 600px; margin: 0 auto; padding: 32px; background: #ffffff;">
          ${emailHeader}
          <h2 style="color: #273E3A; margin-bottom: 8px; font-size: 20px;">Ciao ${to.nome},</h2>
          <p style="color: #4a6360; line-height: 1.6;">La tua registrazione come <strong>Merchandiser</strong> su Retail+ Pharma è stata <strong style="color: #329083;">approvata</strong>!</p>
          <p style="color: #4a6360; line-height: 1.6;">Puoi accedere alla piattaforma con il tuo indirizzo email:</p>
          <div style="background: #edf9f7; padding: 14px 18px; border-radius: 6px; border: 1px solid #d4f2ee; margin: 16px 0;">
            <p style="font-weight: 600; color: #273E3A; margin: 0; font-size: 15px;">${to.email}</p>
          </div>
          <div style="text-align: center; margin-top: 24px;">
            <a href="https://retailplus.co" style="display: inline-block; background: #329083; color: white; padding: 14px 32px; border-radius: 6px; text-decoration: none; font-weight: 600; font-size: 14px;">Accedi a Retail+ Pharma</a>
          </div>
          ${emailFooter}
        </div>
      `,
    }),
  })

  if (!res.ok) {
    const err = await res.text()
    console.error('Brevo email error:', err)
  }
}

export async function sendRejectionEmail(to: { email: string; nome: string }) {
  if (!BREVO_API_KEY) {
    console.warn('Brevo API key not configured, skipping rejection email')
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
      sender: { name: 'Retail+ Pharma', email: 'no-reply@retailplus.co' },
      to: [{ email: to.email, name: to.nome }],
      subject: 'Retail+ Pharma — Esito registrazione',
      htmlContent: `
        <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; max-width: 600px; margin: 0 auto; padding: 32px; background-color: #ffffff;">
          ${emailHeader}
          <h2 style="color: #273E3A; margin-bottom: 8px; font-size: 20px;">Ciao ${to.nome},</h2>
          <p style="color: #4a6360; line-height: 1.6;">Grazie per il tuo interesse verso <strong>Retail+ Pharma</strong>.</p>
          <p style="color: #4a6360; line-height: 1.6;">Purtroppo, al momento non ci è possibile accogliere la tua candidatura come Merchandiser.</p>
          <p style="color: #4a6360; line-height: 1.6;">Ti invitiamo a riprovare in futuro. Per qualsiasi domanda puoi contattarci rispondendo a questa email.</p>
          ${emailFooter}
        </div>
      `,
    }),
  })

  if (!res.ok) {
    const err = await res.text()
    console.error('Brevo rejection email error:', err)
  }
}

export async function sendAccountRemovedEmail(to: { email: string; nome: string }) {
  if (!BREVO_API_KEY) {
    console.warn('Brevo API key not configured, skipping account removal email')
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
      sender: { name: 'Retail+ Pharma', email: 'no-reply@retailplus.co' },
      to: [{ email: to.email, name: to.nome }],
      subject: 'Retail+ Pharma — Account disattivato',
      htmlContent: `
        <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; max-width: 600px; margin: 0 auto; padding: 32px; background-color: #ffffff;">
          ${emailHeader}
          <h2 style="color: #273E3A; margin-bottom: 8px; font-size: 20px;">Ciao ${to.nome},</h2>
          <p style="color: #4a6360; line-height: 1.6;">Ti informiamo che il tuo account su <strong>Retail+ Pharma</strong> è stato disattivato.</p>
          <p style="color: #4a6360; line-height: 1.6;">Se ritieni che si tratti di un errore, contattaci rispondendo a questa email.</p>
          ${emailFooter}
        </div>
      `,
    }),
  })

  if (!res.ok) {
    const err = await res.text()
    console.error('Brevo account removal email error:', err)
  }
}
