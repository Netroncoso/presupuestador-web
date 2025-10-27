import mysql.connector
import tkinter as tk
from tkinter import ttk, messagebox

class Aplicacion:
    def __init__(self, root):
        """
        Constructor de la aplicación principal.
        """
        self.root = root
        self.root.title("Presupuestador")
        
        self.setup_styles()
        
        # ID del presupuesto recién creado, se usará para actualizar
        self.presupuesto_id = None
        
        # Lista de insumos seleccionados, ahora almacena tuplas de (insumo, costo, cantidad)
        self.lista_seleccion_insumos = []
        
        # Lista para almacenar las prestaciones seleccionadas de forma detallada
        # La clave será el ID del servicio
        self.lista_seleccion_prestaciones = []
        
        # Nueva variable para guardar el prestador seleccionado y no perderlo
        self.prestador_seleccionado_anterior = None
        
        # Referencia a las ventanas, se inicializan en None
        self.insumos_window = None
        self.prestaciones_window = None

        # Variables para los datos del presupuesto
        self.nombre = None
        self.dni = None
        self.sucursal = None
        self.dificil_acceso = None
        self.nombre_cliente_actual = "" # Nueva variable para el nombre del cliente

        # Totales
        self.total_insumos = 0
        self.total_prestaciones = 0

        # Configuración de la base de datos
        self.db_config = {
            "host": "127.0.0.1",
            "user": "PRUEBAS",
            "password": "Medihome2006",
            "database": "mh_1"
        }

        # Cargar datos al inicio para evitar recargas constantes
        self.sucursales = self.obtener_sucursales()
        self.prestadores_map = self.obtener_prestadores_db()
        self.prestadores_list = list(self.prestadores_map.keys())
        self.insumos_disponibles = self.obtener_insumos_db()
        
        # Inicia la pantalla principal
        self.mostrar_pantalla_principal_con_pestanas()

    def setup_styles(self):
        """Configura estilos consistentes para toda la aplicación"""
        style = ttk.Style()
        style.theme_use('clam')
        
        # Color palette
        self.primary_color = '#4b6cb7'
        self.secondary_color = '#182848'
        self.accent_color = '#007bff'
        self.bg_color = '#f0f0f0'
        
        style.configure('TFrame', background=self.bg_color)
        style.configure('TLabel', background=self.bg_color, font=('Arial', 10))
        style.configure('TButton', font=('Arial', 10, 'bold'), padding=8)
        style.configure('TEntry', font=('Arial', 10), padding=5)
        style.configure('TCombobox', font=('Arial', 10))
        
        # Estilo para botones principales
        style.configure('Accent.TButton', 
                        foreground='white',
                        background=self.accent_color,
                        font=('Arial', 10, 'bold'))
        style.map('Accent.TButton', 
                  background=[('active', self.secondary_color)])
        
        # Estilo para Treeview
        style.configure("Treeview", 
                        background="white", 
                        fieldbackground="white", 
                        foreground="black",
                        font=('Arial', 10),
                        rowheight=25)
        style.map('Treeview', background=[('selected', self.accent_color)])
        style.configure("Treeview.Heading", font=('Arial', 10, 'bold'))
    
    def mostrar_pantalla_principal_con_pestanas(self):
        """Muestra la pantalla principal con un sistema de pestañas."""
        for widget in self.root.winfo_children():
            widget.destroy()

        self.root.configure(bg=self.bg_color)
        
        # Contenedor principal
        main_frame = ttk.Frame(self.root, padding=(20, 20))
        main_frame.pack(fill='both', expand=True)

        # Marco para los totales en la parte superior derecha
        top_bar_frame = ttk.Frame(main_frame)
        top_bar_frame.pack(fill='x', anchor='e', pady=(0, 10))
        
        # NUEVA ETIQUETA PARA EL NOMBRE DEL CLIENTE
        self.label_nombre_cliente = ttk.Label(top_bar_frame, text="")
        self.label_nombre_cliente.pack(side='left', padx=(0, 20))
        
        ttk.Label(top_bar_frame, text="Totales:", font=('Arial', 11, 'bold')).pack(side='left', padx=(0, 20))
        self.label_total_insumos = ttk.Label(top_bar_frame, text="")
        self.label_total_insumos.pack(side='left', padx=(0, 10))
        self.label_total_prestaciones = ttk.Label(top_bar_frame, text="")
        self.label_total_prestaciones.pack(side='left', padx=(0, 10))
        self.label_total_final = ttk.Label(top_bar_frame, text="")
        self.label_total_final.pack(side='left')
        
        self.actualizar_etiquetas_totales()

        # Notebook (Pestañas)
        self.notebook = ttk.Notebook(main_frame)
        self.notebook.pack(fill='both', expand=True)

        # Crear los frames para cada pestaña
        self.frame_inicio = ttk.Frame(self.notebook, padding=(20, 20))
        self.frame_insumos = ttk.Frame(self.notebook, padding=(15, 15))
        self.frame_prestaciones = ttk.Frame(self.notebook, padding=(15, 15))

        # Añadir los frames al notebook como pestañas
        self.notebook.add(self.frame_inicio, text="Datos del Presupuesto")
        self.notebook.add(self.frame_insumos, text="Insumos")
        self.notebook.add(self.frame_prestaciones, text="Prestaciones")

        # Configurar el contenido de cada pestaña
        self.configurar_pestana_inicio()
        self.configurar_pestana_insumos()
        self.configurar_pestana_prestaciones()
    
    def configurar_pestana_inicio(self):
        """Configura los widgets de la pestaña de inicio."""
        # Título principal
        title_label = ttk.Label(self.frame_inicio, 
                                text="Presupuestador Médico", 
                                font=('Arial', 18, 'bold'),
                                foreground=self.primary_color)
        title_label.pack(pady=(20, 40))
        
        # Marco para agrupar los campos del formulario
        form_frame = ttk.LabelFrame(self.frame_inicio, text="Datos del Paciente", padding=(20, 15))
        form_frame.pack(fill='x', padx=50)

        # Campos de formulario con mejor alineación
        ttk.Label(form_frame, text="Nombre y Apellido:").grid(row=0, column=0, sticky="w", pady=5, padx=5)
        self.entry_nombre = ttk.Entry(form_frame, width=40)
        self.entry_nombre.grid(row=0, column=1, pady=5, padx=5, sticky='ew')
        
        ttk.Label(form_frame, text="DNI:").grid(row=1, column=0, sticky="w", pady=5, padx=5)
        self.entry_dni = ttk.Entry(form_frame, width=40)
        self.entry_dni.grid(row=1, column=1, pady=5, padx=5, sticky='ew')
        
        ttk.Label(form_frame, text="Sucursal:").grid(row=2, column=0, sticky="w", pady=5, padx=5)
        self.combo_sucursal = ttk.Combobox(form_frame, values=self.sucursales, state="readonly", width=38)
        self.combo_sucursal.grid(row=2, column=1, pady=5, padx=5, sticky='ew')
        self.combo_sucursal.set("Seleccione una sucursal")
        
        self.dificil_acceso_var = tk.BooleanVar()
        ttk.Checkbutton(form_frame, text="Dificil Acceso", variable=self.dificil_acceso_var).grid(row=3, column=1, sticky="w", pady=10)
        
        form_frame.columnconfigure(1, weight=1)

        # Marco para los botones de navegación
        button_frame = ttk.Frame(self.frame_inicio)
        button_frame.pack(pady=(20, 10))
        
        # NUEVO BOTÓN PARA INICIAR UN NUEVO PRESUPUESTO
        self.btn_nuevo_presupuesto = ttk.Button(button_frame, 
                                                text="Nuevo Presupuesto", 
                                                command=self.iniciar_nuevo_presupuesto,
                                                style='Accent.TButton',
                                                state=tk.DISABLED) # Inicialmente deshabilitado
        self.btn_nuevo_presupuesto.pack(side=tk.LEFT, padx=(0, 20))

        # Botón para guardar y continuar
        ttk.Button(button_frame, 
                   text="Guardar y Continuar", 
                   command=self.guardar_y_continuar,
                   style='Accent.TButton').pack(side=tk.LEFT)

    def configurar_pestana_insumos(self):
        """Configura los widgets de la pestaña de insumos."""
        # Título
        ttk.Label(self.frame_insumos, 
                  text="Selección de Insumos Médicos", 
                  font=('Arial', 14, 'bold'),
                  foreground=self.primary_color).grid(row=0, column=0, columnspan=2, pady=(0, 15))
        
        # Panel izquierdo - Búsqueda
        left_panel = ttk.LabelFrame(self.frame_insumos, text="Buscar Insumos", padding=(10, 10))
        left_panel.grid(row=1, column=0, sticky='nsew', padx=5, pady=5)
        
        ttk.Label(left_panel, text="Filtrar por nombre:").pack(anchor='w', pady=(0, 5))
        self.search_entry = ttk.Entry(left_panel)
        self.search_entry.pack(fill='x', pady=(0, 10))
        self.search_entry.bind("<KeyRelease>", self.filtrar_insumos)
        
        listbox_frame = ttk.Frame(left_panel)
        listbox_frame.pack(fill='both', expand=True)
        
        scrollbar = ttk.Scrollbar(listbox_frame, orient='vertical')
        self.search_listbox = tk.Listbox(listbox_frame, 
                                        yscrollcommand=scrollbar.set,
                                        font=('Arial', 10),
                                        selectbackground=self.accent_color)
        self.search_listbox.pack(side='left', fill='both', expand=True)
        scrollbar.config(command=self.search_listbox.yview)
        scrollbar.pack(side='right', fill='y')
        
        self.filtrar_insumos()
        
        # Controles para agregar
        add_frame = ttk.Frame(left_panel)
        add_frame.pack(fill='x', pady=(10, 0))
        
        ttk.Label(add_frame, text="Cantidad:").pack(side='left', padx=(0, 5))
        self.cantidad_entry = ttk.Entry(add_frame, width=5)
        self.cantidad_entry.insert(0, "1")
        self.cantidad_entry.pack(side='left', padx=(0, 10))
        
        ttk.Button(add_frame, 
                   text="Agregar Insumo", 
                   command=self.agregar_insumo_a_lista,
                   style='Accent.TButton').pack(side='right')
        
        # Panel derecho - Insumos seleccionados
        right_panel = ttk.LabelFrame(self.frame_insumos, text="Insumos Seleccionados", padding=(10, 10))
        right_panel.grid(row=1, column=1, sticky='nsew', padx=5, pady=5)
        
        selected_listbox_frame = ttk.Frame(right_panel)
        selected_listbox_frame.pack(fill='both', expand=True)
        
        scrollbar_selected = ttk.Scrollbar(selected_listbox_frame, orient='vertical')
        self.listbox_seleccion = tk.Listbox(selected_listbox_frame,
                                          yscrollcommand=scrollbar_selected.set,
                                          font=('Arial', 10),
                                          selectbackground=self.accent_color)
        self.listbox_seleccion.pack(side='left', fill='both', expand=True)
        scrollbar_selected.config(command=self.listbox_seleccion.yview)
        scrollbar_selected.pack(side='right', fill='y')
        
        # Cargar insumos previamente seleccionados
        self.actualizar_listbox_insumos()
        
        # Controles para modificar/eliminar
        controls_frame = ttk.Frame(right_panel)
        controls_frame.pack(fill='x', pady=(10, 0))
        
        ttk.Button(controls_frame, 
                   text="Eliminar Selección", 
                   command=self.eliminar_insumo).pack(side='left', padx=(0, 10))
        
        ttk.Label(controls_frame, text="Modificar Cantidad:").pack(side='left', padx=(0, 5))
        self.mod_cantidad_entry = ttk.Entry(controls_frame, width=5)
        self.mod_cantidad_entry.pack(side='left', padx=(0, 5))
        ttk.Button(controls_frame, 
                   text="Actualizar", 
                   command=self.modificar_cantidad).pack(side='left')
        
        self.frame_insumos.rowconfigure(1, weight=1)
        self.frame_insumos.columnconfigure(0, weight=1)
        self.frame_insumos.columnconfigure(1, weight=1)
    
    def configurar_pestana_prestaciones(self):
        """Configura los widgets de la pestaña de prestaciones."""
        ttk.Label(self.frame_prestaciones, 
                 text="Selección de Prestaciones Médicas", 
                 font=('Arial', 14, 'bold'),
                 foreground=self.primary_color).grid(row=0, column=0, columnspan=2, pady=(0, 15))
        
        # Panel superior - Selección de prestador
        top_frame = ttk.LabelFrame(self.frame_prestaciones, text="Selección de Prestador", padding=(10, 10))
        top_frame.grid(row=1, column=0, columnspan=2, sticky='ew', pady=(0, 15))
        
        ttk.Label(top_frame, text="Prestador:").pack(side='left', padx=(0, 10))
        self.combo_prestador = ttk.Combobox(top_frame, values=self.prestadores_list, state="readonly", width=40)
        self.combo_prestador.pack(side='left', padx=(0, 15))
        self.combo_prestador.set("Seleccione un prestador")
        self.combo_prestador.bind("<<ComboboxSelected>>", self.cargar_prestaciones_para_prestador)
        
        # Panel izquierdo - Prestaciones disponibles (Treeview)
        left_panel = ttk.LabelFrame(self.frame_prestaciones, text="Prestaciones Disponibles", padding=(10, 10))
        left_panel.grid(row=2, column=0, sticky='nsew', padx=(0, 10), pady=5)
        
        tree_frame = ttk.Frame(left_panel)
        tree_frame.pack(fill='both', expand=True)
        
        scrollbar_tree = ttk.Scrollbar(tree_frame, orient='vertical')
        self.tree_prestaciones_disponibles = ttk.Treeview(
            tree_frame, 
            columns=("prestacion", "costo", "total_mes", "condicion", "cant_total"),
            show="headings", 
            yscrollcommand=scrollbar_tree.set, 
            selectmode='browse'
        )
        
        self.tree_prestaciones_disponibles.heading("prestacion", text="Prestación", anchor='w')
        self.tree_prestaciones_disponibles.heading("costo", text="Costo", anchor='center')
        self.tree_prestaciones_disponibles.heading("total_mes", text="Total Mes", anchor='center')
        self.tree_prestaciones_disponibles.heading("condicion", text="Condición", anchor='center')
        self.tree_prestaciones_disponibles.heading("cant_total", text="Cant. Tot.", anchor='center')
        
        self.tree_prestaciones_disponibles.column("prestacion", width=200, anchor='w')
        self.tree_prestaciones_disponibles.column("costo", width=80, anchor='center')
        self.tree_prestaciones_disponibles.column("total_mes", width=80, anchor='center')
        self.tree_prestaciones_disponibles.column("condicion", width=100, anchor='center')
        self.tree_prestaciones_disponibles.column("cant_total", width=80, anchor='center')
        
        self.tree_prestaciones_disponibles.pack(side='left', fill='both', expand=True)
        scrollbar_tree.config(command=self.tree_prestaciones_disponibles.yview)
        scrollbar_tree.pack(side='right', fill='y')
        
        # Controles para agregar prestaciones
        add_frame = ttk.Frame(left_panel)
        add_frame.pack(fill='x', pady=(10, 0))
        ttk.Label(add_frame, text="Cantidad:").pack(side='left', padx=(0, 5))
        self.cantidad_prestacion_entry = ttk.Entry(add_frame, width=5)
        self.cantidad_prestacion_entry.insert(0, "1")
        self.cantidad_prestacion_entry.pack(side='left', padx=(0, 15))
        
        ttk.Label(add_frame, text="Valor Asignado:").pack(side='left', padx=(0, 5))
        self.valor_prestacion_entry = ttk.Entry(add_frame, width=10)
        self.valor_prestacion_entry.pack(side='left', padx=(0, 15))
        ttk.Button(add_frame, text="Agregar Prestación", command=self.agregar_prestacion_a_lista, style='Accent.TButton').pack(side='right')

        # Panel derecho - Prestaciones seleccionadas (Treeview modificado)
        right_panel = ttk.LabelFrame(self.frame_prestaciones, text="Prestaciones Seleccionadas", padding=(10, 10))
        right_panel.grid(row=2, column=1, sticky='nsew', padx=(10, 0), pady=5)
        
        selected_frame = ttk.Frame(right_panel)
        selected_frame.pack(fill='both', expand=True)
        
        scrollbar_selected = ttk.Scrollbar(selected_frame, orient='vertical')
        self.tree_prestaciones_seleccionadas = ttk.Treeview(
            selected_frame, 
            columns=("prestacion", "cantidad", "valor_asignado", "subtotal"), 
            show="headings", 
            yscrollcommand=scrollbar_selected.set,
            selectmode='browse'
        )
        self.tree_prestaciones_seleccionadas.heading("prestacion", text="Prestación", anchor='w')
        self.tree_prestaciones_seleccionadas.heading("cantidad", text="Cantidad", anchor='center')
        self.tree_prestaciones_seleccionadas.heading("valor_asignado", text="Valor Asignado", anchor='center')
        self.tree_prestaciones_seleccionadas.heading("subtotal", text="Subtotal", anchor='center')
        
        self.tree_prestaciones_seleccionadas.column("prestacion", width=200, anchor='w')
        self.tree_prestaciones_seleccionadas.column("cantidad", width=80, anchor='center')
        self.tree_prestaciones_seleccionadas.column("valor_asignado", width=100, anchor='center')
        self.tree_prestaciones_seleccionadas.column("subtotal", width=100, anchor='center')
        
        self.tree_prestaciones_seleccionadas.pack(side='left', fill='both', expand=True)
        scrollbar_selected.config(command=self.tree_prestaciones_seleccionadas.yview)
        scrollbar_selected.pack(side='right', fill='y')

        # Cargar las prestaciones seleccionadas previamente
        self.actualizar_treeview_prestaciones()

        # Controles para modificar y eliminar
        controls_frame = ttk.Frame(right_panel)
        controls_frame.pack(fill='x', pady=(10, 0))
        
        ttk.Label(controls_frame, text="Modificar:").pack(side='left', padx=(0, 5))
        ttk.Label(controls_frame, text="Cant.:").pack(side='left', padx=(0, 5))
        self.mod_cantidad_prestacion_entry = ttk.Entry(controls_frame, width=5)
        self.mod_cantidad_prestacion_entry.pack(side='left', padx=(0, 10))
        
        ttk.Label(controls_frame, text="Valor:").pack(side='left', padx=(0, 5))
        self.mod_valor_prestacion_entry = ttk.Entry(controls_frame, width=10)
        self.mod_valor_prestacion_entry.pack(side='left', padx=(0, 10))
        
        ttk.Button(controls_frame, text="Actualizar", command=self.modificar_prestacion_seleccionada).pack(side='left')
        ttk.Button(controls_frame, text="Eliminar", command=self.eliminar_prestacion).pack(side='left', padx=(10, 0))

        # Botón de confirmación
        confirm_frame = ttk.Frame(self.frame_prestaciones)
        confirm_frame.grid(row=3, column=0, columnspan=2, pady=(15, 0))
        
        ttk.Button(confirm_frame, 
                   text="Confirmar y Guardar Todo", 
                   command=self.confirmar_y_guardar_todo,
                   style='Accent.TButton').pack(side='right')

        # Configurar pesos de filas/columnas
        self.frame_prestaciones.rowconfigure(2, weight=1)
        self.frame_prestaciones.columnconfigure(0, weight=1)
        self.frame_prestaciones.columnconfigure(1, weight=1)
    
    # --- Nuevos y modificados métodos para la gestión de prestaciones ---
    def agregar_prestacion_a_lista(self):
        """
        Agrega la prestación seleccionada a la lista de prestaciones.
        """
        seleccion = self.tree_prestaciones_disponibles.selection()
        if not seleccion:
            messagebox.showwarning("Sin selección", "Por favor, seleccione una prestación de la lista.")
            return

        try:
            cantidad = int(self.cantidad_prestacion_entry.get())
            valor_asignado = float(self.valor_prestacion_entry.get())
            if cantidad <= 0 or valor_asignado <= 0:
                messagebox.showwarning("Valores inválidos", "La cantidad y el valor asignado deben ser positivos.")
                return
        except ValueError:
            messagebox.showwarning("Valores inválidos", "Por favor, ingrese números válidos para cantidad y valor asignado.")
            return

        id_servicio = seleccion[0]
        
        item = self.tree_prestaciones_disponibles.item(id_servicio)
        prestacion_nombre = item['values'][0]
        
        found = False
        for i, p in enumerate(self.lista_seleccion_prestaciones):
            if p['id_servicio'] == id_servicio:
                self.lista_seleccion_prestaciones[i] = {
                    'id_servicio': id_servicio,
                    'prestacion': prestacion_nombre,
                    'cantidad': cantidad,
                    'valor_asignado': valor_asignado
                }
                found = True
                break
        
        if not found:
            self.lista_seleccion_prestaciones.append({
                'id_servicio': id_servicio,
                'prestacion': prestacion_nombre,
                'cantidad': cantidad,
                'valor_asignado': valor_asignado
            })

        self.actualizar_treeview_prestaciones()
        self.calcular_y_actualizar_total_prestaciones()
        messagebox.showinfo("Prestación Agregada", f"Se agregó o actualizó {prestacion_nombre} con cantidad {cantidad}.")
    
    def modificar_prestacion_seleccionada(self):
        """
        Modifica la cantidad y el valor de la prestación seleccionada.
        """
        seleccion = self.tree_prestaciones_seleccionadas.selection()
        if not seleccion:
            messagebox.showwarning("Sin selección", "Por favor, seleccione una prestación para modificar.")
            return

        try:
            nueva_cantidad = int(self.mod_cantidad_prestacion_entry.get())
            nuevo_valor = float(self.mod_valor_prestacion_entry.get())
            if nueva_cantidad <= 0 or nuevo_valor <= 0:
                messagebox.showwarning("Valores inválidos", "La cantidad y el valor deben ser positivos.")
                return
        except ValueError:
            messagebox.showwarning("Valores inválidos", "Por favor, ingrese números válidos.")
            return

        item_id = seleccion[0]
        item_index = self.tree_prestaciones_seleccionadas.index(item_id)

        self.lista_seleccion_prestaciones[item_index]['cantidad'] = nueva_cantidad
        self.lista_seleccion_prestaciones[item_index]['valor_asignado'] = nuevo_valor
        
        self.actualizar_treeview_prestaciones()
        self.calcular_y_actualizar_total_prestaciones()
        messagebox.showinfo("Prestación Modificada", "Prestación actualizada correctamente.")

    def eliminar_prestacion(self):
        """
        Elimina la prestación seleccionada del Treeview y la lista interna.
        """
        seleccion = self.tree_prestaciones_seleccionadas.selection()
        if not seleccion:
            messagebox.showwarning("Sin selección", "Por favor, seleccione una prestación para eliminar.")
            return

        respuesta = messagebox.askyesno("Confirmar", "¿Estás seguro de que quieres eliminar esta prestación?")
        if respuesta:
            item_id = seleccion[0]
            item_index = self.tree_prestaciones_seleccionadas.index(item_id)
            del self.lista_seleccion_prestaciones[item_index]
            
            self.actualizar_treeview_prestaciones()
            self.calcular_y_actualizar_total_prestaciones()
            messagebox.showinfo("Prestación Eliminada", "Se eliminó la prestación seleccionada.")
    
    def actualizar_treeview_prestaciones(self):
        """
        Actualiza el Treeview de prestaciones seleccionadas con los datos de la lista.
        """
        # Limpiar la tabla antes de volver a llenarla
        for item in self.tree_prestaciones_seleccionadas.get_children():
            self.tree_prestaciones_seleccionadas.delete(item)

        for p in self.lista_seleccion_prestaciones:
            subtotal = p['cantidad'] * p['valor_asignado']
            self.tree_prestaciones_seleccionadas.insert('', 'end', values=(
                p['prestacion'],
                p['cantidad'],
                f"{p['valor_asignado']:.2f}",
                f"{subtotal:.2f}"
            ), iid=p['id_servicio'])

    def calcular_y_actualizar_total_prestaciones(self):
        """
        Calcula el total de las prestaciones y actualiza la variable y las etiquetas.
        """
        self.total_prestaciones = sum(p['cantidad'] * p['valor_asignado'] for p in self.lista_seleccion_prestaciones)
        self.actualizar_etiquetas_totales()

    def confirmar_y_guardar_todo(self):
        """
        Calcula el costo total de las prestaciones seleccionadas y lo guarda en la base de datos.
        """
        self.guardar_totales_en_bd()
        messagebox.showinfo("Guardado Exitoso", "El presupuesto completo ha sido guardado.")
    
    # Métodos para la gestión de insumos
    def filtrar_insumos(self, event=None):
        """Filtra la lista de insumos disponibles basada en el texto del Entry."""
        filtro = self.search_entry.get().lower()
        self.search_listbox.delete(0, tk.END)
        for insumo, costo in self.insumos_disponibles:
            if filtro in insumo.lower():
                self.search_listbox.insert(tk.END, f"{insumo} - ${costo:.2f}")

    def agregar_insumo_a_lista(self):
        """Agrega el insumo seleccionado a la lista de insumos seleccionados."""
        seleccion = self.search_listbox.curselection()
        if not seleccion:
            messagebox.showwarning("Sin selección", "Por favor, seleccione un insumo de la lista.")
            return

        try:
            cantidad = int(self.cantidad_entry.get())
            if cantidad <= 0:
                messagebox.showwarning("Cantidad inválida", "La cantidad debe ser un número entero positivo.")
                return
        except ValueError:
            messagebox.showwarning("Cantidad inválida", "Por favor, ingrese un número válido para la cantidad.")
            return
            
        indice = seleccion[0]
        texto_insumo = self.search_listbox.get(indice)
        nombre_insumo = texto_insumo.split(" - $")[0]
        
        costo_unitario = 0
        for insumo_original, costo_original in self.insumos_disponibles:
            if insumo_original == nombre_insumo:
                costo_unitario = costo_original
                break
        
        if costo_unitario == 0:
            messagebox.showerror("Error", "No se encontró el costo del insumo seleccionado.")
            return
            
        found = False
        for i, (insumo, _, _) in enumerate(self.lista_seleccion_insumos):
            if insumo == nombre_insumo:
                self.lista_seleccion_insumos[i] = (nombre_insumo, costo_unitario, cantidad)
                found = True
                break
        
        if not found:
            self.lista_seleccion_insumos.append((nombre_insumo, costo_unitario, cantidad))
        
        self.actualizar_listbox_insumos()
        self.calcular_y_actualizar_total_insumos()
        messagebox.showinfo("Insumo Agregado", f"Se agregó {nombre_insumo} con cantidad {cantidad}.")

    def actualizar_listbox_insumos(self):
        """Actualiza el Listbox de insumos seleccionados con los datos de la lista."""
        self.listbox_seleccion.delete(0, tk.END)
        for insumo, costo, cantidad in self.lista_seleccion_insumos:
            self.listbox_seleccion.insert(tk.END, f"{insumo} - Cantidad: {cantidad}, Costo Unitario: ${costo:.2f}")

    def eliminar_insumo(self):
        """Elimina un insumo seleccionado de la lista."""
        seleccion = self.listbox_seleccion.curselection()
        if not seleccion:
            messagebox.showwarning("Sin selección", "Por favor, seleccione un insumo para eliminar.")
            return

        indice = seleccion[0]
        del self.lista_seleccion_insumos[indice]
        self.actualizar_listbox_insumos()
        self.calcular_y_actualizar_total_insumos()
        messagebox.showinfo("Insumo Eliminado", "Se eliminó el insumo seleccionado.")

    def modificar_cantidad(self):
        """Modifica la cantidad de un insumo seleccionado."""
        seleccion = self.listbox_seleccion.curselection()
        if not seleccion:
            messagebox.showwarning("Sin selección", "Por favor, seleccione un insumo para modificar.")
            return
            
        try:
            nueva_cantidad = int(self.mod_cantidad_entry.get())
            if nueva_cantidad <= 0:
                messagebox.showwarning("Cantidad inválida", "La cantidad debe ser un número entero positivo.")
                return
        except ValueError:
            messagebox.showwarning("Cantidad inválida", "Por favor, ingrese un número válido.")
            return
        
        indice = seleccion[0]
        insumo, costo, _ = self.lista_seleccion_insumos[indice]
        self.lista_seleccion_insumos[indice] = (insumo, costo, nueva_cantidad)
        self.actualizar_listbox_insumos()
        self.calcular_y_actualizar_total_insumos()
        messagebox.showinfo("Cantidad Modificada", "Cantidad actualizada correctamente.")

    def calcular_y_actualizar_total_insumos(self):
        """
        Calcula el total de los insumos y actualiza la variable y las etiquetas.
        """
        self.total_insumos = sum(costo * cantidad for _, costo, cantidad in self.lista_seleccion_insumos)
        self.actualizar_etiquetas_totales()

    def guardar_y_continuar(self):
        """
        Valida los campos, guarda los datos iniciales y cambia de pestaña.
        """
        nombre = self.entry_nombre.get()
        dni = self.entry_dni.get()
        sucursal = self.combo_sucursal.get()
        dificil_acceso_bool = self.dificil_acceso_var.get()
        
        dificil_acceso_str = "si" if dificil_acceso_bool else "no"

        if not nombre or not dni or sucursal == "Seleccione una sucursal":
            messagebox.showwarning("Campos vacíos", "Por favor, complete todos los campos.")
            return

        self.presupuesto_id = self.guardar_datos_en_bd(nombre, dni, sucursal, dificil_acceso_str)
        if self.presupuesto_id:
            self.nombre = nombre
            self.dni = dni
            self.sucursal = sucursal
            self.dificil_acceso = dificil_acceso_str
            self.nombre_cliente_actual = nombre # Guardamos el nombre del cliente
            self.notebook.select(self.frame_insumos)
            self.actualizar_etiquetas_totales() # Actualizamos los totales después de guardar los datos.
            
            # Habilitar el botón de nuevo presupuesto
            self.btn_nuevo_presupuesto.config(state=tk.NORMAL)

    def iniciar_nuevo_presupuesto(self):
        """
        Reinicia la aplicación a su estado inicial para un nuevo presupuesto.
        """
        # Reiniciar variables
        self.presupuesto_id = None
        self.lista_seleccion_insumos = []
        self.lista_seleccion_prestaciones = []
        self.nombre_cliente_actual = ""
        self.total_insumos = 0
        self.total_prestaciones = 0
        
        # Limpiar campos de entrada y selección
        self.entry_nombre.delete(0, tk.END)
        self.entry_dni.delete(0, tk.END)
        self.combo_sucursal.set("Seleccione una sucursal")
        self.dificil_acceso_var.set(False)
        
        # Limpiar listbox e treeviews
        self.listbox_seleccion.delete(0, tk.END)
        for item in self.tree_prestaciones_seleccionadas.get_children():
            self.tree_prestaciones_seleccionadas.delete(item)
            
        # Restablecer etiquetas de totales y el nombre del cliente
        self.actualizar_etiquetas_totales()
        
        # Volver a la primera pestaña
        self.notebook.select(self.frame_inicio)
        
        # Deshabilitar el botón de nuevo presupuesto
        self.btn_nuevo_presupuesto.config(state=tk.DISABLED)
        
        messagebox.showinfo("Nuevo Presupuesto", "La aplicación está lista para un nuevo presupuesto.")

    def guardar_datos_en_bd(self, nombre, dni, sucursal, dificil_acceso):
        """Guarda los datos iniciales en la base de datos y retorna el ID."""
        conn = None
        try:
            conn = mysql.connector.connect(**self.db_config)
            cursor = conn.cursor()
            query = """
                INSERT INTO presupuestos (Nombre_Apellido, DNI, Sucursal, dificil_acceso) 
                VALUES (%s, %s, %s, %s)
            """
            datos = (nombre, dni, sucursal, dificil_acceso)
            cursor.execute(query, datos)
            conn.commit()
            
            presupuesto_id = cursor.lastrowid
            
            messagebox.showinfo("Guardado", f"Los datos se han guardado correctamente en la base de datos con ID: {presupuesto_id}.")
            return presupuesto_id
        except mysql.connector.Error as err:
            messagebox.showerror("Error de base de datos", f"Error al guardar los datos: {err}")
            return None
        finally:
            if conn and conn.is_connected():
                cursor.close()
                conn.close()

    def guardar_totales_en_bd(self):
        """Guarda los totales de insumos y prestaciones en la base de datos."""
        conn = None
        try:
            if not self.presupuesto_id:
                messagebox.showerror("Error", "No se encontró el ID del presupuesto.")
                return
            
            conn = mysql.connector.connect(**self.db_config)
            cursor = conn.cursor()
            
            query_update = "UPDATE presupuestos SET total_insumos = %s, total_prestaciones = %s WHERE idPresupuestos = %s"
            cursor.execute(query_update, (self.total_insumos, self.total_prestaciones, self.presupuesto_id))
            conn.commit()
            
        except mysql.connector.Error as err:
            messagebox.showerror("Error de Base de Datos", f"Error al guardar los costos totales: {err}")
        finally:
            if conn and conn.is_connected():
                cursor.close()
                conn.close()

    def actualizar_etiquetas_totales(self):
        """
        Actualiza las etiquetas de los totales en la barra superior.
        """
        total_final = (self.total_insumos or 0) + (self.total_prestaciones or 0)
        
        # ACTUALLIZAR LA ETIQUETA DEL NOMBRE DEL CLIENTE
        if self.nombre_cliente_actual:
            self.label_nombre_cliente.config(text=f"Cliente: {self.nombre_cliente_actual}")
        else:
            self.label_nombre_cliente.config(text="")

        self.label_total_insumos.config(text=f"Total Insumos: ${self.total_insumos:.2f}")
        self.label_total_prestaciones.config(text=f"Total Prestaciones: ${self.total_prestaciones:.2f}")
        self.label_total_final.config(text=f"TOTAL: ${total_final:.2f}")

    # Métodos de base de datos (sin cambios)
    def obtener_sucursales(self):
        """Obtiene las sucursales de la base de datos MySQL."""
        conn = None
        try:
            conn = mysql.connector.connect(**self.db_config)
            cursor = conn.cursor()
            query = "SELECT Sucursales_mh FROM sucursales_mh"
            cursor.execute(query)
            sucursales = [row[0] for row in cursor.fetchall()]
            return sucursales
        except mysql.connector.Error as err:
            messagebox.showerror("Error de conexión", f"No se pudo conectar a la base de datos: {err}")
            return []
        finally:
            if conn and conn.is_connected():
                cursor.close()
                conn.close()

    def obtener_prestadores_db(self):
        """Obtiene los prestadores de la base de datos y los almacena en un mapa."""
        conn = None
        prestadores = {}
        try:
            conn = mysql.connector.connect(**self.db_config)
            cursor = conn.cursor()
            query = "SELECT idobra_social, Prestador FROM prestador"
            cursor.execute(query)
            for id_prestador, nombre in cursor.fetchall():
                prestadores[nombre] = id_prestador
            return prestadores
        except mysql.connector.Error as err:
            messagebox.showerror("Error de Base de Datos", f"Error al obtener prestadores: {err}")
            return {}
        finally:
            if conn and conn.is_connected():
                cursor.close()
                conn.close()
    
    def obtener_prestaciones_para_prestador(self, id_prestador):
        """Obtiene las prestaciones para un prestador específico."""
        conn = None
        prestaciones = []
        try:
            conn = mysql.connector.connect(**self.db_config)
            cursor = conn.cursor()
            query = """
                SELECT ps.id_servicio, s.nombre, ps.costo, ps.total_mes, ps.condicion, ps.cant_total
                FROM prestador_servicio AS ps
                JOIN servicios AS s ON ps.id_servicio = s.id_servicio
                WHERE ps.idobra_social = %s
            """
            cursor.execute(query, (id_prestador,))
            prestaciones = cursor.fetchall()
            return prestaciones
        except mysql.connector.Error as err:
            messagebox.showerror("Error de Base de Datos", f"Error al obtener prestaciones: {err}")
            return []
        finally:
            if conn and conn.is_connected():
                cursor.close()
                conn.close()

    def obtener_insumos_db(self):
        """Obtiene todos los insumos de la base de datos."""
        conn = None
        insumos = []
        try:
            conn = mysql.connector.connect(**self.db_config)
            cursor = conn.cursor()
            query = "SELECT producto, costo FROM insumos"
            cursor.execute(query)
            insumos = cursor.fetchall()
            return insumos
        except mysql.connector.Error as err:
            messagebox.showerror("Error de Base de Datos", f"Error al obtener insumos: {err}")
            return []
        finally:
            if conn and conn.is_connected():
                cursor.close()
                conn.close()

    def cargar_prestaciones_para_prestador(self, event=None):
        """
        Carga las prestaciones en el Treeview cuando se selecciona un prestador.
        """
        prestador_seleccionado = self.combo_prestador.get()
        if prestador_seleccionado and prestador_seleccionado != "Seleccione un prestador":
            id_prestador = self.prestadores_map.get(prestador_seleccionado)
            if id_prestador:
                prestaciones = self.obtener_prestaciones_para_prestador(id_prestador)
                
                # Limpiar el treeview antes de cargar nuevos datos
                for item in self.tree_prestaciones_disponibles.get_children():
                    self.tree_prestaciones_disponibles.delete(item)
                
                # Insertar las prestaciones en el treeview
                for p in prestaciones:
                    self.tree_prestaciones_disponibles.insert('', 'end', values=(p[1:]), iid=p[0])
            else:
                messagebox.showwarning("Prestador no válido", "No se encontró el ID del prestador seleccionado.")


if __name__ == "__main__":
    root = tk.Tk()
    app = Aplicacion(root)
    root.mainloop()