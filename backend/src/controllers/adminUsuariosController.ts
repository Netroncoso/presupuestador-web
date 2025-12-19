import { Request, Response } from 'express';
import { RowDataPacket, ResultSetHeader } from 'mysql2';
import bcrypt from 'bcrypt';
import { pool } from '../db';
import { asyncHandler, AppError } from '../middleware/errorHandler';

export const getUsuarios = asyncHandler(async (req: Request, res: Response) => {
  const [rows] = await pool.query<RowDataPacket[]>(
    `SELECT u.id, u.username, u.rol, u.activo, u.sucursal_id, s.Sucursales_mh as sucursal_nombre
     FROM usuarios u 
     LEFT JOIN sucursales_mh s ON u.sucursal_id = s.ID 
     ORDER BY u.username`
  );
  res.json(rows);
});

export const createUsuario = asyncHandler(async (req: Request, res: Response) => {
  const { username, password, rol, sucursal_id } = req.body;
  
  if (!username || !password) {
    throw new AppError(400, 'Username y password son requeridos');
  }

  const rolesValidos = ['user', 'gerencia_administrativa', 'gerencia_prestacional', 'gerencia_financiera', 'gerencia_general', 'admin'];
  if (rol && !rolesValidos.includes(rol)) {
    throw new AppError(400, 'Rol inválido');
  }

  const [existingUser] = await pool.query<RowDataPacket[]>(
    'SELECT id FROM usuarios WHERE username = ?',
    [username]
  );
  
  if (existingUser.length > 0) {
    throw new AppError(409, 'El username ya existe');
  }

  const hashedPassword = await bcrypt.hash(password, 10);
  
  await pool.query<ResultSetHeader>(
    'INSERT INTO usuarios (username, password, rol, activo, sucursal_id) VALUES (?, ?, ?, 1, ?)',
    [username, hashedPassword, rol || 'user', sucursal_id || null]
  );
  
  res.json({ message: 'Usuario creado exitosamente' });
});

export const updateUsuario = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  const { username, password, rol, sucursal_id } = req.body;
  
  if (!username || !rol) {
    throw new AppError(400, 'Username y rol son requeridos');
  }

  const rolesValidos = ['user', 'gerencia_administrativa', 'gerencia_prestacional', 'gerencia_financiera', 'gerencia_general', 'admin'];
  if (!rolesValidos.includes(rol)) {
    throw new AppError(400, 'Rol inválido');
  }
  
  const [userCheck] = await pool.query<RowDataPacket[]>(
    'SELECT username FROM usuarios WHERE id = ?',
    [id]
  );
  
  if (userCheck.length === 0) {
    throw new AppError(404, 'Usuario no encontrado');
  }
  
  if (userCheck[0].username === 'admin') {
    throw new AppError(403, 'No se puede editar el usuario administrador principal');
  }
  
  let query = 'UPDATE usuarios SET username = ?, rol = ?, sucursal_id = ?';
  let params = [username, rol, sucursal_id || null];
  
  if (password && password.trim() !== '') {
    const hashedPassword = await bcrypt.hash(password, 10);
    query += ', password = ?';
    params.push(hashedPassword);
  }
  
  query += ' WHERE id = ?';
  params.push(id);
  
  await pool.query<ResultSetHeader>(query, params);
  res.json({ message: 'Usuario actualizado exitosamente' });
});

export const toggleUsuario = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  const { activo } = req.body;
  
  if (activo === undefined) {
    throw new AppError(400, 'El campo activo es requerido');
  }
  
  const [userCheck] = await pool.query<RowDataPacket[]>(
    'SELECT username FROM usuarios WHERE id = ?',
    [id]
  );
  
  if (userCheck.length === 0) {
    throw new AppError(404, 'Usuario no encontrado');
  }
  
  if (userCheck[0].username === 'admin') {
    throw new AppError(403, 'No se puede desactivar el usuario administrador principal');
  }
  
  await pool.query<ResultSetHeader>(
    'UPDATE usuarios SET activo = ? WHERE id = ?',
    [activo, id]
  );
  
  res.json({ message: 'Estado actualizado exitosamente' });
});

export const deleteUsuario = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  
  const [userCheck] = await pool.query<RowDataPacket[]>(
    'SELECT username FROM usuarios WHERE id = ?',
    [id]
  );
  
  if (userCheck.length > 0 && userCheck[0].username === 'admin') {
    throw new AppError(403, 'No se puede eliminar el usuario administrador principal');
  }
  
  await pool.query<ResultSetHeader>(
    'DELETE FROM usuarios WHERE id = ?',
    [id]
  );
  
  res.json({ message: 'Usuario eliminado exitosamente' });
});