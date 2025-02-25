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
app.use(
  cors({
  origin: '*',
  })
);

// Ruta para iniciar la autenticación
app.get('/spotify/login', (req, res) => {
  const scope = 'user-read-private user-read-email user-top-read user-read-currently-playing user-read-recently-played user-read-playback-state user-modify-playback-state';
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
    const response = await axios.get('https://api.spotify.com/v1/me/top/artists?time_range=short_term&limit=50', {
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
    const response = await axios.get('https://api.spotify.com/v1/me/top/tracks?time_range=short_term&limit=50', {
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

// Función auxiliar para obtener el device_id del dispositivo activo
async function getActiveDevice(access_token) {
  try {
    const response = await axios.get('https://api.spotify.com/v1/me/player/devices', {
      headers: { 'Authorization': 'Bearer ' + access_token }
    });
    const devices = response.data.devices;
    if (devices && devices.length) {
      // Se busca el dispositivo activo
      const active = devices.find(device => device.is_active);
      return active ? active.id : devices[0].id; // Si no hay activo, se toma el primero
    }
    return null;
  } catch (error) {
    console.error('Error al obtener dispositivos:', error);
    return null;
  }
}

// Pausar la reproducción
app.put('/spotify/pause', async (req, res) => {
  const access_token = req.query.access_token;
  let device_id = req.query.device_id;
  if (!device_id) {
    device_id = await getActiveDevice(access_token);
  }
  let url = 'https://api.spotify.com/v1/me/player/pause';
  if (device_id) {
    url += `?device_id=${device_id}`;
  }
  try {
    await axios.put(url, null, {
      headers: { 'Authorization': 'Bearer ' + access_token }
    });
    res.json({ success: true });
  } catch (error) {
    console.error('Spotify API error:', error.response ? error.response.data : error);
    res.status(error.response ? error.response.status : 500)
       .json({ error: 'Error al pausar la reproducción' });
  }
});


// Reanudar la reproducción
app.put('/spotify/play', async (req, res) => {
  const access_token = req.query.access_token;
  let device_id = req.query.device_id;
  if (!device_id) {
    device_id = await getActiveDevice(access_token);
  }
  let url = 'https://api.spotify.com/v1/me/player/play';
  if (device_id) {
    url += `?device_id=${device_id}`;
  }
  try {
    await axios.put(url, null, {
      headers: { 'Authorization': 'Bearer ' + access_token }
    });
    res.json({ success: true });
  } catch (error) {
    console.error(error);
    res.status(error.response ? error.response.status : 500)
       .json({ error: 'Error al reanudar la reproducción' });
  }
});

// Saltar a la siguiente canción
app.post('/spotify/next', async (req, res) => {
  const access_token = req.query.access_token;
  let device_id = req.query.device_id;
  if (!device_id) {
    device_id = await getActiveDevice(access_token);
  }
  let url = 'https://api.spotify.com/v1/me/player/next';
  if (device_id) {
    url += `?device_id=${device_id}`;
  }
  try {
    await axios.post(url, null, {
      headers: { 'Authorization': 'Bearer ' + access_token }
    });
    res.json({ success: true });
  } catch (error) {
    console.error(error);
    res.status(error.response ? error.response.status : 500)
       .json({ error: 'Error al pasar a la siguiente canción' });
  }
});

// Volver a la canción anterior
app.post('/spotify/previous', async (req, res) => {
  const access_token = req.query.access_token;
  let device_id = req.query.device_id;
  if (!device_id) {
    device_id = await getActiveDevice(access_token);
  }
  let url = 'https://api.spotify.com/v1/me/player/previous';
  if (device_id) {
    url += `?device_id=${device_id}`;
  }
  try {
    await axios.post(url, null, {
      headers: { 'Authorization': 'Bearer ' + access_token }
    });
    res.json({ success: true });
  } catch (error) {
    console.error(error);
    res.status(error.response ? error.response.status : 500)
       .json({ error: 'Error al volver a la canción anterior' });
  }
});

// Activar o desactivar el modo aleatorio (shuffle)
app.put('/spotify/shuffle', async (req, res) => {
  const access_token = req.query.access_token;
  const state = req.query.state; // 'true' o 'false'
  let device_id = req.query.device_id;
  if (!device_id) {
    device_id = await getActiveDevice(access_token);
  }
  let url = `https://api.spotify.com/v1/me/player/shuffle?state=${state}`;
  if (device_id) {
    url += `&device_id=${device_id}`;
  }
  try {
    await axios.put(url, null, {
      headers: { 'Authorization': 'Bearer ' + access_token }
    });
    res.json({ success: true });
  } catch (error) {
    console.error(error);
    res.status(error.response ? error.response.status : 500)
       .json({ error: 'Error al cambiar el estado aleatorio' });
  }
});

// Establecer el modo de repetición (repeat)
app.put('/spotify/repeat', async (req, res) => {
  const access_token = req.query.access_token;
  const state = req.query.state; // 'track', 'context' o 'off'
  let device_id = req.query.device_id;
  if (!device_id) {
    device_id = await getActiveDevice(access_token);
  }
  let url = `https://api.spotify.com/v1/me/player/repeat?state=${state}`;
  if (device_id) {
    url += `&device_id=${device_id}`;
  }
  try {
    await axios.put(url, null, {
      headers: { 'Authorization': 'Bearer ' + access_token }
    });
    res.json({ success: true });
  } catch (error) {
    console.error(error);
    res.status(error.response ? error.response.status : 500)
       .json({ error: 'Error al establecer el modo de repetición' });
  }
});

// Ruta para obtener las playlists del usuario
app.get('/spotify/playlists', async (req, res) => {
  const access_token = req.query.access_token;
  try {
    const response = await axios.get('https://api.spotify.com/v1/me/playlists?limit=50', {
      headers: { 'Authorization': 'Bearer ' + access_token }
    });
    res.json(response.data);
  } catch (error) {
    console.error('Error al obtener playlists:', error);
    res.status(500).send('Error al obtener playlists');
  }
});

app.use(express.static('public'));

app.listen(port, () => {
  console.log(`ONLINE: http://localhost:${port}`);
});
