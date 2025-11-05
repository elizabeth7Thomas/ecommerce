@echo off
REM Script para ejecutar el setup completo de la base de datos

echo ================================================
echo    SETUP DE BASE DE DATOS - ECOMMERCE
echo ================================================
echo.

REM Solicitar contraseña de PostgreSQL
set /p PGPASSWORD="Ingresa la contraseña de PostgreSQL (usuario postgres): "

echo.
echo [1/3] Ejecutando script SQL completo...
echo.

REM Ejecutar el script SQL
psql -U postgres -f "src\script\completo.sql" 2>error.log

if %ERRORLEVEL% EQU 0 (
    echo [OK] Base de datos creada exitosamente
    echo.
    echo [2/3] Insertando roles por defecto...
    call npm run setup:roles
    
    if %ERRORLEVEL% EQU 0 (
        echo [OK] Roles insertados exitosamente
        echo.
        echo [3/3] Iniciando servidor...
        echo.
        node server.js
    ) else (
        echo [ERROR] No se pudieron insertar los roles
        type error.log
    )
) else (
    echo [ERROR] Hubo un problema al ejecutar el script SQL
    type error.log
)

pause
