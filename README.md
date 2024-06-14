# Projet d'Infrastructure Sécurisée

Ce projet vise à créer une infrastructure sécurisée comprenant un extranet, une API OTP pour la double authentification en Python Flask, un intranet avec authentification SSO via LemonLDAP, une API d'habilitation et un SOC basé sur Wazuh. Le projet inclut également des modes de déploiement et d'automatisation.

## Table des Matières

1. [Fonctionnalités](#fonctionnalités)
2. [Prérequis](#prérequis)
3. [Installation](#installation)
4. [Utilisation](#utilisation)
   - [Extranet](#extranet)
   - [API OTP](#api-otp)
   - [Intranet](#intranet)
   - [SOC Wazuh](#soc-wazuh)
5. [Déploiement et Automatisation](#déploiement-et-automatisation)
6. [Contribuer](#contribuer)
7. [Licence](#licence)

## Fonctionnalités

### Extranet
- Portail sécurisé permettant aux utilisateurs externes de se connecter et d'interagir avec les services de l'entreprise.

### API OTP
- Implémentée en Python Flask pour gérer la double authentification. Utilise des jetons OTP pour renforcer la sécurité lors des connexions utilisateur.

### Intranet
- Authentification SSO (Single Sign-On) via LemonLDAP::NG, permettant aux utilisateurs internes d'accéder aux ressources internes de manière sécurisée et simplifiée.

### API d'Habilitation
- API permettant de gérer les permissions et les rôles des utilisateurs au sein de l'infrastructure.

### SOC (Security Operations Center)
- Implémenté avec Wazuh pour la surveillance, la détection des menaces et la gestion des incidents de sécurité.

## Prérequis

- Python 3.8+
- Flask
- LemonLDAP::NG
- Wazuh

## Installation

1. Clonez le dépôt :
   ```sh
   git clone https://github.com/branavanj/infra-secu.git
   cd infra-secu
