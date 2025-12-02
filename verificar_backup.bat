@echo off
echo ========================================
echo VERIFICACION DE BACKUP - mh_1
echo ========================================
echo.

set BACKUP_FILE=backup_mh_1.sql

if not exist %BACKUP_FILE% (
    echo [ERROR] No se encuentra el archivo %BACKUP_FILE%
    pause
    exit /b 1
)

echo [OK] Archivo encontrado: %BACKUP_FILE%
echo.

echo Tamanio del archivo:
dir %BACKUP_FILE% | findstr backup_mh_1.sql
echo.

echo ========================================
echo Verificando contenido del backup...
echo ========================================
echo.

echo [1/5] Buscando CREATE TABLE...
findstr /C:"CREATE TABLE" %BACKUP_FILE% > nul
if %errorlevel% equ 0 (
    echo [OK] Se encontraron definiciones de tablas
    findstr /C:"CREATE TABLE" %BACKUP_FILE% | find /C "CREATE TABLE"
) else (
    echo [ERROR] No se encontraron CREATE TABLE
)
echo.

echo [2/5] Buscando INSERT INTO...
findstr /C:"INSERT INTO" %BACKUP_FILE% > nul
if %errorlevel% equ 0 (
    echo [OK] Se encontraron datos para insertar
    findstr /C:"INSERT INTO" %BACKUP_FILE% | find /C "INSERT INTO"
) else (
    echo [ADVERTENCIA] No se encontraron INSERT INTO
)
echo.

echo [3/5] Buscando FOREIGN KEY...
findstr /C:"FOREIGN KEY" %BACKUP_FILE% > nul
if %errorlevel% equ 0 (
    echo [OK] Se encontraron Foreign Keys
    findstr /C:"FOREIGN KEY" %BACKUP_FILE% | find /C "FOREIGN KEY"
) else (
    echo [ADVERTENCIA] No se encontraron FOREIGN KEY
)
echo.

echo [4/5] Buscando CREATE INDEX...
findstr /C:"CREATE INDEX" %BACKUP_FILE% > nul
if %errorlevel% equ 0 (
    echo [OK] Se encontraron indices
) else (
    echo [INFO] No se encontraron CREATE INDEX (puede ser normal)
)
echo.

echo [5/5] Verificando tablas principales...
findstr /C:"CREATE TABLE `presupuestos`" %BACKUP_FILE% > nul
if %errorlevel% equ 0 (echo [OK] Tabla presupuestos) else (echo [ERROR] Falta tabla presupuestos)

findstr /C:"CREATE TABLE `usuarios`" %BACKUP_FILE% > nul
if %errorlevel% equ 0 (echo [OK] Tabla usuarios) else (echo [ERROR] Falta tabla usuarios)

findstr /C:"CREATE TABLE `insumos`" %BACKUP_FILE% > nul
if %errorlevel% equ 0 (echo [OK] Tabla insumos) else (echo [ERROR] Falta tabla insumos)

findstr /C:"CREATE TABLE `financiador`" %BACKUP_FILE% > nul
if %errorlevel% equ 0 (echo [OK] Tabla financiador) else (echo [ERROR] Falta tabla financiador)

findstr /C:"CREATE TABLE `sucursales_mh`" %BACKUP_FILE% > nul
if %errorlevel% equ 0 (echo [OK] Tabla sucursales_mh) else (echo [ERROR] Falta tabla sucursales_mh)

echo.
echo ========================================
echo VERIFICACION COMPLETADA
echo ========================================
echo.
echo Si todos los checks son [OK], el backup esta listo para restaurar.
echo.
echo Para restaurar en otra PC:
echo 1. Instalar MySQL 8.0+
echo 2. Crear base de datos: CREATE DATABASE mh_1;
echo 3. Restaurar: mysql -u root -p mh_1 ^< backup_mh_1.sql
echo.
pause
