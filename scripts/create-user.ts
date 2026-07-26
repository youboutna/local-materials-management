#!/usr/bin/env node
/**
 * create-user.ts – Crée un utilisateur via l'API Signup (clé publishable)
 * 
 * FLOW:
 *   1. auth/signup (API) → Crée l'utilisateur dans auth.users
 *   2. public.profiles → Crée le profil
 *   3. public.user_roles → Attribue le rôle
 * 
 * Usage:
 *   npx ts-node scripts/create-user.ts --admin
 *   npx ts-node scripts/create-user.ts --email user@test.com --password Test123! --role admin --name "Admin"
 */

import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import * as path from 'path';
import * as readline from 'readline';

// Charger les variables d'environnement
dotenv.config({ path: path.resolve(process.cwd(), '.env') });

// ============================
// CONFIGURATION
// ============================

const SUPABASE_URL = process.env.VITE_SUPABASE_URL || '';
const SUPABASE_ANON_KEY = process.env.VITE_SUPABASE_ANON_KEY || process.env.VITE_SUPABASE_PUBLISHABLE_KEY || '';

if (!SUPABASE_URL) {
  console.error('❌ VITE_SUPABASE_URL manquant dans .env');
  process.exit(1);
}

if (!SUPABASE_ANON_KEY) {
  console.error('❌ VITE_SUPABASE_ANON_KEY ou VITE_SUPABASE_PUBLISHABLE_KEY manquant dans .env');
  process.exit(1);
}

console.log('🔑 Utilisation de la clé publishable (signup)');
const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// ============================
// TYPES
// ============================

type UserRole = 'admin' | 'manager' | 'director' | 'agent' | 'supplier' | 'user';

interface CreateUserInput {
  email: string;
  password: string;
  fullName: string;
  phone: string;
  nationalId: string;
  role: UserRole;
  isAdmin?: boolean;
  status?: 'active' | 'inactive' | 'suspended' | 'pending_verification';
  region?: string;
  department?: string;
}

// ============================
// INTERFACE
// ============================

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

const question = (prompt: string): Promise<string> => {
  return new Promise((resolve) => {
    rl.question(prompt, (answer) => {
      resolve(answer.trim());
    });
  });
};

// ============================
// FLOW – ÉTAPE 1: SIGNUP VIA API
// ============================

async function step1_SignupUser(input: CreateUserInput): Promise<string> {
  console.log(`\n📝 [1/3] Inscription de l'utilisateur: ${input.email}`);

  const { data, error } = await supabase.auth.signUp({
    email: input.email,
    password: input.password,
    options: {
      data: {
        full_name: input.fullName,
        phone: input.phone,
        national_id: input.nationalId,
        role: input.role,
      },
    },
  });

  if (error) {
    console.error('❌ Erreur inscription:', error.message);
    throw new Error(`Signup error: ${error.message}`);
  }

  if (!data?.user) {
    throw new Error('Aucun utilisateur créé');
  }

  console.log(`✅ Utilisateur créé avec ID: ${data.user.id}`);
  console.log(`⚠️  Email de confirmation envoyé (si activé)`);
  
  return data.user.id;
}

// ============================
// FLOW – ÉTAPE 2: CRÉATION PROFIL
// ============================

async function step2_CreateProfile(userId: string, input: CreateUserInput): Promise<void> {
  console.log(`\n📝 [2/3] Création du profil pour: ${input.fullName}`);

  const { error } = await supabase
    .from('profiles')
    .insert({
      id: userId,
      full_name: input.fullName,
      phone: input.phone,
      national_id: input.nationalId,
      role: input.role,
      is_admin: input.isAdmin || false,
      status: input.status || 'active',
      auth_provider: 'supabase',
      region: input.region || null,
      department: input.department || null,
    });

  if (error) {
    console.error('❌ Erreur création profile:', error.message);
    throw new Error(`Profile error: ${error.message}`);
  }

  console.log(`✅ Profil créé pour: ${input.fullName}`);
}

// ============================
// FLOW – ÉTAPE 3: ATTRIBUTION RÔLE
// ============================

async function step3_CreateUserRole(userId: string, role: UserRole): Promise<void> {
  console.log(`\n📝 [3/3] Attribution du rôle: ${role}`);

  const { error } = await supabase
    .from('user_roles')
    .insert({
      user_id: userId,
      role_name: role,
      assigned_at: new Date().toISOString(),
      status: 'active',
    });

  if (error) {
    console.error('❌ Erreur création user_role:', error.message);
    throw new Error(`Role error: ${error.message}`);
  }

  console.log(`✅ Rôle ${role} attribué`);
}

// ============================
// FLOW COMPLET
// ============================

