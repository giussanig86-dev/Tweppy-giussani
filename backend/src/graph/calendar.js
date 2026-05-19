const { createGraphClient } = require('./graphClient');

async function getEventi(accessToken, startDate, endDate) {
  const client = createGraphClient(accessToken);
  const res = await client
    .api(`/me/calendarView?startDateTime=${startDate}T00:00:00&endDateTime=${endDate}T23:59:59`)
    .header('Prefer', 'outlook.timezone="Europe/Rome"')
    .get();
  return res.value;
}

async function createEvento(accessToken, evento) {
  const client = createGraphClient(accessToken);
  const body = {
    subject: evento.titolo,
    body: { contentType: 'Text', content: evento.note || '' },
    start: { dateTime: evento.inizio, timeZone: 'Europe/Rome' },
    end:   { dateTime: evento.fine,   timeZone: 'Europe/Rome' },
    categories: [evento.tipo || 'altro'],
  };

  if (evento.partecipanti?.length) {
    body.attendees = evento.partecipanti
      .filter(Boolean)
      .map((email) => ({ emailAddress: { address: email.trim() }, type: 'required' }));
  }

  if (evento.creaMeeting) {
    body.isOnlineMeeting = true;
    body.onlineMeetingProvider = 'teamsForBusiness';
  }

  return client.api('/me/events').post(body);
}

async function updateEvento(accessToken, eventId, evento) {
  const client = createGraphClient(accessToken);
  return client.api(`/me/events/${eventId}`).patch({
    subject: evento.titolo,
    body: { contentType: 'Text', content: evento.note || '' },
    start: { dateTime: evento.inizio, timeZone: 'Europe/Rome' },
    end:   { dateTime: evento.fine,   timeZone: 'Europe/Rome' },
    categories: [evento.tipo || 'altro'],
  });
}

async function deleteEvento(accessToken, eventId) {
  const client = createGraphClient(accessToken);
  await client.api(`/me/events/${eventId}`).delete();
}

module.exports = { getEventi, createEvento, updateEvento, deleteEvento };
