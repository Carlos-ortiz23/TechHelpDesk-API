import { DataSource } from 'typeorm';
import * as bcrypt from 'bcrypt';
import * as dotenv from 'dotenv';
import * as path from 'path';

// Entities
import { User } from '../../modules/users/entities/user.entity';
import { Category } from '../../modules/categories/entities/category.entity';
import { Client } from '../../modules/clients/entities/client.entity';
import { Technician } from '../../modules/technicians/entities/technician.entity';
import { Ticket } from '../../modules/tickets/entities/ticket.entity';

// Enums 
import { Role } from '../../common/enums/role.enum';
import { TicketStatus } from '../../common/enums/ticket-status.enum';
import { TicketPriority } from '../../common/enums/ticket-priority.enum';

// Load .env only if it exists (development local)
dotenv.config({ path: path.resolve(process.cwd(), '.env') });

// DataSource configuration
const AppDataSource = new DataSource({
  type: 'postgres',
  host: process.env.DB_HOST || 'db',
  port: parseInt(process.env.DB_PORT || '5432'),
  username: process.env.DB_USERNAME || 'postgres',
  password: process.env.DB_PASSWORD || 'postgres',
  database: process.env.DB_DATABASE || 'techhelpdesk_db',
  entities: [User, Category, Client, Technician, Ticket],
  synchronize: false,
});

