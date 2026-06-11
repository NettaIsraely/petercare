import { Body, Controller, HttpCode, HttpStatus, Post } from '@nestjs/common';
import { AuthService } from './auth.service';
import { SignInDto } from './dto/sign-in.dto';

@Controller('auth')
export class AuthController {
    constructor( private readonly authService: AuthService){}

    @HttpCode(HttpStatus.OK)
    @Post('login')
    signIn (@Body() signInDto: SignInDto ) {
        return this.authService.login(signInDto.email, signInDto.password);
    }

    @Post('forgot-password')
    async forgotPassword(@Body('email') email: string) {
        return this.authService.forgotPassword(email);
    }

    @Post('reset-password')
    async resetPassword(
        @Body('token') token: string,
        @Body('newPassword') newPassword: string,
    ) {
        return this.authService.resetPassword(token.trim(), newPassword);
    }
}
