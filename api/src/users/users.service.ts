import { Injectable, NotFoundException } from '@nestjs/common';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User, UserRole } from './entities/user.entity';
import * as bcrypt from 'bcrypt';

export type PublicUser = {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  morning_alert_time: string;
  evening_alert_time: string;
  expo_push_token?: string;
  created_at: Date;
  updated_at: Date;
};

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>
  ){}

  toPublicUser(user: User): PublicUser {
    return {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      morning_alert_time: user.morning_alert_time,
      evening_alert_time: user.evening_alert_time,
      expo_push_token: user.expo_push_token,
      created_at: user.created_at,
      updated_at: user.updated_at,
    };
  }

  async create(createUserDto: CreateUserDto): Promise<PublicUser> {
    const hashedPassword = await bcrypt.hash(createUserDto.password, 10);

    const newUser = this.userRepository.create({
      name: createUserDto.name,
      email: createUserDto.email,
      password_hash: hashedPassword,
      role: createUserDto.role
    })
    const saved = await this.userRepository.save(newUser);
    return this.toPublicUser(saved);
  }

  async findAll(): Promise<PublicUser[]> {
    const users = await this.userRepository.find();
    return users.map((user) => this.toPublicUser(user));
  }

  async findOne(id: string): Promise<PublicUser> {
    const user = await this.userRepository.findOne({ where: { id } });
    if (!user){
      throw new NotFoundException(`User with ID ${id} not found`);
    }
    return this.toPublicUser(user);
  }

  async findByEmail(email: string) {
    return this.userRepository.findOne({ 
      where: { email } 
    });
  }

  async findByResetToken(token: string) {
    return this.userRepository.findOne({ 
      where: { reset_password_token: token } 
    });
  }

  async update(id: string, updateUserDto: UpdateUserDto): Promise<PublicUser> {
    const updateData: Record<string, unknown> = { id, ...updateUserDto };

    if (updateUserDto.password){
      updateData.password_hash = await bcrypt.hash(updateUserDto.password, 10);
      delete updateData.password;
    }

    const user = await this.userRepository.preload(updateData);
    
    if (!user){
      throw new NotFoundException(`User with ID ${id} not found`);
    }
    const saved = await this.userRepository.save(user);
    return this.toPublicUser(saved);
  }

  async remove(id: string): Promise<void> {
    const result = await this.userRepository.delete(id);
    if (result.affected === 0){
      throw new NotFoundException(`User with ID ${id} not found`);
    }
  }
}
