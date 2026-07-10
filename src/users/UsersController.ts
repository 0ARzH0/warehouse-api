import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Patch,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { UsersService } from './UsersService';
import { CreateUserDto } from './dto/CreateUserDto';
import { UpdateUserDto } from './dto/UpdateUserDto';
import { Role } from './enum/RoleEnum';
import { JwtAuthGuard } from '../auth/guard/JwtAuthGuard';
import { RolesGuard } from '../auth/guard/RolesGuard';
import { SelfOrRolesGuard } from '../auth/guard/SelfOrRolesGuard';
import { Roles } from '../auth/decorator/Roles.decorator';

@ApiTags('users')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Post()
  @UseGuards(RolesGuard)
  @Roles(Role.Admin)
  @ApiOperation({ summary: 'Create a user (admin only)' })
  @ApiResponse({ status: 201, description: 'User created' })
  create(@Body() createUserDto: CreateUserDto) {
    return this.usersService.create(createUserDto);
  }

  @Get()
  @UseGuards(RolesGuard)
  @Roles(Role.Admin, Role.Supervisor)
  @ApiOperation({ summary: 'List all users (admin, supervisor)' })
  findAll() {
    return this.usersService.findAll();
  }

  @Get(':id')
  @UseGuards(SelfOrRolesGuard)
  @Roles(Role.Admin, Role.Supervisor)
  @ApiOperation({ summary: 'View a user (admin, supervisor, or self)' })
  findOne(@Param('id') id: string) {
    return this.usersService.findOne(id);
  }

  @Patch(':id')
  @UseGuards(SelfOrRolesGuard)
  @Roles(Role.Admin)
  @ApiOperation({
    summary: 'Update a user (admin any field, self password only)',
  })
  update(
    @Param('id') id: string,
    @Body() updateUserDto: UpdateUserDto,
    @Req() req,
  ) {
    return this.usersService.update(id, updateUserDto, req.user);
  }

  @Delete(':id')
  @UseGuards(RolesGuard)
  @Roles(Role.Admin)
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete a user (admin only)' })
  remove(@Param('id') id: string) {
    return this.usersService.remove(id);
  }
}
