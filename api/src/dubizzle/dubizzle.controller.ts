import { Controller } from '@nestjs/common';
import { DubizzleService } from './dubizzle.service';

@Controller('dubizzle')
export class DubizzleController {
  constructor(private readonly dubizzleService: DubizzleService) {}
}
