# LocalStorage Adapters - DEV_MODE Implementation

## 🚀 Architecture DEV_MODE avec LocalStorage

### **Flux DEV_MODE Standard**
```typescript
if (DEV_MODE) {
  // Utiliser les params DEV dans les services pour charger/persister les données
  // Charger depuis /data/mockData.ts
  // Persister dans base embarquée LocalStorage pour tester
  // Simuler les délais avec DEV_CONFIG.mockApiDelay
}
```

### **Structure des Adapters LocalStorage**

#### **📁 /src/infrastructure/localStorage/adapters/**
- **`LocalStorageDocumentAdapter.ts`** : Gestion des documents
- **`LocalStorageSupplierAdapter.ts`** : Gestion des fournisseurs  
- **`LocalStorageInspectionPaymentValidationAdapter.ts`** : Gestion des inspections et paiements

#### **📁 /src/infrastructure/localStorage/**
- **`LocalStorageRepositoryFactory.ts`** : Factory pour les adapters LocalStorage

### **Pattern d'Implémentation**

#### **✅ Fonctionnalités Standard**
1. **Simulation de délais** : `await new Promise(resolve => setTimeout(resolve, 300))`
2. **Mock data initial** : Données pré-configurées pour le développement
3. **Persistence LocalStorage** : Sauvegarde automatique dans `localStorage`
4. **Logs DEV_MODE** : Traçabilité des opérations en mode développement

#### **✅ Méthodes Utilitaires**
```typescript
// Initialisation des données mock
initializeMockData(): void

// Nettoyage des données
clearMockData(): void

// Récupération des données actuelles
getMockData(): T[]
```

### **Intégration dans les Hooks**

#### **🎯 Utilisation dans useDocumentsHex.ts**
```typescript
import { LocalStorageRepositoryFactory } from '@/infrastructure/localStorage/LocalStorageRepositoryFactory';

if (DEV_MODE) {
  const documentRepository = LocalStorageRepositoryFactory.getDocumentRepository();
  const documents = await documentRepository.getAllDocuments();
  // Utiliser les données mock avec persistence LocalStorage
}
```

#### **🎯 Utilisation dans useSuppliersHex.ts**
```typescript
if (DEV_MODE) {
  const supplierRepository = LocalStorageRepositoryFactory.getSupplierRepository();
  const suppliers = await supplierRepository.searchSuppliers(query, category);
  // Utiliser les données mock avec persistence LocalStorage
}
```

### **Clés LocalStorage Utilisées**

#### **📋 Stockage des Données**
- **`dev_documents`** : Tableau des documents
- **`dev_suppliers`** : Tableau des fournisseurs
- **dev_inspections`** : Tableau des inspections
- **`dev_payment_requests`** : Tableau des demandes de paiement
- **`dev_projects`** : Tableau des projets

### **Avantages du Pattern**

#### **🚀 Bénéfices**
1. **Développement Offline** : Pas besoin de connexion BDD
2. **Persistence Session** : Données conservées pendant la session
3. **Tests Réels** : Comportement identique à la production
4. **Débogage Facile** : Données visibles dans les outils de développement
5. **Performance** : Accès instantané aux données

### **Configuration DEV_MODE**

#### **⚙️ Variables d'Environnement**
```typescript
// Dans config/constants.ts
export const DEV_MODE = process.env.NODE_ENV === 'development';
export const DEV_CONFIG = {
  mockApiDelay: 300, // ms
  localStorageKey: 'dev_',
  enableLogs: true
};
```

### **Exemple d'Utilisation Complète**

#### **🎯 Hook Complet avec DEV_MODE**
```typescript
export function useDocumentsHex(): UseDocumentsHexResult {
  const queryClient = useQueryClient();
  
  let documentRepository;
  
  if (DEV_MODE) {
    // Mode développement : LocalStorage
    documentRepository = LocalStorageRepositoryFactory.getDocumentRepository();
  } else {
    // Production : Supabase
    documentRepository = RepositoryFactory.getDocumentRepository();
  }
  
  const documentService = new DocumentService(documentRepository);
  
  // Utilisation du service avec le bon adapter
  const { data: documents = [], isLoading, error, refetch } = useQuery({
    queryKey: ['documents'],
    queryFn: async () => {
      if (DEV_MODE) {
        // Flux DEV_MODE avec LocalStorage
        const documents = await documentService.getAllDocuments();
        return DocumentMapper.toResponseDtoArray(documents);
      } else {
        // Flux production normal
        const documents = await documentService.getAllDocuments();
        return DocumentMapper.toResponseDtoArray(documents);
      }
    },
    staleTime: 5 * 60 * 1000,
  });
  
  // ... reste du hook
}
```

### **Conclusion**

Les adapters LocalStorage permettent un développement efficace avec :
- **Données réelles** et persistantes
- **Architecture identique** à la production  
- **Tests complets** sans dépendances externes
- **Débogage simplifié** avec accès direct aux données

**Architecture hexagonale centralisée 🚀 - DEV_MODE LocalStorage opérationnel**
