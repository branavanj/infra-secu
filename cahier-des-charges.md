# Cahier des Charges - Projet d'Infrastructure Sécurisé

## I - Contexte et Définition du Projet

### 1. Description du Projet

Ce projet a pour objectif de créer une infrastructure sécurisée pour héberger des applications web internes et externes. L'infrastructure doit inclure des mécanismes robustes d'authentification et de sécurisation, tout en assurant une haute disponibilité et une gestion efficace des incidents de sécurité.

### 2. Périmètre du Projet

Le périmètre du projet comprend :
- Hébergement des applications web internes et externes.
- Mise en place de systèmes d'authentification pour sécuriser les accès.
- Surveillance et gestion des incidents de sécurité.
- Automatisation des déploiements et des configurations.

## II - Cahier des Charges

### 1. Contraintes Techniques de la Solution

#### Tableau des Fonctionnalités

| Fonctionnalité                                | Description                                                                 |
|-----------------------------------------------|-----------------------------------------------------------------------------|
| Authentification SSO                          | Utilisation de LemonLDAP::NG et Apache pour les applications internes.      |
| Authentification JWT                          | Utilisation de JWT pour les applications externes.                          |
| Double Authentification (OTP)                 | Mise en place d'une API OTP en Python Flask pour la double authentification.|
| Validation de Mail                            | Système de validation de mail pour confirmer les adresses email.            |
| Surveillance et Gestion des Incidents         | Utilisation de Wazuh pour la surveillance et la gestion des incidents.      |
| Répartition de Charge et Haute Disponibilité  | Utilisation de HAProxy pour la répartition de charge et la haute disponibilité. |
| Déploiement et Automatisation                 | Utilisation de GitLab pour CI/CD et Ansible pour l'automatisation.          |

#

**Authentification SSO**
- Description : Mise en œuvre d'un système d'authentification unique (SSO) pour les applications internes afin de permettre aux utilisateurs de se connecter une seule fois pour accéder à plusieurs applications. 
- Détails :
  - **Technologies Utilisées** : LemonLDAP::NG, Active Directory, OpenID Connect.
  - **LemonLDAP::NG** : Un logiciel libre de gestion d’authentification unique (SSO) et de fédération d'identités. LemonLDAP::NG permet de centraliser la gestion des sessions utilisateur pour les applications web internes.
  - **Active Directory** : Utilisé comme annuaire d’authentification pour les utilisateurs internes. LemonLDAP::NG s'intègre avec Active Directory pour valider les identifiants de connexion des utilisateurs.
  - **OpenID Connect** : Protocole d'authentification basé sur OAuth 2.0, utilisé pour permettre l’authentification unique via LemonLDAP::NG. OpenID Connect simplifie l’authentification en permettant aux utilisateurs de se connecter à l’aide de leurs identifiants Active Directory.

  **Processus d'Authentification SSO :**
  1. L'utilisateur accède à une application web interne.
  2. L'application redirige l'utilisateur vers LemonLDAP::NG pour l'authentification.
  3. LemonLDAP::NG utilise Active Directory pour vérifier les identifiants de l'utilisateur.
  4. Une fois authentifié, LemonLDAP::NG génère un jeton d'accès OpenID Connect.
  5. L'utilisateur est redirigé vers l'application web avec le jeton d'accès.
  6. L'application web utilise le jeton pour valider l'authentification de l'utilisateur et accorder l'accès.

#

