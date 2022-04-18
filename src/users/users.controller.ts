import {
  Controller,
  Get,
  Post,
  Body,
  Req,
  UseGuards,
} from '@nestjs/common';
import { UsersService } from './users.service';
import { CreateUserDto } from './dto/create-user.dto';
import { User } from './interfaces/User.interface';
import { CreateAccountDto } from './dto/create-account.dto';
import { Request, Response } from 'express';
import JwtAuthenticationGuard from 'src/authentication/jwt-authentication.guard';

@Controller('users')
export class UsersController {
  constructor(
    private readonly usersService: UsersService,
  ) {}

  @Post('domain')
  async confirmDomain(@Req() request: Request) {
    const { domain, token } = request.body;
    return this.usersService.confirmDomain(domain, token);
  }

  @Post()
  @UseGuards(JwtAuthenticationGuard)
  create(@Body() createUserDto: CreateUserDto) {
    return this.usersService.create(createUserDto);
  }
  
  @Get('db')
  findAllFromDB() {
    return this.usersService.findAll();
  }

  @Post('add')
  addToServer(@Body() usersArray: CreateAccountDto[]) {
    return this.usersService.add(usersArray);
  }

  @Post('addw')
  addToServ(@Body() usersArray: User[]) {
    return this.usersService.getDataAndWrite(usersArray);
  }

  @Get()
  findAll() {
    return this.usersService.findAllFromApi();
  }
}
