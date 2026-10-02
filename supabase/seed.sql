-- =============================================================================
-- USERS_ROWS.SQL – Insertion de plusieurs utilisateurs avec profils et rôles
-- =============================================================================
-- FLOW: auth.users → public.profiles → public.user_roles
-- =============================================================================

-- ============================
-- 1. AUTH.USERS
-- ============================
INSERT INTO "auth"."users" (
    "instance_id", "id", "aud", "role", "email", "encrypted_password",
    "email_confirmed_at", "invited_at", "confirmation_token", "confirmation_sent_at",
    "recovery_token", "recovery_sent_at", "email_change_token_new", "email_change",
    "email_change_sent_at", "last_sign_in_at", "raw_app_meta_data", "raw_user_meta_data",
    "is_super_admin", "created_at", "updated_at", "phone", "phone_confirmed_at",
    "phone_change", "phone_change_token", "phone_change_sent_at", "confirmed_at",
    "email_change_token_current", "email_change_confirm_status", "banned_until",
    "reauthentication_token", "reauthentication_sent_at", "is_sso_user", "deleted_at",
    "is_anonymous"
) VALUES
    -- Utilisateur 1: Somelect Director
    (
        '00000000-0000-0000-0000-000000000000',
        'bb01aec4-397d-4830-ab5c-7d5e0b21b704',
        'authenticated',
        'authenticated',
        'somelect.director.01@gmail.com',
        '$2a$10$FLVTlIl6mUTUoSfmeBwwVOe.19bGmvdR7ZWhcnd.aceSfs9KPDT4e',
        '2025-08-22 14:49:35.368212+00',
        NULL,
        '',
        NULL,
        '',
        NULL,
        '',
        '',
        NULL,
        '2026-07-15 11:53:06.192057+00',
        '{"provider": "email", "providers": ["email"]}',
        '{"sub": "bb01aec4-397d-4830-ab5c-7d5e0b21b704", "email": "somelect.director.01@gmail.com", "phone": "+222414141412", "full_name": "Somelect Director", "national_id": "757412023", "email_verified": true, "phone_verified": false}',
        NULL,
        '2025-08-22 14:49:35.357376+00',
        '2026-07-15 12:51:56.937645+00',
        NULL,
        NULL,
        '',
        '',
        NULL,
        '2025-08-22 14:49:35.368212+00',
        '',
        0,
        NULL,
        '',
        NULL,
        false,
        NULL,
        false
    ),
    -- Utilisateur 2: Somelect Manager
    (
        '00000000-0000-0000-0000-000000000000',
        '23e1401c-a4fb-48be-810b-26605d65a40e',
        'authenticated',
        'authenticated',
        'somelect.manager.01@gmail.com',
        '$2a$10$JbjPv4aSHCO76XK7CR3tO.83ZAs3dgDtFnVBzXpqCnn/nAOLbEPES',
        '2025-08-22 14:48:27.194872+00',
        NULL,
        '',
        NULL,
        '',
        NULL,
        '',
        '',
        NULL,
        '2026-07-03 11:35:50.83501+00',
        '{"provider": "email", "providers": ["email"]}',
        '{"sub": "23e1401c-a4fb-48be-810b-26605d65a40e", "email": "somelect.manager.01@gmail.com", "phone": "+222414141402", "full_name": "somelect manger", "national_id": "42242512", "email_verified": true, "phone_verified": false}',
        NULL,
        '2025-08-22 14:48:27.163857+00',
        '2026-07-03 14:03:45.615793+00',
        NULL,
        NULL,
        '',
        '',
        NULL,
        '2025-08-22 14:48:27.194872+00',
        '',
        0,
        NULL,
        '',
        NULL,
        false,
        NULL,
        false
    ),
    -- Utilisateur 3: Ebyou Business (Google OAuth)
    (
        '00000000-0000-0000-0000-000000000000',
        'a139c5d3-64a9-49d6-9ed8-a97d6a27ad07',
        'authenticated',
        'authenticated',
        'ebyoubusiness@gmail.com',
        '$2a$10$e0J0/oRLhoaAeS/.b3NNIuYF98cg4i9MYDEB5UuttlH2xNwrmaauq',
        '2025-03-31 12:49:23.827663+00',
        NULL,
        '',
        NULL,
        '',
        '2026-07-01 14:41:15.567631+00',
        '',
        '',
        NULL,
        '2026-07-01 14:41:37.473999+00',
        '{"provider": "email", "providers": ["email", "google"]}',
        '{"iss": "https://accounts.google.com", "sub": "111389109705997531116", "name": "Ebyou Business", "email": "ebyoubusiness@gmail.com", "phone": "02414774174", "picture": "https://lh3.googleusercontent.com/a/ACg8ocJlUS1ZBBylSido4jzIcRniPazgPXtjxKwRNU-5vQIodDwdiA=s96-c", "full_name": "Ebyou Business", "avatar_url": "https://lh3.googleusercontent.com/a/ACg8ocJlUS1ZBBylSido4jzIcRniPazgPXtjxKwRNU-5vQIodDwdiA=s96-c", "national_id": "02414774174", "provider_id": "111389109705997531116", "email_verified": true, "phone_verified": false}',
        NULL,
        '2025-03-31 12:48:50.35646+00',
        '2026-07-01 14:41:37.529877+00',
        NULL,
        NULL,
        '',
        '',
        NULL,
        '2025-03-31 12:49:23.827663+00',
        '',
        0,
        NULL,
        '',
        NULL,
        false,
        NULL,
        false
    ),
    -- Utilisateur 4: Somelect Supplier
    (
        '00000000-0000-0000-0000-000000000000',
        'c1ae55a7-f752-48fb-829a-83b37c7631a0',
        'authenticated',
        'authenticated',
        'somelect.supplier.01@gmail.com',
        '$2a$10$kpR1GoAalUB1PX4e4/oOeO1Dvs1Uomtgi3hKC3DUz..D/lC0tWS.W',
        '2025-08-22 14:50:35.972117+00',
        NULL,
        '',
        NULL,
        '',
        NULL,
        '',
        '',
        NULL,
        '2026-06-01 20:02:14.232404+00',
        '{"provider": "email", "providers": ["email"]}',
        '{"sub": "c1ae55a7-f752-48fb-829a-83b37c7631a0", "email": "somelect.supplier.01@gmail.com", "phone": "+222142474", "full_name": "Somelect Fournisseur", "national_id": "757485602", "email_verified": true, "phone_verified": false}',
        NULL,
        '2025-08-22 14:50:35.966+00',
        '2026-06-01 20:02:14.268332+00',
        NULL,
        NULL,
        '',
        '',
        NULL,
        '2025-08-22 14:50:35.972117+00',
        '',
        0,
        NULL,
        '',
        NULL,
        false,
        NULL,
        false
    )
