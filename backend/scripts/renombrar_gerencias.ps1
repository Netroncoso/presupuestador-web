# Renombrar gerencias en backend
Write-Host "Renombrando gerencias en backend..." -ForegroundColor Yellow

# PASO 1: Roles
Get-ChildItem -Path "backend\src" -Filter "*.ts" -Recurse | ForEach-Object {
    (Get-Content $_.FullName -Raw) `
        -replace 'gerencia_administrativa', 'gerencia_prestacional_TEMP' `
        -replace 'gerencia_prestacional', 'gerencia_comercial_TEMP' |
    Set-Content $_.FullName -NoNewline
}

Get-ChildItem -Path "backend\src" -Filter "*.ts" -Recurse | ForEach-Object {
    (Get-Content $_.FullName -Raw) `
        -replace 'gerencia_prestacional_TEMP', 'gerencia_prestacional' `
        -replace 'gerencia_comercial_TEMP', 'gerencia_comercial' |
    Set-Content $_.FullName -NoNewline
}

# PASO 2: Estados
Get-ChildItem -Path "backend\src" -Filter "*.ts" -Recurse | ForEach-Object {
    (Get-Content $_.FullName -Raw) `
        -replace 'pendiente_administrativa', 'pendiente_prestacional_TEMP' `
        -replace 'en_revision_administrativa', 'en_revision_prestacional_TEMP' `
        -replace 'pendiente_prestacional', 'pendiente_comercial_TEMP' `
        -replace 'en_revision_prestacional', 'en_revision_comercial_TEMP' |
    Set-Content $_.FullName -NoNewline
}

Get-ChildItem -Path "backend\src" -Filter "*.ts" -Recurse | ForEach-Object {
    (Get-Content $_.FullName -Raw) `
        -replace 'pendiente_prestacional_TEMP', 'pendiente_prestacional' `
        -replace 'en_revision_prestacional_TEMP', 'en_revision_prestacional' `
        -replace 'pendiente_comercial_TEMP', 'pendiente_comercial' `
        -replace 'en_revision_comercial_TEMP', 'en_revision_comercial' |
    Set-Content $_.FullName -NoNewline
}

# PASO 3: Textos legibles
Get-ChildItem -Path "backend\src" -Filter "*.ts" -Recurse | ForEach-Object {
    (Get-Content $_.FullName -Raw) `
        -replace 'Gerencia Administrativa', 'Gerencia Prestacional_TEMP' `
        -replace 'G\. Administrativa', 'G. Prestacional_TEMP' `
        -replace 'Gerencia Prestacional', 'Gerencia Comercial_TEMP' `
        -replace 'G\. Prestacional', 'G. Comercial_TEMP' |
    Set-Content $_.FullName -NoNewline
}

Get-ChildItem -Path "backend\src" -Filter "*.ts" -Recurse | ForEach-Object {
    (Get-Content $_.FullName -Raw) `
        -replace 'Gerencia Prestacional_TEMP', 'Gerencia Prestacional' `
        -replace 'G\. Prestacional_TEMP', 'G. Prestacional' `
        -replace 'Gerencia Comercial_TEMP', 'Gerencia Comercial' `
        -replace 'G\. Comercial_TEMP', 'G. Comercial' |
    Set-Content $_.FullName -NoNewline
}

# PASO 4: Nombres de funciones
Get-ChildItem -Path "backend\src" -Filter "*.ts" -Recurse | ForEach-Object {
    (Get-Content $_.FullName -Raw) `
        -replace 'requireGerenciaAdministrativa', 'requireGerenciaPrestacional_TEMP' `
        -replace 'requireGerenciaPrestacional', 'requireGerenciaComercial_TEMP' |
    Set-Content $_.FullName -NoNewline
}

Get-ChildItem -Path "backend\src" -Filter "*.ts" -Recurse | ForEach-Object {
    (Get-Content $_.FullName -Raw) `
        -replace 'requireGerenciaPrestacional_TEMP', 'requireGerenciaPrestacional' `
        -replace 'requireGerenciaComercial_TEMP', 'requireGerenciaComercial' |
    Set-Content $_.FullName -NoNewline
}

Write-Host "Backend actualizado" -ForegroundColor Green
