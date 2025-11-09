@echo off
cd /d "c:\Users\Rosquita\Desktop\8vo\Proyecto\ecommerce\src\models"

REM Eliminar archivos problemáticos
del /f /q interaccionesCliente.model.js 2>nul
del /f /q oportunidadesVenta.model.js 2>nul
del /f /q tareasCRM.model.js 2>nul
del /f /q segmentosCliente.model.js 2>nul
del /f /q clienteSegmentos.model.js 2>nul
del /f /q campanasMarketing.model.js 2>nul
del /f /q campanaClientes.model.js 2>nul

echo Archivos eliminados exitosamente
