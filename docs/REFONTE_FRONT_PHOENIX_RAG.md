# McCann Bridge — refonte responsive et trajectoire Phoenix/RAG

Le détail du backend, de l'assistant documentaire et du workflow de rapports est dans `ARCHITECTURE_BACKEND_PHOENIX_RAG_RAPPORTS.md`.

## Décision proposée

Construire la nouvelle interface en Phoenix LiveView, avec Phoenix comme autorité sur les comptes, les droits, les clients, les transitions métier et les documents. Garder le prototype React comme référence fonctionnelle pendant une migration par parcours. Ne pas migrer ses jeux de démonstration comme des données de production.

La refonte visuelle et la migration technique sont deux chantiers liés mais vérifiables séparément : le même contrat de design doit fonctionner dans le prototype et dans LiveView, et chaque parcours migré doit être réellement persistant et autorisé avant de remplacer son écran React.

## Constat dans le dépôt

- Un shell mobile existe déjà (`DashboardLayout.jsx` et règles autour de la ligne 4191 de `src/index.css`). Il faut conserver son comportement utile, puis réduire les exceptions CSS dispersées dans la feuille globale.
- Le frontend contient des vues agence et client, mais beaucoup d'écrans utilisent `localStorage`, des données initiales ou des intégrations simulées. Les vues responsive doivent être évaluées avec leurs états vides, chargement, erreur et données longues.
- L'identité et les droits ne sont pas actuellement des garanties côté serveur : rôle sélectionné dans l'interface, routes Express fondées sur un en-tête, règles Firestore largement ouvertes. Les nouveaux écrans Phoenix ne doivent pas réutiliser ces décisions du navigateur.
- L'API IA reçoit actuellement des documents et extraits transmis par le client. La nouvelle chaîne RAG doit rechercher elle-même les sources autorisées et conserver leur provenance.

## Contrat d'interface responsive

1. Définir des jetons communs : couleurs, contraste, typographie, espacements, tailles de champs, états de focus, largeur maximale et densité des tableaux.
2. Conserver une navigation latérale sur grand écran ; sur petit écran, proposer un tiroir accessible avec fermeture par Échap, retour du focus et verrouillage du défilement. La navigation ne décide jamais des droits : elle reflète seulement ceux fournis par Phoenix.
3. Construire les pages d'abord pour 320–390 px, puis vérifier 768 px, 1024 px et grand écran. Les grilles utilisent `minmax(0, 1fr)` et les contenus ne doivent pas imposer de largeur au viewport.
4. Pour les tableaux métier : choisir selon le cas des cartes mobiles avec les champs essentiels, ou un défilement horizontal explicite avec première colonne identifiable. Ne jamais tronquer silencieusement les montants, dates, statuts ou actions.
5. Standardiser formulaires, filtres, onglets, modales, notifications et états de chargement/erreur. Les actions principales restent accessibles au clavier et au toucher ; la validation affiche les erreurs près des champs.
6. Mesurer l'absence de débordement horizontal et vérifier les parcours au clavier sur les pages de référence : connexion, briefs, traffic, validation, rapports, assistant.

## Architecture cible

```text
Navigateur
  └── Phoenix LiveView (shell, pages, formulaires, mises à jour temps réel)
        ├── Accounts / Memberships / ClientScopes
        ├── Briefs / Traffic / Approvals / Reports / Finance
        ├── Documents / Versions / AccessPolicy
        └── Assistant
              ├── Retrieval (recherche filtrée par droits et client)
              ├── Generation (fournisseur externe côté serveur uniquement)
              └── Citations / Audit
                    └── PostgreSQL + stockage des fichiers
```

Phoenix expose des contextes métier et des contrôles d'accès à chaque lecture et mutation. Ecto/PostgreSQL deviennent la source de vérité. LiveView convient aux écrans collaboratifs, formulaires et tableaux ; les graphiques complexes peuvent recevoir un petit composant JavaScript isolé. Un endpoint JSON documenté n'est ajouté que pour des intégrations ou un client externe identifié.

