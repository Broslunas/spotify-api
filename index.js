const express = require('express');
const axios = require('axios');
const querystring = require('querystring');
const cors = require('cors');
require('dotenv').config();

const app = express();
const port = process.env.PORT || 3000;

const client_id = process.env.CLIENT_ID;
const client_secret = process.env.CLIENT_SECRET;
const redirect_uri = process.env.REDIRECT_URI;

// Aplica CORS a todas las rutas
app.use(cors({
  origin: '*' // <-- Esto permite solicitudes desde cualquier dominio
}));

// Ruta para iniciar la autenticación
app.get('/spotify/login', (req, res) => {
  const scope = 'user-read-private user-read-email user-top-read user-read-currently-playing';
  res.redirect('https://accounts.spotify.com/authorize?' +
    querystring.stringify({
      response_type: 'code',
      client_id: client_id,
      scope: scope,
      redirect_uri: redirect_uri,
    }));
});

// Ruta de callback para recibir el código y cambiarlo por un token
app.get('/spotify/callback', async (req, res) => {
  const code = req.query.code || null;
  try {
    const response = await axios.post('https://accounts.spotify.com/api/token',
      querystring.stringify({
        code: code,
        redirect_uri: redirect_uri,
        grant_type: 'authorization_code'
      }), {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          'Authorization': 'Basic ' + (Buffer.from(client_id + ':' + client_secret).toString('base64'))
        }
      });
    const access_token = response.data.access_token;
    // Ahora redirigimos a la página principal con el token en la URL
    res.redirect(`https://stats.broslunas.com/?access_token=${access_token}`);
  } catch (error) {
    console.error(error);
    res.send('Error en el callback');
  }
});

// Ruta para obtener datos del perfil del usuario
app.get('/spotify/profile', async (req, res) => {
  const access_token = req.query.access_token;
  try {
    const response = await axios.get('https://api.spotify.com/v1/me', {
      headers: { 'Authorization': 'Bearer ' + access_token }
    });
    res.json(response.data);
  } catch (error) {
    console.error(error);
    res.send('Error al obtener el perfil');
  }
});

// Ruta para obtener los mejores artistas del usuario
app.get('/spotify/top-artists', async (req, res) => {
  const access_token = req.query.access_token;
  try {
    const response = await axios.get('https://api.spotify.com/v1/me/top/artists', {
      headers: { 'Authorization': 'Bearer ' + access_token }
    });
    res.json(response.data);
  } catch (error) {
    console.error(error);
    res.send('Error al obtener artistas');
  }
});

// Ruta para obtener las mejores canciones del usuario
app.get('/spotify/top-tracks', async (req, res) => {
  const access_token = req.query.access_token;
  try {
    const response = await axios.get('https://api.spotify.com/v1/me/top/tracks', {
      headers: { 'Authorization': 'Bearer ' + access_token }
    });
    res.json(response.data);
  } catch (error) {
    console.error(error);
    res.send('Error al obtener tracks');
  }
});

// Ruta para obtener la canción que el usuario está escuchando actualmente
app.get('/spotify/currently-playing', async (req, res) => {
  const access_token = req.query.access_token;
  try {
    const response = await axios.get('https://api.spotify.com/v1/me/player/currently-playing', {
      headers: { 'Authorization': 'Bearer ' + access_token }
    });
    // Si está reproduciendo algo, Spotify devuelve un 200 con los datos
    // Si no, puede devolver 204 sin contenido
    if (response.status === 200) {
      res.json(response.data);
    } else {
      res.json({ is_playing: false });
    }
  } catch (error) {
    console.error(error);
    res.json({ is_playing: false });
  }
});

app.get('/spotify/recently-played', async (req, res) => {
  const access_token = req.query.access_token;
  try {
    const response = await axios.get('https://api.spotify.com/v1/me/player/recently-played', {
      headers: { 'Authorization': 'Bearer ' + access_token }
    });
    res.json(response.data);
  } catch (error) {
    console.error(error);
    res.send('Error al obtener las canciones recientemente reproducidas');
  }
});


app.use(express.static('public'));

app.listen(port, () => {
  console.log(`ONLINE: http://localhost:${port}`);
});
