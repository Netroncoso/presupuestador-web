import { RowDataPacket, ResultSetHeader } from 'mysql2';
import bcrypt from 'bcrypt';
import { pool } from '../db';
import { AppError } from '../middleware/errorHandler';
import { cacheService } from './cacheService';

export class UsuariosService {
  
  async obtenerTodos(page: number = 1, limit: number = 50) {
    const cacheKey = `usuarios:page:${page}:limit:${limit}`;
    const cached = cacheService.get(cacheKey);
    if (cached) return cached;

    const offset = (page - 1) * limit;

    const [rows] = await pool.query<RowDataPacket[]>(
      `SELECT u.id, u.username, u.rol, u.activo, u.sucursal_id, s.Sucursales_mh as sucursal_nombre
       FROM usuarios u 
       LEFT JOIN sucursales_mh s ON u.sucursal_id = s.ID 
       ORDER BY u.username
       LIMIT ? OFFSET ?`,
      [limit, offset]
    );

    const [[{ total }]] = await pool.query<RowDataPacket[]>(
      'SELECT COUNT(*) as total FROM usuarios'
    );

    const result = {
      data: rows,
      pagination: {
        page,
        limit,
        total: total as number,
        totalPages: Math.ceil((total as number) / limit)
      }
    };

    cacheService.set(cacheKey, result, 900); // 15 min
    return result;
  }

  private invalidateCache() {
    const keys = cacheService.keys();
    keys.filter((k: string) => k.startsWith('usuarios:')).forEach((k: string) => cacheService.del(k));
  }

  async crear(username: string, password: string, rol?: string, sucursal_id?: number) {
    // Validaciones
    if (!username || !password) {
      throw new AppError(400, 'Username y password son requeridos');
    }

    const rolesValidos = ['user', 'gerencia_administrativa', 'gerencia_prestacional', 'gerencia_financiera', 'gerencia_general', 'admin'];
    if (rol && !rolesValidos.includes(rol)) {
      throw new AppError(400, 'Rol inválido');
    }

    // Verificar si existe
    const [existingUser] = await pool.query<RowDataPacket[]>(
      'SELECT id FROM usuarios WHERE username = ?',
      [username]
    );
    
    if (existingUser.length > 0) {
      throw new AppError(409, 'El username ya existe');
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);
    
    // Crear usuario
    await pool.query<ResultSetHeader>(
      'INSERT INTO usuarios (username, password, rol, activo, sucursal_id) VALUES (?, ?, ?, 1, ?)',
      [username, hashedPassword, rol || 'user', sucursal_id || null]
    );
    
    this.invalidateCache();
    return { message: 'Usuario creado exitosamente' };
  }

  async actualizar(id: string, username: string, rol: string, sucursal_id?: number, password?: string) {
    // Validaciones
    if (!username || !rol) {
      throw new AppError(400, 'Username y rol son requeridos');
    }

    const rolesValidos = ['user', 'gerencia_administrativa', 'gerencia_prestacional', 'gerencia_financiera', 'gerencia_general', 'admin'];
    if (!rolesValidos.includes(rol)) {
      throw new AppError(400, 'Rol inválido');
    }
    
    // Verificar usuario existe
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
    
    // Construir query
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
    this.invalidateCache();
    return { message: 'Usuario actualizado exitosamente' };
  }

  async cambiarEstado(id: string, activo: boolean) {
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
    
    this.invalidateCache();
    return { message: 'Estado actualizado exitosamente' };
  }

  async eliminar(id: string) {
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
    
    this.invalidateCache();
    return { message: 'Usuario eliminado exitosamente' };
  }
}

export const usuariosService = new UsuariosService();