async function createUserFlow(input: CreateUserInput) {
  const userId = await step1_SignupUser(input);
  await step2_CreateProfile(userId, input);
  await step3_CreateUserRole(userId, input.role);

  return {
    userId,
    email: input.email,
    fullName: input.fullName,
    role: input.role,
  };
}

// ============================
// ADMIN PAR DÉFAUT
// ============================

async function createDefaultAdmin() {
  const input: CreateUserInput = {
    email: 'admin@hadratech.com',
    password: 'Admin123!',
    fullName: 'Admin HadraTech',
    phone: '+22212345678',
    nationalId: '123456789',
    role: 'admin',
    isAdmin: true,
    status: 'active',
  };

  console.log(`\n🔐 Création de l'admin par défaut`);
  console.log(`   Email: ${input.email}`);
  const result = await createUserFlow(input);
  console.log(`\n✅ Utilisateur créé: ${result.email} (${result.role})`);
  console.log(`   ID: ${result.userId}`);
}

// ============================
// PARSING DES ARGUMENTS
// ============================

function parseArgs(args: string[]): Partial<CreateUserInput> | null {
  const input: Partial<CreateUserInput> = {};

  for (let i = 0; i < args.length; i++) {
    switch (args[i]) {
      case '--admin':
        return null;
      case '--email':
        input.email = args[++i];
        break;
      case '--password':
        input.password = args[++i];
        break;
      case '--role':
        input.role = args[++i] as UserRole;
        break;
      case '--name':
        input.fullName = args[++i];
        break;
      case '--phone':
        input.phone = args[++i];
        break;
      case '--national-id':
        input.nationalId = args[++i];
        break;
      case '--status':
        input.status = args[++i] as any;
        break;
      case '--region':
        input.region = args[++i];
        break;
      case '--department':
        input.department = args[++i];
        break;
      case '--help':
      case '-h':
        console.log(`
${'FLOW COMPLET – Création utilisateur via API Signup'}

Usage: npx ts-node scripts/create-user.ts [OPTIONS]

Options:
  --admin              Crée l'admin par défaut (admin@hadratech.com)
  --email EMAIL        Email de l'utilisateur
  --password PASS      Mot de passe (min 6 caractères)
  --role ROLE          Rôle (admin, manager, director, agent, supplier, user)
  --name NAME          Nom complet
  --phone PHONE        Téléphone
  --national-id ID     Numéro d'identité
  --status STATUS      Statut (active, inactive, suspended, pending_verification)
  --region REGION      Région
  --department DEPT    Département
  --help, -h           Affiche cette aide

Étapes du flow:
  1. auth/signup → Création de l'utilisateur
  2. public.profiles → Création du profil
  3. public.user_roles → Attribution du rôle
        `);
        process.exit(0);
    }
  }

  return input;
}

// ============================
// MODE INTERACTIF
// ============================

async function promptUserInput(): Promise<CreateUserInput> {
  console.log('\n🔐 Création d\'un nouvel utilisateur\n');

  const email = await question('Email: ');
  const password = await question('Mot de passe (min 6 caractères): ');
  const fullName = await question('Nom complet: ');
  const phone = await question('Téléphone: ');
  const nationalId = await question('Numéro d\'identité: ');

  console.log('\nRôles disponibles: admin, manager, director, agent, supplier, user');
  const roleInput = await question('Rôle: ');
  const role = roleInput as UserRole;

  const isAdmin = (await question('Administrateur? (y/n): ')).toLowerCase() === 'y';

  return {
    email,
    password,
    fullName,
    phone,
    nationalId,
    role,
    isAdmin,
  };
}

// ============================
// MAIN
// ============================

async function main() {
  const args = process.argv.slice(2);

  try {
    // Vérifier la connexion
    console.log('🔍 Vérification de la connexion...');
    await supabase.from('profiles').select('count').limit(1);
    console.log('✅ Connexion à Supabase établie\n');

    if (args.includes('--admin')) {
      await createDefaultAdmin();
      return;
    }

    const parsedInput = parseArgs(args);

    if (parsedInput && parsedInput.email && parsedInput.password && parsedInput.role && parsedInput.fullName) {
      const result = await createUserFlow(parsedInput as CreateUserInput);
      console.log(`\n✅ Utilisateur créé: ${result.email} (${result.role})`);
      console.log(`   ID: ${result.userId}`);
      return;
    }

    // Mode interactif
    const input = await promptUserInput();
    const result = await createUserFlow(input);
    console.log(`\n✅ Utilisateur créé: ${result.email} (${result.role})`);
    console.log(`   ID: ${result.userId}`);
  } catch (error) {
    console.error('❌ Erreur:', error instanceof Error ? error.message : error);
    process.exit(1);
  } finally {
    rl.close();
  }
}

if (require.main === module) {
  main();
}

export { createUserFlow, step1_SignupUser, step2_CreateProfile, step3_CreateUserRole };
