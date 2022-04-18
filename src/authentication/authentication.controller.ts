import { UsersService } from 'src/users/users.service';
import {
  BadRequestException,
  Body,
  Controller,
  Get,
  HttpCode,
  Post,
  Req,
  Res,
  UseGuards,
} from '@nestjs/common';
import { AuthenticationService } from './authentication.service';
import RegisterDto from './dto/register.dto';
import { LocalAuthenticationGuard } from './localAuthentication.guard';
import RequestWithUser from './requestWithUser.interface';
import { Request, Response } from 'express';
import JwtAuthenticationGuard from './jwt-authentication.guard';
import JwtRefreshGuard from './jwtRefreshGuard.guard';


@Controller('authentication')
export class AuthenticationController {
  constructor(
    private readonly authenticationService: AuthenticationService,
    private readonly usersService: UsersService,
  ) {}

  @Post('register')
  async register(@Body() registrationData: RegisterDto) {
    return this.authenticationService.register(registrationData);
  }

  @HttpCode(200)
  @UseGuards(LocalAuthenticationGuard)
  @Post('login')
  async logIn(
    @Req() request: RequestWithUser,
    @Res({ passthrough: true }) response: Response,
  ) {
    const { email, password } = request.body;

    const user = await this.authenticationService.getAuthenticatedUser(
      email,
      password,
    );

    if (!user) {
      throw new BadRequestException('Invalid credentials!');
    }

    const accessToken = this.authenticationService.getJwtToken(user._id);
    const refreshToken = this.authenticationService.getJwtRefreshToken(
      user._id,
    );

    await this.usersService.setCurrentRefreshToken(refreshToken, user._id);

    user.password = undefined;

    return { user: { email, id: user._id }, accessToken, refreshToken };
  }

  @UseGuards(JwtRefreshGuard)
  @Post('refresh')
  refresh(
    @Req() request: RequestWithUser,
    @Res({ passthrough: true }) response: Response,
  ) {
    
    const accessToken = this.authenticationService.getJwtToken(
      request.body.user._id,
    );

    return {
      user: request.body.user,
      accessToken,
    };
  }

  @UseGuards(JwtAuthenticationGuard)
  @Post('logout')
  @HttpCode(200)
  async logOut(
    @Req() request: RequestWithUser,
    @Res({ passthrough: true }) response: Response,
  ) {
    console.log('Req body', request.body);

    await this.usersService.removeRefreshToken(request.body._id);

    return this.authenticationService.getTokensForLogOut();
  }

  @UseGuards(JwtAuthenticationGuard)
  @Get('user')
  async authenticate(@Req() request: Request) {
    const user = request.body.email;
    const token = request?.headers?.authorization;

    const verified = await this.authenticationService.verifyToken(token, {
      secret: `${process.env.JWT_SECRET}`,
    });

    return { user, _id: verified.sub };
  }

}
