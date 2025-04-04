import {
  ConflictException,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from 'src/common/services';
import {
  CutVideo,
  EscaleVideo,
  NanaroscopeVideo,
  Prisma,
} from '@prisma/client';

@Injectable()
export class VideosService {
  constructor(private readonly prisma: PrismaService) {}

  async cutVideo(
    where: Prisma.CutVideoWhereUniqueInput,
  ): Promise<CutVideo | null> {
    return await this.prisma.cutVideo.findUnique({ where });
  }
  async cutVideos(
    where: Prisma.CutVideoWhereInput,
  ): Promise<CutVideo[] | null> {
    return await this.prisma.cutVideo.findMany({ where });
  }
  async createCutVideo(data: Prisma.CutVideoCreateInput): Promise<CutVideo> {
    try {
      return await this.prisma.cutVideo.create({ data });
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError) {
        if (error.code === 'P2002') {
          throw new ConflictException(`CutVideo already exists`);
        }
      }
      throw new InternalServerErrorException(error);
    }
  }
  async deleteCutVideo(
    where: Prisma.CutVideoWhereUniqueInput,
  ): Promise<CutVideo> {
    try {
      return await this.prisma.cutVideo.delete({ where });
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError) {
        if (error.code === 'P2025') {
          throw new NotFoundException('CutVideo not found');
        }
      }
      throw new InternalServerErrorException(error);
    }
  }

  async escaleVideo(
    where: Prisma.EscaleVideoWhereUniqueInput,
  ): Promise<EscaleVideo | null> {
    return await this.prisma.escaleVideo.findUnique({ where });
  }
  async escaleVideos(
    where: Prisma.EscaleVideoWhereInput,
  ): Promise<EscaleVideo[] | null> {
    return await this.prisma.escaleVideo.findMany({ where });
  }
  async createEscaleVideo(
    data: Prisma.EscaleVideoCreateInput,
  ): Promise<EscaleVideo> {
    try {
      return await this.prisma.escaleVideo.create({ data });
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError) {
        if (error.code === 'P2002') {
          throw new ConflictException(`EscaleVideo already exists`);
        }
      }
      throw new InternalServerErrorException(error);
    }
  }
  async deleteEscaleVideo(
    where: Prisma.EscaleVideoWhereUniqueInput,
  ): Promise<EscaleVideo> {
    try {
      return await this.prisma.escaleVideo.delete({ where });
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError) {
        if (error.code === 'P2025') {
          throw new NotFoundException('EscaleVideo not found');
        }
      }
      throw new InternalServerErrorException(error);
    }
  }

  async nanaroscopeVideo(
    where: Prisma.NanaroscopeVideoWhereUniqueInput,
  ): Promise<NanaroscopeVideo | null> {
    return await this.prisma.nanaroscopeVideo.findUnique({ where });
  }
  async nanaroscopeVideos(
    where: Prisma.NanaroscopeVideoWhereInput,
  ): Promise<NanaroscopeVideo[] | null> {
    return await this.prisma.nanaroscopeVideo.findMany({ where });
  }
  async createNanaroscopeVideo(
    data: Prisma.NanaroscopeVideoCreateInput,
  ): Promise<NanaroscopeVideo> {
    try {
      return await this.prisma.nanaroscopeVideo.create({ data });
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError) {
        if (error.code === 'P2002') {
          throw new ConflictException(`NanaroscopeVideo already exists`);
        }
      }
      throw new InternalServerErrorException(error);
    }
  }
  async deleteNanaroscopeVideo(
    where: Prisma.NanaroscopeVideoWhereUniqueInput,
  ): Promise<NanaroscopeVideo> {
    try {
      return await this.prisma.nanaroscopeVideo.delete({ where });
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError) {
        if (error.code === 'P2025') {
          throw new NotFoundException('NanaroscopeVideo not found');
        }
      }
      throw new InternalServerErrorException(error);
    }
  }
}
