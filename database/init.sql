-- TechHelpDesk Database Initial Schema and Data
-- This file creates the database schema and populates initial data

-- Create enum types
DO $$ BEGIN
    CREATE TYPE role_enum AS ENUM ('admin', 'technician', 'client');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE ticket_status_enum AS ENUM ('open', 'in_progress', 'resolved', 'closed');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE ticket_priority_enum AS ENUM ('low', 'medium', 'high', 'critical');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Create extension for UUID generation
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Users table
CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(100) NOT NULL,
    email VARCHAR(150) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    role role_enum DEFAULT 'client',
    "isActive" BOOLEAN DEFAULT true,
    "createdAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Categories table
CREATE TABLE IF NOT EXISTS categories (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(100) UNIQUE NOT NULL,
    description TEXT,
    "isActive" BOOLEAN DEFAULT true,
    "createdAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Clients table
CREATE TABLE IF NOT EXISTS clients (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(100) NOT NULL,
    company VARCHAR(150),
    "contactEmail" VARCHAR(150) NOT NULL,
    phone VARCHAR(20),
    "isActive" BOOLEAN DEFAULT true,
    "userId" UUID REFERENCES users(id) ON DELETE SET NULL,
    "createdAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Technicians table
CREATE TABLE IF NOT EXISTS technicians (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(100) NOT NULL,
    specialty VARCHAR(100),
    availability BOOLEAN DEFAULT true,
    "isActive" BOOLEAN DEFAULT true,
    "userId" UUID REFERENCES users(id) ON DELETE SET NULL,
    "createdAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Tickets table
CREATE TABLE IF NOT EXISTS tickets (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title VARCHAR(200) NOT NULL,
    description TEXT NOT NULL,
    status ticket_status_enum DEFAULT 'open',
    priority ticket_priority_enum DEFAULT 'medium',
    "categoryId" UUID NOT NULL REFERENCES categories(id) ON DELETE RESTRICT,
    "clientId" UUID NOT NULL REFERENCES clients(id) ON DELETE RESTRICT,
    "technicianId" UUID REFERENCES technicians(id) ON DELETE SET NULL,
    "createdAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_tickets_status ON tickets(status);
CREATE INDEX IF NOT EXISTS idx_tickets_client ON tickets("clientId");
CREATE INDEX IF NOT EXISTS idx_tickets_technician ON tickets("technicianId");
CREATE INDEX IF NOT EXISTS idx_tickets_category ON tickets("categoryId");
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);

-- Insert initial data

-- Password: Password123! (bcrypt hash)
-- Generated with: await bcrypt.hash('Password123!', 10)
INSERT INTO users (id, name, email, password, role, "isActive") VALUES
    ('a1b2c3d4-e5f6-4789-abcd-ef0123456789', 'Admin Principal', 'admin@techhelpdesk.com', '$2b$10$8KzaNdKIMyOkASCsq5ByXe9lLLDVBJJKE3dBLpR5gYDlKCYKZqzXi', 'admin', true),
    ('b2c3d4e5-f6a7-4890-bcde-f01234567890', 'Carlos Rodríguez', 'carlos.rodriguez@techhelpdesk.com', '$2b$10$8KzaNdKIMyOkASCsq5ByXe9lLLDVBJJKE3dBLpR5gYDlKCYKZqzXi', 'technician', true),
    ('c3d4e5f6-a7b8-4901-cdef-012345678901', 'Ana Martínez', 'ana.martinez@techhelpdesk.com', '$2b$10$8KzaNdKIMyOkASCsq5ByXe9lLLDVBJJKE3dBLpR5gYDlKCYKZqzXi', 'technician', true),
    ('d4e5f6a7-b8c9-4012-def0-123456789012', 'Luis Fernández', 'luis.fernandez@techhelpdesk.com', '$2b$10$8KzaNdKIMyOkASCsq5ByXe9lLLDVBJJKE3dBLpR5gYDlKCYKZqzXi', 'technician', true),
    ('e5f6a7b8-c9d0-4123-ef01-234567890123', 'María García', 'maria.garcia@empresa.com', '$2b$10$8KzaNdKIMyOkASCsq5ByXe9lLLDVBJJKE3dBLpR5gYDlKCYKZqzXi', 'client', true),
    ('f6a7b8c9-d0e1-4234-f012-345678901234', 'Pedro López', 'pedro.lopez@empresa.com', '$2b$10$8KzaNdKIMyOkASCsq5ByXe9lLLDVBJJKE3dBLpR5gYDlKCYKZqzXi', 'client', true),
    ('a7b8c9d0-e1f2-4345-0123-456789012345', 'Laura Sánchez', 'laura.sanchez@empresa.com', '$2b$10$8KzaNdKIMyOkASCsq5ByXe9lLLDVBJJKE3dBLpR5gYDlKCYKZqzXi', 'client', true)
ON CONFLICT (email) DO NOTHING;

-- Categories
INSERT INTO categories (id, name, description, "isActive") VALUES
    ('cat-0001-0000-0000-000000000001', 'Solicitud', 'Solicitudes generales de soporte técnico y consultas', true),
    ('cat-0002-0000-0000-000000000002', 'Incidente de Hardware', 'Problemas relacionados con equipos físicos: computadoras, impresoras, monitores, etc.', true),
    ('cat-0003-0000-0000-000000000003', 'Incidente de Software', 'Problemas relacionados con aplicaciones, sistemas operativos y programas', true)
ON CONFLICT (name) DO NOTHING;

-- Technicians
INSERT INTO technicians (id, name, specialty, availability, "isActive", "userId") VALUES
    ('tech-0001-0000-0000-000000000001', 'Carlos Rodríguez', 'Redes y Comunicaciones', true, true, 'b2c3d4e5-f6a7-4890-bcde-f01234567890'),
    ('tech-0002-0000-0000-000000000002', 'Ana Martínez', 'Hardware y Mantenimiento', true, true, 'c3d4e5f6-a7b8-4901-cdef-012345678901'),
    ('tech-0003-0000-0000-000000000003', 'Luis Fernández', 'Software y Sistemas', true, true, 'd4e5f6a7-b8c9-4012-def0-123456789012')
ON CONFLICT DO NOTHING;

-- Clients
INSERT INTO clients (id, name, company, "contactEmail", phone, "isActive", "userId") VALUES
    ('cli-0001-0000-0000-000000000001', 'María García', 'Tech Solutions S.A.', 'maria.garcia@empresa.com', '+1234567890', true, 'e5f6a7b8-c9d0-4123-ef01-234567890123'),
    ('cli-0002-0000-0000-000000000002', 'Pedro López', 'Innovación Digital Ltda.', 'pedro.lopez@empresa.com', '+0987654321', true, 'f6a7b8c9-d0e1-4234-f012-345678901234'),
    ('cli-0003-0000-0000-000000000003', 'Laura Sánchez', 'Consultores Asociados', 'laura.sanchez@empresa.com', '+1122334455', true, 'a7b8c9d0-e1f2-4345-0123-456789012345')
ON CONFLICT DO NOTHING;

-- Tickets
INSERT INTO tickets (id, title, description, status, priority, "categoryId", "clientId", "technicianId") VALUES
    ('tick-0001-0000-0000-000000000001', 'Impresora no funciona', 'La impresora HP LaserJet del departamento de ventas no imprime documentos desde ayer.', 'open', 'high', 'cat-0002-0000-0000-000000000002', 'cli-0001-0000-0000-000000000001', NULL),
    ('tick-0002-0000-0000-000000000002', 'Error en sistema de facturación', 'El sistema muestra error al generar facturas con más de 10 items.', 'in_progress', 'critical', 'cat-0003-0000-0000-000000000003', 'cli-0002-0000-0000-000000000002', 'tech-0001-0000-0000-000000000001'),
    ('tick-0003-0000-0000-000000000003', 'Solicitud de nuevo monitor', 'Se requiere un monitor adicional para el puesto de trabajo del área de diseño.', 'open', 'low', 'cat-0001-0000-0000-000000000001', 'cli-0003-0000-0000-000000000003', NULL),
    ('tick-0004-0000-0000-000000000004', 'Computadora lenta', 'La computadora del área de contabilidad está muy lenta y tarda mucho en abrir programas.', 'in_progress', 'medium', 'cat-0002-0000-0000-000000000002', 'cli-0001-0000-0000-000000000001', 'tech-0002-0000-0000-000000000002'),
    ('tick-0005-0000-0000-000000000005', 'Instalación de software', 'Se necesita instalar Adobe Creative Suite en las computadoras del departamento de marketing.', 'resolved', 'medium', 'cat-0003-0000-0000-000000000003', 'cli-0002-0000-0000-000000000002', 'tech-0003-0000-0000-000000000003')
ON CONFLICT DO NOTHING;

-- Display summary
DO $$
BEGIN
    RAISE NOTICE '==========================================';
    RAISE NOTICE 'TechHelpDesk Database initialized';
    RAISE NOTICE '==========================================';
    RAISE NOTICE 'Users: %', (SELECT COUNT(*) FROM users);
    RAISE NOTICE 'Categories: %', (SELECT COUNT(*) FROM categories);
    RAISE NOTICE 'Technicians: %', (SELECT COUNT(*) FROM technicians);
    RAISE NOTICE 'Clients: %', (SELECT COUNT(*) FROM clients);
    RAISE NOTICE 'Tickets: %', (SELECT COUNT(*) FROM tickets);
    RAISE NOTICE '==========================================';
END $$;
