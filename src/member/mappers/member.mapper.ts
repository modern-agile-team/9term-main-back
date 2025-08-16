import { User, UserGroup as PrismaUserGroup } from '@prisma/client';
import { MemberResponseDto } from '../dto/member-response.dto';

type MemberWithUser = PrismaUserGroup & { user: User };

export function toMemberResponseDto(member: MemberWithUser): MemberResponseDto {
  return {
    userId: member.userId,
    name: member.user.name,
    role: member.role,
    joinedAt: member.createdAt,
    status: member.status,
  };
}

export function toMemberResponseList(
  members: MemberWithUser[],
): MemberResponseDto[] {
  return members.map(toMemberResponseDto);
}
