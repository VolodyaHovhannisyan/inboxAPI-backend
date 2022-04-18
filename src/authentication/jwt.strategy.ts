import { AuthenticationService } from './authentication.service';
import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { Request } from 'express';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { User } from 'src/users/schemas/user.schema';
import { UsersService } from 'src/users/users.service';
import RequestWithUser from './requestWithUser.interface';
import { TokenPayload } from './tokenPayload.interface';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy, 'jwt') {
  constructor(
    private readonly usersService: UsersService,
    private readonly authenticationService: AuthenticationService,
  ) {
    super({
      jwtFromRequest: 
       ExtractJwt.fromExtractors([(request: Request) => {      
        return request?.headers?.authorization;
      }]),
      secretOrKey: `${process.env.JWT_SECRET}`,
      ignoreExpiration: false,
      usernameField: 'email',
      passReqToCallback: true,
    });
  }

  async validate(request: Request, payload: TokenPayload) {
    const accessToken = request?.headers?.authorization

    return await this.usersService.getUserIfAccessTokenValid(
      accessToken,
      payload.sub,
    );
  } 
}
