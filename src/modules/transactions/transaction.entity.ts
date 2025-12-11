import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  CreateDateColumn,
} from 'typeorm';
import { Wallet } from '../wallet/wallet.entity';

@Entity()
export class Transaction {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => Wallet)
  wallet: Wallet;

  @Column()
  type: 'deposit' | 'transfer';

  @Column({ type: 'decimal' })
  amount: number;

  @Column()
  status: 'pending' | 'success' | 'failed';

  @Column({ unique: true })
  reference: string;

  @CreateDateColumn()
  createdAt: Date;
}
