# Limpiar _TEMP restantes
Write-Host "Limpiando _TEMP restantes..." -ForegroundColor Yellow

Get-ChildItem -Path "frontend\src" -Include "*.ts","*.tsx" -Recurse | ForEach-Object {
    $content = Get-Content $_.FullName -Raw
    $content = $content -replace 'gerencia_comercial_TEMP', 'gerencia_prestacional'
    $content = $content -replace 'Gerencia Comercial_TEMP', 'Gerencia Prestacional'
    $content = $content -replace 'G\. Comercial_TEMP', 'G. Prestacional'
    $content = $content -replace 'pendiente_comercial_TEMP', 'pendiente_prestacional'
    $content = $content -replace 'en_revision_comercial_TEMP', 'en_revision_prestacional'
    Set-Content $_.FullName $content -NoNewline
}

Write-Host "Limpieza completada" -ForegroundColor Green
