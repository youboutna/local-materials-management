// Script de diagnostic pour vérifier les données de projets
import { createClient } from "@supabase/supabase-js";

// Configuration Supabase
const SUPABASE_URL = "https://ttrfbzonzcyimfmezuqv.supabase.co";
const SUPABASE_ANON_KEY =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InR0cmZiem9uemN5aW1mbWV6dXF2Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4NDk1NzU1NSwiZXhwIjoyMTAwNTMzNTU1fQ.YcaoNMsGrKNznJI3_Ck7EIC6w1oFCfueN03KZPrKocE";

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

async function debugProjects() {
  console.log("=== DIAGNOSTIC DES PROJETS ===\n");

  try {
    // 1. Vérifier tous les projets
    const { data: projects, error: projectsError } = await supabase
      .from("projects")
      .select("id, title, location, status, progress, budget");

    if (projectsError) {
      console.error("Erreur lors de la récupération des projets:", projectsError);
      return;
    }

    console.log(`Nombre total de projets: ${projects?.length || 0}\n`);

    if (!projects || projects.length === 0) {
      console.log("Aucun projet trouvé dans la base de données.");
      return;
    }

    // 2. Distribution par localisation
    console.log("=== DISTRIBUTION PAR LOCALISATION ===");
    const locationCounts = {};
    projects.forEach((project) => {
      const location = project.location || "Non spécifié";
      locationCounts[location] = (locationCounts[location] || 0) + 1;
    });

    Object.entries(locationCounts)
      .sort((a, b) => b[1] - a[1])
      .forEach(([location, count]) => {
        console.log(`  ${location}: ${count} projet(s)`);
      });

    // 3. Distribution par statut
    console.log("\n=== DISTRIBUTION PAR STATUT ===");
    const statusCounts = {};
    projects.forEach((project) => {
      const status = project.status || "Non spécifié";
      statusCounts[status] = (statusCounts[status] || 0) + 1;
    });

    Object.entries(statusCounts)
      .sort((a, b) => b[1] - a[1])
      .forEach(([status, count]) => {
        console.log(`  ${status}: ${count} projet(s)`);
      });

    // 4. Vérifier les projets avec Mauritanie
    console.log("\n=== PROJETS MAURITANIE ===");
    const mauritanieProjects = projects.filter((p) => p.location && p.location.toLowerCase().includes("mauritanie"));

    if (mauritanieProjects.length > 0) {
      mauritanieProjects.forEach((p) => {
        console.log(`  - ${p.title} (location: ${p.location})`);
      });
    } else {
      console.log('  Aucun projet avec "Mauritanie" dans la localisation.');
    }

    // 5. Projets avec localisations similaires
    console.log("\n=== ANALYSE DES LOCALISATIONS SIMILAIRES ===");
    const normalizedLocations = {};
    projects.forEach((project) => {
      const normalized = (project.location || "").toLowerCase().trim();
      if (!normalizedLocations[normalized]) {
        normalizedLocations[normalized] = [];
      }
      normalizedLocations[normalized].push(project.title);
    });

    Object.entries(normalizedLocations)
      .filter(([loc, projects]) => projects.length > 1)
      .forEach(([location, projectList]) => {
        console.log(`  "${location}": ${projectList.length} projets`);
        projectList.forEach((title) => console.log(`    - ${title}`));
      });

    console.log("\n=== FIN DU DIAGNOSTIC ===");
  } catch (error) {
    console.error("Erreur inattendue:", error);
  }
}

debugProjects();
