import { RowDataPacket, ResultSetHeader } from 'mysql2';
import bcrypt from 'bcrypt';
import { pool } from '../db';
import { AppError } from '../middleware/errorHandler';
import { cacheService } from './cacheService';

export class UsuariosService {
  
  async obtenerTodos(page: number = 1, limit: number = 50) {
    try {
      const cacheKey = `usuarios:page:${page}:limit:${limit}`;
      const cached = cacheService.get(cacheKey);
      if (cached) return cached;

      const offset = (page - 1) * limit;
      
      if (offset < 0) {
        throw new AppError(400, 'Página inválida');
      }

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

      cacheService.set(cacheKey, result, 900);
      return result;
    } catch (error) {
      console.error('Error al obtener usuarios:', error);
      throw new AppError(500, 'Error al obtener usuarios');
    }
  }

  private invalidateCache() {
    try {
      const cacheKeys = cacheService.keys();
      const userCacheKeys = cacheKeys.filter((key: string) => key.startsWith('usuarios:'));
      userCacheKeys.forEach((key: string) => cacheService.del(key));
    } catch (error) {
      console.warn('Error invalidating cache:', error);
    }
  }

  async crear(usuarioData: { username: string; password: string; rol?: string; sucursal_id?: number }) {
    const { username, password, rol, sucursal_id } = usuarioData;
    
    try {
      if (!username || !password) {
        throw new AppError(400, 'Username y password son requeridos');
      }

      const allowedRoles = ['user', 'gerencia_comercial', 'gerencia_comercial', 'gerencia_financiera', 'gerencia_general', 'operador_carga', 'admin'];
      if (rol && !allowedRoles.includes(rol)) {
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
      
      this.invalidateCache();
      return { message: 'Usuario creado exitosamente' };
    } catch (error) {
      console.error('Error al crear usuario:', error);
      if (error instanceof AppError) throw error;
      throw new AppError(500, 'Error al crear usuario');
    }
  }

  async actualizar(id: string, updateData: { username: string; rol: string; sucursal_id?: number; password?: string }) {
    const { username, rol, sucursal_id, password } = updateData;
    
    try {
      if (!username || !rol) {
        throw new AppError(400, 'Username y rol son requeridos');
      }

      const allowedRoles = ['user', 'gerencia_comercial', 'gerencia_comercial', 'gerencia_financiera', 'gerencia_general', 'operador_carga', 'admin'];
      if (!allowedRoles.includes(rol)) {
        throw new AppError(400, 'Rol inválido');
      }
      
      const [userExists] = await pool.query<RowDataPacket[]>(
        'SELECT username FROM usuarios WHERE id = ?',
        [id]
      );
      
      if (userExists.length === 0) {
        throw new AppError(404, 'Usuario no encontrado');
      }
      
      if (userExists[0].username === 'admin') {
        throw new AppError(403, 'No se puede editar el usuario administrador principal');
      }
      
      let updateQuery = 'UPDATE usuarios SET username = ?, rol = ?, sucursal_id = ?';
      let queryParams = [username, rol, sucursal_id || null];
      
      if (password && password.trim() !== '') {
        const hashedPassword = await bcrypt.hash(password, 10);
        updateQuery += ', password = ?';
        queryParams.push(hashedPassword);
      }
      
      updateQuery += ' WHERE id = ?';
      queryParams.push(id);
      
      await pool.query<ResultSetHeader>(updateQuery, queryParams);
      this.invalidateCache();
      return { message: 'Usuario actualizado exitosamente' };
    } catch (error) {
      console.error('Error al actualizar usuario:', error);
      if (error instanceof AppError) throw error;
      throw new AppError(500, 'Error al actualizar usuario');
    }
  }

  async cambiarEstado(id: string, activo: boolean) {
    try {
      if (activo === undefined) {
        throw new AppError(400, 'El campo activo es requerido');
      }
      
      const [userExists] = await pool.query<RowDataPacket[]>(
        'SELECT username FROM usuarios WHERE id = ?',
        [id]
      );
      
      if (userExists.length === 0) {
        throw new AppError(404, 'Usuario no encontrado');
      }
      
      if (userExists[0].username === 'admin') {
        throw new AppError(403, 'No se puede desactivar el usuario administrador principal');
      }
      
      await pool.query<ResultSetHeader>(
        'UPDATE usuarios SET activo = ? WHERE id = ?',
        [activo, id]
      );
      
      this.invalidateCache();
      return { message: 'Estado actualizado exitosamente' };
    } catch (error) {
      console.error('Error al cambiar estado del usuario:', error);
      if (error instanceof AppError) throw error;
      throw new AppError(500, 'Error al cambiar estado del usuario');
    }
  }

  async eliminar(id: string) {
    try {
      if (!id || id.trim() === '') {
        throw new AppError(400, 'ID de usuario es requerido');
      }

      const [existingUser] = await pool.query<RowDataPacket[]>(
        'SELECT username FROM usuarios WHERE id = ?',
        [id]
      );
      
      if (existingUser.length === 0) {
        throw new AppError(404, 'Usuario no encontrado');
      }
      
      if (existingUser[0].username === 'admin') {
        throw new AppError(403, 'No se puede eliminar el usuario administrador principal');
      }
      
      await pool.query<ResultSetHeader>(
        'DELETE FROM usuarios WHERE id = ?',
        [id]
      );
      
      this.invalidateCache();
      return { message: 'Usuario eliminado exitosamente' };
    } catch (error) {
      console.error('Error al eliminar usuario:', error);
      if (error instanceof AppError) throw error;
      throw new AppError(500, 'Error al eliminar usuario');
    }
  }
}

export const usuariosService = new UsuariosService();
