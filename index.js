import express from 'express';
import cors from 'cors';
import { Pool } from 'pg';

const app = express();
const PORT = 3000;

app.use(express.json());

const corsOptions = {
  origin: '*',
};

app.use(cors(corsOptions));

const pool = new Pool({
  host: 'localhost',
  user: 'postgres',
  password: '12345',
  database: 'likeme',
  port: 5432,
  allowExitOnIdle: true,
});

app.listen(PORT, async () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});

// (id SERIAL, titulo VARCHAR(25), img VARCHAR(1000), descripcion VARCHAR(255), likes INt

//obtener toda la info de la tabla likeme

export const getAll = async () => {
  const { rows, rowCount } = await pool.query(
    "SELECT * FROM posts ORDER BY id DESC"
  );
  console.log("Total de resultados: ", rowCount); //esto se puede comentar para que no nos muestre tantos logs
  console.log("Filas: ", rows); 
  return rows;
};

app.get('/posts', async (req, res) => { 
  try { const posts = await getAll(); 
    res.status(200).json({ success: true, data: posts, }); 
} catch (err) { console.error(err);
   res.status(500).json({ 
    success: false, 
    message: 'Hubo un error al obtener los posts', });
} });



// (id SERIAL, titulo VARCHAR(25), img VARCHAR(1000), descripcion VARCHAR(255), likes INt

// obtener un dato por su id

export const getLikeId = async (id) => {

  const query = "SELECT * FROM posts WHERE id = $1";
  const values = [id];

  const { rows } = await pool.query(query, values);

  return rows[0] || null;
};

//función para agregar un nuevo post

export const addPosts = async (titulo, img, descripcion) => {
  const consulta =
    "INSERT INTO posts values (DEFAULT, $1, $2, $3, 0) RETURNING *";
  const values = [titulo, img, descripcion];
  const result = await pool.query(consulta, values);

  return result.rows[0];
};

app.post('/posts', async (req, res) => {
  try {
    const { titulo, img, descripcion } = req.body;
    const newPost = await addPosts(titulo, img, descripcion);
    res.status(201).json({ success: true, data: newPost });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: 'Hubo un error al agregar el post' });
  }
});

// función para agregar un like a un post

export const addLike = async (likes , id) => {
  const consulta =
    "UPDATE posts SET likes = $1 where id = $2 RETURNING *";
  const values = [likes, id];
  const result = await pool.query(consulta, values);
  return result.rows[0];
};

//ruta para actualizar los likes de un post se le da un +1 a los likes actuales no esta restringido

app.put('/posts/like/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const post = await getLikeId(id);

    if (!post) {
      return res.status(404).json({ success: false, message: 'Post no encontrado' });
    }
    const updatedPost = await addLike(post.likes + 1, id);
    res.status(200).json({ success: true, data: updatedPost });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: 'Hubo un error al actualizar los likes' });
  }
});

export const deletePosts = async (id) => {
  const consulta = "DELETE FROM posts WHERE id = $1 RETURNING *";
  const values = [id];
  const result = await pool.query(consulta, values);
  return result.rows[0];
};

app.delete('/posts/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const post = await getLikeId(id);
    if (!post) {
      return res.status(404).json({ success: false, message: 'Post no encontrado' });
    }
    const deletedPost = await deletePosts(id);
    res.status(200).json({ success: true, data: deletedPost });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: 'Hubo un error al eliminar el post' });
  }
});