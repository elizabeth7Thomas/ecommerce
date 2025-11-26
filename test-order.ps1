# Test script for order creation

# Step 1: Get authentication token
$loginBody = @{
    correo_electronico = "ale@example.com"
    contrasena = "password123"
} | ConvertTo-Json

$loginResp = Invoke-RestMethod -Uri "http://localhost:3000/api/auth/login" `
    -Method Post `
    -ContentType "application/json" `
    -Body $loginBody

$token = $loginResp.data.token
Write-Host "✓ Token obtained: $($token.Substring(0, 20))...`n"

# Step 2: Create order
$orderBody = @{
    id_direccion_envio = 17
    notas_orden = "Entrega urgente"
} | ConvertTo-Json

Write-Host "Creating order..."
$orderResp = Invoke-RestMethod -Uri "http://localhost:3000/api/ordenes" `
    -Method Post `
    -ContentType "application/json" `
    -Body $orderBody `
    -Headers @{"Authorization" = "Bearer $token"}

Write-Host "Response:`n"
$orderResp | ConvertTo-Json -Depth 10
