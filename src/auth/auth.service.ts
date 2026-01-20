import { Injectable, UnauthorizedException, OnModuleInit } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from '../prisma/prisma.service';
import * as bcrypt from 'bcrypt';
import { UserRole } from '@prisma/client';

@Injectable()
export class AuthService implements OnModuleInit {
    constructor(
        private prisma: PrismaService,
        private jwtService: JwtService,
    ) { }

    async onModuleInit() {
        await this.seedAdmin();
    }

    async seedAdmin() {
        const adminExists = await this.prisma.user.findFirst({
            where: { role: UserRole.ADMIN }
        });

        if (!adminExists) {
            const hashedPassword = await bcrypt.hash('Sumit@399180', 10);
            await this.prisma.user.create({
                data: {
                    telegramId: 'admin_placeholder_' + Date.now(),
                    username: 'admin',
                    password: hashedPassword,
                    role: UserRole.ADMIN
                }
            });
            console.log('Default Admin User Created: admin / admin123');
        }
    }

    async validateUser(username: string, pass: string): Promise<any> {
        const user = await this.prisma.user.findFirst({ where: { username } });

        if (user && user.password && (await bcrypt.compare(pass, user.password))) {
            const { password, ...result } = user;
            return result;
        }
        return null;
    }

    async login(user: any) {
        const payload = { username: user.username, sub: user.id, role: user.role };
        return {
            access_token: this.jwtService.sign(payload),
            user: {
                id: user.id,
                username: user.username,
                role: user.role
            }
        };
    }
}
