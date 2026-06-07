import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { InjectRepository } from '@nestjs/typeorm';
import { User } from 'src/users/entities/user.entity';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcrypt';

@Injectable()
export class AuthService {
    constructor(
        @InjectRepository(User)
        private readonly userRepository: Repository<User>,

        private readonly jwtService: JwtService
    ){}

    async login(email: string, password: string) {
        const user = await this.userRepository.findOne({ where: { email } })
        if (!user){
            throw new UnauthorizedException('Invalid credentials');
        }

        const isMatch = await bcrypt.compare(password, user.password_hash);
        if (!isMatch){
            throw new UnauthorizedException('Invalid credentials');
        }

        const payload = {
            sub: user.id,
            name: user.name,
            role: user.role
        };

        return {
            access_token: await this.jwtService.signAsync(payload)
        };
    }
}
