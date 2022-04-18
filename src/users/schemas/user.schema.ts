import { IsOptional } from 'class-validator';
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';
import mongoose from 'mongoose';

export type UserDocument = User & Document;

@Schema()
export class User {
  _id?: mongoose.Schema.Types.ObjectId

  @Prop({ unique: true })
  email: string

  @Prop()
  @IsOptional()
  password?: string
 
  @Prop()
  @IsOptional()
  currentHashedRefreshToken?: string  
}

export const UserSchema = SchemaFactory.createForClass(User);
