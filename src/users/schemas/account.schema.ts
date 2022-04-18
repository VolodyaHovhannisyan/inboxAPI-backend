import { CreateAccountDto } from './../dto/create-account.dto';
import { IsOptional } from 'class-validator';
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';
import { timeStamp } from 'console';

export type AccountDocument = Account & Document;

@Schema({ timestamps: true })
export class Account {
  @Prop()
  Name: string;
  @Prop()
  Surname: string;
  @Prop({ unique: true })
  Email: string;
}

export const AccountSchema = SchemaFactory.createForClass(Account);
