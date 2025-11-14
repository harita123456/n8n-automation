import { Injectable } from '@nestjs/common';
import { UsersRepository } from '../../database/repositories/users.repository';
import { User } from '../../database/schema';

@Injectable()
export class AuthService {
  constructor(private readonly usersRepository: UsersRepository) {}

  async validateUser(
    profile: any,
    accessToken: string,
    refreshToken: string,
  ): Promise<User> {
    const { id, displayName, emails, photos } = profile;
    const email = emails?.[0]?.value;
    const avatar = photos?.[0]?.value;

    let user = await this.usersRepository.findByGoogleId(id);

    if (user) {
      user = await this.usersRepository.updateTokens(
        user.id,
        accessToken,
        refreshToken,
      );
      return user;
    }

    user = await this.usersRepository.create({
      googleId: id,
      name: displayName,
      email: email,
      avatar: avatar,
      googleAccessToken: accessToken,
      googleRefreshToken: refreshToken,
    });

    return user;
  }

  async findUserById(id: string): Promise<User | null> {
    return this.usersRepository.findById(id);
  }
}
