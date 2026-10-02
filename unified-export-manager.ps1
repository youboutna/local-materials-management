# Script Unifié de Gestion des Exports Hexagonaux
# Version 2.0 - Organisation optimisée
# Auteur: System Administrator

# Configuration
$Global:Config = @{
    IndexPath = "./src/hooks/hexagonal/index.ts"
    HooksDir = "./src/hooks/hexagonal"
    BackupDir = "./backups"
    ReportDir = "./reports"
    LogFile = "./export-manager.log"
    ExportStructure = @(
        # ==================== CORE HOOKS ====================
        @{ Name = "Authentication"; Pattern = "Auth" },
        @{ Name = "Projects"; Pattern = "Project" },
        @{ Name = "Suppliers"; Pattern = "Supplier" },
        @{ Name = "Materials"; Pattern = "Material" },
        @{ Name = "Inspections"; Pattern = "Inspection" },
        @{ Name = "Users"; Pattern = "User" },
        @{ Name = "Tasks"; Pattern = "Task" },
        @{ Name = "Documents"; Pattern = "Document" },
        
        # ==================== MANAGEMENT HOOKS ====================
        @{ Name = "Task & Project Management"; Pattern = @("TaskAssignment", "Phase") },
        @{ Name = "Phase Management"; Pattern = @("PhasePayment", "PhaseInspection", "PhaseMonitoring") },
        @{ Name = "Monitoring & Compliance"; Pattern = @("Compliance", "Alert", "Monitoring") },
        @{ Name = "Tenders & Documents"; Pattern = @("Tender", "Estimate") },
        
        # ==================== ENHANCED FEATURES ====================
        @{ Name = "Analytics & KPIs"; Pattern = @("Analytics", "KPI", "Stats") },
        @{ Name = "Payment Management"; Pattern = "Payment" },
        @{ Name = "Quantity Takeoff"; Pattern = @("Takeoff", "Quantity") },
        @{ Name = "Inspection Management"; Pattern = @("InspectionCrud", "InspectionWorkflow") },
        
        # ==================== SUPPLIER PORTAL ====================
        @{ Name = "Supplier Portal"; Pattern = "SupplierPortal" },
        @{ Name = "Unified Supplier Portal"; Pattern = "SupplierAuth" },
        
        # ==================== UTILITY & SELECTORS ====================
        @{ Name = "Utility & Selectors"; Pattern = @("Selector", "Employee", "Stakeholder") },
        
        # ==================== DEV & TESTING ====================
        @{ Name = "Dev & Testing"; Pattern = "DevMode" },
        
        # ==================== SPECIALIZED HOOKS ====================
        @{ Name = "Bank Guarantees"; Pattern = "BankGuarantee" },
        @{ Name = "Insurance"; Pattern = "Insurance" },
        @{ Name = "Milestones"; Pattern = "Milestone" },
        @{ Name = "Project Structure & Details"; Pattern = @("Structure", "Detail") },
        @{ Name = "Progress & Invoices"; Pattern = @("Progress", "Invoice") }
    )
}

# Initialisation
function Initialize-Manager {
    Write-Host "🔧 Initialisation du gestionnaire..." -ForegroundColor Cyan
    
    # Créer les répertoires
    @($Config.BackupDir, $Config.ReportDir) | ForEach-Object {
        if (-not (Test-Path $_)) {
            New-Item -ItemType Directory -Path $_ -Force | Out-Null
            Write-Host "  📁 Créé: $_" -ForegroundColor Gray
        }
    }
    
    # Vérifier les chemins
    if (-not (Test-Path $Config.IndexPath)) {
        Write-Error "❌ Fichier index.ts introuvable: $($Config.IndexPath)"
        return $false
    }
    
    if (-not (Test-Path $Config.HooksDir)) {
        Write-Error "❌ Répertoire des hooks introuvable: $($Config.HooksDir)"
        return $false
    }
    
    return $true
}

# Journalisation
function Write-Log {
    param([string]$Message, [string]$Level = "INFO")
    
    $timestamp = Get-Date -Format "yyyy-MM-dd HH:mm:ss"
    $logEntry = "[$timestamp] [$Level] $Message"
    
    switch ($Level) {
        "ERROR" { Write-Host $logEntry -ForegroundColor Red }
        "WARN"  { Write-Host $logEntry -ForegroundColor Yellow }
        "INFO"  { Write-Host $logEntry -ForegroundColor Cyan }
        default { Write-Host $logEntry -ForegroundColor White }
    }
    
    Add-Content -Path $Config.LogFile -Value $logEntry -ErrorAction SilentlyContinue
}