**Authentification JWT**
- Description : Utilisation de JSON Web Tokens (JWT) pour l'authentification des utilisateurs des applications externes, permettant des sessions sécurisées et des échanges d'information fiables.
- Détails :
  - **Technologies Utilisées** : Node.js, Python Flask.
  - **JWT (JSON Web Token)** : Un standard ouvert (RFC 7519) pour la création de tokens d'accès sécurisés. JWT est utilisé pour transférer des informations de manière sécurisée entre un client et un serveur sous forme de JSON.
  - **Node.js** : Utilisé pour implémenter les applications web qui nécessitent une authentification JWT.
  - **Python Flask** : Utilisé pour créer des API qui génèrent et valident les tokens JWT.

  **Processus d'Authentification JWT :**
  1. L'utilisateur accède à l'application web externe et soumet ses identifiants (login/mot de passe).
  2. L'application web envoie les identifiants à une API d'authentification développée en Python Flask.
  3. L'API vérifie les identifiants et, s'ils sont corrects, génère un JWT contenant les informations de l'utilisateur et les permissions associées.
  4. Le JWT est renvoyé au client (navigateur de l'utilisateur).
  5. Le client stocke le JWT (généralement dans le stockage local ou les cookies).
  6. Pour chaque requête ultérieure vers l'application web, le client inclut le JWT dans les en-têtes HTTP Authorization.
  7. L'application web vérifie la validité du JWT pour authentifier l'utilisateur et autoriser l'accès aux ressources protégées.

Cette solution permet une authentification stateless, où les informations d'authentification sont incluses dans le token lui-même, éliminant le besoin de stocker des sessions côté serveur. Le JWT contient des informations sur l'utilisateur, les permissions et une signature pour garantir l'intégrité et l'authenticité du token.


#



**Double Authentification (OTP)**
- Description : Intégration d'une API de génération de code à usage unique (OTP) pour renforcer la sécurité avec une double authentification, demandant un code supplémentaire lors de la connexion.
- Détails :
  - **Technologies Utilisées** : Python Flask, Redis, SMTP (Gmail).
  - **OTP (One-Time Password)** : Un mot de passe temporaire généré pour une seule transaction de connexion. Le code OTP est un code de 6 chiffres.
  - **Python Flask** : Utilisé pour développer l'API de gestion de l'OTP.
  - **Redis** : Utilisé pour stocker temporairement les codes OTP.
  - **SMTP (Gmail)** : Utilisé pour envoyer les codes OTP aux utilisateurs par email.

  **Processus de Double Authentification (OTP) :**
  1. **Génération du Code OTP** :
     - L'utilisateur soumet une demande d'OTP avec son email ou son nom d'utilisateur dans l'en-tête de la requête HTTP.
     - L'API OTP (Python Flask) génère un code OTP de 6 chiffres.
     - L'API envoie le code OTP à l'adresse email associée via un relais SMTP Gmail.
     - Le code OTP est haché et stocké dans Redis avec l'email associé, avec une expiration de 5 minutes.

  2. **Envoi du Code OTP** :
     - L'utilisateur reçoit le code OTP par email.
     - L'utilisateur entre le code OTP reçu dans un formulaire dédié sur l'application web.

  3. **Validation du Code OTP** :
     - L'utilisateur soumet le formulaire avec le code OTP.
     - L'application web envoie le code OTP et l'email associé à l'API OTP pour validation.
     - L'API OTP compare le code haché reçu avec celui stocké dans Redis.
     - Si les codes correspondent et ne sont pas expirés, l'utilisateur est authentifié avec succès.

Cette solution permet de renforcer la sécurité des connexions en ajoutant une couche d'authentification supplémentaire, garantissant que même si les identifiants de l'utilisateur sont compromis, un attaquant ne pourrait pas accéder au compte sans le code OTP temporaire envoyé par email.

#

**Validation de Mail**
- Description : Système de validation d'adresse email pour confirmer l'authenticité des utilisateurs, nécessitant la validation de leur adresse email lors de l'inscription.
- Détails :
  - **Technologies Utilisées** : Node.js, SMTP (Gmail), PostgreSQL.
  - **Node.js** : Utilisé pour développer l'application web et l'API de validation de mail.
  - **SMTP (Gmail)** : Utilisé pour envoyer les emails de validation aux utilisateurs.
  - **PostgreSQL** : Utilisé pour stocker les informations des utilisateurs et l'état de validation de l'email.

  **Processus de Validation de Mail :**
  1. **Inscription de l'Utilisateur** :
     - L'utilisateur s'inscrit sur l'application web en fournissant son adresse email.
     - L'application web enregistre l'utilisateur dans la base de données PostgreSQL avec un statut "non validé".

  2. **Envoi de l'Email de Validation** :
     - L'application web génère un lien de validation unique contenant un jeton de validation.
     - L'application web envoie un email de validation contenant ce lien à l'adresse email fournie par l'utilisateur via un relais SMTP Gmail.

  3. **Validation de l'Email** :
     - L'utilisateur clique sur le lien de validation dans l'email.
     - L'application web reçoit la requête de validation et extrait le jeton de validation.
     - L'application web vérifie le jeton et met à jour le statut de l'utilisateur dans la base de données PostgreSQL à "validé" si le jeton est correct et non expiré.

  4. **Accès aux Services** :
     - Une fois l'email validé, l'utilisateur peut accéder aux services et fonctionnalités de l'application web nécessitant une validation préalable.

Cette solution garantit que les utilisateurs ont fourni une adresse email valide, ce qui aide à prévenir les inscriptions frauduleuses et permet de communiquer efficacement avec les utilisateurs pour des notifications importantes et des réinitialisations de mot de passe.

#



**Surveillance et Gestion des Incidents (SOC)**
- Description : Utilisation d'un Security Operations Center (SOC) basé sur Wazuh pour la surveillance en temps réel de l'infrastructure et la gestion proactive des incidents de sécurité.
- Détails :
  - **Technologies Utilisées** : Wazuh.
  - **Wazuh** : Une solution de sécurité open source pour la surveillance, la détection des menaces et la réponse aux incidents.

  **Processus de Surveillance et Gestion des Incidents :**
  1. **Déploiement de Wazuh** :
     - Installation et configuration de Wazuh Server pour centraliser les données de sécurité.
     - Déploiement d'agents Wazuh sur tous les serveurs et postes de travail pour collecter les logs et surveiller les activités suspectes.

  2. **Collecte et Analyse des Logs** :
     - Les agents Wazuh collectent les logs des systèmes, des applications et des dispositifs réseau.
     - Les logs sont envoyés au serveur Wazuh pour une analyse centralisée.
     - Wazuh utilise des règles de détection pour identifier les événements de sécurité potentiels.

  3. **Détection des Menaces** :
     - Wazuh analyse les logs en temps réel pour détecter des anomalies et des activités suspectes, telles que des tentatives de connexion échouées, des modifications de fichiers système, ou des activités réseau inhabituelles.
     - Lorsque des menaces sont détectées, des alertes sont générées et envoyées aux administrateurs de sécurité.

  4. **Réponse aux Incidents** :
     - Les administrateurs de sécurité analysent les alertes et prennent des mesures appropriées pour répondre aux incidents, comme l'isolement des systèmes compromis, la mise à jour des règles de pare-feu, ou l'application de correctifs de sécurité.
     - Wazuh fournit des outils pour automatiser certaines réponses aux incidents, réduisant ainsi le temps de réaction.

  5. **Rapports et Conformité** :
     - Wazuh génère des rapports détaillés sur les activités de sécurité, les incidents détectés et les mesures prises.
     - Ces rapports aident à assurer la conformité avec les réglementations de sécurité et à identifier les domaines nécessitant des améliorations.

Cette solution permet une surveillance continue et proactive de l'infrastructure, assurant une détection rapide des menaces et une réponse efficace aux incidents de sécurité, tout en fournissant une visibilité complète sur les activités de sécurité.

#

**Répartition de Charge et Haute Disponibilité**
- Description : Mise en place de HAProxy et de Redis Sentinel pour assurer la répartition de charge et la haute disponibilité des services web et des bases de données Redis, minimisant les interruptions de service et assurant une performance optimale.
- Détails :
  - **Technologies Utilisées** : HAProxy, Redis Sentinel.
  - **HAProxy** : Un logiciel open source de répartition de charge (load balancer) et de proxy inverse (reverse proxy) qui distribue le trafic réseau ou applicatif à travers plusieurs serveurs.
  - **Redis Sentinel** : Un système de haute disponibilité pour Redis, qui gère le basculement automatique et la surveillance des instances Redis.

  **Processus de Répartition de Charge et Haute Disponibilité :**
  1. **Configuration de HAProxy** :
     - Installation de HAProxy sur les serveurs dédiés à la répartition de charge.
     - Configuration des règles de répartition de charge pour distribuer le trafic entrant entre les serveurs backend (serveurs d'application et serveurs de base de données).

  2. **Répartition de Charge** :
     - HAProxy surveille le trafic entrant et le distribue aux serveurs backend selon des algorithmes de répartition (round-robin, least connections, etc.).
     - HAProxy équilibre la charge de travail entre les serveurs pour éviter les surcharges et garantir une utilisation efficace des ressources.

  3. **Haute Disponibilité avec HAProxy** :
     - HAProxy surveille en continu l'état des serveurs backend et redirige le trafic vers des serveurs en bonne santé en cas de défaillance.
     - Configuration de clusters HAProxy avec des mécanismes de failover pour assurer une disponibilité continue même en cas de panne d'un des nœuds HAProxy.

  4. **SSL/TLS Termination** :
     - HAProxy gère la terminaison SSL/TLS, déchargeant les serveurs backend de la gestion des connexions sécurisées.
     - HAProxy peut également gérer le renouvellement des certificats SSL/TLS.

  5. **Haute Disponibilité avec Redis Sentinel** :
     - Installation de Redis Sentinel pour surveiller les instances Redis.
     - Redis Sentinel effectue une surveillance en temps réel, détecte les défaillances et effectue un basculement automatique en cas de panne de l'instance Redis principale.
     - Redis Sentinel assure que les clients Redis sont redirigés vers la nouvelle instance principale après un basculement.

  6. **Monitoring et Logging** :
     - Mise en place de systèmes de monitoring pour surveiller la performance de HAProxy, Redis et des serveurs backend.
     - Configuration des logs pour capturer les détails des requêtes et des réponses, facilitant le diagnostic et la résolution des problèmes.


Cette solution assure une distribution efficace du trafic réseau et la haute disponibilité des services web et des bases de données Redis, améliorant les performances et la fiabilité des services tout en garantissant une disponibilité continue grâce à des mécanismes de redondance et de failover.

#



**Déploiement et Automatisation**
- Description : Utilisation de GitLab pour le CI/CD (Continuous Integration/Continuous Deployment) et Ansible pour l'automatisation des déploiements et des configurations, réduisant les erreurs humaines et accélérant les cycles de déploiement.
- Détails :
  - **Technologies Utilisées** : GitLab, Ansible.
  - **GitLab CI/CD** : Un outil intégré dans GitLab pour automatiser l'intégration continue et le déploiement continu. GitLab CI/CD permet de définir des pipelines de déploiement pour automatiser les tests, les constructions et les déploiements des applications.
  - **Ansible** : Un outil d'automatisation open source utilisé pour la gestion de configurations, le déploiement d'applications et l'orchestration de tâches.

  **Processus de Déploiement et Automatisation :**
  1. **Configuration de GitLab CI/CD** :
     - Création de fichiers de pipeline (`.gitlab-ci.yml`) pour définir les étapes du pipeline CI/CD, incluant les tests, les constructions et les déploiements.
     - Configuration des runners GitLab pour exécuter les pipelines.

  2. **Intégration Continue (CI)** :
     - Lorsqu'un développeur pousse du code vers le dépôt GitLab, le pipeline CI est déclenché automatiquement.
     - Le pipeline CI exécute des tests unitaires, des tests d'intégration et des analyses de code pour vérifier la qualité du code.
     - En cas de succès, le code est validé et prêt pour le déploiement.

  3. **Déploiement Continu (CD)** :
     - Le pipeline CD est déclenché après la validation du code par le pipeline CI.
     - Le pipeline CD construit les artefacts de déploiement et les déploie sur les environnements de test, de staging et de production.
     - Les déploiements peuvent inclure des étapes de déploiement bleu/vert ou canari pour minimiser les interruptions de service.

  4. **Automatisation avec Ansible** :
     - Création de playbooks Ansible pour définir les tâches d'automatisation, telles que l'installation de logiciels, la configuration des serveurs et le déploiement des applications.
     - Utilisation d'Ansible pour orchestrer les déploiements et appliquer les configurations sur les serveurs cibles.
     - Ansible assure une gestion cohérente et reproductible des environnements, réduisant les erreurs humaines et améliorant l'efficacité des opérations.

Cette solution permet de garantir des déploiements rapides et fiables, avec une intégration continue pour assurer la qualité du code et une automatisation complète des déploiements et des configurations, améliorant ainsi l'efficacité opérationnelle et réduisant les risques d'erreurs.

#

#### Tableau des Contraintes

| Contrainte                                    | Description                                                                 |
|-----------------------------------------------|-----------------------------------------------------------------------------|
| Infrastructure Réseau                         | Utilisation de pfSense pour le pare-feu et la gestion du réseau.            |
| Langages de Programmation                     | Node.js pour le site web, Python Flask pour les APIs.                       |
| Bases de Données                              | PostgreSQL et Active Directory pour l'authentification.                     |
| Outils de Développement                       | GitLab pour CI/CD, Ansible pour l'automatisation des déploiements.          |

### 2. Configuration Matérielle Minimale Requise pour la Solution

| Composant                  | Configuration Minimale Requise          |
|----------------------------|-----------------------------------------|
| Serveur Web                | Processeur quad-core,4 Go de RAM, 20 Go de stockage |
| Firewall (pfSense)         | Processeur dual-core, 4 Go de RAM, 20 Go de stockage   |
| Serveur de Surveillance    | Processeur quad-core, 8 Go de RAM,  150 Go de stockage |
| Serveur de Base de données | Processeur quad-core, 8 Go de RAM,  150 Go de stockage

### 3. Recommandation Matérielle Minimale en Production

| Composant                  | Configuration Recommandée              |
|----------------------------|-----------------------------------------|
| Serveur Web                | Processeur quad-core, 8 Go de RAM, 50 Go de stockage SSD |
| Serveur de Base de Données | Processeur quad-core, 8 Go de RAM, 50 Go de stockage SSD |
| Firewall (pfSense)         | Processeur quad-core, 6 Go de RAM, 50 Go de stockage SSD  |
| Serveur de Wazuh   | Processeur octa-core, 16 Go de RAM, 200 Go de stockage SSD |

### 4. Logigramme de la Solution

```mermaid
graph TD
    A[Utilisateur] -->|Accès web| B[Application Web Interne/Externe]
    B -->|Authentification| C{Type d'Authentification}
    C -->|SSO| D[LemonLDAP::NG]
    C -->|JWT| E[JWT]
    E -->|OTP| F[API OTP en Python Flask]
    B -->|Validation de Mail| G[Système de Validation de Mail]
    D --> H[Base de Données - Active Directory]
    F --> I[Base de Données - PostgreSQL]
    G --> J[Base de Données - PostgreSQL]
    B --> K[Serveur Web (Node.js)]
    K --> L[Firewall (pfSense)]
    L --> M[HAProxy]
    M --> N[Surveillance (Wazuh)]
    B --> O[CI/CD (GitLab)]
    O --> P[Automatisation (Ansible)]
