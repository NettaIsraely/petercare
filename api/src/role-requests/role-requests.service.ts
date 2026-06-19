import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';
import { Repository } from 'typeorm';
import { User, UserRole } from '../users/entities/user.entity';
import { RoleRequest, RoleRequestStatus } from './entities/role-request.entity';
import { UsersService } from '../users/users.service';
import {
  roleRequestAlertMessage,
  roleRequestApprovedMessage,
  roleRequestDeniedMessage,
} from '../notifications/notification-messages';
import { NotificationPreferencesService } from '../notifications/notification-preferences.service';

@Injectable()
export class RoleRequestsService {
  constructor(
    @InjectRepository(RoleRequest)
    private readonly roleRequestRepository: Repository<RoleRequest>,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    @InjectQueue('notifications')
    private readonly notificationQueue: Queue,
    private readonly usersService: UsersService,
    private readonly notificationPreferences: NotificationPreferencesService,
  ) {}

  async create(userId: string): Promise<RoleRequest> {
    const user = await this.userRepository.findOne({ where: { id: userId } });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    if (user.role !== UserRole.GUEST) {
      throw new ForbiddenException('Only guest users can request caregiver access.');
    }

    const existingPending = await this.roleRequestRepository.findOne({
      where: { user: { id: userId }, status: RoleRequestStatus.PENDING },
    });

    if (existingPending) {
      throw new BadRequestException('You already have a pending caregiver request.');
    }

    const request = this.roleRequestRepository.create({
      user: { id: userId } as User,
      requested_role: UserRole.CAREGIVER,
      status: RoleRequestStatus.PENDING,
    });

    const savedRequest = await this.roleRequestRepository.save(request);
    await this.notifyOwners(user, savedRequest.id);

    return this.findOneWithRelations(savedRequest.id);
  }

  async findMine(userId: string): Promise<RoleRequest | null> {
    return this.roleRequestRepository.findOne({
      where: { user: { id: userId } },
      relations: { user: true, reviewed_by: true },
      order: { created_at: 'DESC' },
    });
  }

  async findPending(): Promise<RoleRequest[]> {
    return this.roleRequestRepository.find({
      where: { status: RoleRequestStatus.PENDING },
      relations: { user: true },
      order: { created_at: 'ASC' },
    });
  }

  async approve(requestId: string, reviewerId: string): Promise<RoleRequest> {
    const request = await this.findOneWithRelations(requestId);

    if (request.status !== RoleRequestStatus.PENDING) {
      throw new BadRequestException('This request has already been reviewed.');
    }

    const requester = await this.userRepository.findOne({
      where: { id: request.user.id },
    });

    if (!requester) {
      throw new NotFoundException('Requesting user not found');
    }

    requester.role = UserRole.CAREGIVER;
    await this.usersService.assignDisplayOrderForRole(requester);

    request.status = RoleRequestStatus.APPROVED;
    request.reviewed_by = { id: reviewerId } as User;
    request.reviewed_at = new Date();
    await this.roleRequestRepository.save(request);

    await this.notifyRequester(
      requester.id,
      roleRequestApprovedMessage(),
      'approved',
      request.id,
    );

    return this.findOneWithRelations(requestId);
  }

  async deny(requestId: string, reviewerId: string): Promise<RoleRequest> {
    const request = await this.findOneWithRelations(requestId);

    if (request.status !== RoleRequestStatus.PENDING) {
      throw new BadRequestException('This request has already been reviewed.');
    }

    request.status = RoleRequestStatus.DENIED;
    request.reviewed_by = { id: reviewerId } as User;
    request.reviewed_at = new Date();
    await this.roleRequestRepository.save(request);

    await this.notifyRequester(
      request.user.id,
      roleRequestDeniedMessage(),
      'denied',
      request.id,
    );

    return this.findOneWithRelations(requestId);
  }

  private async findOneWithRelations(requestId: string): Promise<RoleRequest> {
    const request = await this.roleRequestRepository.findOne({
      where: { id: requestId },
      relations: { user: true, reviewed_by: true },
    });

    if (!request) {
      throw new NotFoundException(`Role request with ID ${requestId} not found`);
    }

    return request;
  }

  private async notifyOwners(requester: User, requestId: string): Promise<void> {
    const owners = await this.userRepository.find({
      where: { role: UserRole.OWNER },
    });

    const ownerIds = owners.map((owner) => owner.id);
    const eligibleIds = await this.notificationPreferences.filterEligibleUserIds(
      ownerIds,
      'role-request-alert',
    );

    for (const ownerId of eligibleIds) {
      await this.notificationQueue.add('role-request-alert', {
        userId: ownerId,
        message: roleRequestAlertMessage(requester.name),
        data: { type: 'role-request', requestId },
      });
    }
  }

  private async notifyRequester(
    userId: string,
    message: string,
    resolution: 'approved' | 'denied',
    requestId: string,
  ): Promise<void> {
    const eligible = await this.notificationPreferences.isUserEligible(
      userId,
      'role-request-resolved',
    );

    if (!eligible) {
      return;
    }

    await this.notificationQueue.add('role-request-resolved', {
      userId,
      message,
      data: { type: 'role-request-resolved', resolution, requestId },
    });
  }
}