# Analyser les hooks disponibles
function Get-AvailableHooks {
    Write-Log "Analyse des hooks disponibles..." "INFO"
    
    $hookFiles = Get-ChildItem -Path $Config.HooksDir -Filter "*.ts" -ErrorAction SilentlyContinue
    $availableHooks = @{}
    
    foreach ($file in $hookFiles) {
        try {
            $content = Get-Content $file.FullName -Raw
            $exports = [regex]::Matches($content, "export\s+(?:const|function)\s+(use\w+)")
            
            foreach ($export in $exports) {
                $hookName = $export.Groups[1].Value
                if (-not $availableHooks.ContainsKey($hookName)) {
                    $availableHooks[$hookName] = @{
                        FileName = $file.BaseName
                        FullPath = $file.FullName
                        Exports = @()
                    }
                }
                $availableHooks[$hookName].Exports += $hookName
            }
        } catch {
            Write-Log "Erreur analyse $($file.Name): $_" "ERROR"
        }
    }
    
    Write-Log "✅ $($availableHooks.Count) hooks uniques détectés" "SUCCESS"
    return $availableHooks
}

# Analyser l'index actuel
function Get-CurrentIndexExports {
    Write-Log "Analyse de l'index actuel..." "INFO"
    
    try {
        $content = Get-Content $Config.IndexPath -Raw
        $exports = @{}
        $sections = @{}
        $currentSection = "Non classifié"
        
        # Analyser par ligne
        $lines = $content -split "`n"
        for ($i = 0; $i -lt $lines.Count; $i++) {
            $line = $lines[$i].Trim()
            
            # Détecter les sections
            if ($line -match "// =+ ([^=]+) =+") {
                $currentSection = $matches[1].Trim()
                $sections[$currentSection] = @()
                continue
            }
            
            # Détecter les exports
            if ($line -match "export\s*(type)?\s*\{([^}]+)\}\s*from\s*['""]([^'""]+)['""]") {
                $isType = $matches[1].Success
                $exportsText = $matches[2].Value
                $source = $matches[3].Value
                
                # Extraire chaque export
                $exportItems = $exportsText -split ',' | ForEach-Object { 
                    $item = $_.Trim()
                    if ($item -match " as ") {
                        @{ Original = ($item -split " as ")[0].Trim(); Alias = ($item -split " as ")[1].Trim() }
                    } else {
                        @{ Original = $item; Alias = $null }
                    }
                }
                
                foreach ($item in $exportItems) {
                    $exportName = if ($item.Alias) { $item.Alias } else { $item.Original }
                    
                    if ($exports.ContainsKey($exportName)) {
                        $exports[$exportName].Count++
                        $exports[$exportName].Lines += $i + 1
                        $exports[$exportName].Sources += $source
                    } else {
                        $exports[$exportName] = @{
                            Original = $item.Original
                            Alias = $item.Alias
                            Source = $source
                            IsType = $isType
                            Count = 1
                            Section = $currentSection
                            Lines = @($i + 1)
                            Sources = @($source)
                        }
                    }
                    
                    # Ajouter à la section
                    if ($sections.ContainsKey($currentSection)) {
                        $sections[$currentSection] += $exportName
                    }
                }
            }
        }
        
        Write-Log "✅ $($exports.Count) exports analysés dans $($sections.Count) sections" "SUCCESS"
        return @{ Exports = $exports; Sections = $sections; Content = $content }
    } catch {
        Write-Log "Erreur analyse index: $_" "ERROR"
        return $null
    }
}

