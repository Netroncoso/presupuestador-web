@echo off
echo ========================================
echo   BACKUP BASE DE DATOS - Presupuestador
echo ========================================
echo.

REM Configurar rutas (ajustar según tu instalación)
set MYSQL_PATH=C:\Program Files\MySQL\MySQL Server 8.0\bin
set BACKUP_DIR=%~dp0
set FECHA=%date:~-4%%date:~3,2%%date:~0,2%
set BACKUP_FILE=%BACKUP_DIR%backup_mh_1_%FECHA%.sql

echo Buscando MySQL...
if exist "%MYSQL_PATH%\mysqldump.exe" (
    echo MySQL encontrado en: %MYSQL_PATH%
    echo.
    echo Creando backup de la base de datos mh_1...
    echo Archivo: %BACKUP_FILE%
    echo.
    
    "%MYSQL_PATH%\mysqldump.exe" -u PRUEBAS -pMedihome2006 --no-tablespaces mh_1 > "%BACKUP_FILE%"
    
    if %ERRORLEVEL% EQU 0 (
        echo.
        echo ========================================
        echo   BACKUP COMPLETADO EXITOSAMENTE
        echo ========================================
        echo Archivo guardado en:
        echo %BACKUP_FILE%
        echo.
        echo Tamaño del archivo:
        dir "%BACKUP_FILE%" | find "backup_mh_1"
    ) else (
        echo.
        echo ========================================
        echo   ERROR AL CREAR BACKUP
        echo ========================================
        echo Verifica las credenciales de MySQL
    )
) else (
    echo.
    echo ERROR: No se encontró MySQL en la ruta especificada
    echo Ruta buscada: %MYSQL_PATH%
    echo.
    echo Por favor, edita este archivo .bat y ajusta la variable MYSQL_PATH
    echo con la ruta correcta de tu instalación de MySQL
    echo.
    echo Rutas comunes:
    echo - C:\Program Files\MySQL\MySQL Server 8.0\bin
    echo - C:\Program Files\MySQL\MySQL Server 5.7\bin
    echo - C:\xampp\mysql\bin
    echo - C:\wamp64\bin\mysql\mysql8.0.x\bin
)

echo.
pause
