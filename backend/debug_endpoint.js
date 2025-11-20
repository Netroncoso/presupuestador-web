// Endpoint temporal para debuggear notificaciones
// Agregar a app.ts temporalmente

app.get('/api/debug/notificaciones/:userId', async (req, res) => {
  const userId = parseInt(req.params.userId);
  
  try {
    // 1. Contar notificaciones no leídas
    const [countResult] = await pool.query(
      'SELECT COUNT(*) as count FROM notificaciones WHERE usuario_id = ? AND estado = "nuevo"',
      [userId]
    );
    
    // 2. Listar todas las notificaciones del usuario
    const [allNotifications] = await pool.query(`
      SELECT n.*, p.Nombre_Apellido as paciente, u.username, u.rol
      FROM notificaciones n
      LEFT JOIN presupuestos p ON n.presupuesto_id = p.idPresupuestos
      LEFT JOIN usuarios u ON n.usuario_id = u.id
      WHERE n.usuario_id = ?
      ORDER BY n.creado_en DESC
    `, [userId]);
    
    // 3. Info del usuario
    const [userInfo] = await pool.query(
      'SELECT id, username, rol FROM usuarios WHERE id = ?',
      [userId]
    );
    
    res.json({
      userId,
      user: userInfo[0],
      unreadCount: countResult[0].count,
      allNotifications,
      totalNotifications: allNotifications.length
    });
    
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Usar: GET /api/debug/notificaciones/USER_ID