# Détecter les problèmes
function Find-Problems {
    param(
        [hashtable]$AvailableHooks,
        [hashtable]$CurrentIndex
    )
    
    $problems = @{
        MissingExports = @()
        DuplicateExports = @()
        InvalidExports = @()
        UnorganizedExports = @()
        SectionIssues = @()
    }
    
    # 1. Hooks manquants
    foreach ($hookName in $AvailableHooks.Keys) {
        if (-not $CurrentIndex.Exports.ContainsKey($hookName)) {
            $problems.MissingExports += @{
                Name = $hookName
                File = $AvailableHooks[$hookName].FileName
            }
        }
    }
    
    # 2. Exports dupliqués
    foreach ($exportName in $CurrentIndex.Exports.Keys) {
        if ($CurrentIndex.Exports[$exportName].Count -gt 1) {
            $problems.DuplicateExports += @{
                Name = $exportName
                Count = $CurrentIndex.Exports[$exportName].Count
                Lines = $CurrentIndex.Exports[$exportName].Lines
                Sources = $CurrentIndex.Exports[$exportName].Sources
            }
        }
    }
    
    # 3. Exports invalides (non trouvés dans les fichiers)
    foreach ($exportName in $CurrentIndex.Exports.Keys) {
        $originalName = $CurrentIndex.Exports[$exportName].Original
        if ($originalName -match "^use" -and -not $AvailableHooks.ContainsKey($originalName)) {
            $problems.InvalidExports += @{
                Name = $exportName
                Original = $originalName
                Source = $CurrentIndex.Exports[$exportName].Source
            }
        }
    }
    
    # 4. Vérifier l'organisation par section
    $definedSections = $Config.ExportStructure.Name
    foreach ($sectionName in $CurrentIndex.Sections.Keys) {
        if ($sectionName -ne "Non classifié" -and $sectionName -notin $definedSections) {
            $problems.SectionIssues += @{
                Section = $sectionName
                Issue = "Section non définie dans la structure"
            }
        }
    }
    
    # 5. Exports non classifiés
    if ($CurrentIndex.Sections.ContainsKey("Non classifié") -and 
        $CurrentIndex.Sections["Non classifié"].Count -gt 0) {
        $problems.UnorganizedExports += @{
            Count = $CurrentIndex.Sections["Non classifié"].Count
            Exports = $CurrentIndex.Sections["Non classifié"]
        }
    }
    
    return $problems
}

# Classer les hooks par section
function Classify-Hooks {
    param([hashtable]$Hooks)
    
    $classified = @{}
    
    foreach ($section in $Config.ExportStructure) {
        $sectionName = $section.Name
        $patterns = if ($section.Pattern -is [array]) { $section.Pattern } else { @($section.Pattern) }
        
        $classified[$sectionName] = @()
        
        foreach ($hookName in $Hooks.Keys) {
            foreach ($pattern in $patterns) {
                if ($hookName -match $pattern) {
                    $classified[$sectionName] += @{
                        Name = $hookName
                        File = $Hooks[$hookName].FileName
                    }
                    break
                }
            }
        }
    }
    
    # Ajouter les non classifiés
    $allClassified = $classified.Values | ForEach-Object { $_.Name }
    $unclassified = $Hooks.Keys | Where-Object { $_ -notin $allClassified }
    
    if ($unclassified.Count -gt 0) {
        $classified["Non classifié"] = @()
        foreach ($hook in $unclassified) {
            $classified["Non classifié"] += @{
                Name = $hook
                File = $Hooks[$hook].FileName
            }
        }
    }
    
    return $classified
}

# Générer le nouvel index organisé
function Generate-OrganizedIndex {
    param(
        [hashtable]$AvailableHooks,
        [hashtable]$CurrentIndex
    )
    
    Write-Log "Génération du nouvel index organisé..." "INFO"
    
    # Classer les hooks
    $classifiedHooks = Classify-Hooks -Hooks $AvailableHooks
    
    # Construire le contenu
    $newContent = @()
    $newContent += "/**"
    $newContent += " * Hexagonal Hooks Index"
    $newContent += " * Central export point for all hexagonal architecture hooks"
    $newContent += " * "
    $newContent += " * This file exports all hexagonal hooks and their types."
    $newContent += " * New hooks are automatically available without manual export updates."
    $newContent += " */"
    $newContent += ""
    
    # Ajouter chaque section
    $totalExports = 0
    
    foreach ($sectionName in $Config.ExportStructure.Name) {
        if ($classifiedHooks[$sectionName] -and $classifiedHooks[$sectionName].Count -gt 0) {
            # Section header
            $newContent += "// $(('=' * 20)) $sectionName $(('=' * 20))"
            
            # Grouper par fichier source
            $hooksByFile = @{}
            foreach ($hook in $classifiedHooks[$sectionName]) {
                $fileName = $hook.File
                if (-not $hooksByFile.ContainsKey($fileName)) {
                    $hooksByFile[$fileName] = @()
                }
                $hooksByFile[$fileName] += $hook.Name
            }
            
            # Ajouter les exports groupés
            foreach ($fileName in $hooksByFile.Keys | Sort-Object) {
                $exports = $hooksByFile[$fileName] | Sort-Object
                if ($exports.Count -gt 0) {
                    $exportLine = "export { " + ($exports -join ", ") + " } from './$fileName';"
                    $newContent += $exportLine
                    $totalExports += $exports.Count
                }
            }
            
            $newContent += ""
        }
    }
    
    # Section des types
    if ($CurrentIndex.Exports.Values | Where-Object { $_.IsType }) {
        $newContent += "// $(('=' * 20)) TYPE EXPORTS $(('=' * 20))"
        
        # Collecter les exports de type
        $typeExports = @{}
        foreach ($export in $CurrentIndex.Exports.Values | Where-Object { $_.IsType }) {
            if (-not $typeExports.ContainsKey($export.Source)) {
                $typeExports[$export.Source] = @()
            }
            $typeExports[$export.Source] += if ($export.Alias) { "$($export.Original) as $($export.Alias)" } else { $export.Original }
        }
        
        foreach ($source in $typeExports.Keys | Sort-Object) {
            $exports = $typeExports[$source] | Sort-Object
            $exportLine = "export type { " + ($exports -join ", ") + " } from '$source';"
            $newContent += $exportLine
        }
        
        $newContent += ""
    }
    
    Write-Log "✅ Nouvel index généré avec $totalExports exports" "SUCCESS"
    return $newContent -join "`r`n"
}