ON CONFLICT (id) DO NOTHING;

-- ============================
-- 2. PROFILES
-- ============================
INSERT INTO public.profiles (
    id, full_name, phone, national_id, role, is_admin, status
) VALUES
    (
        'bb01aec4-397d-4830-ab5c-7d5e0b21b704',
        'Somelect Director',
        '+222414141412',
        '757412023',
        'director',
        false,
        'active'
    ),
    (
        '23e1401c-a4fb-48be-810b-26605d65a40e',
        'somelect manager',
        '+222414141402',
        '42242512',
        'manager',
        false,
        'active'
    ),
    (
        'a139c5d3-64a9-49d6-9ed8-a97d6a27ad07',
        'Ebyou Business',
        '02414774174',
        '02414774174',
        'admin',
        true,
        'active'
    ),
    (
        'c1ae55a7-f752-48fb-829a-83b37c7631a0',
        'Somelect Fournisseur',
        '+222142474',
        '757485602',
        'supplier',
        false,
        'active'
    )
ON CONFLICT (id) DO UPDATE SET
    full_name = EXCLUDED.full_name,
    phone = EXCLUDED.phone,
    national_id = EXCLUDED.national_id,
    role = EXCLUDED.role,
    is_admin = EXCLUDED.is_admin,
    status = EXCLUDED.status,
    updated_at = NOW();

-- ============================
-- 3. USER ROLES
-- ============================
INSERT INTO public.user_roles (
    user_id, role_name, status
) VALUES
    ('bb01aec4-397d-4830-ab5c-7d5e0b21b704', 'director', 'active'),
    ('23e1401c-a4fb-48be-810b-26605d65a40e', 'manager', 'active'),
    ('a139c5d3-64a9-49d6-9ed8-a97d6a27ad07', 'admin', 'active'),
    ('c1ae55a7-f752-48fb-829a-83b37c7631a0', 'supplier', 'active')
ON CONFLICT (user_id, role_name) DO UPDATE SET
    status = EXCLUDED.status,
    assigned_at = NOW();

-- ============================
-- 4. VALIDATION FINALE
-- ============================
DO $$
DECLARE
    user_count INTEGER;
    profile_count INTEGER;
    role_count INTEGER;
BEGIN
    SELECT COUNT(*) INTO user_count FROM auth.users;
    SELECT COUNT(*) INTO profile_count FROM public.profiles;
    SELECT COUNT(*) INTO role_count FROM public.user_roles;

    RAISE NOTICE '✅ Insertion terminée.';
    RAISE NOTICE '   Utilisateurs : %, Profils : %, Rôles : %', user_count, profile_count, role_count;
END $$;