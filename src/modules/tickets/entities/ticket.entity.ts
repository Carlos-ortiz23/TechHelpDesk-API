import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { TicketStatus } from '../../../common/enums/ticket-status.enum';
import { TicketPriority } from '../../../common/enums/ticket-priority.enum';
import { Category } from '../../categories/entities/category.entity';
import { Client } from '../../clients/entities/client.entity';
import { Technician } from '../../technicians/entities/technician.entity';

@Entity('tickets')
export class Ticket {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ length: 200 })
  title: string;

  @Column({ type: 'text' })
  description: string;

  @Column({
    type: 'enum',
    enum: TicketStatus,
    default: TicketStatus.OPEN,
  })
  status: TicketStatus;

  @Column({
    type: 'enum',
    enum: TicketPriority,
    default: TicketPriority.MEDIUM,
  })
  priority: TicketPriority;

  @ManyToOne(() => Category, (category) => category.tickets, {
    nullable: false,
    onDelete: 'RESTRICT',
  })
  @JoinColumn({ name: 'categoryId' })
  category: Category;

  @Column()
  categoryId: string;

  @ManyToOne(() => Client, (client) => client.tickets, {
    nullable: false,
    onDelete: 'RESTRICT',
  })
  @JoinColumn({ name: 'clientId' })
  client: Client;

  @Column()
  clientId: string;

  @ManyToOne(() => Technician, (technician) => technician.tickets, {
    nullable: true,
    onDelete: 'SET NULL',
  })
  @JoinColumn({ name: 'technicianId' })
  technician: Technician;

  @Column({ nullable: true })
  technicianId: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
