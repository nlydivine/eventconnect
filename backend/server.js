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
    const keyword = req.query.keyword || '';
    const city = req.query.city || '';
    const classificationName = req.query.classificationName || '';
    const sort = req.query.sort || 'date,asc';
    const page = req.query.page || 0;
    const size = req.query.size || 20;

    const params = { apikey: API_KEY, keyword, city, classificationName, sort, page, size };
    Object.keys(params).forEach(function(k) {
      if (params[k] === '' || params[k] === undefined) delete params[k];
    });

    const response = await axios.get(TM_BASE + '/events.json', { params });
    const embedded = response.data._embedded || {};
    const events = embedded.events || [];
    const page_info = response.data.page || {};

    const formatted = events.map(function(event) {
      var dates = event.dates || {};
      var start = dates.start || {};
      var status = dates.status || {};
      var embedded2 = event._embedded || {};
      var venues = embedded2.venues || [];
      var venue = venues[0] || {};
      var city2 = venue.city || {};
      var country = venue.country || {};
      var classifications = event.classifications || [];
      var classification = classifications[0] || {};
      var segment = classification.segment || {};
      var genre = classification.genre || {};
      var images = event.images || [];
      var image = images.filter(function(img) {
        return img.ratio === '16_9' && img.width > 500;
      })[0] || images[0] || {};
      var priceRanges = event.priceRanges || [];
      var price = priceRanges[0] || {};

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
    var errData = err.response ? err.response.data : null;
    var errStatus = err.response ? err.response.status : null;
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
    const response = await axios.get(HOLIDAY_BASE + '/PublicHolidays/' + year + '/' + countryCode);
    const holidays = response.data.map(function(h) {
      var types = h.types || [];
      return {
        name: h.name,
        localName: h.localName,
        date: h.date,
        country: countryCode,
        type: types[0] || 'Public Holiday',
      };
    });
    res.json({ holidays: holidays });
  } catch (err) {
    console.error('Holidays error:', err.message);
    res.status(500).json({ error: 'Failed to fetch holidays.' });
  }
});

app.get('/api/countries', async (req, res) => {
  try {
    const response = await axios.get(HOLIDAY_BASE + '/AvailableCountries');
    res.json({ countries: response.data });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch countries.' });
  }
});

app.listen(PORT, function() {
  console.log('\n EventConnect running at http://localhost:' + PORT);
  console.log('   API Key loaded: ' + (API_KEY ? 'Yes' : 'No - check your .env file!') + '\n');
});
