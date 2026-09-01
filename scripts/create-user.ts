// scripts/create-user.ts
// Création d'utilisateur via Supabase Admin API

import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import * as readline from 'readline';

// Charger .env
dotenv.config({ path: '.env' });

// Configuration
const SUPABASE_URL = process.env.VITE_SUPABASE_URL || '';
const SUPABASE_SERVICE_ROLE_KEY = process.env.VITE_SUPABASE_SERVICE_ROLE_KEY || '';
const SUPABASE_ANON_KEY = process.env.VITE_SUPABASE_ANON_KEY || '';

if (!SUPABASE_URL) {
  console.error('❌ VITE_SUPABASE_URL non défini dans .env');
  process.exit(1);
}

if (!SUPABASE_SERVICE_ROLE_KEY && !SUPABASE_ANON_KEY) {
  console.error('❌ Aucune clé trouvée. Ajoutez VITE_SUPABASE_SERVICE_ROLE_KEY ou VITE_SUPABASE_ANON_KEY');
  process.exit(1);
}

const supabase = createClient(
  SUPABASE_URL,
  SUPABASE_SERVICE_ROLE_KEY || SUPABASE_ANON_KEY
);

// Interface de ligne de commande
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

const question = (query: string): Promise<string> => {
  return new Promise((resolve) => {
    rl.question(query, (answer) => {
      resolve(answer);
    });
  });
};

// Rôles disponibles
const AVAILABLE_ROLES = ['admin', 'director', 'manager', 'agent', 'supplier', 'consultant', 'user'] as const;

// ============================================================================
// FONCTIONS
// ============================================================================

async function createUser(options: {
  email: string;
  password: string;
  role: string;
  fullName?: string;
  phone?: string;
  nationalId?: string;
}) {
  console.log(`\n📝 Création de l'utilisateur: ${options.email}`);
  console.log(`   Rôle: ${options.role}`);
  console.log(`   Nom: ${options.fullName || '(non spécifié)'}`);

  try {
    // 1. Créer l'utilisateur dans auth.users
    console.log('   🔐 Création dans auth.users...');
    const { data: authUser, error: authError } = await supabase.auth.admin.createUser({
      email: options.email,
      password: options.password,
      email_confirm: true,
      user_metadata: {
        full_name: options.fullName || options.email.split('@')[0],
        phone: options.phone || '',
        national_id: options.nationalId || '',
      },
    });

    if (authError) {
      throw new Error(`Erreur auth: ${authError.message}`);
    }

    if (!authUser?.user) {
      throw new Error('Utilisateur non créé');
    }

    const userId = authUser.user.id;
    console.log(`   ✅ Utilisateur créé: ${userId}`);

    // 2. Créer le profil dans public.profiles
    console.log('   📋 Création du profil...');
    const { error: profileError } = await supabase
      .from('profiles')
      .insert({
        id: userId,
        full_name: options.fullName || options.email.split('@')[0],
        email: options.email,
        phone: options.phone || '',
        national_id: options.nationalId || '',
        role: options.role,
        is_active: true,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      });

    if (profileError) {
      console.error('   ⚠️ Erreur profil:', profileError);
      // Continuer
    } else {
      console.log('   ✅ Profil créé');
    }

    // 3. Créer le rôle dans public.user_roles
    console.log('   🎯 Attribution du rôle...');
    const { error: roleError } = await supabase
      .from('user_roles')
      .insert({
        user_id: userId,
        role: options.role,
        assigned_by: 'system',
        assigned_at: new Date().toISOString(),
      });

    if (roleError) {
      console.error('   ⚠️ Erreur rôle:', roleError);
    } else {
      console.log('   ✅ Rôle attribué');
    }

    console.log(`\n✅ Utilisateur créé avec succès !`);
    console.log(`   ID: ${userId}`);
    console.log(`   Email: ${options.email}`);
    console.log(`   Rôle: ${options.role}`);

    return { userId, email: options.email, role: options.role };
  } catch (error) {
    console.error(`\n❌ Erreur: ${error instanceof Error ? error.message : String(error)}`);
    throw error;
  }
}

