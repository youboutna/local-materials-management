import { ProjectData } from "@/dtos/types/project";

export const allProjectsData: ProjectData[] = [
            {
                "id": "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
                "title": "Construction d'un Centre de Santé à El Mina",
                "description": "Travaux de construction d'un centre de santé type B dans le quartier d'El Mina",
                "location": "El Mina, Nouakchott",
                "budget": 45000000,
                "startDate": "2025-03-01",
                "endDate": "2025-11-30",
                "teamSize": 8,
                coordinates:{"latitude": 18.0865,"longitude": -15.975},
                "financingSource": "État",
                "marketType": "Public",
                "selectionMode": "Appel d'offres",
                "launchDate": "2025-01-20",
                "attributionDate": "2025-02-15",
                "projectReference": "PRJ-SANTE-2025-001",
                "mainContractor": "Société des Bâtiments Modernes SARL",
                "allowsInitialPayment": true,
                "initialPaymentPercentage": 20,
                "status": "attribué",
                "progress": 0,
                "category": "Santé",
                "subCategory": "Infrastructure sanitaire",
                "priorityLevel": "Élevée",
                "riskLevel": "Moyen",
                "environmentalImpact": "Faible",
                "sustainabilityScore": 75,
                "documents": [
                    {
                        "name": "ATT_DEF_26062025.pdf",
                        "type": "Dossier d'attribution",
                        "url": "https://marchespublics.gov.mr/documents/ATT_DEF_26062025.pdf",
                        "uploadDate": "2025-01-10"
                    }
                ],
                "milestones": [
                    {
                        "name": "Préparation du terrain",
                        "plannedDate": "2025-03-15",
                        "actualDate": null,
                        "status": "planned"
                    }
                ],
                "inspections": [],
                "stakeholders": [
                    {
                        "name": "Dr. Mohamed Ould Salem",
                        "email": "m.salem@sante.gov.mr",
                        "phone": "+22212345679",
                        "role": "Chef de projet ministériel",
                        "organization": "Ministère de la Santé",
                        "isPrimary": true
                    }
                ]
            },
            {
                "id": "b2c3d4e5-f6g7-8901-bcde-f23456789012",
                "title": "Construction de l'École ENTIC Nouadhibou",
                "description": "Travaux de construction de l'École de la Nouvelle Technologie, de l'Information et de la Communication",
                "location": "Nouadhibou",
                "budget": 120000000,
                "startDate": "2025-04-01",
                "endDate": "2026-06-30",
                "teamSize": 15,
                coordinates:{"latitude": 20.9344,
                "longitude": -17.0378},
                "financingSource": "État",
                "marketType": "Public",
                "selectionMode": "Appel d'offres",
                "launchDate": "2025-02-01",
                "attributionDate": "2025-03-15",
                "projectReference": "PRJ-EDU-2025-002",
                "mainContractor": "BTP Mauritanie SA",
                "allowsInitialPayment": true,
                "initialPaymentPercentage": 15,
                "status": "en cours",
                "progress": 10,
                "category": "Éducation",
                "subCategory": "Enseignement supérieur",
                "priorityLevel": "Très élevée",
                "riskLevel": "Moyen",
                "environmentalImpact": "Modéré",
                "sustainabilityScore": 80,
                "documents": [
                    {
                        "name": "Dossier_ENTIC_Nouadhibou.pdf",
                        "type": "Dossier d'appel d'offres",
                        "url": "https://marchespublics.gov.mr/documents/ENTIC_Nouadhibou.pdf",
                        "uploadDate": "2025-01-15"
                    }
                ],
                "milestones": [
                    {
                        "name": "Fondations",
                        "plannedDate": "2025-05-15",
                        "actualDate": null,
                        "status": "in_progress"
                    }
                ],
                "inspections": [
                    {
                        "inspectionDate": "2025-04-20",
                        "inspector": "Ahmed Ould Beya",
                        "status": "completed",
                        "progressAtInspection": 8,
                        "comments": "Travaux conformes, bon avancement",
                        "issues": [],
                        "recommendations": [
                            "Respecter le planning initial"
                        ],
                        id: "",
                        project_id: "",
                        date: "",
                        progress_at_inspection: 0,
                        created_at: "",
                        updated_at: ""
                    }
                ],
                "stakeholders": [
                    {
                        "name": "M. Ali Ould Mohamed",
                        "email": "a.mohamed@mhuat.gov.mr",
                        "phone": "+22223456789",
                        "role": "Responsable technique",
                        "organization": "Ministère de l'Habitat",
                        "isPrimary": true
                    }
                ]
            },
            {
                "id": "c3d4e5f6-g7h8-9012-cdef-345678901234",
                "title": "PGASED - Construction de deux écoles à Boutilimit",
                "description": "Construction de deux écoles complètes dans les localités de Lahouach et nouveau quartier",
                "location": "Boutilimit",
                "budget": 85000000,
                "startDate": "2025-03-15",
                "endDate": "2025-12-15",
                "teamSize": 12,
                coordinates:{"latitude": 17.5333,
                "longitude": -14.7},
                "financingSource": "Partenaire international",
                "marketType": "Public",
                "selectionMode": "Appel d'offres",
                "launchDate": "2025-01-10",
                "attributionDate": "2025-02-28",
                "projectReference": "PRJ-PGASED-2025-003",
                "mainContractor": "Groupe Immobilier du Trarza",
                "allowsInitialPayment": true,
                "initialPaymentPercentage": 18,
                "status": "en cours",
                "progress": 20,
                "category": "Éducation",
                "subCategory": "Enseignement primaire",
                "priorityLevel": "Élevée",
                "riskLevel": "Faible",
                "environmentalImpact": "Faible",
                "sustainabilityScore": 85,
                "documents": [
                    {
                        "name": "AAP_PPM_MHUAT_Lots.pdf",
                        "type": "Avis d'appel à propositions",
                        "url": "https://marchespublics.gov.mr/documents/AAP_PPM_MHUAT_Lots.pdf",
                        "uploadDate": "2024-12-15"
                    }
                ],
                "milestones": [
                    {
                        "name": "École Lahouach - Gros œuvre",
                        "plannedDate": "2025-05-30",
                        "actualDate": null,
                        "status": "in_progress"
                    }
                ],
                "inspections": [
                    {
                        id: "c3d4e5f6-g7t8-8012-cdef-345678901234",
                        project_id: "c3d4e5f6-g7h8-9012-cdef-345678901234",
                        date: "2025-04-10",
                        progress_at_inspection: 0,
                        created_at: "2025-04-10",
                        updated_at: "2025-10-10",
                        "inspector": "Fatimetou Mint Ahmed",
                        "status": "completed",
                        "progressAtInspection": 15,
                        "comments": "Respect des normes techniques",
                        "issues": [
                            "Retard léger sur le planning"
                        ],
                        "recommendations": [
                            "Renforcer l'équipe de travail"
                        ],

                    }
                ],
                "stakeholders": [
                    {
                        "name": "M. Sidi Ould Ahmed",
                        "email": "s.ahmed@pgased.mr",
                        "phone": "+22234567890",
                        "role": "Coordinateur PGASED",
                        "organization": "Programme PGASED",
                        "isPrimary": true
                    }
                ]
            },
            {
                "id": "d4e5f6g7-h8i9-0123-defg-456789012345",
                "title": "Construction Centre de Santé type B - Tarhil/Toujounine",
                "description": "Construction d'un centre de santé type B dans le secteur de Tarhil 19",
                "location": "Tarhil/Toujounine, Nouakchott",
                "budget": 38000000,
                "startDate": "2025-05-01",
                "endDate": "2025-11-30",
                "teamSize": 6,
                coordinates:{"latitude": 18.12,
                "longitude": -15.95},
                "financingSource": "État",
                "marketType": "Public",
                "selectionMode": "Appel d'offres",
                "launchDate": "2025-02-15",
                "attributionDate": "2025-04-01",
                "projectReference": "PRJ-SANTE-2025-004",
                "mainContractor": "Société Médico-Bâtiment SARL",
                "allowsInitialPayment": true,
                "initialPaymentPercentage": 20,
                "status": "attribué",
                "progress": 0,
                "category": "Santé",
                "subCategory": "Infrastructure sanitaire",
                "priorityLevel": "Élevée",
                "riskLevel": "Faible",
                "environmentalImpact": "Faible",
                "sustainabilityScore": 78,
                "documents": [
                    {
                        "name": "Avis_Attribution_Lot09.pdf",
                        "type": "Avis d'attribution",
                        "url": "https://marchespublics.gov.mr/documents/Avis_Attribution_Lot09.pdf",
                        "uploadDate": "2025-03-20"
                    }
                ],
                "milestones": [
                    {
                        "name": "Début des travaux",
                        "plannedDate": "2025-05-01",
                        "actualDate": null,
                        "status": "planned"
                    }
                ],
                "inspections": [],
                "stakeholders": [
                    {
                        "name": "Dr. Aichetou Mint Mohamed",
                        "email": "a.mohamed@sante.gov.mr",
                        "phone": "+22245678901",
                        "role": "Chef de projet santé",
                        "organization": "Ministère de la Santé",
                        "isPrimary": true
                    }
                ]
            },
            {
                "id": "e5f6g7h8-i9j0-1234-efgh-567890123456",
                "title": "Construction Hôtel de Ville de Nouadhibou",
                "description": "Travaux de construction d'un hôtel de ville à proximité de l'hôpital des spécialités",
                "location": "Nouadhibou",
                "budget": 95000000,
                "startDate": "2025-06-01",
                "endDate": "2026-03-31",
                "teamSize": 18,
                coordinates:{ "latitude": 20.95,
                "longitude": -17.02},
                "financingSource": "Collectivité locale",
                "marketType": "Public",
                "selectionMode": "Appel d'offres",
                "launchDate": "2025-03-01",
                "attributionDate": "2025-05-15",
                "projectReference": "PRJ-ADMIN-2025-005",
                "mainContractor": "Nouadhibou Bâtiment SA",
                "allowsInitialPayment": true,
                "initialPaymentPercentage": 15,
                "status": "attribué",
                "progress": 0,
                "category": "Administration",
                "subCategory": "Infrastructure publique",
                "priorityLevel": "Moyenne",
                "riskLevel": "Moyen",
                "environmentalImpact": "Modéré",
                "sustainabilityScore": 70,
                "documents": [
                    {
                        "name": "Avis_Relance_HotelVille.pdf",
                        "type": "Avis de relance",
                        "url": "https://marchespublics.gov.mr/documents/Avis_Relance_HotelVille.pdf",
                        "uploadDate": "2025-02-10"
                    }
                ],
                "milestones": [
                    {
                        "name": "Préparation du chantier",
                        "plannedDate": "2025-06-15",
                        "actualDate": null,
                        "status": "planned"
                    }
                ],
                "inspections": [],
                "stakeholders": [
                    {
                        "name": "M. Mohamed Ould Abdel Aziz",
                        "email": "m.abdelaziz@nouadhibou.mr",
                        "phone": "+22256789012",
                        "role": "Représentant de la Wilaya",
                        "organization": "Wilaya de Nouadhibou",
                        "isPrimary": true
                    }
                ]
            },
            {
                "id": "f6g7h8i9-j0k1-2345-fghi-678901234567",
                "title": "Supervision des travaux PGASED - Boutilimit",
                "description": "Mission de suivi, coordination et supervision des travaux du programme PGASED",
                "location": "Boutilimit",
                "budget": 12000000,
                "startDate": "2025-03-01",
                "endDate": "2026-02-28",
                "teamSize": 4,
               coordinates:{ "latitude": 17.5333,
                "longitude": -14.7},
                "financingSource": "Partenaire international",
                "marketType": "Public",
                "selectionMode": "Consultation",
                "launchDate": "2025-01-20",
                "attributionDate": "2025-02-25",
                "projectReference": "PRJ-SUPERV-2025-006",
                "mainContractor": "Bureau d'Études Techniques Mauritanie",
                "allowsInitialPayment": false,
                "initialPaymentPercentage": 0,
                "status": "en cours",
                "progress": 30,
                "category": "Éducation",
                "subCategory": "Supervision de projets",
                "priorityLevel": "Moyenne",
                "riskLevel": "Faible",
                "environmentalImpact": "Nul",
                "sustainabilityScore": 90,
                "documents": [
                    {
                        "name": "PPGASDL_Suivi_Travaux.pdf",
                        "type": "Dossier de consultation",
                        "url": "https://marchespublics.gov.mr/documents/PPGASDL_Suivi_Travaux.pdf",
                        "uploadDate": "2024-12-20"
                    }
                ],
                "milestones": [
                    {
                        "name": "Premier rapport de supervision",
                        "plannedDate": "2025-04-15",
                        "actualDate": "2025-04-10",
                        "status": "completed"
                    }
                ],
                "inspections": [
                    {"id": "f6g7h8i9-j0k1-2345-fghi-678901234547",
                        project_id:"f6g7h8i9-j0k1-2345-fghi-678901234567",
                        "date": "2025-04-05",
                        "created_at": "2025-04-05",
                        "updated_at": "2025-04-05",
                        "inspector": "Mariem Mint Sidi",
                        "status": "completed",
                        "progress_at_inspection": 25,
                        "comments": "Mission de supervision efficace",
                        "issues": [],
                        "recommendations": [
                            "Maintenir la fréquence des visites"
                        ]
                    }
                ],
                "stakeholders": [
                    {
                        "name": "M. Abdallahi Ould Sidi",
                        "email": "a.sidi@consulting.mr",
                        "phone": "+22267890123",
                        "role": "Superviseur principal",
                        "organization": "Bureau d'Études Techniques Mauritanie",
                        "isPrimary": true
                    }
                ]
            },
            {
                "id": "g7h8i9j0-k1l2-3456-ghij-789012345678",
                "title": "Supervision Centres de Santé Nouakchott",
                "description": "Mission de suivi et supervision des travaux de construction de centres de santé sur plusieurs sites",
                "location": "Nouakchott (El Bassra, Elkouva, Sebkha, El Mina)",
                "budget": 15000000,
                "startDate": "2025-02-01",
                "endDate": "2025-12-31",
                "teamSize": 5,
                coordinates:{"latitude": 18.0865,
                "longitude": -15.9582},
                "financingSource": "Agence de développement",
                "marketType": "Public",
                "selectionMode": "Consultation",
                "launchDate": "2024-11-15",
                "attributionDate": "2025-01-20",
                "projectReference": "PRJ-SUPERV-SANTE-2025-007",
                "mainContractor": "ADU Consulting Group",
                "allowsInitialPayment": false,
                "initialPaymentPercentage": 0,
                "status": "en cours",
                "progress": 45,
                "category": "Santé",
                "subCategory": "Supervision de projets",
                "priorityLevel": "Élevée",
                "riskLevel": "Faible",
                "environmentalImpact": "Nul",
                "sustainabilityScore": 88,
                "documents": [
                    {
                        "name": "AMI01CPMPADU2024.pdf",
                        "type": "Dossier d'appel à manifestation",
                        "url": "https://marchespublics.gov.mr/documents/AMI01CPMPADU2024.pdf",
                        "uploadDate": "2024-10-30"
                    }
                ],
                "milestones": [
                    {
                        "name": "Rapport intermédiaire de supervision",
                        "plannedDate": "2025-05-31",
                        "actualDate": null,
                        "status": "in_progress"
                    }
                ],
                "inspections": [
                    {
                        "id": "a6g7h8i9-j0k1-2345-fghi-678901234547",
                        project_id:"g7h8i9j0-k1l2-3456-ghij-789012345678",
                        "date": "2025-03-20",
                        "created_at": "2025-03-05",
                        "updated_at": "2025-04-05",
                        "inspector": "Ahmed Ould Mohamed Mahmoud",
                        "status": "completed",
                        "progress_at_inspection": 35,
                        "comments": "Bon suivi des différents chantiers",
                        "issues": [
                            "Retards sur le site d'El Bassra"
                        ],
                        "recommendations": [
                            "Coordination renforcée avec les entreprises"
                        ]
                    }
                ],
                "stakeholders": [
                    {
                        "name": "M. Cheikh Ould Mohamed",
                        "email": "c.mohamed@adu.mr",
                        "phone": "+22278901234",
                        "role": "Coordinateur ADU",
                        "organization": "Agence de Développement Urbain",
                        "isPrimary": true
                    }
                ]
            },
            {
                "id": "h8i9j0k1-l2m3-4567-hijk-890123456789",
                "title": "PGASED - Infrastructures éducatives Trarza",
                "description": "Construction d'écoles primaires et extension du collège de Boutilimit",
                "location": "Trarza, Boutilimit, Bir Tourse",
                "budget": 110000000,
                "startDate": "2025-04-15",
                "endDate": "2026-01-31",
                "teamSize": 20,
                coordinates :{"latitude": 17.5333,
                "longitude": -14.7},
                "financingSource": "Partenaire international",
                "marketType": "Public",
                "selectionMode": "Appel d'offres",
                "launchDate": "2025-01-30",
                "attributionDate": "2025-03-20",
                "projectReference": "PRJ-PGASED-2025-008",
                "mainContractor": "Groupe BTP du Trarza",
                "allowsInitialPayment": true,
                "initialPaymentPercentage": 20,
                "status": "en cours",
                "progress": 15,
                "category": "Éducation",
                "subCategory": "Infrastructure éducative",
                "priorityLevel": "Élevée",
                "riskLevel": "Moyen",
                "environmentalImpact": "Modéré",
                "sustainabilityScore": 82,
                "documents": [
                    {
                        "name": "PPM_MHUAT_Planning_Lots.pdf",
                        "type": "Planning des lots",
                        "url": "https://marchespublics.gov.mr/documents/PPM_MHUAT_Planning_Lots.pdf",
                        "uploadDate": "2025-01-05"
                    }
                ],
                "milestones": [
                    {
                        "name": "Extension collège Boutilimit - Début",
                        "plannedDate": "2025-06-01",
                        "actualDate": null,
                        "status": "planned"
                    }
                ],
                "inspections": [
                    {
                        "id": "h8i9j0k1-l2m3-4567-hijk-890123456789",
                        project_id:"g7h8i9j0-k1l2-3456-ghij-789012345678",
                        "date": "2025-05-05",
                        "created_at": "2025-03-05",
                        "updated_at": "2025-04-05",
                        "inspector": "Mariem Mint Ahmedou",
                        "status": "completed",
                        "progress_at_inspection": 12,
                        "comments": "Démarrage conforme aux spécifications",
                        "issues": [
                            "Problème d'approvisionnement en matériaux"
                        ],
                        "recommendations": [
                            "Anticiper les commandes de matériaux"
                        ]
                    }
                ],
                "stakeholders": [
                    {
                        "name": "M. Mohamed Ould Sidi",
                        "email": "m.sidi@mhuat.gov.mr",
                        "phone": "+22289012345",
                        "role": "Chef de projet PPM",
                        "organization": "Ministère de l'Habitat",
                        "isPrimary": true
                    }
                ]
            },
            {
                "id": "i9j0k1l2-m3n4-5678-ijkl-901234567890",
                "title": "Centres de Santé - Lot N°10 Nouakchott",
                "description": "Construction de deux centres de santé aux secteurs 17 Tarhil et PK7",
                "location": "Secteur 17 Tarhil et PK7, Nouakchott",
                "budget": 42000000,
                "startDate": "2025-06-15",
                "endDate": "2025-12-20",
                "teamSize": 7,
                coordinates:{"latitude": 18.11,
                "longitude": -15.94},
                "financingSource": "État",
                "marketType": "Public",
                "selectionMode": "Appel d'offres",
                "launchDate": "2025-03-10",
                "attributionDate": "2025-05-05",
                "projectReference": "PRJ-SANTE-2025-009",
                "mainContractor": "Santé Bâtiment SARL",
                "allowsInitialPayment": true,
                "initialPaymentPercentage": 18,
                "status": "attribué",
                "progress": 0,
                "category": "Santé",
                "subCategory": "Infrastructure sanitaire",
                "priorityLevel": "Élevée",
                "riskLevel": "Faible",
                "environmentalImpact": "Faible",
                "sustainabilityScore": 80,
                "documents": [
                    {
                        "name": "Notice_Lot10_CentresSante.pdf",
                        "type": "Notice d'attribution",
                        "url": "https://marchespublics.gov.mr/documents/Notice_Lot10_CentresSante.pdf",
                        "uploadDate": "2025-04-15"
                    }
                ],
                "milestones": [
                    {
                        "name": "Début travaux PK7",
                        "plannedDate": "2025-06-15",
                        "actualDate": null,
                        "status": "planned"
                    }
                ],
                "inspections": [],
                "stakeholders": [
                    {
                        "name": "Dr. Aissata Mint Mohamed",
                        "email": "a.mohamed@sante.gov.mr",
                        "phone": "+22290123456",
                        "role": "Responsable projet santé",
                        "organization": "Ministère de la Santé",
                        "isPrimary": true
                    }
                ]
            },
            {
                "id": "j0k1l2m3-n4o5-6789-jklm-012345678901",
                "title": "Infrastructures de production filières animales",
                "description": "Construction et implantation d'infrastructures pour la valorisation des filières laitières, viandes et avicoles",
                "location": "Plusieurs territoires",
                "budget": 185000000,
                "startDate": "2025-07-01",
                "endDate": "2026-12-31",
                "teamSize": 25,
                coordinates:{"latitude": 18.0735,
                "longitude": -15.9582},
                "financingSource": "Partenaire international",
                "marketType": "Public",
                "selectionMode": "Pré-qualification",
                "launchDate": "2025-02-28",
                "attributionDate": "2025-06-15",
                "projectReference": "PRJ-AGRIC-2025-010",
                "mainContractor": "À déterminer",
                "allowsInitialPayment": true,
                "initialPaymentPercentage": 15,
                "status": "pré-qualification",
                "progress": 0,
                "category": "Agriculture",
                "subCategory": "Infrastructure agricole",
                "priorityLevel": "Moyenne",
                "riskLevel": "Élevé",
                "environmentalImpact": "Modéré",
                "sustainabilityScore": 75,
                "documents": [
                    {
                        "name": "Avis_PreQualification_FilieresAnimales.pdf",
                        "type": "Avis de pré-qualification",
                        "url": "https://beta.mr/documents/Avis_PreQualification_FilieresAnimales.pdf",
                        "uploadDate": "2025-01-25"
                    }
                ],
                "milestones": [
                    {
                        "name": "Clôture pré-qualification",
                        "plannedDate": "2025-05-31",
                        "actualDate": null,
                        "status": "planned"
                    }
                ],
                "inspections": [],
                "stakeholders": [
                    {
                        "name": "M. Sidi Ould Ahmed Salem",
                        "email": "s.salem@agriculture.mr",
                        "phone": "+22201234567",
                        "role": "Coordinateur national",
                        "organization": "Ministère de l'Agriculture",
                        "isPrimary": true
                    }
                ]
            }
        ];