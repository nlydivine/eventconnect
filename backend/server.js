const express = require('express');
const axios = require('axios');
const cors = require('cors');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());
app.use(express.static('../frontend'));

const TM_BASE = 'https://app.ticketmaster.com/discovery/v2';
const HOLIDAY_BASE = 'https://date.nager.at/api/v3';
const API_KEY = process.env.TICKETMASTER_API_KEY;

app.get('/api/events', async (req, res) => {
  try {
    const {
      keyword = '',
      city = '',
      classificationName = '',
      sort = 'date,asc',
      page = 0,
      size = 20,
    } = req.query;

    const params = { apikey: API_KEY, keyword, city, classificationName, sort, page, size };
    Object.keys(params).forEach(k => {
      if (params[k] === '' || params[k] === undefined) delete params[k];
    });

    const response = await axios.get(`${TM_BASE}/events.json`, { params });
    const events = response.data._embedded?.events || [];
    const page_info = response.data.page || {};

    const formatted = events.map(function(event) {
  var dates = event.dates || {};
  var start = dates.start || {};
  var venues = (event._embedded && event._embedded.venues) || [];
  var venue = venues[0] || {};
  var classifications = event.classifications || [];
  var classification = classifications[0] || {};
  var segment = classification.segment || {};
  var genre = classification.genre || {};
  var images = event.images || [];
  var image = images.find(function(img) { return img.ratio === '16_9' && img.width > 500; }) || images[0] || {};
  var priceRanges = event.priceRanges || [];
  var price = priceRanges[0] || {};
  var status = dates.status || {};
  return {
    id: event.id,
    name: event.name,
    date: start.localDate || 'TBA',
    time: start.localTime || '',
    venue: venue.name || 'Venue TBA',
    city: (venue.city && venue.city.name) || '',
    country: (venue.country && venue.country.name) || '',
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
    console.error('Ticketmaster error:', err.response?.data || err.message);
    if (err.response?.status === 401) return res.status(401).json({ error: 'Invalid API key.' });
    if (err.response?.status === 429) return res.status(429).json({ error: 'Rate limit reached. Wait a moment.' });
    res.status(500).json({ error: 'Failed to fetch events. Please try again.' });
  }
});

app.get('/api/holidays', async (req, res) => {
  try {
    const { countryCode = 'RW', year = new Date().getFullYear() } = req.query;
    const response = await axios.get(`${HOLIDAY_BASE}/PublicHolidays/${year}/${countryCode}`);
    const holidays = response.data.map(h => ({
      name: h.name,
      localName: h.localName,
      date: h.date,
      country: countryCode,
      type: h.types?.[0] || 'Public Holiday',
    }));
    res.json({ holidays });
  } catch (err) {
    console.error('Holidays error:', err.message);
    res.status(500).json({ error: 'Failed to fetch holidays.' });
  }
});

app.get('/api/countries', async (req, res) => {
  try {
    const response = await axios.get(`${HOLIDAY_BASE}/AvailableCountries`);
    res.json({ countries: response.data });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch countries.' });
  }
});

app.listen(PORT, () => {
  console.log(`\n EventConnect running at http://localhost:${PORT}`);
  console.log(`   API Key loaded: ${API_KEY ? 'Yes' : 'No - check your .env file!'}\n`);
});