// ============================================================================
// MODE ADMIN PAR DÉFAUT
// ============================================================================

async function createAdmin() {
  console.log('\n👑 Création de l\'admin par défaut');
  console.log('   Email: admin@hadratech.com');
  console.log('   Mot de passe: Admin123!');
  console.log('   Rôle: admin');

  try {
    // Vérifier si l'admin existe déjà
    const { data: existing } = await supabase
      .from('profiles')
      .select('id')
      .eq('email', 'admin@hadratech.com')
      .single();

    if (existing) {
      console.log('ℹ️ L\'admin existe déjà');
      return;
    }

    await createUser({
      email: 'admin@hadratech.com',
      password: 'Admin123!',
      role: 'admin',
      fullName: 'Administrateur HadraTech',
      phone: '+222 00 00 00 00',
      nationalId: 'ADMIN-001',
    });

    console.log('\n🔐 Identifiants:');
    console.log('   Email: admin@hadratech.com');
    console.log('   Mot de passe: Admin123!');
    console.log('   (Changez le mot de passe après la première connexion)');
  } catch (error) {
    console.error('❌ Erreur:', error);
  }
}

// ============================================================================
// MODE INTERACTIF
// ============================================================================

async function interactive() {
  console.log('\n👤 Création d\'utilisateur interactive\n');

  const email = await question('📧 Email: ');
  if (!email || !email.includes('@')) {
    console.error('❌ Email invalide');
    process.exit(1);
  }

  const password = await question('🔑 Mot de passe (min 6 caractères): ');
  if (!password || password.length < 6) {
    console.error('❌ Mot de passe trop court (min 6)');
    process.exit(1);
  }

  console.log('\n📋 Rôles disponibles:');
  AVAILABLE_ROLES.forEach((r, i) => console.log(`   ${i + 1}. ${r}`));

  const roleInput = await question('🎯 Choisissez un rôle (1-8): ');
  const roleIndex = parseInt(roleInput) - 1;
  const role = AVAILABLE_ROLES[roleIndex] || 'user';

  const fullName = await question('👤 Nom complet: ');

  const phone = await question('📱 Téléphone: ');

  const nationalId = await question('🪪 CIN: ');

  await createUser({
    email,
    password,
    role,
    fullName: fullName || undefined,
    phone: phone || undefined,
    nationalId: nationalId || undefined,
  });

  rl.close();
}

// ============================================================================
// MAIN
// ============================================================================

async function main() {
  const args = process.argv.slice(2);

  // Mode admin
  if (args.includes('--admin')) {
    await createAdmin();
    return;
  }

  // Mode paramètres
  const email = args.find((a) => a.startsWith('--email='))?.split('=')[1] || 
                args[args.indexOf('--email') + 1] || '';
  const password = args.find((a) => a.startsWith('--password='))?.split('=')[1] ||
                   args[args.indexOf('--password') + 1] || '';
  const role = args.find((a) => a.startsWith('--role='))?.split('=')[1] ||
               args[args.indexOf('--role') + 1] || '';
  const name = args.find((a) => a.startsWith('--name='))?.split('=')[1] ||
               args[args.indexOf('--name') + 1] || '';
  const phone = args.find((a) => a.startsWith('--phone='))?.split('=')[1] ||
                args[args.indexOf('--phone') + 1] || '';
  const nationalId = args.find((a) => a.startsWith('--national-id='))?.split('=')[1] ||
                      args[args.indexOf('--national-id') + 1] || '';

  if (email && password && role) {
    await createUser({
      email,
      password,
      role,
      fullName: name || undefined,
      phone: phone || undefined,
      nationalId: nationalId || undefined,
    });
    return;
  }

  // Mode interactif par défaut
  await interactive();
}

main().catch(console.error);