Tables minimales à concevoir avant migration : `users`, `clients`, `memberships`, `briefs`, `tickets`, `approvals`, `documents`, `document_versions`, `report_requests`, `audit_events`, `assistant_conversations`, `assistant_messages`, `knowledge_chunks`. Chaque enregistrement métier porte le client ou un parent permettant de le déterminer. Les identifiants, rôles et client actif proviennent de la session et des droits vérifiés par Phoenix.

## Chaîne RAG gouvernée

1. Dépôt réel d'un fichier, versionnement, statut de validation humaine et extraction de texte. Conserver nom, hash, version, pages, client, périmètre d'accès et auteur. Le texte extrait n'est pas automatiquement publiable dans l'assistant.
2. Découpage et indexation des seules versions approuvées. Commencer par une recherche textuelle PostgreSQL avec filtres de droits. Ajouter les embeddings/pgvector seulement après un jeu d'évaluation mesurant la qualité de recherche ; une recherche lexicale ne doit pas être appelée « sémantique ».
3. À chaque question, Phoenix détermine le client et les sources accessibles, recherche les extraits, puis revérifie leur accès et leur version avant l'envoi au modèle et avant l'affichage. Le navigateur ne peut pas fournir des extraits réputés fiables.
4. Le modèle et sa clé restent côté serveur. Le choix du fournisseur, la conservation des données, les coûts et l'envoi éventuel de documents externes sont configurés explicitement avant activation.
5. Réponse structurée : `answer`, `grounded`, `citations`, `source_version_ids`. Une réponse sans source vérifiée porte `grounded: false` et `citations: []`. Une citation pointe vers la version et la page consultables par cet utilisateur.
6. Journaliser la demande, les sources retenues, la version du prompt et le fournisseur sans recopier inutilement les contenus sensibles. Retirer des résultats historiques toute source devenue inaccessible.

## Lots et critères de sortie

| Lot | Travail | Critère de sortie |
| --- | --- | --- |
| 0 — Contrat | Inventaire des écrans, états et composants ; maquettes mobile/tablette/desktop du shell et du parcours brief → validation | Maquettes validées, règles de composants et matrice de droits écrites |
| 1 — Fondations Phoenix | Application Phoenix, session, comptes, memberships, clients, politiques d'accès, migrations, journal d'audit | Tests d'accès croisé client/agence et de mutation directe réussis |
| 2 — Shell et premier parcours | Design system LiveView, navigation, briefs, tickets et validation | Parcours complet utilisable à 320, 768 et 1440 px, au clavier, avec persistance et erreurs visibles |
| 3 — Documents | Vrais fichiers, versions, extraction et recherche autorisée | Source/version traçables ; aucune donnée de démonstration présentée comme réelle |
| 4 — Assistant et rapports | Recherche filtrée, citations, génération sous contrôle, KPI calculés et rapports validés | Réponses évaluées sur un corpus de test ; PDF fondés sur un snapshot vérifiable et une revue humaine |
| 5 — Autres modules | Influence, calendrier, finance, Ads, Growth et tâches selon usage confirmé | Chaque écran migré a une source de vérité et des intégrations qualifiées comme réelles ou simulées |

## Premier lot à réaliser

Commencer par les maquettes et composants du shell, puis le parcours **brief → ticket → validation**. Ce flux traverse les deux profils et expose rapidement les problèmes de navigation mobile, de droits, de persistance et de collaboration. Avant de couper l'ancien écran, comparer les données et comportements sur un environnement de test ; basculer route par route, avec retour possible au prototype pendant la migration.

## Points à arbitrer avant l'implémentation Phoenix

- Source des comptes et éventuel SSO de l'agence et des clients.
- Liste réelle des clients, marques, rôles et droits de validation.
- Hébergement et politique de conservation des fichiers ; fournisseur IA et conditions d'envoi des documents.
- Parcours prioritaire exact si le flux brief → validation ne correspond pas à l'usage le plus fréquent.