# Appliquer les corrections
function Apply-Corrections {
    param(
        [hashtable]$AvailableHooks,
        [hashtable]$CurrentIndex,
        [hashtable]$Problems
    )
    
    # Créer une sauvegarde
    $backupPath = "$($Config.BackupDir)/index.backup.$(Get-Date -Format 'yyyyMMdd-HHmmss').ts"
    Copy-Item $Config.IndexPath $backupPath -Force
    Write-Log "📦 Sauvegarde créée: $backupPath" "INFO"
    
    # Générer le nouvel index
    $newContent = Generate-OrganizedIndex -AvailableHooks $AvailableHooks -CurrentIndex $CurrentIndex
    
    # Sauvegarder le nouveau contenu
    Set-Content -Path $Config.IndexPath -Value $newContent -NoNewline
    
    # Générer un rapport
    Generate-Report -AvailableHooks $AvailableHooks -CurrentIndex @{ Content = $newContent } -Problems $Problems -Fixed $true
    
    return $true
}

# Générer un rapport
function Generate-Report {
    param(
        [hashtable]$AvailableHooks,
        [hashtable]$CurrentIndex,
        [hashtable]$Problems,
        [bool]$Fixed = $false
    )
    
    $timestamp = Get-Date -Format "yyyyMMdd-HHmmss"
    $reportPath = "$($Config.ReportDir)/export-report-$timestamp.txt"
    
    $report = @"
==================================================
 RAPPORT DE GESTION DES EXPORTS HEXAGONAUX
 Généré le: $(Get-Date -Format 'dd/MM/yyyy HH:mm:ss')
 Statut: $(if ($Fixed) { "CORRIGÉ" } else { "ANALYSE" })
==================================================

📊 STATISTIQUES:
• Hooks disponibles: $($AvailableHooks.Count)
• Exports analysés: $(if ($CurrentIndex.Exports) { $CurrentIndex.Exports.Count } else { "N/A" })
• Sections détectées: $(if ($CurrentIndex.Sections) { $CurrentIndex.Sections.Count } else { "N/A" })

"@
    
    if ($Problems.MissingExports.Count -gt 0) {
        $report += "`n❌ EXPORTS MANQUANTS ($($Problems.MissingExports.Count)):`n"
        foreach ($missing in $Problems.MissingExports) {
            $report += "  • $($missing.Name) (dans $($missing.File).ts)`n"
        }
    }
    
    if ($Problems.DuplicateExports.Count -gt 0) {
        $report += "`n⚠️ EXPORTS DUPLIQUÉS ($($Problems.DuplicateExports.Count)):`n"
        foreach ($dup in $Problems.DuplicateExports) {
            $report += "  • $($dup.Name) ($($dup.Count) fois) - Lignes: $($dup.Lines -join ', ')`n"
        }
    }
    
    if ($Problems.InvalidExports.Count -gt 0) {
        $report += "`n❌ EXPORTS INVALIDES ($($Problems.InvalidExports.Count)):`n"
        foreach ($invalid in $Problems.InvalidExports) {
            $report += "  • $($invalid.Name) (original: $($invalid.Original)) - Source: $($invalid.Source)`n"
        }
    }
    
    # Classement des hooks
    $classified = Classify-Hooks -Hooks $AvailableHooks
    $report += "`n📁 CLASSEMENT DES HOOKS:`n"
    foreach ($section in $classified.Keys) {
        $report += "  [$section]: $($classified[$section].Count) hooks`n"
    }
    
    Set-Content -Path $reportPath -Value $report
    Write-Log "📄 Rapport généré: $reportPath" "SUCCESS"
    
    return $reportPath
}

