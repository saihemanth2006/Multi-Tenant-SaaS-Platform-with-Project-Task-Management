-- Seed data for multi-tenant SaaS
-- Passwords hashed with bcrypt (cost 10):
-- superadmin@system.com -> Admin@123
-- admin@demo.com -> Demo@123
-- user1@demo.com -> User@123
-- user2@demo.com -> User@123

BEGIN;

-- Super admin (tenant_id NULL)
INSERT INTO users (id, tenant_id, email, password_hash, full_name, role, is_active)
VALUES (
    gen_random_uuid(),
    NULL,
    'superadmin@system.com',
    '$2b$10$5sEmcEVLiw9tMB8QYLSOK.YtbZ0EPqaEzJDFpZYKB28baE9yM3v4i',
    'Super Admin',
    'super_admin',
    TRUE
);

-- Demo tenant
INSERT INTO tenants (id, name, subdomain, status, subscription_plan)
VALUES (
    '11111111-1111-1111-1111-111111111111',
    'Demo Company',
    'demo',
    'active',
    'pro'
);

-- Tenant admin for Demo
INSERT INTO users (id, tenant_id, email, password_hash, full_name, role, is_active)
VALUES (
    '22222222-2222-2222-2222-222222222222',
    '11111111-1111-1111-1111-111111111111',
    'admin@demo.com',
    '$2b$10$oOUrkuRRtSrcle5zyK090.jifGt0HRhVvFVvQtrGdIR8iSJ.KTnxy',
    'Demo Admin',
    'tenant_admin',
    TRUE
);

-- Regular users for Demo
INSERT INTO users (id, tenant_id, email, password_hash, full_name, role, is_active)
VALUES
    (
        '33333333-3333-3333-3333-333333333333',
        '11111111-1111-1111-1111-111111111111',
        'user1@demo.com',
        '$2b$10$wIDgo5LIu6FUk4xWUXqKLecyEyK7B51lrqsuElbzuumi4HsHYKtAe',
        'Demo User One',
        'user',
        TRUE
    ),
    (
        '44444444-4444-4444-4444-444444444444',
        '11111111-1111-1111-1111-111111111111',
        'user2@demo.com',
        '$2b$10$wIDgo5LIu6FUk4xWUXqKLecyEyK7B51lrqsuElbzuumi4HsHYKtAe',
        'Demo User Two',
        'user',
        TRUE
    );

-- Sample projects
INSERT INTO projects (id, tenant_id, name, description, status, created_by)
VALUES
    (
        '55555555-5555-5555-5555-555555555555',
        '11111111-1111-1111-1111-111111111111',
        'Onboarding',
        'Tenant onboarding and setup',
        'active',
        '22222222-2222-2222-2222-222222222222'
    ),
    (
        '66666666-6666-6666-6666-666666666666',
        '11111111-1111-1111-1111-111111111111',
        'Product Roadmap',
        'Plan upcoming features',
        'active',
        '22222222-2222-2222-2222-222222222222'
    );

-- Sample tasks (5 total across projects)
INSERT INTO tasks (id, project_id, tenant_id, title, description, status, priority, assigned_to, due_date)
VALUES
    (
        '77777777-7777-7777-7777-777777777777',
        '55555555-5555-5555-5555-555555555555',
        '11111111-1111-1111-1111-111111111111',
        'Set up subdomain',
        'Configure DNS and SSL',
        'in_progress',
        'high',
        '33333333-3333-3333-3333-333333333333',
        CURRENT_DATE + INTERVAL '3 days'
    ),
    (
        '88888888-8888-8888-8888-888888888888',
        '55555555-5555-5555-5555-555555555555',
        '11111111-1111-1111-1111-111111111111',
        'Seed tenant data',
        'Initial tenant + users',
        'todo',
        'medium',
        '44444444-4444-4444-4444-444444444444',
        CURRENT_DATE + INTERVAL '5 days'
    ),
    (
        '99999999-9999-9999-9999-999999999999',
        '55555555-5555-5555-5555-555555555555',
        '11111111-1111-1111-1111-111111111111',
        'Enable audit logging',
        'Capture key actions',
        'todo',
        'medium',
        '22222222-2222-2222-2222-222222222222',
        CURRENT_DATE + INTERVAL '7 days'
    ),
    (
        'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
        '66666666-6666-6666-6666-666666666666',
        '11111111-1111-1111-1111-111111111111',
        'Draft Q1 roadmap',
        'Outline priorities',
        'in_progress',
        'high',
        '33333333-3333-3333-3333-333333333333',
        CURRENT_DATE + INTERVAL '10 days'
    ),
    (
        'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb',
        '66666666-6666-6666-6666-666666666666',
        '11111111-1111-1111-1111-111111111111',
        'Stakeholder review',
        'Collect feedback',
        'todo',
        'low',
        '44444444-4444-4444-4444-444444444444',
        CURRENT_DATE + INTERVAL '14 days'
    );

COMMIT;
