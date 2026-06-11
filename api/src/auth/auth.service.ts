import { BadRequestException, Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { InjectRepository } from '@nestjs/typeorm';
import { User } from 'src/users/entities/user.entity';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcrypt';
import * as crypto from 'crypto';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';
import { UsersService } from 'src/users/users.service';

@Injectable()
export class AuthService {
    constructor(
        @InjectRepository(User)
        private readonly userRepository: Repository<User>,
        private readonly jwtService: JwtService,
        private usersService: UsersService,
        @InjectQueue('notifications')
        private notificationQueue: Queue
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

    async forgotPassword(email: string){
        // Find the user
        const user = await this.usersService.findByEmail(email.toLowerCase().trim());
        if (!user){
            return { message: 'If that email exists, a reset link has been sent.' };
        }

        // Generate a highly secure random token
        const resetToken = Math.floor(100000 + Math.random() * 900000).toString();
        // Set expiration for 1 hour from right now
        const expireDate = new Date();
        expireDate.setHours(expireDate.getHours() + 1);

        // 4. Save to the database
        await this.usersService.update(user.id, {
            reset_password_token: resetToken,
            reset_password_expires: expireDate,
        });

        // 5. Hand the heavy lifting off to your background worker
        await this.notificationQueue.add('password-reset-email', {
            email: user.email,
            name: user.name,
            token: resetToken,
        });

        return { message: 'If that email exists, a reset link has been sent.' };
    }

    async resetPassword(token: string, newPassword: string){
        const user = await this.usersService.findByResetToken(token);
        if (!user || !user.reset_password_expires) {
            throw new BadRequestException('Invalid or expired password reset token');
        }

        // Check if the token is past its deadline
        if (new Date() > user.reset_password_expires) {
            throw new BadRequestException('Invalid or expired password reset token');
        }

        // Save the new password and completely wipe the reset token data
        await this.usersService.update(user.id, {
            password: newPassword,
            reset_password_token: null,
            reset_password_expires: null,
        });

        return { message: 'Password has been successfully reset.' };
    }
}
