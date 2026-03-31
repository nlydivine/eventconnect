const express = require('express');
const axios = require('axios');
const cors = require('cors');
const path = require('path');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

const TM_BASE = 'https://app.ticketmaster.com/discovery/v2';
const HOLIDAY_BASE = 'https://date.nager.at/api/v3';
const API_KEY = process.env.TICKETMASTER_API_KEY;

app.get('/api/events', async (req, res) => {
  try {
    const keyword = req.query.keyword || '';
    const city = req.query.city || '';
    const classificationName = req.query.classificationName || '';
    const sort = req.query.sort || 'date,asc';
    const page = req.query.page || 0;
    const size = req.query.size || 20;

    const params = { apikey: API_KEY, keyword, city, classificationName, sort, page, size };
    Object.keys(params).forEach(k => {
      if (params[k] === '' || params[k] === undefined) delete params[k];
    });

    const response = await axios.get(TM_BASE + '/events.json', { params });
    const embedded = response.data._embedded || {};
    const events = embedded.events || [];
    const page_info = response.data.page || {};

    const formatted = events.map(event => {
      const dates = event.dates || {};
      const start = dates.start || {};
      const status = dates.status || {};
      const embedded2 = event._embedded || {};
      const venues = embedded2.venues || [];
      const venue = venues[0] || {};
      const city2 = venue.city || {};
      const country = venue.country || {};
      const classifications = event.classifications || [];
      const classification = classifications[0] || {};
      const segment = classification.segment || {};
      const genre = classification.genre || {};
      const images = event.images || [];
      const image = images.filter(img => img.ratio === '16_9' && img.width > 500)[0] || images[0] || {};
      const priceRanges = event.priceRanges || [];
      const price = priceRanges[0] || {};

      return {
        id: event.id,
        name: event.name,
        date: start.localDate || 'TBA',
        time: start.localTime || '',
        venue: venue.name || 'Venue TBA',
        city: city2.name || '',
        country: country.name || '',
        category: segment.name || 'Event',
        genre: genre.name || '',
        image: image.url || '',
        url: event.url || '#',
        priceMin: price.min !== undefined ? price.min : null,
        priceMax: price.max !== undefined ? price.max : null,
        currency: price.currency || 'USD',
        status: status.code || 'onsale',
      };
    });

    res.json({ events: formatted, page: page_info });
  } catch (err) {
    const errData = err.response ? err.response.data : null;
    const errStatus = err.response ? err.response.status : null;
    console.error('Ticketmaster error:', errData || err.message);
    if (errStatus === 401) return res.status(401).json({ error: 'Invalid API key.' });
    if (errStatus === 429) return res.status(429).json({ error: 'Rate limit reached. Wait a moment.' });
    res.status(500).json({ error: 'Failed to fetch events. Please try again.' });
  }
});

app.get('/api/holidays', async (req, res) => {
  try {
    const countryCode = req.query.countryCode || 'RW';
    const year = req.query.year || new Date().getFullYear();

    const response = await axios.get(`${HOLIDAY_BASE}/PublicHolidays/${year}/${countryCode}`);
    const holidays = Array.isArray(response.data)
      ? response.data.map(h => ({
          name: h.name,
          localName: h.localName,
          date: h.date,
          country: countryCode,
          type: (h.types || [])[0] || 'Public Holiday',
        }))
      : [];

    res.json({ holidays });
  } catch (err) {
    console.error('Holidays error:', err.message);
    res.status(500).json({ error: 'Failed to fetch holidays.' });
  }
});

app.get('/api/countries', async (req, res) => {
  try {
    const response = await axios.get(HOLIDAY_BASE + '/AvailableCountries');
    res.json({ countries: Array.isArray(response.data) ? response.data : [] });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch countries.' });
  }
});

app.use(express.static(path.join(__dirname, '../frontend')));

app.get('*', (req, res) => {
  if (!req.path.startsWith('/api')) {
    res.sendFile(path.join(__dirname, '../frontend/index.html'));
  }
});

app.listen(PORT, () => {
  console.log(`EventConnect running at http://localhost:${PORT}`);
  console.log('API Key loaded: ' + (API_KEY ? 'Yes' : 'No - check your .env file!'));
});

