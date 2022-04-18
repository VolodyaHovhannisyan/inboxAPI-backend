import { AuthenticationModule } from './../authentication/authentication.module';
import { AuthenticationService } from './../authentication/authentication.service';
import { Account, AccountSchema } from './schemas/account.schema';
import { User, UserSchema } from './schemas/user.schema';
import { Module, forwardRef } from '@nestjs/common';
import { UsersService } from './users.service';
import { UsersController } from './users.controller';
import { MongooseModule } from '@nestjs/mongoose';
import { HttpModule } from '@nestjs/axios';
import { JwtModule } from '@nestjs/jwt';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: User.name, schema: UserSchema }]),
    MongooseModule.forFeature([{ name: Account.name, schema: AccountSchema }]),
    HttpModule,
    JwtModule.register({
      secret: `${process.env.SECRET}`,
      signOptions: {
        expiresIn: '100s'
      }
    }),
    forwardRef(() => AuthenticationModule),
            
  ],
  controllers: [UsersController],
  providers: [UsersService],
  exports: [UsersService] 
})
export class UsersModule {}