async function runSeed() {
  console.log('- Iniciando seeders...');

  try {
    await AppDataSource.initialize();
    console.log('- Conexión a la base de datos establecida');

    // Repositories
    const userRepo = AppDataSource.getRepository(User);
    const categoryRepo = AppDataSource.getRepository(Category);
    const clientRepo = AppDataSource.getRepository(Client);
    const technicianRepo = AppDataSource.getRepository(Technician);
    const ticketRepo = AppDataSource.getRepository(Ticket);

    // Clear existing data (respecting foreign keys)
    console.log('- Limpiando datos existentes...');
    await ticketRepo.createQueryBuilder().delete().from(Ticket).execute();
    await technicianRepo.createQueryBuilder().delete().from(Technician).execute();
    await clientRepo.createQueryBuilder().delete().from(Client).execute();
    await categoryRepo.createQueryBuilder().delete().from(Category).execute();
    await userRepo.createQueryBuilder().delete().from(User).execute();

    // Hash password
    const hashedPassword = await bcrypt.hash('Password123!', 10);

    // ==================== USERS ====================
    console.log('- Creando usuarios...');
    
    const admin = userRepo.create({
      name: 'Admin Principal',
      email: 'admin@techhelpdesk.com',
      password: hashedPassword,
      role: Role.ADMIN,
      isActive: true,
    });

    const techUser1 = userRepo.create({
      name: 'Carlos Rodríguez',
      email: 'carlos.rodriguez@techhelpdesk.com',
      password: hashedPassword,
      role: Role.TECHNICIAN,
      isActive: true,
    });

    const techUser2 = userRepo.create({
      name: 'Ana Martínez',
      email: 'ana.martinez@techhelpdesk.com',
      password: hashedPassword,
      role: Role.TECHNICIAN,
      isActive: true,
    });

    const techUser3 = userRepo.create({
      name: 'Luis Fernández',
      email: 'luis.fernandez@techhelpdesk.com',
      password: hashedPassword,
      role: Role.TECHNICIAN,
      isActive: true,
    });

    const clientUser1 = userRepo.create({
      name: 'María García',
      email: 'maria.garcia@empresa.com',
      password: hashedPassword,
      role: Role.CLIENT,
      isActive: true,
    });

    const clientUser2 = userRepo.create({
      name: 'Pedro López',
      email: 'pedro.lopez@empresa.com',
      password: hashedPassword,
      role: Role.CLIENT,
      isActive: true,
    });

    const clientUser3 = userRepo.create({
      name: 'Laura Sánchez',
      email: 'laura.sanchez@empresa.com',
      password: hashedPassword,
      role: Role.CLIENT,
      isActive: true,
    });

    const users = await userRepo.save([
      admin,
      techUser1,
      techUser2,
      techUser3,
      clientUser1,
      clientUser2,
      clientUser3,
    ]);
    console.log(`- Usuarios creados: ${users.length}`);

    // ==================== CATEGORIES ====================
    console.log('- Creando categorías...');

    const catSolicitud = categoryRepo.create({
      name: 'Solicitud',
      description: 'Solicitudes generales de soporte técnico y consultas',
      isActive: true,
    });

    const catHardware = categoryRepo.create({
      name: 'Incidente de Hardware',
      description: 'Problemas relacionados con equipos físicos: computadoras, impresoras, monitores, etc.',
      isActive: true,
    });

    const catSoftware = categoryRepo.create({
      name: 'Incidente de Software',
      description: 'Problemas relacionados con aplicaciones, sistemas operativos y programas',
      isActive: true,
    });

    const categories = await categoryRepo.save([catSolicitud, catHardware, catSoftware]);
    console.log(`- Categorías creadas: ${categories.length}`);

    // ==================== TECHNICIANS ====================
    console.log('- Creando técnicos...');

    const tech1 = technicianRepo.create({
      name: 'Carlos Rodríguez',
      specialty: 'Redes y Comunicaciones',
      availability: true,
      isActive: true,
      user: techUser1,
    });

    const tech2 = technicianRepo.create({
      name: 'Ana Martínez',
      specialty: 'Hardware y Mantenimiento',
      availability: true,
      isActive: true,
      user: techUser2,
    });

    const tech3 = technicianRepo.create({
      name: 'Luis Fernández',
      specialty: 'Software y Sistemas',
      availability: true,
      isActive: true,
      user: techUser3,
    });

    const technicians = await technicianRepo.save([tech1, tech2, tech3]);
    console.log(`- Técnicos creados: ${technicians.length}`);

    // ==================== CLIENTS ====================
    console.log('- Creando clientes...');

    const client1 = clientRepo.create({
      name: 'María García',
      company: 'Tech Solutions S.A.',
      contactEmail: 'maria.garcia@empresa.com',
      phone: '+1234567890',
      isActive: true,
      user: clientUser1,
    });

    const client2 = clientRepo.create({
      name: 'Pedro López',
      company: 'Innovación Digital Ltda.',
      contactEmail: 'pedro.lopez@empresa.com',
      phone: '+0987654321',
      isActive: true,
      user: clientUser2,
    });

    const client3 = clientRepo.create({
      name: 'Laura Sánchez',
      company: 'Consultores Asociados',
      contactEmail: 'laura.sanchez@empresa.com',
      phone: '+1122334455',
      isActive: true,
      user: clientUser3,
    });

    const clients = await clientRepo.save([client1, client2, client3]);
    console.log(`- Clientes creados: ${clients.length}`);

    // ==================== TICKETS ====================
    console.log('- Creando tickets de ejemplo...');

    const ticket1 = ticketRepo.create({
      title: 'Impresora no funciona',
      description: 'La impresora HP LaserJet del departamento de ventas no imprime documentos desde ayer.',
      status: TicketStatus.OPEN,
      priority: TicketPriority.HIGH,
      category: catHardware,
      client: client1,
    });

    const ticket2 = ticketRepo.create({
      title: 'Error en sistema de facturación',
      description: 'El sistema muestra error al generar facturas con más de 10 items.',
      status: TicketStatus.IN_PROGRESS,
      priority: TicketPriority.CRITICAL,
      category: catSoftware,
      client: client2,
      technician: tech1,
    });

    const ticket3 = ticketRepo.create({
      title: 'Solicitud de nuevo monitor',
      description: 'Se requiere un monitor adicional para el puesto de trabajo del área de diseño.',
      status: TicketStatus.OPEN,
      priority: TicketPriority.LOW,
      category: catSolicitud,
      client: client3,
    });

    const ticket4 = ticketRepo.create({
      title: 'Computadora lenta',
      description: 'La computadora del área de contabilidad está muy lenta y tarda mucho en abrir programas.',
      status: TicketStatus.IN_PROGRESS,
      priority: TicketPriority.MEDIUM,
      category: catHardware,
      client: client1,
      technician: tech2,
    });

    const ticket5 = ticketRepo.create({
      title: 'Instalación de software',
      description: 'Se necesita instalar Adobe Creative Suite en las computadoras del departamento de marketing.',
      status: TicketStatus.RESOLVED,
      priority: TicketPriority.MEDIUM,
      category: catSoftware,
      client: client2,
      technician: tech3,
    });

    const tickets = await ticketRepo.save([ticket1, ticket2, ticket3, ticket4, ticket5]);
    console.log(`- Tickets creados: ${tickets.length}`);

    console.log(`
    ==========================================
         Seeders ejecutados exitosamente
    ==========================================
    
    Resumen:
    - Usuarios: ${users.length}
    - Categorías: ${categories.length}
    - Técnicos: ${technicians.length}
    - Clientes: ${clients.length}
    - Tickets: ${tickets.length}

    Credenciales de prueba:
    - Email: admin@techhelpdesk.com
    - Password: Password123!
    ==========================================
    `);

  } catch (error) {
    console.error(' Error ejecutando seeders:', error);
    process.exit(1);
  } finally {
    await AppDataSource.destroy();
  }
}

runSeed();
