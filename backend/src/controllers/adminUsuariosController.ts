import { Request, Response } from 'express';
import { RowDataPacket, ResultSetHeader } from 'mysql2';
import bcrypt from 'bcrypt';
import { pool } from '../db';

export const getUsuarios = async (req: Request, res: Response) => {
  try {
    const [rows] = await pool.query<RowDataPacket[]>(
      'SELECT id, username, rol, activo FROM usuarios ORDER BY username'
    );
    res.json(rows);
  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
};

export const createUsuario = async (req: Request, res: Response) => {
  try {
    const { username, password, rol } = req.body;
    
    if (!username || !password) {
      return res.status(400).json({ error: 'Username y password son requeridos' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    
    await pool.query<ResultSetHeader>(
      'INSERT INTO usuarios (username, password, rol, activo) VALUES (?, ?, ?, 1)',
      [username, hashedPassword, rol || 'user']
    );
    
    res.json({ message: 'Usuario creado exitosamente' });
  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
};

export const updateUsuario = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { username, password, rol } = req.body;
    
    // Verificar si es el usuario admin root
    const [userCheck] = await pool.query<RowDataPacket[]>(
      'SELECT username FROM usuarios WHERE id = ?',
      [id]
    );
    
    if (userCheck.length > 0 && userCheck[0].username === 'admin') {
      return res.status(403).json({ error: 'No se puede editar el usuario administrador principal' });
    }
    
    let query = 'UPDATE usuarios SET username = ?, rol = ?';
    let params = [username, rol];
    
    if (password && password.trim() !== '') {
      const hashedPassword = await bcrypt.hash(password, 10);
      query += ', password = ?';
      params.push(hashedPassword);
    }
    
    query += ' WHERE id = ?';
    params.push(id);
    
    await pool.query<ResultSetHeader>(query, params);
    res.json({ message: 'Usuario actualizado exitosamente' });
  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
};

export const toggleUsuario = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { activo } = req.body;
    
    // Verificar si es el usuario admin root
    const [userCheck] = await pool.query<RowDataPacket[]>(
      'SELECT username FROM usuarios WHERE id = ?',
      [id]
    );
    
    if (userCheck.length > 0 && userCheck[0].username === 'admin') {
      return res.status(403).json({ error: 'No se puede desactivar el usuario administrador principal' });
    }
    
    await pool.query<ResultSetHeader>(
      'UPDATE usuarios SET activo = ? WHERE id = ?',
      [activo, id]
    );
    
    res.json({ message: 'Estado actualizado exitosamente' });
  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
};

export const deleteUsuario = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    
    // Verificar si es el usuario admin root
    const [userCheck] = await pool.query<RowDataPacket[]>(
      'SELECT username FROM usuarios WHERE id = ?',
      [id]
    );
    
    if (userCheck.length > 0 && userCheck[0].username === 'admin') {
      return res.status(403).json({ error: 'No se puede eliminar el usuario administrador principal' });
    }
    
    await pool.query<ResultSetHeader>(
      'DELETE FROM usuarios WHERE id = ?',
      [id]
    );
    
    res.json({ message: 'Usuario eliminado exitosamente' });
  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
};