# Fonction principale
function Invoke-ExportManager {
    param(
        [switch]$Analyze,
        [switch]$Fix,
        [switch]$Monitor
    )
    
    Write-Host "`n🚀 GESTIONNAIRE D'EXPORTS HEXAGONAUX" -ForegroundColor Magenta
    Write-Host "==========================================" -ForegroundColor Magenta
    
    if (-not (Initialize-Manager)) {
        return
    }
    
    # Étape 1: Analyse
    Write-Log "Démarrage de l'analyse..." "INFO"
    
    $availableHooks = Get-AvailableHooks
    $currentIndex = Get-CurrentIndexExports
    
    if (-not $currentIndex) {
        Write-Log "Impossible d'analyser l'index actuel" "ERROR"
        return
    }
    
    # Étape 2: Détection des problèmes
    $problems = Find-Problems -AvailableHooks $availableHooks -CurrentIndex $currentIndex
    
    # Étape 3: Rapport
    $reportPath = Generate-Report -AvailableHooks $availableHooks -CurrentIndex $currentIndex -Problems $problems
    
    # Étape 4: Correction si demandée
    if ($Fix) {
        Write-Log "Application des corrections..." "INFO"
        $success = Apply-Corrections -AvailableHooks $availableHooks -CurrentIndex $currentIndex -Problems $problems
        
        if ($success) {
            Write-Log "✅ Corrections appliquées avec succès!" "SUCCESS"
            
            # Vérifier après correction
            $newIndex = Get-CurrentIndexExports
            $newProblems = Find-Problems -AvailableHooks $availableHooks -CurrentIndex $newIndex
            
            Write-Host "`n📋 RÉSULTAT FINAL:" -ForegroundColor Green
            Write-Host "• Exports manquants résolus: $($problems.MissingExports.Count - $newProblems.MissingExports.Count)" -ForegroundColor White
            Write-Host "• Doublons éliminés: $($problems.DuplicateExports.Count - $newProblems.DuplicateExports.Count)" -ForegroundColor White
            Write-Host "• Organisation optimisée selon la structure définie" -ForegroundColor White
        }
    }
    
    # Étape 5: Monitoring
    if ($Monitor) {
        Write-Log "Mode monitoring activé..." "INFO"
        Write-Host "`n👁️ Surveillance active (Ctrl+C pour arrêter)" -ForegroundColor Yellow
        
        $lastHash = (Get-FileHash $Config.IndexPath -Algorithm MD5).Hash
        
        while ($true) {
            Start-Sleep -Seconds 10
            $currentHash = (Get-FileHash $Config.IndexPath -Algorithm MD5).Hash
            
            if ($currentHash -ne $lastHash) {
                Write-Log "Changement détecté dans index.ts" "WARN"
                Invoke-ExportManager -Analyze
                $lastHash = $currentHash
            }
        }
    }
}

# Menu interactif
function Show-Menu {
    Write-Host "`n🎯 GESTIONNAIRE D'EXPORTS HEXAGONAUX" -ForegroundColor Magenta
    Write-Host "==========================================" -ForegroundColor Magenta
    Write-Host "1. 🔍 Analyser uniquement" -ForegroundColor Cyan
    Write-Host "2. 🔧 Analyser et corriger" -ForegroundColor Yellow
    Write-Host "3. 👁️ Mode monitoring continu" -ForegroundColor Green
    Write-Host "4. 🚪 Quitter" -ForegroundColor Gray
    
    $choice = Read-Host "`nChoisissez une option (1-4)"
    
    switch ($choice) {
        "1" { 
            Invoke-ExportManager -Analyze
            Show-Menu
        }
        "2" { 
            Invoke-ExportManager -Analyze -Fix
            Show-Menu
        }
        "3" { 
            Invoke-ExportManager -Monitor
        }
        "4" { 
            Write-Log "Au revoir!" "INFO"
            exit 0
        }
        default { 
            Write-Log "Option invalide" "ERROR"
            Show-Menu
        }
    }
}

# Point d'entrée principal
if ($args.Count -gt 0) {
    switch ($args[0]) {
        "--analyze" { Invoke-ExportManager -Analyze }
        "--fix"     { Invoke-ExportManager -Analyze -Fix }
        "--monitor" { Invoke-ExportManager -Monitor }
        default {
            Write-Host "Usage: .\export-manager.ps1 [--analyze|--fix|--monitor]" -ForegroundColor Yellow
            exit 1
        }
    }
} else {
    Show-Menu
}