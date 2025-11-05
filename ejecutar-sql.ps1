# Script PowerShell para ejecutar el setup de la base de datos

Write-Host "================================================" -ForegroundColor Cyan
Write-Host "   SETUP DE BASE DE DATOS - ECOMMERCE" -ForegroundColor Cyan
Write-Host "================================================" -ForegroundColor Cyan
Write-Host ""

# Solicitar contraseña de PostgreSQL
$password = Read-Host "Ingresa la contraseña de PostgreSQL (usuario postgres)" -AsSecureString
$BSTR = [System.Runtime.InteropServices.Marshal]::SecureStringToBSTR($password)
$plainPassword = [System.Runtime.InteropServices.Marshal]::PtrToStringAuto($BSTR)

Write-Host ""
Write-Host "[1/3] Ejecutando script SQL completo..." -ForegroundColor Yellow
Write-Host ""

# Establecer variable de entorno para la contraseña
$env:PGPASSWORD = $plainPassword

# Ejecutar el script SQL
try {
    psql -U postgres -f "src\script\completo.sql"
    
    if ($LASTEXITCODE -eq 0) {
        Write-Host ""
        Write-Host "[OK] Base de datos creada exitosamente" -ForegroundColor Green
        Write-Host ""
        Write-Host "[2/3] Insertando roles por defecto..." -ForegroundColor Yellow
        
        npm run setup:roles
        
        if ($LASTEXITCODE -eq 0) {
            Write-Host ""
            Write-Host "[OK] Roles insertados exitosamente" -ForegroundColor Green
            Write-Host ""
            Write-Host "[3/3] Iniciando servidor..." -ForegroundColor Yellow
            Write-Host ""
            node server.js
        } else {
            Write-Host ""
            Write-Host "[ERROR] No se pudieron insertar los roles" -ForegroundColor Red
        }
    } else {
        Write-Host ""
        Write-Host "[ERROR] Hubo un problema al ejecutar el script SQL" -ForegroundColor Red
    }
} catch {
    Write-Host ""
    Write-Host "[ERROR] $($_.Exception.Message)" -ForegroundColor Red
} finally {
    # Limpiar la contraseña de la memoria
    Remove-Variable -Name PGPASSWORD -ErrorAction SilentlyContinue
}
